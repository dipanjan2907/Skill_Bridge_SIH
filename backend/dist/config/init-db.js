import db from "./db";
export const initDb = async () => {
    return new Promise((resolve, reject) => {
        // 1. Inspect existing users table and alter if missing required columns / updated roles
        const alterUsersSql = `
      ALTER TABLE users
      MODIFY COLUMN role ENUM('Student', 'Industry', 'Academician', 'Institution', 'Institute', 'Faculty', 'Admin') NOT NULL;
    `;
        db.query(alterUsersSql, (err) => {
            if (err) {
                console.warn("Notice altering users role enum:", err.message);
            }
            else {
                console.log("Updated users table role ENUM successfully.");
            }
            // Check and add is_verified
            const addIsVerifiedSql = `
        ALTER TABLE users
        ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER role;
      `;
            db.query(addIsVerifiedSql, (err) => {
                if (err && !err.message.includes("Duplicate column name")) {
                    console.warn("Notice adding is_verified to users:", err.message);
                }
                // Check and add updated_at
                const addUpdatedAtSql = `
          ALTER TABLE users
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
        `;
                db.query(addUpdatedAtSql, (err) => {
                    if (err && !err.message.includes("Duplicate column name")) {
                        console.warn("Notice adding updated_at to users:", err.message);
                    }
                    createRemainingTables(resolve, reject);
                });
            });
        });
    });
};
const createRemainingTables = (resolve, reject) => {
    const tableQueries = [
        // 2. student_profiles
        `CREATE TABLE IF NOT EXISTS student_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      roll_number VARCHAR(50),
      institution_name VARCHAR(255),
      department VARCHAR(100),
      degree VARCHAR(100),
      graduation_year INT,
      cgpa DECIMAL(3, 2),
      phone VARCHAR(20),
      bio TEXT,
      resume_url VARCHAR(512),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 3. skills
        `CREATE TABLE IF NOT EXISTS skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,
        // 4. student_skills
        `CREATE TABLE IF NOT EXISTS student_skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      skill_id INT NOT NULL,
      proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Beginner',
      is_verified TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_student_skill (student_id, skill_id),
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 5. skill_assessments
        `CREATE TABLE IF NOT EXISTS skill_assessments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      skill_id INT NOT NULL,
      score INT NOT NULL,
      max_score INT NOT NULL DEFAULT 100,
      status ENUM('Pending', 'Passed', 'Failed') DEFAULT 'Pending',
      assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 6. companies
        `CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      industry_type VARCHAR(100),
      description TEXT,
      website VARCHAR(255),
      location VARCHAR(255),
      logo_url VARCHAR(512),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 7. opportunities
        `CREATE TABLE IF NOT EXISTS opportunities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      posted_by_user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      opportunity_type ENUM('Internship', 'Job', 'Training', 'Project') NOT NULL,
      location VARCHAR(255),
      stipend_salary VARCHAR(100),
      duration VARCHAR(100),
      deadline DATETIME,
      status ENUM('Open', 'Closed', 'Draft') DEFAULT 'Open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (posted_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 8. opportunity_skills
        `CREATE TABLE IF NOT EXISTS opportunity_skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      opportunity_id INT NOT NULL,
      skill_id INT NOT NULL,
      min_proficiency ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Beginner',
      is_required TINYINT(1) DEFAULT 1,
      UNIQUE KEY unique_opp_skill (opportunity_id, skill_id),
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 9. applications
        `CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      opportunity_id INT NOT NULL,
      student_id INT NOT NULL,
      status ENUM('Applied', 'Under Review', 'Shortlisted', 'Accepted', 'Rejected') DEFAULT 'Applied',
      cover_letter TEXT,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_opp_student (opportunity_id, student_id),
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 10. certifications
        `CREATE TABLE IF NOT EXISTS certifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      issuing_organization VARCHAR(255) NOT NULL,
      issue_date DATE,
      expiry_date DATE,
      credential_id VARCHAR(255),
      credential_url VARCHAR(512),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 11. projects
        `CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      project_url VARCHAR(512),
      github_url VARCHAR(512),
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,
        // 12. internships
        `CREATE TABLE IF NOT EXISTS internships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      role_title VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      is_current TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`
    ];
    let completed = 0;
    for (const query of tableQueries) {
        db.query(query, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
                return reject(err);
            }
            completed++;
            if (completed === tableQueries.length) {
                console.log("All core relational tables created/verified successfully.");
                resolve();
            }
        });
    }
};
