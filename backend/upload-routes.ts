import { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import { upload, getPublicUrl, deleteFile } from "./utils/fileUpload";
import { authMiddleware } from "./middleware/auth";

const router = Router();

// Upload a single file
router.post(
  "/upload",
  authMiddleware,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });
      }

      const fileUrl = getPublicUrl(req.file.filename);

      // Get additional file info from request
      const { originalName, fileSize, fileType } = req.query;

      res.status(201).json({
        success: true,
        url: fileUrl,
        previewUrl: fileUrl, // Same as URL for backend-stored files
        filename: req.file.filename,
        originalName: originalName || req.file.originalname,
        fileSize: fileSize || req.file.size,
        fileType: fileType || req.file.mimetype,
        message: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Upload multiple files
router.post(
  "/upload-multiple",
  authMiddleware,
  upload.array("images", 10), // Max 10 files
  async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: "No files uploaded" });
      }

      const files = req.files.map((file) => ({
        success: true,
        url: getPublicUrl(file.filename),
        previewUrl: getPublicUrl(file.filename),
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
      }));

      res.status(201).json({
        success: true,
        files,
        message: `${files.length} files uploaded successfully`,
      });
    } catch (error) {
      console.error("Multiple upload error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload files",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Delete a file
router.delete(
  "/uploads/:filename",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      await deleteFile(filename);
      res.json({ success: true, message: "File deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Serve uploaded files (public route)
router.get("/uploads/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "File not found" });
  }

  // Get file extension to set correct content type
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };

  // Set appropriate content type based on file extension
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  // Handle errors
  fileStream.on("error", (error) => {
    console.error("File stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Error streaming file",
        details: error.message,
      });
    }
  });
});

export default router;
