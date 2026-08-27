import { initTables } from "../config/initTables.js";

async function main() {
  console.log("-----------------------------------------");
  console.log("SkillBridge Database Setup & Schema Init");
  console.log("-----------------------------------------");
  try {
    await initTables();
    console.log("✅ All necessary database tables created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

main();
