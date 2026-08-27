import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface ParsedQuestion {
  questionNumber: number;
  difficulty: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

interface ParsedSection {
  rawTitle: string;
  cleanSkillName: string;
  questions: ParsedQuestion[];
}

// Map section headings to master skills registry names
const SKILL_NAME_MAP: Record<string, string> = {
  "3. Communication": "Communication",
  "4. Leadership": "Leadership",
  "5. Problem Solving": "Problem Solving",
  "6. Teamwork": "Teamwork",
  "7. Data Visualization": "Data Visualization",
  "8. Machine Learning": "Machine Learning",
  "9. MySQL": "MySQL",
  "10. Node.js": "Node.js",
  "11. Python Programming": "Python Programming",
  "12. React": "React",
};

/**
 * Normalizes text for reliable duplicate detection.
 */
function normalizeText(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Parses the Markdown Question Bank file.
 */
export function parseQuestionBankMarkdown(filePath: string): ParsedSection[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Markdown question bank file not found at: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const rawSections = fileContent.split(/^## /m).filter((sec) => sec.trim().length > 0);

  const parsedSections: ParsedSection[] = [];

  for (const rawSection of rawSections) {
    const lines = rawSection.trim().split("\n");
    const sectionTitleLine = lines[0].trim();

    // Determine clean skill name
    let cleanSkillName = SKILL_NAME_MAP[sectionTitleLine];
    if (!cleanSkillName) {
      // Strip leading section numbers like "13. "
      cleanSkillName = sectionTitleLine.replace(/^\d+\.\s*/, "").trim();
    }

    const questionBlocks = rawSection.split(/^#### Q/m).slice(1);
    const parsedQuestions: ParsedQuestion[] = [];

    for (const qBlock of questionBlocks) {
      const qLines = qBlock.trim().split("\n");
      const headerLine = qLines[0]; // e.g. "1. [Medium]" or "10. [Hard]"

      const numMatch = headerLine.match(/^(\d+)\.\s*(?:\[(.*?)\])?/);
      const questionNumber = numMatch ? parseInt(numMatch[1], 10) : 0;
      const rawDifficulty = numMatch && numMatch[2] ? numMatch[2].trim() : "Medium";
      const difficulty = ["Easy", "Medium", "Hard"].includes(rawDifficulty) ? rawDifficulty : "Medium";

      let questionText = "";
      let optionA = "";
      let optionB = "";
      let optionC = "";
      let optionD = "";
      let correctOption: "A" | "B" | "C" | "D" = "A";
      let explanation = "";

      let currentMode: "question" | "options" | "correct" | "explanation" = "question";

      for (let i = 1; i < qLines.length; i++) {
        const line = qLines[i].trim();

        if (!line) continue;

        if (line.startsWith("- A)") || line.startsWith("- A.") || line.startsWith("A)")) {
          optionA = line.replace(/^(?:-\s*)?A[\)\.]\s*/, "").trim();
          currentMode = "options";
          continue;
        }
        if (line.startsWith("- B)") || line.startsWith("- B.") || line.startsWith("B)")) {
          optionB = line.replace(/^(?:-\s*)?B[\)\.]\s*/, "").trim();
          currentMode = "options";
          continue;
        }
        if (line.startsWith("- C)") || line.startsWith("- C.") || line.startsWith("C)")) {
          optionC = line.replace(/^(?:-\s*)?C[\)\.]\s*/, "").trim();
          currentMode = "options";
          continue;
        }
        if (line.startsWith("- D)") || line.startsWith("- D.") || line.startsWith("D)")) {
          optionD = line.replace(/^(?:-\s*)?D[\)\.]\s*/, "").trim();
          currentMode = "options";
          continue;
        }

        if (line.toLowerCase().includes("**correct answer:**")) {
          const ansMatch = line.match(/\*\*Correct Answer:\*\*\s*([A-D])/i);
          if (ansMatch) {
            correctOption = ansMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
          }
          currentMode = "correct";
          continue;
        }

        if (line.toLowerCase().includes("**explanation:**")) {
          explanation = line.replace(/\*\*Explanation:\*\*\s*/i, "").trim();
          currentMode = "explanation";
          continue;
        }

        if (currentMode === "question") {
          questionText += (questionText ? "\n" : "") + line;
        } else if (currentMode === "explanation") {
          explanation += (explanation ? " " : "") + line;
        }
      }

      if (questionText && optionA && optionB && optionC && optionD) {
        parsedQuestions.push({
          questionNumber,
          difficulty,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOption,
          explanation,
        });
      } else {
        console.warn(`[Warning] Malformed question Q${questionNumber} in section '${cleanSkillName}'`);
      }
    }

    parsedSections.push({
      rawTitle: sectionTitleLine,
      cleanSkillName,
      questions: parsedQuestions,
    });
  }

  return parsedSections;
}

/**
 * Main import runner.
 */
export async function runAssessmentImport(filePath?: string) {
  const targetFile = filePath || "D:/Downloads/120_Comprehensive_MCQ_Question_Bank.md";
  console.log(`\n==================================================`);
  console.log(`Starting Assessment Question Bank Import`);
  console.log(`Source File: ${targetFile}`);
  console.log(`==================================================\n`);

  const sections = parseQuestionBankMarkdown(targetFile);

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const summaryReport: { skill: string; total: number; added: number; skipped: number; errors: number }[] = [];

  for (const sec of sections) {
    let secAdded = 0;
    let secSkipped = 0;
    let secErrors = 0;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Find or create skill in skills table
      let skillId: number | null = null;
      const [skillRows] = await connection.query<RowDataPacket[]>(
        `SELECT id, name FROM skills WHERE LOWER(name) = LOWER(?) LIMIT 1`,
        [sec.cleanSkillName]
      );

      if (skillRows.length > 0) {
        skillId = Number(skillRows[0].id);
      } else {
        // Fallback search (e.g., Python Programming matching Python)
        const [fallbackRows] = await connection.query<RowDataPacket[]>(
          `SELECT id, name FROM skills WHERE LOWER(name) LIKE LOWER(?) LIMIT 1`,
          [`%${sec.cleanSkillName}%`]
        );
        if (fallbackRows.length > 0) {
          skillId = Number(fallbackRows[0].id);
        } else {
          // Create skill in master registry if missing
          const defaultCategory = ["Communication", "Leadership", "Problem Solving", "Teamwork"].includes(sec.cleanSkillName)
            ? "Soft Skill"
            : "Technical";

          const [insertSkillResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO skills (name, category) VALUES (?, ?)`,
            [sec.cleanSkillName, defaultCategory]
          );
          skillId = insertSkillResult.insertId;
          console.log(`[Skill Created] Added '${sec.cleanSkillName}' (ID: ${skillId}, Category: ${defaultCategory})`);
        }
      }

      // 2. Fetch existing questions for this skill to prevent duplicates
      const [existingQuestions] = await connection.query<RowDataPacket[]>(
        `SELECT id, question FROM assessment_questions WHERE skill_id = ?`,
        [skillId]
      );

      const existingQuestionSet = new Set<string>(
        existingQuestions.map((q) => normalizeText(q.question))
      );

      // 3. Process each parsed question
      for (const q of sec.questions) {
        const normQ = normalizeText(q.questionText);

        if (existingQuestionSet.has(normQ)) {
          secSkipped++;
          totalSkipped++;
          continue;
        }

        await connection.query(
          `INSERT INTO assessment_questions 
           (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            skillId,
            q.questionText,
            q.optionA,
            q.optionB,
            q.optionC,
            q.optionD,
            q.correctOption,
            q.difficulty,
            q.explanation,
          ]
        );

        existingQuestionSet.add(normQ);
        secAdded++;
        totalAdded++;
      }

      await connection.commit();
    } catch (err: any) {
      await connection.rollback();
      console.error(`[Error] Failed importing section '${sec.cleanSkillName}':`, err.message);
      secErrors = sec.questions.length - secAdded - secSkipped;
      totalErrors += secErrors;
    } finally {
      connection.release();
    }

    summaryReport.push({
      skill: sec.cleanSkillName,
      total: sec.questions.length,
      added: secAdded,
      skipped: secSkipped,
      errors: secErrors,
    });
  }

  console.log(`\n==================================================`);
  console.log(`Assessment Import Complete Summary`);
  console.log(`==================================================\n`);
  console.table(summaryReport);

  console.log(`\nTotal Questions Processed: ${totalAdded + totalSkipped + totalErrors}`);
  console.log(`  Added:   ${totalAdded}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log(`  Errors:  ${totalErrors}\n`);
}

// Execute script if invoked directly
if (process.argv[1] && process.argv[1].endsWith("importAssessments.ts")) {
  runAssessmentImport()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Import script failed:", err);
      process.exit(1);
    });
}
