import type { Request, Response } from "express";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const getStudentProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    // 1. Fetch user, student_profile, and JOINED institution from institutions table
    // Using DATE_FORMAT(sp.dob, '%Y-%m-%d') prevents JS Date timezone offset shifting bugs
    let [profileRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.name, 
        u.email, 
        sp.id AS profile_id,
        sp.institution_id,
        sp.phone, 
        sp.location, 
        DATE_FORMAT(sp.dob, '%Y-%m-%d') AS dob, 
        sp.gender, 
        sp.bio, 
        inst.name AS institution, 
        inst.code AS institution_code,
        sp.degree, 
        sp.department, 
        sp.roll_number, 
        sp.current_sem, 
        sp.cgpa, 
        sp.expected_grad, 
        sp.counselor, 
        sp.github, 
        sp.linkedin, 
        sp.portfolio,
        sp.work_mode_preference,
        sp.expected_stipend_min,
        sp.expected_stipend_max,
        sp.preferred_locations,
        sp.target_roles
       FROM users u 
       LEFT JOIN student_profiles sp ON u.id = sp.user_id 
       LEFT JOIN institutions inst ON sp.institution_id = inst.id
       WHERE u.id = ?`,
      [userId]
    );

    if (profileRows.length === 0) {
      res.status(404).json({ error: "Student account not found in database" });
      return;
    }

    let rawProfile = profileRows[0];

    // If profile row doesn't exist yet, auto-create one with nulls
    if (!rawProfile.profile_id) {
      await pool.query(
        `INSERT INTO student_profiles (user_id, institution_id, degree, department, cgpa, location, bio)
         VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL)
         ON DUPLICATE KEY UPDATE user_id=user_id`,
        [userId]
      );

      // Re-query profile with formatted dob
      const [reQueried] = await pool.query<RowDataPacket[]>(
        `SELECT 
          u.name, 
          u.email, 
          sp.id AS profile_id,
          sp.institution_id,
          sp.phone, 
          sp.location, 
          DATE_FORMAT(sp.dob, '%Y-%m-%d') AS dob, 
          sp.gender, 
          sp.bio, 
          inst.name AS institution, 
          inst.code AS institution_code,
          sp.degree, 
          sp.department, 
          sp.roll_number, 
          sp.current_sem, 
          sp.cgpa, 
          sp.expected_grad, 
          sp.counselor, 
          sp.github, 
          sp.linkedin, 
          sp.portfolio,
          sp.work_mode_preference,
          sp.expected_stipend_min,
          sp.expected_stipend_max,
          sp.preferred_locations,
          sp.target_roles
         FROM users u 
         LEFT JOIN student_profiles sp ON u.id = sp.user_id 
         LEFT JOIN institutions inst ON sp.institution_id = inst.id
         WHERE u.id = ?`,
        [userId]
      );
      if (reQueried.length > 0) {
        rawProfile = reQueried[0];
      }
    }

    const studentProfileId = rawProfile.profile_id;

    // Parse JSON attributes safely
    const profile = {
      ...rawProfile,
      preferred_locations:
        typeof rawProfile.preferred_locations === "string"
          ? JSON.parse(rawProfile.preferred_locations)
          : rawProfile.preferred_locations || null,
      target_roles:
        typeof rawProfile.target_roles === "string"
          ? JSON.parse(rawProfile.target_roles)
          : rawProfile.target_roles || null,
    };

    // 2. Fetch Verified Skills with category
    const [skills] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ss.id, 
        ss.student_id,
        ss.skill_id,
        s.name, 
        s.category,
        ss.proficiency_score, 
        ss.verification_source, 
        ss.is_badge_earned 
       FROM student_skills ss 
       JOIN skills s ON ss.skill_id = s.id 
       WHERE ss.student_id = ?
       ORDER BY ss.id DESC`,
      [studentProfileId]
    );

    // 3. Fetch Projects
    const [projectRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, description, tech_stack, status, project_url, repo_url 
       FROM student_projects 
       WHERE student_id = ?
       ORDER BY id DESC`,
      [studentProfileId]
    );

    const projects = (projectRows || []).map((p) => ({
      ...p,
      tech_stack:
        typeof p.tech_stack === "string"
          ? JSON.parse(p.tech_stack)
          : p.tech_stack || [],
    }));

    // 4. Fetch Certifications
    const [certifications] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, issuer, issue_year, credential_url 
       FROM student_certifications 
       WHERE student_id = ?
       ORDER BY id DESC`,
      [studentProfileId]
    );

    const primaryRole =
      Array.isArray(profile.target_roles) && profile.target_roles.length > 0
        ? profile.target_roles[0]
        : profile.department || "Software Engineer";

    const calculatedMatchScore = skills.length > 0 ? Math.min(98, 70 + skills.length * 6) : null;

    if (calculatedMatchScore !== profile.career_match_score) {
      pool.query(
        `UPDATE student_profiles SET career_match_score = ? WHERE id = ?`,
        [calculatedMatchScore, studentProfileId]
      ).catch((err) => console.error("Error updating career_match_score in DB:", err));
      profile.career_match_score = calculatedMatchScore;
    }

    res.status(200).json({
      profile,
      skills,
      projects,
      certifications,
    });
  } catch (error: any) {
    console.error("getStudentProfile error:", error);
    res.status(500).json({ error: `Database failure: ${error.message}` });
  }
};

export const updateStudentProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  const {
    name,
    phone,
    location,
    dob,
    gender,
    bio,
    institution_id,
    degree,
    department,
    roll_number,
    current_sem,
    cgpa,
    expected_grad,
    counselor,
    github,
    linkedin,
    portfolio,
    work_mode_preference,
    expected_stipend_min,
    expected_stipend_max,
    preferred_locations,
    target_roles,
  } = req.body;

  try {
    // Update user full name in users table if changed
    if (name) {
      await pool.query(`UPDATE users SET name = ? WHERE id = ?`, [name, userId]);
    }

    const cleanInstId = institution_id ? parseInt(String(institution_id)) || null : null;
    const cleanDob = dob && typeof dob === "string" && dob.trim() !== "" ? dob.split("T")[0] : null;
    const cleanCgpa = cgpa ? parseFloat(cgpa) || null : null;
    const cleanStipendMin = expected_stipend_min ? parseInt(expected_stipend_min) || null : null;
    const cleanStipendMax = expected_stipend_max ? parseInt(expected_stipend_max) || null : null;

    await pool.query<ResultSetHeader>(
      `INSERT INTO student_profiles (
        user_id, institution_id, phone, location, dob, gender, bio, degree,
        department, roll_number, current_sem, cgpa, expected_grad,
        counselor, github, linkedin, portfolio, work_mode_preference,
        expected_stipend_min, expected_stipend_max, preferred_locations, target_roles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        institution_id = VALUES(institution_id),
        phone = VALUES(phone),
        location = VALUES(location),
        dob = VALUES(dob),
        gender = VALUES(gender),
        bio = VALUES(bio),
        degree = VALUES(degree),
        department = VALUES(department),
        roll_number = VALUES(roll_number),
        current_sem = VALUES(current_sem),
        cgpa = VALUES(cgpa),
        expected_grad = VALUES(expected_grad),
        counselor = VALUES(counselor),
        github = VALUES(github),
        linkedin = VALUES(linkedin),
        portfolio = VALUES(portfolio),
        work_mode_preference = VALUES(work_mode_preference),
        expected_stipend_min = VALUES(expected_stipend_min),
        expected_stipend_max = VALUES(expected_stipend_max),
        preferred_locations = VALUES(preferred_locations),
        target_roles = VALUES(target_roles)`,
      [
        userId,
        cleanInstId,
        phone || null,
        location || null,
        cleanDob,
        gender || null,
        bio || null,
        degree || null,
        department || null,
        roll_number || null,
        current_sem || null,
        cleanCgpa,
        expected_grad || null,
        counselor || null,
        github || null,
        linkedin || null,
        portfolio || null,
        work_mode_preference || null,
        cleanStipendMin,
        cleanStipendMax,
        preferred_locations ? JSON.stringify(preferred_locations) : null,
        target_roles ? JSON.stringify(target_roles) : null,
      ]
    );

    res
      .status(200)
      .json({ message: "Profile successfully synchronized with database" });
  } catch (error: any) {
    console.error("updateStudentProfile error:", error);
    res.status(500).json({ error: `Update failed: ${error.message}` });
  }
};

export const getInstitutions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, code, location, website, verification_status 
       FROM institutions 
       WHERE verification_status IS NULL OR verification_status = 'approved' OR verification_status = 'verified'
       ORDER BY name ASC`
    );
    res.status(200).json(rows);
  } catch (error: any) {
    console.error("getInstitutions error:", error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
};

/**
 * Helper to get student_profile ID for current user
 */
const getStudentProfileId = async (userId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM student_profiles WHERE user_id = ?`,
    [userId]
  );
  if (rows.length === 0) {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_profiles (user_id) VALUES (?)`,
      [userId]
    );
    return result.insertId;
  }
  return rows[0].id;
};

/**
 * Fetch GitHub public repositories for a username
 */
export const fetchGitHubRepos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.body;
    let cleanUsername = username;

    // Extract username if a full URL was provided
    if (cleanUsername && cleanUsername.includes("github.com/")) {
      cleanUsername = cleanUsername.split("github.com/")[1].split("/")[0].trim();
    }

    if (!cleanUsername) {
      res.status(400).json({ error: "GitHub username is required" });
      return;
    }

    const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=30`, {
      headers: {
        "User-Agent": "SkillBridge-App",
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (ghRes.status === 404) {
      res.status(404).json({ error: `GitHub user "${cleanUsername}" not found` });
      return;
    }

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      res.status(ghRes.status).json({ error: `GitHub API error: ${errText}` });
      return;
    }

    const reposData: any[] = await ghRes.json();

    const formattedRepos = reposData.map((r) => {
      const stack: string[] = [];
      if (r.language) stack.push(r.language);
      if (Array.isArray(r.topics)) {
        r.topics.slice(0, 4).forEach((t: string) => {
          if (!stack.includes(t)) stack.push(t);
        });
      }

      return {
        id: r.id,
        name: r.name,
        description: r.description || "Public GitHub Repository",
        html_url: r.html_url,
        homepage: r.homepage || null,
        language: r.language,
        tech_stack: stack,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        updated_at: r.updated_at,
      };
    });

    res.status(200).json({
      username: cleanUsername,
      repos: formattedRepos,
    });
  } catch (error: any) {
    console.error("fetchGitHubRepos error:", error);
    res.status(500).json({ error: `Failed to fetch GitHub repos: ${error.message}` });
  }
};

/**
 * Import selected GitHub repos into student_projects DB table
 */
export const importGitHubProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { repos } = req.body;
    if (!Array.isArray(repos) || repos.length === 0) {
      res.status(400).json({ error: "At least one project repository must be selected" });
      return;
    }

    const studentId = await getStudentProfileId(userId);

    for (const repo of repos) {
      const title = repo.name || repo.title || "GitHub Repository";
      const description = repo.description || "Imported from GitHub";
      const techStack = Array.isArray(repo.tech_stack) ? repo.tech_stack : (repo.language ? [repo.language] : []);
      const repoUrl = repo.html_url || repo.repo_url || null;
      const projectUrl = repo.homepage || repo.project_url || repoUrl;

      // Avoid duplicating existing projects with same title and student_id
      const [existing] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM student_projects WHERE student_id = ? AND title = ?`,
        [studentId, title]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO student_projects (student_id, title, description, tech_stack, status, project_url, repo_url)
           VALUES (?, ?, ?, ?, 'Completed', ?, ?)`,
          [studentId, title, description, JSON.stringify(techStack), projectUrl, repoUrl]
        );
      }
    }

    // Fetch updated projects list
    const [updatedProjects] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, description, tech_stack, status, project_url, repo_url 
       FROM student_projects 
       WHERE student_id = ? 
       ORDER BY id DESC`,
      [studentId]
    );

    const formatted = updatedProjects.map((p) => ({
      ...p,
      tech_stack: typeof p.tech_stack === "string" ? JSON.parse(p.tech_stack) : p.tech_stack || [],
    }));

    res.status(200).json({
      message: `Successfully imported ${repos.length} GitHub repository project(s)!`,
      projects: formatted,
    });
  } catch (error: any) {
    console.error("importGitHubProjects error:", error);
    res.status(500).json({ error: `Import failed: ${error.message}` });
  }
};

/**
 * Add a custom project manually
 */
export const addStudentProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { title, description, tech_stack, status, project_url, repo_url } = req.body;
    if (!title) {
      res.status(400).json({ error: "Project title is required" });
      return;
    }

    const studentId = await getStudentProfileId(userId);
    const stackArray = Array.isArray(tech_stack)
      ? tech_stack
      : typeof tech_stack === "string"
      ? tech_stack.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_projects (student_id, title, description, tech_stack, status, project_url, repo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        title,
        description || "",
        JSON.stringify(stackArray),
        status || "Completed",
        project_url || null,
        repo_url || null,
      ]
    );

    res.status(201).json({
      message: "Project successfully added!",
      project: {
        id: result.insertId,
        title,
        description,
        tech_stack: stackArray,
        status: status || "Completed",
        project_url,
        repo_url,
      },
    });
  } catch (error: any) {
    console.error("addStudentProject error:", error);
    res.status(500).json({ error: `Failed to add project: ${error.message}` });
  }
};

/**
 * Delete a student project
 */
export const deleteStudentProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { id } = req.params;
    const studentId = await getStudentProfileId(userId);

    await pool.query(
      `DELETE FROM student_projects WHERE id = ? AND student_id = ?`,
      [id, studentId]
    );

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("deleteStudentProject error:", error);
    res.status(500).json({ error: `Failed to delete project: ${error.message}` });
  }
};

