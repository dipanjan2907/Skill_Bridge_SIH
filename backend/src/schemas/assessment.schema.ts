import { z } from "zod";

export const createQuestionSchema = z.object({
  skill_id: z.coerce.number().int().positive("Valid skill ID is required"),
  question: z.string().min(3, "Question text must be at least 3 characters"),
  option_a: z.string().min(1, "Option A is required"),
  option_b: z.string().min(1, "Option B is required"),
  option_c: z.string().min(1, "Option C is required"),
  option_d: z.string().min(1, "Option D is required"),
  correct_option: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
    z.enum(["A", "B", "C", "D"]),
  ),
  difficulty: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim()) {
        const cleaned = val.trim();
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      }
      return "Medium";
    },
    z.enum(["Easy", "Medium", "Hard"]),
  ).default("Medium"),
  explanation: z.preprocess(
    (val) => (typeof val === "string" && val.trim().length >= 1 ? val.trim() : "No detailed explanation provided."),
    z.string().min(1),
  ).default("No detailed explanation provided."),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const bulkQuestionImportSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, "At least one question is required").max(100, "A maximum of 100 questions can be imported at once"),
});

export const rejectQuestionSchema = z.object({
  rejection_reason: z.string().min(3, "Rejection reason must be at least 3 characters"),
});

export const createSkillRequestSchema = z.object({
  skill_name: z.string().min(2, "Skill name must be at least 2 characters"),
  category: z.string().optional().default("Technical"),
  reason: z.string().optional(),
});
