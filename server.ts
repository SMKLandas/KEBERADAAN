import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    teacherId TEXT NOT NULL,
    teacherName TEXT NOT NULL,
    startDate TEXT NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    needRelief BOOLEAN NOT NULL,
    remarks TEXT,
    createdAt TEXT NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/teachers", (req, res) => {
    const teachers = db.prepare("SELECT * FROM teachers ORDER BY name ASC").all();
    res.json(teachers);
  });

  app.post("/api/teachers", (req, res) => {
    const { id, name } = req.body;
    db.prepare("INSERT INTO teachers (id, name) VALUES (?, ?)").run(id, name);
    res.json({ success: true });
  });

  app.delete("/api/teachers/:id", (req, res) => {
    db.prepare("DELETE FROM teachers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/records", (req, res) => {
    const records = db.prepare("SELECT * FROM records ORDER BY createdAt DESC").all();
    res.json(records.map(r => ({ ...r, needRelief: !!r.needRelief })));
  });

  app.post("/api/records", (req, res) => {
    const { id, teacherId, teacherName, startDate, days, reason, needRelief, remarks, createdAt } = req.body;
    db.prepare(`
      INSERT INTO records (id, teacherId, teacherName, startDate, days, reason, needRelief, remarks, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, teacherId, teacherName, startDate, days, reason, needRelief ? 1 : 0, remarks, createdAt);
    res.json({ success: true });
  });

  app.delete("/api/records/:id", (req, res) => {
    db.prepare("DELETE FROM records WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
