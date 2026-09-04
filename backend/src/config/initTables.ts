import pool from "./db.js";

export const initTables = async () => {
  try {
    console.log(
      "Resetting and initializing database tables based on updated schema...",
    );

    // Disable foreign key checks for table creation/reset
    await pool.query(`SET FOREIGN_KEY_CHECKS = 0`);

    // 1. Institutions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE,
        location VARCHAR(255),
        website VARCHAR(255),
        verification_status VARCHAR(50) DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool.query(`ALTER TABLE institutions ADD COLUMN verification_status VARCHAR(50) DEFAULT 'approved'`);
    } catch (_err) {
      // Column already exists
    }


    // 2. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Student',
        institution_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
      )
    `);

    // Ensure institution_id column exists if table was created previously without it
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN institution_id INT NULL`);
    } catch (e) {
      // Column already exists
    }

    try {
      await pool.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(100) DEFAULT 'Student'`);
    } catch (e) {
      // Ignore migration error
    }

    // 3. Student Profiles Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        institution_id INT NULL,
        degree VARCHAR(150),
        department VARCHAR(150),
        cgpa DECIMAL(3, 2) DEFAULT NULL,
        phone VARCHAR(20),
        dob DATE,
        gender VARCHAR(20),
        bio TEXT,
        roll_number VARCHAR(100),
        current_sem VARCHAR(50),
        expected_grad VARCHAR(10),
        counselor VARCHAR(150),
        github VARCHAR(255),
        linkedin VARCHAR(255),
        portfolio VARCHAR(255),
        work_mode_preference VARCHAR(100),
        expected_stipend_min INT,
        expected_stipend_max INT,
        preferred_locations JSON,
        target_roles JSON,
        student_id VARCHAR(100) NULL,
        career_match_score INT NULL,
        verification_status VARCHAR(50) DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
      )
    `);

    try {
      await pool.query(`ALTER TABLE student_profiles MODIFY COLUMN cgpa DECIMAL(3, 2) DEFAULT NULL`);
    } catch (_e) {}
    try {
      await pool.query(`ALTER TABLE student_profiles ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending'`);
    } catch (_e) {}
    try {
      await pool.query(`ALTER TABLE student_profiles ADD COLUMN career_match_score INT NULL`);
    } catch (_e) {}
    try {
      await pool.query(`ALTER TABLE student_profiles ADD COLUMN student_id VARCHAR(100) NULL`);
    } catch (_e) {}

    // 4. Skills Table (id, name, category)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'Technical'
      )
    `);

    // 5. Student Skills Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        skill_id INT NOT NULL,
        proficiency_score INT DEFAULT 70,
        verification_source VARCHAR(255) DEFAULT 'Self Reported',
        is_badge_earned BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    // 6. Student Projects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tech_stack JSON,
        status VARCHAR(50) DEFAULT 'Completed',
        project_url VARCHAR(255),
        repo_url VARCHAR(255),
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);

    try {
      await pool.query(`ALTER TABLE student_projects ADD COLUMN repo_url VARCHAR(255) NULL`);
    } catch (_e) {
      // Column already exists
    }

    // 7. Student Certifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_certifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        issuer VARCHAR(255) NOT NULL,
        issue_year VARCHAR(10),
        credential_url VARCHAR(255),
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);

    // Safe non-destructive additive migrations for student_certifications
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN issue_date DATE NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN credential_id VARCHAR(255) NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN file_name VARCHAR(255) NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN file_type VARCHAR(100) NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN file_size INT NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending'`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN verified_by INT NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN verified_at TIMESTAMP NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (_e) {}

    // 7b. Student Resumes Table (Only 1 active resume per student)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT UNIQUE NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);

    // 7c. Student Work & Internship Experiences Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_work_experiences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NULL,
        employment_type VARCHAR(100) DEFAULT 'Full-time',
        start_date VARCHAR(50) NULL,
        end_date VARCHAR(50) NULL,
        is_current BOOLEAN DEFAULT FALSE,
        description TEXT NULL,
        skills_used JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);

    // 8. Assessment Questions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        skill_id INT NOT NULL,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
        difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',
        explanation TEXT,
        source_type VARCHAR(50) NOT NULL DEFAULT 'system',
        source_company_id INT NULL,
        created_by_user_id INT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'approved',
        rejection_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_assessment_questions_skill_id (skill_id),
        INDEX idx_assessment_questions_status (status),
        INDEX idx_assessment_questions_source (source_type),
        INDEX idx_assessment_questions_company (source_company_id),
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    // Safe non-destructive additive migrations for assessment_questions
    try { await pool.query(`ALTER TABLE assessment_questions ADD COLUMN source_type VARCHAR(50) NOT NULL DEFAULT 'system'`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD COLUMN source_company_id INT NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD COLUMN created_by_user_id INT NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'approved'`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD COLUMN rejection_reason TEXT NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD INDEX idx_assessment_questions_status (status)`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD INDEX idx_assessment_questions_source (source_type)`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE assessment_questions ADD INDEX idx_assessment_questions_company (source_company_id)`); } catch (_e) {}

    // 8b. Assessment Attempts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        skill_id INT NOT NULL,
        score INT DEFAULT 0,
        proficiency_score INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        correct_count INT DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_att_student (student_id),
        INDEX idx_att_skill (skill_id),
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    // 8c. Assessment Attempt Questions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_attempt_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_option VARCHAR(10) NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        INDEX idx_att_q_attempt (attempt_id),
        INDEX idx_att_q_question (question_id),
        FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
      )
    `);

    // 8d. Skill Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skill_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requested_by INT NOT NULL,
        skill_name VARCHAR(100) NOT NULL,
        category VARCHAR(100) DEFAULT 'Technical',
        reason TEXT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_skill_req_user (requested_by),
        INDEX idx_skill_req_status (status),
        FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 9. Industry Profiles Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS industry_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        company_type VARCHAR(100) NULL,
        industry_sector VARCHAR(100) NULL,
        description TEXT NULL,
        website VARCHAR(255) NULL,
        location VARCHAR(255) NULL,
        contact_email VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        logo VARCHAR(255) NULL,
        verification_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        rejection_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_industry_profiles_user_id (user_id),
        INDEX idx_industry_profiles_status (verification_status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 10. Opportunities Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        industry_id INT NOT NULL,
        type ENUM('internship', 'job') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255) NULL,
        work_mode VARCHAR(50) NOT NULL DEFAULT 'On-site',
        stipend_min DECIMAL(10,2) NULL,
        stipend_max DECIMAL(10,2) NULL,
        duration VARCHAR(100) NULL,
        eligibility TEXT NULL,
        application_deadline DATE NULL,
        status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_opportunities_industry_id (industry_id),
        INDEX idx_opportunities_status (status),
        INDEX idx_opportunities_type (type),
        FOREIGN KEY (industry_id) REFERENCES industry_profiles(id) ON DELETE CASCADE
      )
    `);

    // Safe non-destructive additive migrations for opportunities
    try { await pool.query(`ALTER TABLE opportunities MODIFY COLUMN type VARCHAR(100) NOT NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE opportunities ADD COLUMN target_audience VARCHAR(50) NOT NULL DEFAULT 'STUDENT'`); } catch (_e) {}

    // 11. Opportunity Skills Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunity_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        opportunity_id INT NOT NULL,
        skill_id INT NOT NULL,
        required_proficiency INT NOT NULL DEFAULT 0,
        INDEX idx_opp_skills_opp_id (opportunity_id),
        INDEX idx_opp_skills_skill_id (skill_id),
        UNIQUE KEY unique_opp_skill (opportunity_id, skill_id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    // 11b. Saved Opportunities Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_opportunities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        opportunity_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_saved_opp_user (user_id),
        INDEX idx_saved_opp_opportunity (opportunity_id),
        UNIQUE KEY unique_user_saved_opp (user_id, opportunity_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      )
    `);

    // 11c. Student Learning Progress Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_learning_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        path_id VARCHAR(100) NOT NULL,
        module_id VARCHAR(100) NOT NULL,
        status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'in_progress',
        progress_pct INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_learning_user (user_id),
        UNIQUE KEY unique_user_module (user_id, path_id, module_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 12. Applications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        opportunity_id INT NOT NULL,
        status ENUM('applied', 'shortlisted', 'rejected', 'selected') NOT NULL DEFAULT 'applied',
        cover_letter TEXT NULL,
        resume_url VARCHAR(255) NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_applications_student_id (student_id),
        INDEX idx_applications_opportunity_id (opportunity_id),
        INDEX idx_applications_status (status),
        UNIQUE KEY unique_student_opportunity (student_id, opportunity_id),
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      )
    `);

    // 13. Collaborations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collaborations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_by INT NOT NULL,
        industry_id INT NULL,
        institution_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        collaboration_type ENUM(
          'Mentorship',
          'Workshop',
          'Guest Lecture',
          'Innovation Challenge',
          'Live Industry Project',
          'Research Collaboration',
          'Faculty Training',
          'Industrial Training'
        ) NOT NULL,
        target_audience ENUM('Student', 'Faculty', 'Both') NOT NULL DEFAULT 'Both',
        start_date DATE NULL,
        end_date DATE NULL,
        start_time VARCHAR(100) NULL,
        location VARCHAR(255) NULL,
        mode ENUM('Online', 'Offline', 'Hybrid') NOT NULL DEFAULT 'Online',
        capacity INT NOT NULL DEFAULT 50,
        status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_collaborations_created_by (created_by),
        INDEX idx_collaborations_industry_id (industry_id),
        INDEX idx_collaborations_institution_id (institution_id),
        INDEX idx_collaborations_type (collaboration_type),
        INDEX idx_collaborations_status (status),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (industry_id) REFERENCES industry_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
      )
    `);

    // Ensure start_time column exists if table was previously initialized
    try {
      await pool.query(`ALTER TABLE collaborations ADD COLUMN start_time VARCHAR(100) NULL`);
    } catch (_e) {
      // Column already exists
    }

    // 14. Collaboration Skills Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collaboration_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        collaboration_id INT NOT NULL,
        skill_id INT NOT NULL,
        INDEX idx_collab_skills_collab_id (collaboration_id),
        INDEX idx_collab_skills_skill_id (skill_id),
        UNIQUE KEY unique_collab_skill (collaboration_id, skill_id),
        FOREIGN KEY (collaboration_id) REFERENCES collaborations(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    // 15. Collaboration Participants Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collaboration_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        collaboration_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        status ENUM('Applied', 'Accepted', 'Rejected', 'Completed') NOT NULL DEFAULT 'Applied',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_collab_parts_collab_id (collaboration_id),
        INDEX idx_collab_parts_user_id (user_id),
        INDEX idx_collab_parts_status (status),
        UNIQUE KEY unique_user_collaboration (collaboration_id, user_id),
        FOREIGN KEY (collaboration_id) REFERENCES collaborations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Re-enable foreign key checks
    await pool.query(`SET FOREIGN_KEY_CHECKS = 1`);

    // Seed default admin account if not existing
    const [existingAdmin]: any = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE LOWER(role) = 'admin'`,
    );
    if (existingAdmin[0].count === 0) {
      const bcrypt = await import("bcrypt");
      const hashedAdminPassword = await bcrypt.default.hash(
        "AdminPassword123!",
        10,
      );
      await pool.query(
        `INSERT INTO users (name, username, email, password, role)
         VALUES ('System Admin', 'admin', 'admin@skillbridge.com', ?, 'admin')`,
        [hashedAdminPassword],
      );
      console.log("Default admin account seeded: admin@skillbridge.com");
    }

    // Seed Institutions Table (20 institutes)
    await pool.query(`
      INSERT INTO institutions (id, name, code, location, website) VALUES
        (1, 'JIS University', 'JISU', 'Kolkata, West Bengal', 'jisuniversity.ac.in'),
        (2, 'Heritage Institute of Technology', 'HITK', 'Kolkata, West Bengal', 'heritageit.edu'),
        (3, 'Indian Institute of Technology Kharagpur', 'IITKGP', 'Kharagpur, West Bengal', 'iitkgp.ac.in'),
        (4, 'Maulana Abul Kalam Azad University of Technology', 'MAKAUT', 'Haringhata, West Bengal', 'makautwb.ac.in'),
        (5, 'National Institute of Technology Durgapur', 'NITDGP', 'Durgapur, West Bengal', 'nitdgp.ac.in'),
        (6, 'Jadavpur University', 'JU', 'Kolkata, West Bengal', 'jaduniv.edu.in'),
        (7, 'University of Calcutta', 'CU', 'Kolkata, West Bengal', 'caluniv.ac.in'),
        (8, 'Indian Statistical Institute', 'ISI', 'Kolkata, West Bengal', 'isical.ac.in'),
        (9, 'Indian Institute of Engineering Science and Technology, Shibpur', 'IIEST', 'Shibpur, Howrah, West Bengal', 'iiests.ac.in'),
        (10, 'Indian Institute of Management Calcutta', 'IIMC', 'Kolkata, West Bengal', 'iimcal.ac.in'),
        (11, 'National Institute of Technical Teachers Training and Research, Kolkata', 'NITTTR', 'Kolkata, West Bengal', 'nitttrkol.ac.in'),
        (12, 'Saha Institute of Nuclear Physics', 'SINP', 'Kolkata, West Bengal', 'sinp.ac.in'),
        (13, 'Bose Institute', 'BOSE', 'Kolkata, West Bengal', 'jcbose.ac.in'),
        (14, 'St. Xavier''s University, Kolkata', 'SXUK', 'Kolkata, West Bengal', 'sxuk.edu.in'),
        (15, 'Techno India University, West Bengal', 'TIU', 'Kolkata, West Bengal', 'technoindiaeducation.com'),
        (16, 'Techno Main Salt Lake', 'TMSL', 'Salt Lake, Kolkata, West Bengal', 'ticollege.ac.in'),
        (17, 'Netaji Subhash Engineering College', 'NSEC', 'Kolkata, West Bengal', 'nsec.ac.in'),
        (18, 'Narula Institute of Technology', 'NIT', 'Agarpara, Kolkata, West Bengal', 'nit.ac.in'),
        (19, 'Guru Nanak Institute of Technology', 'GNIT', 'Sodepur, Kolkata, West Bengal', 'gnit.ac.in'),
        (20, 'Adamas University', 'ADAMAS', 'Barasat, West Bengal', 'adamasuniversity.ac.in')
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        code = VALUES(code),
        location = VALUES(location),
        website = VALUES(website)
    `);
    console.log("Institutions table successfully updated with 20 institutes.");

    // Seed default institution user account if not existing
    const [existingInstUser]: any = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE LOWER(role) = 'institution'`,
    );
    if (existingInstUser[0].count === 0) {
      const bcrypt = await import("bcrypt");
      const hashedInstPassword = await bcrypt.default.hash(
        "InstitutionPassword123!",
        10,
      );
      await pool.query(
        `INSERT INTO users (name, username, email, password, role, institution_id)
         VALUES ('JIS University Academic Office', 'jis_institution', 'institution@jisuniversity.ac.in', ?, 'institution', 1)`,
        [hashedInstPassword],
      );
      console.log(
        "Default institution account seeded: institution@jisuniversity.ac.in",
      );
    }

    // Set default institution_id for unassigned student profiles
    await pool.query(
      `UPDATE student_profiles SET institution_id = 1 WHERE institution_id IS NULL`,
    );

    // Seed Master Skills Table with required initial skills & categories
    const initialSkills = [
      { name: "React", category: "Technical" },
      { name: "Node.js", category: "Technical" },
      { name: "TypeScript", category: "Technical" },
      { name: "JavaScript", category: "Technical" },
      { name: "React & TypeScript", category: "Technical" },
      { name: "React and TypeScript", category: "Technical" },
      { name: "MySQL", category: "Technical" },
      { name: "SQL & Relational Databases", category: "Technical" },
      { name: "SQL and Relational Databases", category: "Technical" },
      { name: "Communication", category: "Soft Skill" },
      { name: "Leadership", category: "Soft Skill" },
      { name: "Python Programming", category: "Technical" },
      { name: "Data Visualization", category: "Technical" },
      { name: "Machine Learning", category: "Technical" },
      { name: "Problem Solving", category: "Soft Skill" },
      { name: "Teamwork", category: "Soft Skill" },
    ];

    for (const skill of initialSkills) {
      await pool.query(
        `INSERT INTO skills (name, category) VALUES (?, ?) ON DUPLICATE KEY UPDATE category = VALUES(category)`,
        [skill.name, skill.category],
      );
    }

    // Seed Assessment Questions for all SQL / MySQL / Relational Database skill variations
    const [existingSqlSkills]: any = await pool.query(
      `SELECT id, name FROM skills 
       WHERE name LIKE '%MySQL%' OR name LIKE '%SQL%' OR name LIKE '%Relational%'`,
    );

    const assessmentQuestions = [
      {
        question:
          "In PostgreSQL or MySQL 8.0+, which window function would you use to assign a unique sequential integer to rows within a partition without any gaps or duplicate ranks for tied values?",
        option_a: "RANK()",
        option_b: "DENSE_RANK()",
        option_c: "ROW_NUMBER()",
        option_d: "NTILE()",
        correct_option: "C",
        difficulty: "Medium",
        explanation:
          "ROW_NUMBER() assigns a unique, strictly incrementing integer to each row within a partition regardless of ties. RANK() and DENSE_RANK() assign identical values to tied rows.",
      },
      {
        question:
          "What is the primary difference between a WHERE clause and a HAVING clause in SQL?",
        option_a:
          "WHERE filters rows before aggregation, whereas HAVING filters groups after aggregation.",
        option_b:
          "WHERE can only be used with subqueries, whereas HAVING is used with joins.",
        option_c:
          "HAVING filters rows before aggregation, whereas WHERE filters groups after aggregation.",
        option_d:
          "There is no functional difference; they are aliases for each other.",
        correct_option: "A",
        difficulty: "Medium",
        explanation:
          "WHERE filters individual rows prior to grouping, while HAVING applies filtering criteria to aggregated group results generated by GROUP BY.",
      },
      {
        question:
          "Which ACID property ensures that concurrent execution of transactions results in a system state equivalent to serial execution?",
        option_a: "Atomicity",
        option_b: "Consistency",
        option_c: "Isolation",
        option_d: "Durability",
        correct_option: "C",
        difficulty: "Medium",
        explanation:
          "Isolation ensures that concurrent transactions do not interfere with each other and execute as if they were running serially.",
      },
      {
        question:
          "What happens when a query performs a LEFT JOIN between table A and table B, and there are no matching rows in B for a row in A?",
        option_a: "The row from A is omitted from the final result set.",
        option_b:
          "The row from A is included with NULL values for all columns of B.",
        option_c: "The query fails with a foreign key violation error.",
        option_d:
          "The database substitutes default empty strings or zero values for columns of B.",
        correct_option: "B",
        difficulty: "Medium",
        explanation:
          "In a LEFT JOIN, all rows from the left table are retained; non-matching columns from the right table are populated with NULL.",
      },
      {
        question:
          "Under the ANSI SQL REPEATABLE READ isolation level, which concurrency anomaly can still occur according to standard definitions?",
        option_a: "Dirty Read",
        option_b: "Non-Repeatable Read",
        option_c: "Phantom Read",
        option_d: "Lost Update",
        correct_option: "C",
        difficulty: "Hard",
        explanation:
          "Standard ANSI SQL REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but allows Phantom Reads.",
      },
      {
        question:
          "Consider a composite B-Tree index on columns (department_id, hire_date, salary). Which query CANNOT utilize this index effectively for filtering?",
        option_a: "WHERE department_id = 10 AND hire_date > '2022-01-01'",
        option_b: "WHERE department_id = 10 AND salary > 50000",
        option_c: "WHERE hire_date = '2023-01-01' AND salary > 60000",
        option_d: "WHERE department_id = 10",
        correct_option: "C",
        difficulty: "Hard",
        explanation:
          "Composite B-Tree indexes follow the leftmost-prefix principle. If the leading column department_id is omitted, the index cannot be used efficiently for the specified lookup.",
      },
      {
        question:
          "What is the primary operational difference between UNION and UNION ALL?",
        option_a:
          "UNION preserves duplicates, whereas UNION ALL performs a distinct sort operation.",
        option_b:
          "UNION ALL combines results and removes duplicates, whereas UNION preserves duplicates.",
        option_c:
          "UNION removes duplicate rows, whereas UNION ALL combines results without removing duplicates.",
        option_d:
          "UNION can only be executed on indexed columns, whereas UNION ALL works on unindexed columns.",
        correct_option: "C",
        difficulty: "Hard",
        explanation:
          "UNION removes duplicate rows from the combined result, while UNION ALL retains duplicates and generally avoids the additional deduplication operation.",
      },
      {
        question:
          "What is the Third Normal Form (3NF) requirement in relational schema design?",
        option_a:
          "All non-key attributes must be fully functionally dependent on the entire primary key.",
        option_b:
          "The table must be in 2NF and contain no transitive dependencies for non-key attributes.",
        option_c: "Every determinant must be a candidate key (BCNF).",
        option_d: "The table must eliminate multi-valued dependencies.",
        correct_option: "B",
        difficulty: "Medium",
        explanation:
          "3NF requires 2NF compliance plus the removal of transitive dependencies involving non-key attributes.",
      },
      {
        question:
          "What will the SQL expression SELECT COUNT(*), COUNT(commission) FROM employees; return if 10 out of 100 employees have a NULL commission?",
        option_a: "100, 100",
        option_b: "100, 90",
        option_c: "90, 90",
        option_d: "100, 0",
        correct_option: "B",
        difficulty: "Medium",
        explanation:
          "COUNT(*) counts all rows, whereas COUNT(column_name) ignores NULL values in that column.",
      },
      {
        question:
          "Which SQL statement is classified as a Data Definition Language (DDL) command?",
        option_a: "UPDATE",
        option_b: "SELECT",
        option_c: "TRUNCATE TABLE",
        option_d: "INSERT",
        correct_option: "C",
        difficulty: "Easy",
        explanation:
          "TRUNCATE TABLE is generally classified as DDL in MySQL. INSERT and UPDATE are DML, while SELECT is generally classified as DQL.",
      },
    ];

    for (const sqlSkillRow of existingSqlSkills) {
      const targetSqlSkillId = sqlSkillRow.id;
      for (const q of assessmentQuestions) {
        const [existing]: any = await pool.query(
          `SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`,
          [targetSqlSkillId, q.question],
        );
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO assessment_questions 
             (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              targetSqlSkillId,
              q.question,
              q.option_a,
              q.option_b,
              q.option_c,
              q.option_d,
              q.correct_option,
              q.difficulty,
              q.explanation,
            ],
          );
        }
      }
    }

    // Seed React questions
    const [reactSkill]: any = await pool.query(
      `SELECT id FROM skills WHERE name = 'React' LIMIT 1`,
    );
    if (reactSkill.length > 0) {
      const reactSkillId = reactSkill[0].id;
      const reactQuestions = [
        {
          question:
            "Which React Hook is used to perform side effects in function components?",
          option_a: "useSideEffect",
          option_b: "useEffect",
          option_c: "useState",
          option_d: "useContext",
          correct_option: "B",
          difficulty: "Easy",
          explanation:
            "useEffect is the standard React hook for side effects such as data fetching, subscriptions, or manual DOM mutations.",
        },
        {
          question:
            "Which hook should be used to preserve a mutable state value across renders without causing a re-render when updated?",
          option_a: "useRef",
          option_b: "useState",
          option_c: "useMemo",
          option_d: "useCallback",
          correct_option: "A",
          difficulty: "Medium",
          explanation:
            "useRef returns a mutable ref object whose .current property persists across renders without triggering component re-renders.",
        },
        {
          question:
            "In React, what is the primary purpose of the 'key' prop when rendering lists of elements?",
          option_a: "To uniquely style list items in CSS",
          option_b:
            "To help React identify which items have changed, been added, or been removed",
          option_c: "To bind event listeners to specific DOM nodes",
          option_d: "To enable automatic sorting of array elements",
          correct_option: "B",
          difficulty: "Easy",
          explanation:
            "Keys help React identify which items have changed, are added, or are removed, enabling efficient DOM diffing and re-rendering.",
        },
        {
          question: "What does the useMemo hook do in React?",
          option_a:
            "Memoizes the return value of a calculation between renders",
          option_b: "Memoizes a callback function definition",
          option_c: "Automatically caches network requests",
          option_d: "Stores component state in localStorage",
          correct_option: "A",
          difficulty: "Medium",
          explanation:
            "useMemo caches the result of a calculation between renders based on a dependency array.",
        },
        {
          question:
            "How do you pass data down from a parent component to a child component in React?",
          option_a: "Via State",
          option_b: "Via Props",
          option_c: "Via Redux only",
          option_d: "Via HTML attributes",
          correct_option: "B",
          difficulty: "Easy",
          explanation:
            "Props (short for properties) are used to pass data from parent components down to child components in React.",
        },
        {
          question:
            "What is the Context API primarily used for in React applications?",
          option_a: "Managing server-side database connections",
          option_b:
            "Sharing state globally across the component tree without prop drilling",
          option_c: "Routing between different HTML pages",
          option_d: "Optimizing CSS animation performance",
          correct_option: "B",
          difficulty: "Medium",
          explanation:
            "React Context provides a way to pass data through the component tree without having to pass props down manually at every level.",
        },
        {
          question:
            "Which hook should be used to cache a callback function definition between renders?",
          option_a: "useMemo",
          option_b: "useCallback",
          option_c: "useRef",
          option_d: "useState",
          correct_option: "B",
          difficulty: "Medium",
          explanation:
            "useCallback returns a memoized version of the callback function that only changes if one of the dependencies has changed.",
        },
        {
          question: "What is Strict Mode in React?",
          option_a:
            "A tool for highlighting potential problems in an application during development",
          option_b: "A production mode that minifies code",
          option_c: "A security feature that prevents XSS attacks",
          option_d: "A TypeScript compiler configuration",
          correct_option: "A",
          difficulty: "Easy",
          explanation:
            "React.StrictMode is a developer tool that triggers additional checks and warnings for components in development mode.",
        },
        {
          question:
            "When using the useEffect hook with an empty dependency array `[]`, when does the effect execute?",
          option_a: "On every re-render",
          option_b: "Only once after the initial mount",
          option_c: "Right before the component unmounts only",
          option_d: "Never",
          correct_option: "B",
          difficulty: "Easy",
          explanation:
            "Passing an empty dependency array `[]` ensures the effect runs only once after the component mounts.",
        },
        {
          question:
            "What is the custom hook naming convention enforced by React Rules of Hooks?",
          option_a: "Must start with 'use' (e.g., useFetch)",
          option_b: "Must end with 'Hook'",
          option_c: "Must be written in ALL CAPS",
          option_d: "Must start with 'get'",
          correct_option: "A",
          difficulty: "Easy",
          explanation:
            "Custom hooks in React must start with the prefix 'use' to allow linters to automatically check for compliance with hook rules.",
        },
      ];

      for (const q of reactQuestions) {
        const [existing]: any = await pool.query(
          `SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`,
          [reactSkillId, q.question],
        );
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO assessment_questions 
             (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              reactSkillId,
              q.question,
              q.option_a,
              q.option_b,
              q.option_c,
              q.option_d,
              q.correct_option,
              q.difficulty,
              q.explanation,
            ],
          );
        }
      }
    }

    // Seed TypeScript / JavaScript questions
    const [existingTsSkills]: any = await pool.query(
      `SELECT id FROM skills WHERE name LIKE '%TypeScript%' OR name LIKE '%JavaScript%' OR name LIKE '%TS%'`,
    );

    if (existingTsSkills.length > 0) {
      const tsQuestions = [
        {
          question:
            "What is the primary benefit of TypeScript over vanilla JavaScript?",
          option_a: "Direct execution by browser engines without compilation",
          option_b: "Static type checking at compile time",
          option_c: "Automatic database optimization",
          option_d: "Faster CSS render times",
          correct_option: "B",
          difficulty: "Easy",
          explanation:
            "TypeScript introduces optional static typing that catches type-related errors during compile time before code runs.",
        },
        {
          question:
            "Which TypeScript utility type constructs a type with all properties of T set to optional?",
          option_a: "Required<T>",
          option_b: "Partial<T>",
          option_c: "Readonly<T>",
          option_d: "Pick<T, K>",
          correct_option: "B",
          difficulty: "Medium",
          explanation: "Partial<T> makes all properties of type T optional.",
        },
        {
          question: "What does the 'unknown' type represent in TypeScript?",
          option_a:
            "A type-safe counterpart to 'any' that requires type narrowing before usage",
          option_b: "A type for functions that never return",
          option_c: "An alias for null or undefined",
          option_d: "A type reserved exclusively for private class fields",
          correct_option: "A",
          difficulty: "Medium",
          explanation:
            "unknown is the top type in TypeScript. Any value can be assigned to unknown, but performing operations requires type assertions or narrowing.",
        },
        {
          question: "In TypeScript, what is the 'never' type used for?",
          option_a: "Variables that might be null",
          option_b:
            "Values that will never occur, such as a function that always throws an error or never returns",
          option_c: "Asynchronous promise return types",
          option_d: "Exporting modules to CommonJS",
          correct_option: "B",
          difficulty: "Hard",
          explanation:
            "never represents the type of values that never occur, such as functions that throw exceptions or enter infinite loops.",
        },
        {
          question: "How do you define an interface in TypeScript?",
          option_a: "interface User { name: string; age: number; }",
          option_b: "struct User { name: string; age: number; }",
          option_c: "class interface User { name: string; }",
          option_d: "type interface User = { name: string; }",
          correct_option: "A",
          difficulty: "Easy",
          explanation:
            "Interfaces are declared using the 'interface' keyword in TypeScript.",
        },
      ];

      for (const tsRow of existingTsSkills) {
        for (const q of tsQuestions) {
          const [existing]: any = await pool.query(
            `SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`,
            [tsRow.id, q.question],
          );
          if (existing.length === 0) {
            await pool.query(
              `INSERT INTO assessment_questions 
               (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                tsRow.id,
                q.question,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_option,
                q.difficulty,
                q.explanation,
              ],
            );
          }
        }
      }
    }

    // Seed 10 React & TypeScript specific assessment questions
    const [reactTsSkills]: any = await pool.query(
      `SELECT id FROM skills WHERE name LIKE '%React%TypeScript%' OR name LIKE '%React%TS%' OR name = 'React & TypeScript' OR name = 'React and TypeScript'`,
    );

    if (reactTsSkills.length > 0) {
      const reactTsSpecificQuestions = [
        {
          question:
            "How should you type the `children` prop of a reusable wrapper React component in TypeScript to accept any valid React renderable node?",
          option_a: "children: React.ReactElement",
          option_b: "children: React.ReactNode",
          option_c: "children: JSX.Element",
          option_d: "children: HTMLElement",
          correct_option: "B",
          difficulty: "Medium",
          explanation:
            "`React.ReactNode` encompasses all possible renderable values in JSX, including elements, strings, numbers, fragments, portals, `null`, `undefined`, and booleans.",
        },
        {
          question:
            "When typing an HTML button click event handler in a React component, which TypeScript type is most accurate?",
          option_a: "React.UIEvent<HTMLButtonElement>",
          option_b: "React.MouseEvent<HTMLButtonElement>",
          option_c: "React.SyntheticEvent<HTMLElement>",
          option_d: "EventTarget.MouseEvent",
          correct_option: "B",
          difficulty: "Medium",
          explanation:
            "`React.MouseEvent<HTMLButtonElement>` provides proper typing for mouse events originating from standard HTML button elements.",
        },
        {
          question:
            "Given a generic TypeScript function `function useApiResponse<T>()`, how do you restrict `T` to objects that must include an `id: string` property?",
          option_a: "function useApiResponse<T extends { id: string }>()",
          option_b: "function useApiResponse<T implements { id: string }>()",
          option_c: "function useApiResponse<T : { id: string }>()",
          option_d: "function useApiResponse<T satisfies { id: string }>()",
          correct_option: "A",
          difficulty: "Medium",
          explanation:
            "In TypeScript generics, the `extends` keyword enforces constraints on generic type parameters.",
        },
        {
          question:
            "Given the union type: `type Status = 'idle' | 'loading' | 'success' | 'error'`. Which TypeScript utility type creates a new type containing only `'success' | 'error'`?",
          option_a: "Omit<Status, 'idle' | 'loading'>",
          option_b: "Extract<Status, 'success' | 'error'>",
          option_c: "Pick<Status, 'success' | 'error'>",
          option_d: "Exclude<Status, 'success' | 'error'>",
          correct_option: "B",
          difficulty: "Hard",
          explanation:
            "`Extract<T, U>` extracts from union `T` all union members that are assignable to `U`. `Pick` and `Omit` operate on object properties.",
        },
        {
          question:
            "How should you type a `useRef` hook in React when you intend to attach it to an `<input />` DOM node?",
          option_a: "const ref = useRef<HTMLInputElement>(null);",
          option_b: "const ref = useRef<HTMLInputElement | null>(undefined);",
          option_c: "const ref = useRef<HTMLInputElement>(undefined);",
          option_d: "const ref = useRef<HTMLInputElement | undefined>();",
          correct_option: "A",
          difficulty: "Hard",
          explanation:
            "For a DOM ref that React manages, `useRef<HTMLInputElement>(null)` is the standard typing pattern. React assigns the actual DOM element to the ref when the element mounts.",
        },
        {
          question:
            "What is the utility of TypeScript's `ComponentPropsWithoutRef<'button'>` in React design systems?",
          option_a:
            "It extracts all native button HTML attributes while explicitly removing the `ref` prop.",
          option_b: "It prevents the button from triggering re-renders.",
          option_c:
            "It injects accessibility attributes automatically into custom components.",
          option_d: "It creates a memoized version of standard button props.",
          correct_option: "A",
          difficulty: "Medium",
          explanation:
            "`ComponentPropsWithoutRef<T>` generates the props associated with an element or component while excluding the `ref` prop, making it useful for components that do not forward refs.",
        },
        {
          question:
            "What does the `satisfies` operator introduced in TypeScript 4.9 achieve?",
          option_a:
            "It forces type widening to `any` for unspecified properties.",
          option_b:
            "It validates that an expression matches a type without changing the expression's inferred type.",
          option_c: "It automatically injects default prop values at runtime.",
          option_d: "It performs runtime type checking of React components.",
          correct_option: "B",
          difficulty: "Hard",
          explanation:
            "The `satisfies` operator validates that a value conforms to a type while preserving the more specific inferred type of the expression.",
        },
        {
          question:
            "Which approach provides strongly typed actions when using `useReducer` with a discriminated union?",
          option_a:
            "useReducer<React.Reducer<State, Action>>(reducer, initialState)",
          option_b: "useReducer<State, Action>(reducer, initialState)",
          option_c: "useState<Action>(initialState)",
          option_d: "useCallback<Action>(dispatch)",
          correct_option: "A",
          difficulty: "Medium",
          explanation:
            "Using `React.Reducer<State, Action>` explicitly connects the state type and discriminated action union, allowing TypeScript to enforce valid actions passed to `dispatch`.",
        },
        {
          question:
            "What is the type-safe approach for defining a polymorphic React component that changes its rendered HTML element through an `as` prop?",
          option_a: "type BoxProps = { as: string; [key: string]: any }",
          option_b:
            "Use generic types parameterized with `React.ElementType` together with `React.ComponentPropsWithRef<E>`.",
          option_c: "type BoxProps = React.HTMLProps<HTMLElement>",
          option_d:
            "Cast the component output using `as unknown as JSX.Element`.",
          correct_option: "B",
          difficulty: "Hard",
          explanation:
            "Polymorphic components require a generic element type such as `<E extends React.ElementType>` and dynamically derived component props to maintain type safety.",
        },
        {
          question:
            "Which TypeScript type is most appropriate for typing the state of a React component that can have exactly three states: loading, successful data, or an error?",
          option_a: "type State = { status: string; data?: any; error?: any }",
          option_b: "type State = any",
          option_c:
            "type State = { status: 'loading' } | { status: 'success'; data: User[] } | { status: 'error'; error: string };",
          option_d:
            "type State = { loading: boolean; success: boolean; error: boolean }",
          correct_option: "C",
          difficulty: "Medium",
          explanation:
            "A discriminated union represents mutually exclusive states precisely and allows TypeScript to narrow the available properties based on the `status` field.",
        },
      ];

      for (const rtsRow of reactTsSkills) {
        for (const q of reactTsSpecificQuestions) {
          const [existing]: any = await pool.query(
            `SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`,
            [rtsRow.id, q.question],
          );
          if (existing.length === 0) {
            await pool.query(
              `INSERT INTO assessment_questions 
               (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                rtsRow.id,
                q.question,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_option,
                q.difficulty,
                q.explanation,
              ],
            );
          }
        }
      }
    }

    // Seed Sample Academia-Industry Collaborations if empty
    const [existingCollabs]: any = await pool.query(`SELECT COUNT(*) as count FROM collaborations`);
    if (existingCollabs[0].count === 0) {
      const [adminUser]: any = await pool.query(`SELECT id FROM users WHERE LOWER(role) = 'admin' LIMIT 1`);
      const adminId = adminUser.length > 0 ? adminUser[0].id : 1;

      // Seed 4 initial high-quality collaboration initiatives
      const sampleCollabs = [
        {
          title: "Full Stack AI & Web Development Mentorship",
          description: "A 6-week 1-on-1 industry mentorship program connecting senior engineers from tech partners with promising students to build production-grade web applications using React, Node.js, and TypeScript.",
          collaboration_type: "Mentorship",
          target_audience: "Student",
          mode: "Online",
          capacity: 40,
          location: "Virtual Classroom",
          skills: ["React", "Node.js", "TypeScript"],
        },
        {
          title: "Industry-Academia Joint Research in Applied Machine Learning",
          description: "Collaborative research initiative between university faculty and AI research labs targeting scalable machine learning models for computer vision and analytics.",
          collaboration_type: "Research Collaboration",
          target_audience: "Faculty",
          mode: "Hybrid",
          capacity: 25,
          location: "JIS University Research Hub & Remote",
          skills: ["Machine Learning", "Python Programming", "Data Visualization"],
        },
        {
          title: "Faculty Development Program on Cloud Native Architecture",
          description: "A 3-day intensive workshop for engineering academicians covering microservices design, containerization, and modern database orchestration.",
          collaboration_type: "Faculty Training",
          target_audience: "Faculty",
          mode: "Online",
          capacity: 60,
          location: "Online Portal",
          skills: ["SQL & Relational Databases", "Node.js"],
        },
        {
          title: "Next-Gen Fintech Innovation Challenge 2026",
          description: "An interactive hackathon and live project challenge hosted by industry leaders for students to solve real-world payment system problems.",
          collaboration_type: "Innovation Challenge",
          target_audience: "Both",
          mode: "Hybrid",
          capacity: 100,
          location: "Kolkata Tech Park & Virtual",
          skills: ["React", "TypeScript", "Problem Solving"],
        },
      ];

      for (const col of sampleCollabs) {
        const [cRes]: any = await pool.query(
          `INSERT INTO collaborations 
           (created_by, institution_id, title, description, collaboration_type, target_audience, mode, capacity, location, status)
           VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 'published')`,
          [adminId, col.title, col.description, col.collaboration_type, col.target_audience, col.mode, col.capacity, col.location]
        );

        const newCollabId = cRes.insertId;

        for (const sName of col.skills) {
          const [sRows]: any = await pool.query(`SELECT id FROM skills WHERE name = ? LIMIT 1`, [sName]);
          if (sRows.length > 0) {
            await pool.query(
              `INSERT INTO collaboration_skills (collaboration_id, skill_id) VALUES (?, ?)`,
              [newCollabId, sRows[0].id]
            );
          }
        }
      }
      console.log("Seeded sample Academia-Industry collaboration initiatives.");
    }

    console.log(
      "Database schema reset, skills, assessment questions, and collaborations populated successfully.",
    );
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};
