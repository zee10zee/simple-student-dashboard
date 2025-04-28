import { dbConnect } from './db.js'; // your pool connection

const {pool} = dbConnect();

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      studentname VARCHAR(45) NOT NULL,
       grade  int UNIQUE NOT NULL CHECK(grade < 12),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      city TEXT,
      street TEXT,
      studentid INT REFERENCES students(id) ON DELETE CASCADE
    );
  `);
}

export default createTables;
