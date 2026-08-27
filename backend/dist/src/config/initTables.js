import pool from "./db.js";
export const initTables = async () => {
    try {
        console.log("Resetting and initializing database tables based on updated schema...");
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // 2. Users Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // 3. Student Profiles Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE NOT NULL,
        institution_id INT NULL,
        degree VARCHAR(150),
        department VARCHAR(150),
        cgpa DECIMAL(3, 2),
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
      )
    `);
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
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);
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
        INDEX idx_assessment_questions_skill_id (skill_id),
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
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
        // Re-enable foreign key checks
        await pool.query(`SET FOREIGN_KEY_CHECKS = 1`);
        // Seed default admin account if not existing
        const [existingAdmin] = await pool.query(`SELECT COUNT(*) as count FROM users WHERE LOWER(role) = 'admin'`);
        if (existingAdmin[0].count === 0) {
            const bcrypt = await import("bcrypt");
            const hashedAdminPassword = await bcrypt.default.hash("AdminPassword123!", 10);
            await pool.query(`INSERT INTO users (name, username, email, password, role)
         VALUES ('System Admin', 'admin', 'admin@skillbridge.com', ?, 'admin')`, [hashedAdminPassword]);
            console.log("Default admin account seeded: admin@skillbridge.com");
        }
        // Seed Institutions Table if empty
        const [existingInst] = await pool.query(`SELECT COUNT(*) as count FROM institutions`);
        if (existingInst[0].count === 0) {
            await pool.query(`
        INSERT INTO institutions (id, name, code, location, website) VALUES
        (1, 'JIS University', 'JISU', 'Kolkata, West Bengal', 'jisuniversity.ac.in'),
        (2, 'Heritage Institute of Technology', 'HITK', 'Kolkata, West Bengal', 'heritageit.edu'),
        (3, 'Indian Institute of Technology Kharagpur', 'IITKGP', 'Kharagpur, West Bengal', 'iitkgp.ac.in'),
        (4, 'Maulana Abul Kalam Azad University of Technology', 'MAKAUT', 'Haringhata, West Bengal', 'makautwb.ac.in'),
        (5, 'National Institute of Technology Durgapur', 'NITDGP', 'Durgapur, West Bengal', 'nitdgp.ac.in')
      `);
        }
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
            await pool.query(`INSERT INTO skills (name, category) VALUES (?, ?) ON DUPLICATE KEY UPDATE category = VALUES(category)`, [skill.name, skill.category]);
        }
        // Seed Assessment Questions for all SQL / MySQL / Relational Database skill variations
        const [existingSqlSkills] = await pool.query(`SELECT id, name FROM skills 
       WHERE name LIKE '%MySQL%' OR name LIKE '%SQL%' OR name LIKE '%Relational%'`);
        const assessmentQuestions = [
            {
                question: "In PostgreSQL or MySQL 8.0+, which window function would you use to assign a unique sequential integer to rows within a partition without any gaps or duplicate ranks for tied values?",
                option_a: "RANK()",
                option_b: "DENSE_RANK()",
                option_c: "ROW_NUMBER()",
                option_d: "NTILE()",
                correct_option: "C",
                difficulty: "Medium",
                explanation: "ROW_NUMBER() assigns a unique, strictly incrementing integer to each row within a partition regardless of ties. RANK() and DENSE_RANK() assign identical values to tied rows.",
            },
            {
                question: "What is the primary difference between a WHERE clause and a HAVING clause in SQL?",
                option_a: "WHERE filters rows before aggregation, whereas HAVING filters groups after aggregation.",
                option_b: "WHERE can only be used with subqueries, whereas HAVING is used with joins.",
                option_c: "HAVING filters rows before aggregation, whereas WHERE filters groups after aggregation.",
                option_d: "There is no functional difference; they are aliases for each other.",
                correct_option: "A",
                difficulty: "Medium",
                explanation: "WHERE filters individual rows prior to grouping, while HAVING applies filtering criteria to aggregated group results generated by GROUP BY.",
            },
            {
                question: "Which ACID property ensures that concurrent execution of transactions results in a system state equivalent to serial execution?",
                option_a: "Atomicity",
                option_b: "Consistency",
                option_c: "Isolation",
                option_d: "Durability",
                correct_option: "C",
                difficulty: "Medium",
                explanation: "Isolation ensures that concurrent transactions do not interfere with each other and execute as if they were running serially.",
            },
            {
                question: "What happens when a query performs a LEFT JOIN between table A and table B, and there are no matching rows in B for a row in A?",
                option_a: "The row from A is omitted from the final result set.",
                option_b: "The row from A is included with NULL values for all columns of B.",
                option_c: "The query fails with a foreign key violation error.",
                option_d: "The database substitutes default empty strings or zero values for columns of B.",
                correct_option: "B",
                difficulty: "Medium",
                explanation: "In a LEFT JOIN, all rows from the left table are retained; non-matching columns from the right table are populated with NULL.",
            },
            {
                question: "Under the ANSI SQL REPEATABLE READ isolation level, which concurrency anomaly can still occur according to standard definitions?",
                option_a: "Dirty Read",
                option_b: "Non-Repeatable Read",
                option_c: "Phantom Read",
                option_d: "Lost Update",
                correct_option: "C",
                difficulty: "Hard",
                explanation: "Standard ANSI SQL REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads, but allows Phantom Reads.",
            },
            {
                question: "Consider a composite B-Tree index on columns (department_id, hire_date, salary). Which query CANNOT utilize this index effectively for filtering?",
                option_a: "WHERE department_id = 10 AND hire_date > '2022-01-01'",
                option_b: "WHERE department_id = 10 AND salary > 50000",
                option_c: "WHERE hire_date = '2023-01-01' AND salary > 60000",
                option_d: "WHERE department_id = 10",
                correct_option: "C",
                difficulty: "Hard",
                explanation: "Composite B-Tree indexes follow the leftmost-prefix principle. If the leading column department_id is omitted, the index cannot be used efficiently for the specified lookup.",
            },
            {
                question: "What is the primary operational difference between UNION and UNION ALL?",
                option_a: "UNION preserves duplicates, whereas UNION ALL performs a distinct sort operation.",
                option_b: "UNION ALL combines results and removes duplicates, whereas UNION preserves duplicates.",
                option_c: "UNION removes duplicate rows, whereas UNION ALL combines results without removing duplicates.",
                option_d: "UNION can only be executed on indexed columns, whereas UNION ALL works on unindexed columns.",
                correct_option: "C",
                difficulty: "Hard",
                explanation: "UNION removes duplicate rows from the combined result, while UNION ALL retains duplicates and generally avoids the additional deduplication operation.",
            },
            {
                question: "What is the Third Normal Form (3NF) requirement in relational schema design?",
                option_a: "All non-key attributes must be fully functionally dependent on the entire primary key.",
                option_b: "The table must be in 2NF and contain no transitive dependencies for non-key attributes.",
                option_c: "Every determinant must be a candidate key (BCNF).",
                option_d: "The table must eliminate multi-valued dependencies.",
                correct_option: "B",
                difficulty: "Medium",
                explanation: "3NF requires 2NF compliance plus the removal of transitive dependencies involving non-key attributes.",
            },
            {
                question: "What will the SQL expression SELECT COUNT(*), COUNT(commission) FROM employees; return if 10 out of 100 employees have a NULL commission?",
                option_a: "100, 100",
                option_b: "100, 90",
                option_c: "90, 90",
                option_d: "100, 0",
                correct_option: "B",
                difficulty: "Medium",
                explanation: "COUNT(*) counts all rows, whereas COUNT(column_name) ignores NULL values in that column.",
            },
            {
                question: "Which SQL statement is classified as a Data Definition Language (DDL) command?",
                option_a: "UPDATE",
                option_b: "SELECT",
                option_c: "TRUNCATE TABLE",
                option_d: "INSERT",
                correct_option: "C",
                difficulty: "Easy",
                explanation: "TRUNCATE TABLE is generally classified as DDL in MySQL. INSERT and UPDATE are DML, while SELECT is generally classified as DQL.",
            },
        ];
        for (const sqlSkillRow of existingSqlSkills) {
            const targetSqlSkillId = sqlSkillRow.id;
            for (const q of assessmentQuestions) {
                const [existing] = await pool.query(`SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`, [targetSqlSkillId, q.question]);
                if (existing.length === 0) {
                    await pool.query(`INSERT INTO assessment_questions 
             (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        targetSqlSkillId,
                        q.question,
                        q.option_a,
                        q.option_b,
                        q.option_c,
                        q.option_d,
                        q.correct_option,
                        q.difficulty,
                        q.explanation,
                    ]);
                }
            }
        }
        // Seed React questions
        const [reactSkill] = await pool.query(`SELECT id FROM skills WHERE name = 'React' LIMIT 1`);
        if (reactSkill.length > 0) {
            const reactSkillId = reactSkill[0].id;
            const reactQuestions = [
                {
                    question: "Which React Hook is used to perform side effects in function components?",
                    option_a: "useSideEffect",
                    option_b: "useEffect",
                    option_c: "useState",
                    option_d: "useContext",
                    correct_option: "B",
                    difficulty: "Easy",
                    explanation: "useEffect is the standard React hook for side effects such as data fetching, subscriptions, or manual DOM mutations."
                },
                {
                    question: "Which hook should be used to preserve a mutable state value across renders without causing a re-render when updated?",
                    option_a: "useRef",
                    option_b: "useState",
                    option_c: "useMemo",
                    option_d: "useCallback",
                    correct_option: "A",
                    difficulty: "Medium",
                    explanation: "useRef returns a mutable ref object whose .current property persists across renders without triggering component re-renders."
                },
                {
                    question: "In React, what is the primary purpose of the 'key' prop when rendering lists of elements?",
                    option_a: "To uniquely style list items in CSS",
                    option_b: "To help React identify which items have changed, been added, or been removed",
                    option_c: "To bind event listeners to specific DOM nodes",
                    option_d: "To enable automatic sorting of array elements",
                    correct_option: "B",
                    difficulty: "Easy",
                    explanation: "Keys help React identify which items have changed, are added, or are removed, enabling efficient DOM diffing and re-rendering."
                },
                {
                    question: "What does the useMemo hook do in React?",
                    option_a: "Memoizes the return value of a calculation between renders",
                    option_b: "Memoizes a callback function definition",
                    option_c: "Automatically caches network requests",
                    option_d: "Stores component state in localStorage",
                    correct_option: "A",
                    difficulty: "Medium",
                    explanation: "useMemo caches the result of a calculation between renders based on a dependency array."
                },
                {
                    question: "How do you pass data down from a parent component to a child component in React?",
                    option_a: "Via State",
                    option_b: "Via Props",
                    option_c: "Via Redux only",
                    option_d: "Via HTML attributes",
                    correct_option: "B",
                    difficulty: "Easy",
                    explanation: "Props (short for properties) are used to pass data from parent components down to child components in React."
                },
                {
                    question: "What is the Context API primarily used for in React applications?",
                    option_a: "Managing server-side database connections",
                    option_b: "Sharing state globally across the component tree without prop drilling",
                    option_c: "Routing between different HTML pages",
                    option_d: "Optimizing CSS animation performance",
                    correct_option: "B",
                    difficulty: "Medium",
                    explanation: "React Context provides a way to pass data through the component tree without having to pass props down manually at every level."
                },
                {
                    question: "Which hook should be used to cache a callback function definition between renders?",
                    option_a: "useMemo",
                    option_b: "useCallback",
                    option_c: "useRef",
                    option_d: "useState",
                    correct_option: "B",
                    difficulty: "Medium",
                    explanation: "useCallback returns a memoized version of the callback function that only changes if one of the dependencies has changed."
                },
                {
                    question: "What is Strict Mode in React?",
                    option_a: "A tool for highlighting potential problems in an application during development",
                    option_b: "A production mode that minifies code",
                    option_c: "A security feature that prevents XSS attacks",
                    option_d: "A TypeScript compiler configuration",
                    correct_option: "A",
                    difficulty: "Easy",
                    explanation: "React.StrictMode is a developer tool that triggers additional checks and warnings for components in development mode."
                },
                {
                    question: "When using the useEffect hook with an empty dependency array `[]`, when does the effect execute?",
                    option_a: "On every re-render",
                    option_b: "Only once after the initial mount",
                    option_c: "Right before the component unmounts only",
                    option_d: "Never",
                    correct_option: "B",
                    difficulty: "Easy",
                    explanation: "Passing an empty dependency array `[]` ensures the effect runs only once after the component mounts."
                },
                {
                    question: "What is the custom hook naming convention enforced by React Rules of Hooks?",
                    option_a: "Must start with 'use' (e.g., useFetch)",
                    option_b: "Must end with 'Hook'",
                    option_c: "Must be written in ALL CAPS",
                    option_d: "Must start with 'get'",
                    correct_option: "A",
                    difficulty: "Easy",
                    explanation: "Custom hooks in React must start with the prefix 'use' to allow linters to automatically check for compliance with hook rules."
                }
            ];
            for (const q of reactQuestions) {
                const [existing] = await pool.query(`SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`, [reactSkillId, q.question]);
                if (existing.length === 0) {
                    await pool.query(`INSERT INTO assessment_questions 
             (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        reactSkillId,
                        q.question,
                        q.option_a,
                        q.option_b,
                        q.option_c,
                        q.option_d,
                        q.correct_option,
                        q.difficulty,
                        q.explanation,
                    ]);
                }
            }
        }
        // Seed TypeScript / JavaScript questions
        const [existingTsSkills] = await pool.query(`SELECT id FROM skills WHERE name LIKE '%TypeScript%' OR name LIKE '%JavaScript%' OR name LIKE '%TS%'`);
        if (existingTsSkills.length > 0) {
            const tsQuestions = [
                {
                    question: "What is the primary benefit of TypeScript over vanilla JavaScript?",
                    option_a: "Direct execution by browser engines without compilation",
                    option_b: "Static type checking at compile time",
                    option_c: "Automatic database optimization",
                    option_d: "Faster CSS render times",
                    correct_option: "B",
                    difficulty: "Easy",
                    explanation: "TypeScript introduces optional static typing that catches type-related errors during compile time before code runs."
                },
                {
                    question: "Which TypeScript utility type constructs a type with all properties of T set to optional?",
                    option_a: "Required<T>",
                    option_b: "Partial<T>",
                    option_c: "Readonly<T>",
                    option_d: "Pick<T, K>",
                    correct_option: "B",
                    difficulty: "Medium",
                    explanation: "Partial<T> makes all properties of type T optional."
                },
                {
                    question: "What does the 'unknown' type represent in TypeScript?",
                    option_a: "A type-safe counterpart to 'any' that requires type narrowing before usage",
                    option_b: "A type for functions that never return",
                    option_c: "An alias for null or undefined",
                    option_d: "A type reserved exclusively for private class fields",
                    correct_option: "A",
                    difficulty: "Medium",
                    explanation: "unknown is the top type in TypeScript. Any value can be assigned to unknown, but performing operations requires type assertions or narrowing."
                },
                {
                    question: "In TypeScript, what is the 'never' type used for?",
                    option_a: "Variables that might be null",
                    option_b: "Values that will never occur, such as a function that always throws an error or never returns",
                    option_c: "Asynchronous promise return types",
                    option_d: "Exporting modules to CommonJS",
                    correct_option: "B",
                    difficulty: "Hard",
                    explanation: "never represents the type of values that never occur, such as functions that throw exceptions or enter infinite loops."
                },
                {
                    question: "How do you define an interface in TypeScript?",
                    option_a: "interface User { name: string; age: number; }",
                    option_b: "struct User { name: string; age: number; }",
                    option_c: "class interface User { name: string; }",
                    option_d: "type interface User = { name: string; }",
                    correct_option: "A",
                    difficulty: "Easy",
                    explanation: "Interfaces are declared using the 'interface' keyword in TypeScript."
                }
            ];
            for (const tsRow of existingTsSkills) {
                for (const q of tsQuestions) {
                    const [existing] = await pool.query(`SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`, [tsRow.id, q.question]);
                    if (existing.length === 0) {
                        await pool.query(`INSERT INTO assessment_questions 
               (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [tsRow.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.difficulty, q.explanation]);
                    }
                }
            }
        }
        // Seed 10 React & TypeScript specific assessment questions
        const [reactTsSkills] = await pool.query(`SELECT id FROM skills WHERE name LIKE '%React%TypeScript%' OR name LIKE '%React%TS%' OR name = 'React & TypeScript' OR name = 'React and TypeScript'`);
        if (reactTsSkills.length > 0) {
            const reactTsSpecificQuestions = [
                {
                    question: "How should you type the `children` prop of a reusable wrapper React component in TypeScript to accept any valid React renderable node?",
                    option_a: "children: React.ReactElement",
                    option_b: "children: React.ReactNode",
                    option_c: "children: JSX.Element",
                    option_d: "children: HTMLElement",
                    correct_option: "B",
                    difficulty: "Medium",
                    explanation: "`React.ReactNode` encompasses all possible renderable values in JSX, including elements, strings, numbers, fragments, portals, `null`, `undefined`, and booleans."
                },
                {
                    question: "When typing an HTML button click event handler in a React component, which TypeScript type is most accurate?",
                    option_a: "React.UIEvent<HTMLButtonElement>",
                    option_b: "React.MouseEvent<HTMLButtonElement>",
                    option_c: "React.SyntheticEvent<HTMLElement>",
                    option_d: "EventTarget.MouseEvent",
                    correct_option: "B",
                    difficulty: "Medium",
                    explanation: "`React.MouseEvent<HTMLButtonElement>` provides proper typing for mouse events originating from standard HTML button elements."
                },
                {
                    question: "Given a generic TypeScript function `function useApiResponse<T>()`, how do you restrict `T` to objects that must include an `id: string` property?",
                    option_a: "function useApiResponse<T extends { id: string }>()",
                    option_b: "function useApiResponse<T implements { id: string }>()",
                    option_c: "function useApiResponse<T : { id: string }>()",
                    option_d: "function useApiResponse<T satisfies { id: string }>()",
                    correct_option: "A",
                    difficulty: "Medium",
                    explanation: "In TypeScript generics, the `extends` keyword enforces constraints on generic type parameters."
                },
                {
                    question: "Given the union type: `type Status = 'idle' | 'loading' | 'success' | 'error'`. Which TypeScript utility type creates a new type containing only `'success' | 'error'`?",
                    option_a: "Omit<Status, 'idle' | 'loading'>",
                    option_b: "Extract<Status, 'success' | 'error'>",
                    option_c: "Pick<Status, 'success' | 'error'>",
                    option_d: "Exclude<Status, 'success' | 'error'>",
                    correct_option: "B",
                    difficulty: "Hard",
                    explanation: "`Extract<T, U>` extracts from union `T` all union members that are assignable to `U`. `Pick` and `Omit` operate on object properties."
                },
                {
                    question: "How should you type a `useRef` hook in React when you intend to attach it to an `<input />` DOM node?",
                    option_a: "const ref = useRef<HTMLInputElement>(null);",
                    option_b: "const ref = useRef<HTMLInputElement | null>(undefined);",
                    option_c: "const ref = useRef<HTMLInputElement>(undefined);",
                    option_d: "const ref = useRef<HTMLInputElement | undefined>();",
                    correct_option: "A",
                    difficulty: "Hard",
                    explanation: "For a DOM ref that React manages, `useRef<HTMLInputElement>(null)` is the standard typing pattern. React assigns the actual DOM element to the ref when the element mounts."
                },
                {
                    question: "What is the utility of TypeScript's `ComponentPropsWithoutRef<'button'>` in React design systems?",
                    option_a: "It extracts all native button HTML attributes while explicitly removing the `ref` prop.",
                    option_b: "It prevents the button from triggering re-renders.",
                    option_c: "It injects accessibility attributes automatically into custom components.",
                    option_d: "It creates a memoized version of standard button props.",
                    correct_option: "A",
                    difficulty: "Medium",
                    explanation: "`ComponentPropsWithoutRef<T>` generates the props associated with an element or component while excluding the `ref` prop, making it useful for components that do not forward refs."
                },
                {
                    question: "What does the `satisfies` operator introduced in TypeScript 4.9 achieve?",
                    option_a: "It forces type widening to `any` for unspecified properties.",
                    option_b: "It validates that an expression matches a type without changing the expression's inferred type.",
                    option_c: "It automatically injects default prop values at runtime.",
                    option_d: "It performs runtime type checking of React components.",
                    correct_option: "B",
                    difficulty: "Hard",
                    explanation: "The `satisfies` operator validates that a value conforms to a type while preserving the more specific inferred type of the expression."
                },
                {
                    question: "Which approach provides strongly typed actions when using `useReducer` with a discriminated union?",
                    option_a: "useReducer<React.Reducer<State, Action>>(reducer, initialState)",
                    option_b: "useReducer<State, Action>(reducer, initialState)",
                    option_c: "useState<Action>(initialState)",
                    option_d: "useCallback<Action>(dispatch)",
                    correct_option: "A",
                    difficulty: "Medium",
                    explanation: "Using `React.Reducer<State, Action>` explicitly connects the state type and discriminated action union, allowing TypeScript to enforce valid actions passed to `dispatch`."
                },
                {
                    question: "What is the type-safe approach for defining a polymorphic React component that changes its rendered HTML element through an `as` prop?",
                    option_a: "type BoxProps = { as: string; [key: string]: any }",
                    option_b: "Use generic types parameterized with `React.ElementType` together with `React.ComponentPropsWithRef<E>`.",
                    option_c: "type BoxProps = React.HTMLProps<HTMLElement>",
                    option_d: "Cast the component output using `as unknown as JSX.Element`.",
                    correct_option: "B",
                    difficulty: "Hard",
                    explanation: "Polymorphic components require a generic element type such as `<E extends React.ElementType>` and dynamically derived component props to maintain type safety."
                },
                {
                    question: "Which TypeScript type is most appropriate for typing the state of a React component that can have exactly three states: loading, successful data, or an error?",
                    option_a: "type State = { status: string; data?: any; error?: any }",
                    option_b: "type State = any",
                    option_c: "type State = { status: 'loading' } | { status: 'success'; data: User[] } | { status: 'error'; error: string };",
                    option_d: "type State = { loading: boolean; success: boolean; error: boolean }",
                    correct_option: "C",
                    difficulty: "Medium",
                    explanation: "A discriminated union represents mutually exclusive states precisely and allows TypeScript to narrow the available properties based on the `status` field."
                }
            ];
            for (const rtsRow of reactTsSkills) {
                for (const q of reactTsSpecificQuestions) {
                    const [existing] = await pool.query(`SELECT id FROM assessment_questions WHERE skill_id = ? AND question = ?`, [rtsRow.id, q.question]);
                    if (existing.length === 0) {
                        await pool.query(`INSERT INTO assessment_questions 
               (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [rtsRow.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.difficulty, q.explanation]);
                    }
                }
            }
        }
        console.log("Database schema reset, skills, and assessment questions populated successfully.");
    }
    catch (error) {
        console.error("Error initializing database tables:", error);
    }
};
