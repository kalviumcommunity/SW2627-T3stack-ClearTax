import fs from "fs";
import path from "path";
import { pool } from "../lib/db.js";

export async function initDatabase() {
  try {
    const schemaPath = path.join(process.cwd(), "db", "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schemaSql);
    console.log("PostgreSQL database tables initialized successfully.");
  } catch (error) {
    console.error("Error initializing database schema:", error);
  }
}

// Run directly if executed as a script
if (process.argv[1] && process.argv[1].endsWith("init.js")) {
  initDatabase().then(() => pool.end());
}
