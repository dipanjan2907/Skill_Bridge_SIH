-- 1. Base Users Table (Reference)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'faculty', 'industry', 'institution') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Skills Registry (Shared across Students, Faculty, and Jobs)
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'Technical'
);

-- 3. Student Profile Core & Preferences
CREATE TABLE IF NOT EXISTS student_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  dob DATE,
  gender VARCHAR(20),
  bio TEXT,
  institution VARCHAR(255),
  degree VARCHAR(150),
  department VARCHAR(150),
  roll_number VARCHAR(100),
  current_sem VARCHAR(50),
  cgpa DECIMAL(3, 2) DEFAULT NULL,
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Student Skills & Verified Scores
CREATE TABLE IF NOT EXISTS student_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency_score INT DEFAULT 0, -- 0 to 100
  verification_source VARCHAR(150),
  is_badge_earned BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 5. Student Projects
CREATE TABLE IF NOT EXISTS student_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tech_stack JSON, -- e.g., ["React", "TypeScript", "Node.js"]
  status VARCHAR(50) DEFAULT 'Completed',
  project_url VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 6. Student Certifications
CREATE TABLE IF NOT EXISTS student_certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issue_year VARCHAR(10),
  credential_url VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 8. Assessment Questions
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
  INDEX idx_assessment_questions_skill_id (skill_id),
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 9. Industry Profiles Table
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
);

-- 10. Opportunities Table
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
);

-- 11. Opportunity Skills Table
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
);

