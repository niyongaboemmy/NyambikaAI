import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env.PORT || "3004", 10);

// Resolve uploads directory — default to /file-server/uploads/
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "uploads");

const FILE_SERVER_BASE_URL =
  process.env.FILE_SERVER_BASE_URL || `http://localhost:${PORT}`;

// Optional API key for write operations (leave empty to allow all in dev)
const API_KEY = process.env.FILE_SERVER_API_KEY || "";

// Ensure uploads directory exists at startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`Created uploads directory: ${UPLOADS_DIR}`);
}

// ─── CORS ───────────────────────────────────────────────────────────────────

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3003"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key"],
  })
);

app.use(express.json());

// ─── MULTER ──────────────────────────────────────────────────────────────────

const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and PDFs are allowed."));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────

function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  // If no API key configured, allow all (development mode)
  if (!API_KEY) return next();
  if (req.headers["x-api-key"] === API_KEY) return next();
  res.status(401).json({ success: false, message: "Unauthorized" });
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Health check
app.get("/health", (_req: Request, res: Response) => {
  const files = fs.existsSync(UPLOADS_DIR)
    ? fs.readdirSync(UPLOADS_DIR).filter((f) => f !== ".gitkeep").length
    : 0;

  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    filesCount: files,
    uploadsDir: UPLOADS_DIR,
  });
});

// Serve a file
app.get("/files/:filename", (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, message: "File not found" });
    return;
  }

  const ext = path.extname(filename).toLowerCase().slice(1);
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
  };

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year

  if (mimeMap[ext]) {
    res.setHeader("Content-Type", mimeMap[ext]);
  }

  res.sendFile(filePath);
});

// Upload a file
app.post(
  "/upload",
  requireApiKey,
  upload.single("file"),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file provided" });
      return;
    }

    const url = `${FILE_SERVER_BASE_URL}/files/${req.file.filename}`;
    res.status(201).json({
      success: true,
      url,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    });
  }
);

// Delete a file
app.delete(
  "/files/:filename",
  requireApiKey,
  (req: Request, res: Response) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: "File not found" });
      return;
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        res.status(500).json({ success: false, message: "Failed to delete file" });
        return;
      }
      res.json({ success: true, message: "File deleted" });
    });
  }
);

// ─── START ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`File server running on port ${PORT}`);
  console.log(`Serving files from: ${UPLOADS_DIR}`);
  console.log(`Base URL: ${FILE_SERVER_BASE_URL}`);
});
