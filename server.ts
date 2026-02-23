import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("database.sqlite");

const INITIAL_TEACHERS = [
  "Cg. Azman bin Mohd Nor @ Harun", "Cg. Wan Johari bin Wan Gati", "Cg. Abdullah bin Ab Rahman",
  "Cg. Shaylatulazwin binti Abdul Wahid", "Cg. Anuar Ruddin bin Salleh", "Cg. Zalina binti Omar",
  "Cg. Mohd Kamal bin Harun", "Cg. Mohd Shamsuddin bin Othman", "Cg. Alimien bin Muda",
  "Ust. Ismail bin Salleh", "Cg. Mohammad Syafiq bin Abdul Majeed", "Cg. Mohd Hamidi bin Mohd Noor",
  "Cg. Dul – Rosidi bin Ahmad", "Cg. Mohd Khalis bin Abd. Malik", "Cg. Amirul Shahadam bin Suhasmadi",
  "Cg. Mohd Rizuan bin Ibrahim", "Cg. Nasharuddin bin Ngah", "Cg. Mohd Faizal bin Mohd Noor",
  "Cg. Mohd Shufian bin Abdul Kadir", "Cg. Nor Azimah binti Rokman", "Cg. Farida Hamimi binti Muhamad Saidi",
  "Ustz. Hasni binti Baba", "Cg. Juliani binti Mansor", "Cg. Kartini binti Abdul Rahim",
  "Cg. Noordiana binti Abdul Aziz", "Cg. Nor Hamiza binti Ramli", "Cg. Noorazlina binti Ismail",
  "Cg. Norul Hazlinda bt. Romli", "Cg. Hibatul ’ Atikah binti Khairul Anuar", "Cg. Nur Faizzatul Ain binti Othman",
  "Cg. Rosharizam binti Abd. Ghani", "Ustz. Rosmawati binti Mamat", "Cg. Rusmaniza binti Jusoh",
  "Cg. Sazilawati binti Yusof", "Cg. Saidatul Asima binti Kamarulzaman Shah", "Cg. Siti Halimah binti Ab. Halim",
  "Cg. Siti Saniah binti Idris", "Cg. Suriani binti Muda", "Ustz Rohana binti Awang",
  "Cg. Wan Nor Azlinda bt. Wan Abd. Aziz", "Cg. Amirah Nasuha binti Suhaimi", "Cg. Suhaila Afiqah binti Mohd Nasir",
  "Cg. Nurul Najibah binti Musameh", "Cg. Iza Amirah binti Muhamad Zawahir", "Cg. Nurzahidatullazura binti Amzah",
  "Cg. Azizah binti Ismail"
];

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

// Seed Teachers if empty
const teacherCount = db.prepare("SELECT COUNT(*) as count FROM teachers").get() as { count: number };
if (teacherCount.count === 0) {
  console.log("Seeding initial teachers...");
  const insert = db.prepare("INSERT INTO teachers (id, name) VALUES (?, ?)");
  const transaction = db.transaction((list) => {
    for (let i = 0; i < list.length; i++) {
      // Use stable IDs based on index for the initial seed
      insert.run(`t-${i}`, list[i]);
    }
  });
  transaction(INITIAL_TEACHERS);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    try {
      const teacherCount = db.prepare("SELECT COUNT(*) as count FROM teachers").get() as { count: number };
      const recordCount = db.prepare("SELECT COUNT(*) as count FROM records").get() as { count: number };
      res.json({ 
        status: "ok", 
        database: "connected", 
        teachers: teacherCount.count,
        records: recordCount.count,
        time: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Routes
  app.get("/api/teachers", (req, res) => {
    try {
      let teachers = db.prepare("SELECT * FROM teachers ORDER BY name ASC").all();
      
      // Fallback seeding if empty (extra safety)
      if (teachers.length === 0) {
        const insert = db.prepare("INSERT INTO teachers (id, name) VALUES (?, ?)");
        const transaction = db.transaction((list) => {
          for (let i = 0; i < list.length; i++) {
            insert.run(`t-${i}`, list[i]);
          }
        });
        transaction(INITIAL_TEACHERS);
        teachers = db.prepare("SELECT * FROM teachers ORDER BY name ASC").all();
      }
      
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
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
