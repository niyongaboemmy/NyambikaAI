import { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import { upload, getPublicUrl, deleteFile } from "./utils/fileUpload";
import { authMiddleware } from "./middleware/auth";
import multer from "multer";
import { processImage } from "./utils/imageProcessor";

const router = Router();

// Upload a single file
router.post(
  "/upload",
  authMiddleware,
  (req: Request, _res: Response, next: any) => {
    console.log("=== Before Multer ===");
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Authorization:", req.headers.authorization);
    next();
  },
  upload.single("image"),
  (err: any, _req: Request, res: Response, next: any) => {
    console.log("=== Multer Error ===");
    console.log("Error:", err);
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ success: false, error: "File too large" });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res
          .status(400)
          .json({ success: false, error: "Too many files" });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res
          .status(400)
          .json({ success: false, error: "Unexpected file field" });
      }
      return res
        .status(400)
        .json({ success: false, error: "File upload error: " + err.message });
    }
    next(err);
  },
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });
      }

      // Get the uploaded file path
      const uploadedFilePath = req.file.path;
      const processedFilePath = path.join(
        path.dirname(uploadedFilePath),
        `processed-${req.file.filename}`
      );

      // Process the image (compress and crop)
      console.log("Processing image:", req.file.filename);
      const processingResult = await processImage(
        uploadedFilePath,
        processedFilePath
      );

      if (!processingResult.success) {
        console.error("Image processing failed:", processingResult.error);
        // Continue with original file if processing fails
        const fileUrl = getPublicUrl(req.file.filename);
        return res.status(201).json({
          success: true,
          url: fileUrl,
          previewUrl: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          message: "File uploaded successfully (processing failed)",
          processingError: processingResult.error,
        });
      }

      // Replace original file with processed file
      fs.unlinkSync(uploadedFilePath);
      const finalFilename = `processed-${req.file.filename}`;
      const finalPath = path.join(
        path.dirname(uploadedFilePath),
        finalFilename
      );
      fs.renameSync(processedFilePath, finalPath);

      const fileUrl = getPublicUrl(finalFilename);

      // Get additional file info from request
      const { originalName, fileSize, fileType } = req.query;

      res.status(201).json({
        success: true,
        url: fileUrl,
        previewUrl: fileUrl,
        filename: finalFilename,
        originalName: originalName || req.file.originalname,
        fileSize:
          processingResult.metadata?.processedSize || fileSize || req.file.size,
        fileType: fileType || req.file.mimetype,
        message: "File uploaded and processed successfully",
        processing: {
          compressionRatio: processingResult.metadata?.compressionRatio,
          dimensions: processingResult.metadata?.dimensions,
        },
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

      const files = await Promise.all(
        req.files.map(async (file) => {
          const uploadedFilePath = file.path;
          const processedFilePath = path.join(
            path.dirname(uploadedFilePath),
            `processed-${file.filename}`
          );

          // Process the image (compress and crop)
          console.log("Processing image:", file.filename);
          const processingResult = await processImage(
            uploadedFilePath,
            processedFilePath
          );

          let finalFilename = file.filename;
          let finalFileSize = file.size;
          let processingInfo = null;

          if (processingResult.success) {
            // Replace original file with processed file
            fs.unlinkSync(uploadedFilePath);
            finalFilename = `processed-${file.filename}`;
            const finalPath = path.join(
              path.dirname(uploadedFilePath),
              finalFilename
            );
            fs.renameSync(processedFilePath, finalPath);
            finalFileSize =
              processingResult.metadata?.processedSize || file.size;
            processingInfo = {
              compressionRatio: processingResult.metadata?.compressionRatio,
              dimensions: processingResult.metadata?.dimensions,
            };
          } else {
            console.error("Image processing failed:", processingResult.error);
          }

          return {
            success: true,
            url: getPublicUrl(finalFilename),
            previewUrl: getPublicUrl(finalFilename),
            filename: finalFilename,
            originalName: file.originalname,
            fileSize: finalFileSize,
            fileType: file.mimetype,
            processing: processingInfo,
            processingError: processingResult.success
              ? null
              : processingResult.error,
          };
        })
      );

      res.status(201).json({
        success: true,
        files,
        message: `${files.length} files uploaded and processed successfully`,
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
  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "File not found" });
  }

  // Get file extension to set correct content type
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };

  // Set appropriate content type based on file extension
  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);

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
