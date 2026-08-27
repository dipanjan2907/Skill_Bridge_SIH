import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "Skill_Bridge",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
pool
    .getConnection()
    .then((conn) => {
    console.log("Connected to MySQL Database: " + process.env.DB_NAME);
    conn.release();
})
    .catch((err) => {
    console.error("MySQL connection error:", err.message);
});
export default pool;
