import { Request, Response } from "express";
import pool from "../config/db.js";
import { RowDataPacket } from "mysql2";

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessonsCount: number;
  topics: string[];
  status?: "not_started" | "in_progress" | "completed";
  progressPct?: number;
}

export interface LearningPath {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: number;
  alignedRole: string;
  icon: string;
  modules: LearningModule[];
  overallProgress?: number;
}

const DEFAULT_LEARNING_PATHS: LearningPath[] = [
  {
    id: "fullstack-web",
    title: "Full-Stack Web Engineering",
    category: "Software Development",
    description: "Master modern web development from responsive UI to scalable backend microservices.",
    difficulty: "Intermediate",
    estimatedHours: 45,
    alignedRole: "Full Stack Engineer",
    icon: "code",
    modules: [
      {
        id: "fs-1",
        title: "Advanced React 19 & State Management",
        description: "Deep dive into React Hooks, Context API, Redux Toolkit, and performance optimization.",
        duration: "10 hrs",
        lessonsCount: 12,
        topics: ["Component Lifecycle", "Custom Hooks", "State Normalization", "Code Splitting"],
      },
      {
        id: "fs-2",
        title: "Node.js Architecture & RESTful API Design",
        description: "Build robust, secure backend services using Express, TypeScript, and MySQL/PostgreSQL.",
        duration: "12 hrs",
        lessonsCount: 14,
        topics: ["Middleware Architecture", "JWT Authentication", "Database Indexing", "Error Handling"],
      },
      {
        id: "fs-3",
        title: "Database Engineering & Query Optimization",
        description: "Master relational schema design, transactions, indexing strategies, and ORM patterns.",
        duration: "8 hrs",
        lessonsCount: 10,
        topics: ["Normalized Schemas", "Complex JOINs", "ACID Compliance", "Query Profiling"],
      },
      {
        id: "fs-4",
        title: "DevOps & Cloud Deployment Pipeline",
        description: "Containerize applications with Docker and deploy to production cloud providers.",
        duration: "15 hrs",
        lessonsCount: 16,
        topics: ["Docker & Compose", "CI/CD Pipelines", "Nginx Reverse Proxy", "SSL & Domain Config"],
      },
    ],
  },
  {
    id: "ai-data-science",
    title: "AI & Data Science Track",
    category: "Artificial Intelligence",
    description: "Learn machine learning algorithms, deep learning neural networks, and data analytics pipelines.",
    difficulty: "Advanced",
    estimatedHours: 60,
    alignedRole: "AI / ML Engineer",
    icon: "brain",
    modules: [
      {
        id: "ai-1",
        title: "Python for Data Science & Numerical Computing",
        description: "Master NumPy, Pandas, and Matplotlib for data cleaning and exploratory analysis.",
        duration: "12 hrs",
        lessonsCount: 15,
        topics: ["Data Wrangling", "Exploratory Data Analysis", "Vectorized Operations", "Plotting"],
      },
      {
        id: "ai-2",
        title: "Machine Learning Algorithms & Scikit-Learn",
        description: "Implement supervised and unsupervised machine learning models with validation.",
        duration: "18 hrs",
        lessonsCount: 20,
        topics: ["Regression & Classification", "Random Forests", "Hyperparameter Tuning", "Model Metrics"],
      },
      {
        id: "ai-3",
        title: "Deep Learning & Neural Networks with PyTorch",
        description: "Build convolutional and recurrent neural networks for vision and sequence modeling.",
        duration: "20 hrs",
        lessonsCount: 22,
        topics: ["Neural Architectures", "Backpropagation", "Convolutional Nets", "Transfer Learning"],
      },
      {
        id: "ai-4",
        title: "Generative AI & LLM Fine-Tuning",
        description: "Explore transformer models, prompt engineering, RAG architecture, and API integration.",
        duration: "10 hrs",
        lessonsCount: 12,
        topics: ["Transformers", "Retrieval-Augmented Generation", "LangChain & Vector DBs", "Model Fine-tuning"],
      },
    ],
  },
  {
    id: "cloud-devops",
    title: "Cloud Computing & DevOps",
    category: "Cloud Infrastructure",
    description: "Build automated, resilient infrastructure using AWS, Docker, Kubernetes, and Terraform.",
    difficulty: "Intermediate",
    estimatedHours: 40,
    alignedRole: "DevOps Engineer",
    icon: "cloud",
    modules: [
      {
        id: "cd-1",
        title: "Cloud Fundamentals & AWS Architecture",
        description: "Understand core cloud computing models, VPC networks, EC2 instances, and S3 storage.",
        duration: "10 hrs",
        lessonsCount: 12,
        topics: ["VPC & Subnets", "EC2 & Auto Scaling", "S3 Storage", "IAM & Security Groups"],
      },
      {
        id: "cd-2",
        title: "Infrastructure as Code with Terraform",
        description: "Automate cloud infrastructure provisioning using declarative configuration code.",
        duration: "12 hrs",
        lessonsCount: 14,
        topics: ["Terraform State", "Modules & Variables", "Resource Provisioning", "Drift Detection"],
      },
      {
        id: "cd-3",
        title: "Container Orchestration with Kubernetes",
        description: "Deploy, manage, and scale containerized applications on Kubernetes clusters.",
        duration: "18 hrs",
        lessonsCount: 18,
        topics: ["Pods & Deployments", "Services & Ingress", "ConfigMaps & Secrets", "Cluster Monitoring"],
      },
    ],
  },
  {
    id: "cyber-security",
    title: "Cybersecurity & Web Defense",
    category: "Information Security",
    description: "Learn web vulnerability assessment, ethical hacking, cryptography, and defensive security.",
    difficulty: "Advanced",
    estimatedHours: 35,
    alignedRole: "Security Analyst",
    icon: "shield",
    modules: [
      {
        id: "cs-1",
        title: "OWASP Top 10 Web Vulnerabilities",
        description: "Identify and remediate SQL Injection, XSS, CSRF, and broken authentication.",
        duration: "10 hrs",
        lessonsCount: 10,
        topics: ["SQL Injection", "Cross-Site Scripting", "Authentication Flaws", "Security Headers"],
      },
      {
        id: "cs-2",
        title: "Network Security & Cryptography",
        description: "Master TLS/SSL encryption, public key infrastructure, and packet analysis.",
        duration: "12 hrs",
        lessonsCount: 14,
        topics: ["Symmetric & Asymmetric Encryption", "PKI & Certificates", "Wireshark Packet Analysis", "VPNs"],
      },
      {
        id: "cs-3",
        title: "Ethical Hacking & Penetration Testing",
        description: "Conduct systematic security audits and penetration testing using Linux tools.",
        duration: "13 hrs",
        lessonsCount: 15,
        topics: ["Reconnaissance", "Nmap Scanning", "Metasploit Basics", "Vulnerability Reporting"],
      },
    ],
  },
];

/**
 * @route   GET /api/student/learning/paths
 * @desc    Get structured learning paths with user progress
 * @access  Private (Authenticated User)
 */
export const getLearningPaths = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    // Fetch user progress for all modules
    const [progressRows] = await pool.query<RowDataPacket[]>(
      `SELECT path_id, module_id, status, progress_pct FROM student_learning_progress WHERE user_id = ?`,
      [userId]
    );

    const progressMap = new Map<string, { status: string; progressPct: number }>();
    progressRows.forEach((row: RowDataPacket) => {
      progressMap.set(`${row.path_id}_${row.module_id}`, {
        status: row.status,
        progressPct: row.progress_pct,
      });
    });

    const pathsWithProgress: LearningPath[] = DEFAULT_LEARNING_PATHS.map((path) => {
      let totalProgress = 0;
      const modulesWithProgress = path.modules.map((m) => {
        const key = `${path.id}_${m.id}`;
        const p = progressMap.get(key);
        const status = (p?.status as "not_started" | "in_progress" | "completed") || "not_started";
        const progressPct = p ? p.progressPct : 0;
        totalProgress += progressPct;

        return {
          ...m,
          status,
          progressPct,
        };
      });

      const overallProgress = Math.round(totalProgress / path.modules.length);

      return {
        ...path,
        modules: modulesWithProgress,
        overallProgress,
      };
    });

    res.status(200).json({
      success: true,
      paths: pathsWithProgress,
    });
  } catch (error: any) {
    console.error("getLearningPaths error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching learning paths: " + error.message,
    });
  }
};

/**
 * @route   POST /api/student/learning/progress
 * @desc    Update progress or complete a module in a learning path
 * @access  Private (Authenticated User)
 */
export const updateLearningProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { pathId, moduleId, progressPct, status } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    if (!pathId || !moduleId) {
      res.status(400).json({ success: false, message: "Missing pathId or moduleId." });
      return;
    }

    const finalPct = Math.min(100, Math.max(0, parseInt(progressPct || 0, 10)));
    const finalStatus = status || (finalPct === 100 ? "completed" : "in_progress");

    await pool.query(
      `INSERT INTO student_learning_progress (user_id, path_id, module_id, status, progress_pct)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), progress_pct = VALUES(progress_pct), updated_at = CURRENT_TIMESTAMP`,
      [userId, pathId, moduleId, finalStatus, finalPct]
    );

    res.status(200).json({
      success: true,
      message: finalStatus === "completed" ? "Module completed successfully!" : "Progress saved.",
      progress: {
        pathId,
        moduleId,
        status: finalStatus,
        progressPct: finalPct,
      },
    });
  } catch (error: any) {
    console.error("updateLearningProgress error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating learning progress: " + error.message,
    });
  }
};

/**
 * @route   GET /api/student/learning/activities
 * @desc    Fetch recent activity stream of students across platform & logged-in user
 * @access  Private (Authenticated User)
 */
export const getRecentStudentActivities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const activities: any[] = [];

    // 1. Skill Verification Assessments Completed
    try {
      const [skillsRows] = await pool.query<RowDataPacket[]>(
        `SELECT ss.id, sp.user_id, ss.proficiency_score, ss.is_badge_earned, s.name AS skill_name, u.name AS user_name
         FROM student_skills ss
         JOIN student_profiles sp ON ss.student_id = sp.id
         JOIN skills s ON ss.skill_id = s.id
         JOIN users u ON sp.user_id = u.id
         ORDER BY ss.id DESC
         LIMIT 15`
      );

      skillsRows.forEach((row: RowDataPacket) => {
        activities.push({
          id: `skill_${row.id}`,
          userId: row.user_id,
          userName: row.user_name,
          type: "skill_verification",
          title: "Passed Skill Assessment",
          detail: `Verified proficiency in ${row.skill_name} (${row.proficiency_score}% score)`,
          badge: `${row.proficiency_score}% Score`,
          timestamp: new Date().toISOString(),
          iconType: "award",
        });
      });
    } catch (err) {
      console.warn("Error fetching skills activities:", err);
    }

    // 2. Certificates Uploaded / Verified
    try {
      const [certRows] = await pool.query<RowDataPacket[]>(
        `SELECT c.id, sp.user_id, c.title, c.issuer, c.created_at, u.name AS user_name
         FROM student_certifications c
         JOIN student_profiles sp ON c.student_id = sp.id
         JOIN users u ON sp.user_id = u.id
         ORDER BY c.id DESC
         LIMIT 15`
      );

      certRows.forEach((row: RowDataPacket) => {
        activities.push({
          id: `cert_${row.id}`,
          userId: row.user_id,
          userName: row.user_name,
          type: "certificate",
          title: "Earned Certification",
          detail: `Added "${row.title}" certified by ${row.issuer || "Authorized Body"}`,
          badge: "Certified",
          timestamp: row.created_at || new Date().toISOString(),
          iconType: "file-check",
        });
      });
    } catch (err) {
      console.warn("Error fetching cert activities:", err);
    }

    // 3. Projects Added
    try {
      const [projectRows] = await pool.query<RowDataPacket[]>(
        `SELECT p.id, sp.user_id, p.title, u.name AS user_name
         FROM student_projects p
         JOIN student_profiles sp ON p.student_id = sp.id
         JOIN users u ON sp.user_id = u.id
         ORDER BY p.id DESC
         LIMIT 15`
      );

      projectRows.forEach((row: RowDataPacket) => {
        activities.push({
          id: `proj_${row.id}`,
          userId: row.user_id,
          userName: row.user_name,
          type: "project",
          title: "Published Project",
          detail: `Built and showcased portfolio project "${row.title}"`,
          badge: "Portfolio Project",
          timestamp: new Date().toISOString(),
          iconType: "code",
        });
      });
    } catch (err) {
      console.warn("Error fetching project activities:", err);
    }

    // 4. Learning Modules Completed
    try {
      const [progressRows] = await pool.query<RowDataPacket[]>(
        `SELECT slp.id, slp.user_id, slp.path_id, slp.module_id, slp.status, slp.progress_pct, slp.updated_at, u.name AS user_name
         FROM student_learning_progress slp
         JOIN users u ON slp.user_id = u.id
         ORDER BY slp.updated_at DESC
         LIMIT 15`
      );

      progressRows.forEach((row: RowDataPacket) => {
        activities.push({
          id: `progress_${row.id}`,
          userId: row.user_id,
          userName: row.user_name,
          type: "learning_module",
          title: row.status === "completed" ? "Completed Learning Module" : "In-Progress Learning",
          detail: `Made ${row.progress_pct}% progress on module [${row.module_id.toUpperCase()}] in ${row.path_id.replace(/-/g, " ")}`,
          badge: row.status === "completed" ? "100% Completed" : `${row.progress_pct}% Done`,
          timestamp: row.updated_at || new Date().toISOString(),
          iconType: "book-open",
        });
      });
    } catch (err) {
      console.warn("Error fetching learning progress activities:", err);
    }

    // 5. Applications Submitted
    try {
      const [appRows] = await pool.query<RowDataPacket[]>(
        `SELECT a.id, a.student_id AS user_id, a.applied_at, o.title AS opp_title, ip.company_name, u.name AS user_name
         FROM applications a
         JOIN opportunities o ON a.opportunity_id = o.id
         JOIN industry_profiles ip ON o.industry_id = ip.id
         JOIN users u ON a.student_id = u.id
         ORDER BY a.applied_at DESC
         LIMIT 15`
      );

      appRows.forEach((row: RowDataPacket) => {
        activities.push({
          id: `app_${row.id}`,
          userId: row.user_id,
          userName: row.user_name,
          type: "application",
          title: "Applied to Opportunity",
          detail: `Submitted application for "${row.opp_title}" at ${row.company_name || "Industry Partner"}`,
          badge: "Application Sent",
          timestamp: row.applied_at || new Date().toISOString(),
          iconType: "briefcase",
        });
      });
    } catch (err) {
      console.warn("Error fetching application activities:", err);
    }

    // Sort all activities by timestamp DESC
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // User personal learning stats
    let verifiedSkillsCount = 0;
    let completedModulesCount = 0;
    let certificatesCount = 0;

    try {
      const [userVerifiedSkills] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM student_skills ss JOIN student_profiles sp ON ss.student_id = sp.id WHERE sp.user_id = ? AND ss.is_badge_earned = 1`,
        [userId]
      );
      verifiedSkillsCount = userVerifiedSkills[0]?.count || 0;
    } catch (_e) {}

    try {
      const [userCompletedModules] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM student_learning_progress WHERE user_id = ? AND status = 'completed'`,
        [userId]
      );
      completedModulesCount = userCompletedModules[0]?.count || 0;
    } catch (_e) {}

    try {
      const [userCertificates] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM student_certifications c JOIN student_profiles sp ON c.student_id = sp.id WHERE sp.user_id = ?`,
        [userId]
      );
      certificatesCount = userCertificates[0]?.count || 0;
    } catch (_e) {}

    res.status(200).json({
      success: true,
      activities: activities.slice(0, 30),
      stats: {
        verifiedSkillsCount,
        completedModulesCount,
        certificatesCount,
        estimatedHoursLearned: completedModulesCount * 8 + 12,
      },
    });
  } catch (error: any) {
    console.error("getRecentStudentActivities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching recent student activities: " + error.message,
    });
  }
};
