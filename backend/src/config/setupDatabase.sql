-- SkillBridge Database Schema Reset & Setup
CREATE DATABASE IF NOT EXISTS skillbridge_db;
USE skillbridge_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Institutions Table
CREATE TABLE IF NOT EXISTS institutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  location VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Student Profiles Table
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

-- 4. Skills Table (id, name, category)
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Technical'
);

-- 5. Student Skills Table
CREATE TABLE IF NOT EXISTS student_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency_score INT DEFAULT 70,
  verification_source VARCHAR(255) DEFAULT 'Self Reported',
  is_badge_earned BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 6. Student Projects Table
CREATE TABLE IF NOT EXISTS student_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tech_stack JSON,
  status VARCHAR(50) DEFAULT 'Completed',
  project_url VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 7. Student Certifications Table
CREATE TABLE IF NOT EXISTS student_certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issue_year VARCHAR(10),
  credential_url VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 8. Assessment Questions Table
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

SET FOREIGN_KEY_CHECKS = 1;

-- Initial Master Institutions Data
INSERT IGNORE INTO institutions (id, name, code, location, website) VALUES
(1, 'JIS University', 'JISU', 'Kolkata, West Bengal', 'jisuniversity.ac.in'),
(2, 'Heritage Institute of Technology', 'HITK', 'Kolkata, West Bengal', 'heritageit.edu'),
(3, 'Indian Institute of Technology Kharagpur', 'IITKGP', 'Kharagpur, West Bengal', 'iitkgp.ac.in'),
(4, 'Maulana Abul Kalam Azad University of Technology', 'MAKAUT', 'Haringhata, West Bengal', 'makautwb.ac.in'),
(5, 'National Institute of Technology Durgapur', 'NITDGP', 'Durgapur, West Bengal', 'nitdgp.ac.in');

-- Initial Master Skills Data
INSERT INTO skills (name, category) VALUES
('React', 'Technical'),
('Node.js', 'Technical'),
('MySQL', 'Technical'),
('Communication', 'Soft Skill'),
('Leadership', 'Soft Skill'),
('Python Programming', 'Technical'),
('Data Visualization', 'Technical'),
('Machine Learning', 'Technical')
ON DUPLICATE KEY UPDATE category = VALUES(category);
