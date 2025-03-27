import Database from "better-sqlite3";

const db = new Database("database.sqlite");

db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    creation_date TEXT NOT NULL,
    times_clicked INTEGER NOT NULL DEFAULT 0,
    short_url TEXT NOT NULL

  )
`);

export { db };
