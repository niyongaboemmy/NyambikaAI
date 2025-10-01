import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

// Extend Express namespace to include our custom file types
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        /** Field name specified in the form */
        fieldname: string;
        /** Name of the file on the user's computer */
        originalname: string;
        /** Encoding type of the file */
        encoding: string;
        /** Mime type of the file */
        mimetype: string;
        /** Size of the file in bytes */
        size: number;
        /** The folder to which the file has been saved (DiskStorage) */
        destination: string;
        /** The name of the file within the destination (DiskStorage) */
        filename: string;
        /** Location of the uploaded file (DiskStorage) */
        path: string;
        /** A Buffer of the entire file (MemoryStorage) */
        buffer: Buffer;
      }
    }
  }
}

// Extend the Express Request type to include our file types
declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
    files?:
      | {
          [fieldname: string]: Express.Multer.File[];
        }
      | Express.Multer.File[];
  }
}

// Use process.cwd() for more reliable path resolution in both dev and prod
const rootDir = process.cwd();
const uploadDir = path.join(rootDir, "public", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory at: ${uploadDir}`);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: DestinationCallback
  ): void => {
    cb(null, uploadDir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileNameCallback
  ): void => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uuidv4()}-${uniqueSuffix}${ext}`);
  },
});

// File filter for allowed types
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDFs are allowed."));
  }
};

// Initialize multer with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export { upload };

// Function to generate public URL
export function getPublicUrl(filename: string): string {
  return `/uploads/${filename}`;
}

// Function to delete a file
export const deleteFile = (filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(uploadDir, filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        // Ignore file not found errors
        return reject(err);
      }
      resolve();
    });
  });
};
