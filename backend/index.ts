import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import uploadRoutes from "./upload-routes";

const app = express();

// CORS configuration using cors middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3003",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3003",
      "https://Nyambika.onrender.com",
      "https://nyambika-python.onrender.com",
      "https://nyambika-ai.vercel.app",
      "https://nyambika.com",
      "http://nyambika.com",
      "https://www.nyambika.com",
      "http://www.nyambika.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "x-api-key",
    ],
    credentials: true,
  })
);

// Increase body size limits to support file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Register upload routes
app.use("/api", uploadRoutes);

// Serve uploaded files directly (public access)
const uploadsDir = path.join(process.cwd(), "public", "uploads");
console.log("Serving static files from:", uploadsDir);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  console.log("Creating uploads directory at:", uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files with proper headers
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders: (res, path) => {
      const ext = path.split(".").pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        pdf: "application/pdf",
      };

      if (ext && mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }
    },
  })
);

// Also keep the API endpoint for backward compatibility
app.use("/api/uploads", express.static(uploadsDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    console.log(`serving on port ${port}`);
  });
})();
