import multer from "multer";
import type { Request, Response, NextFunction } from "express";

// Storage in memory so buffer can be streamed to Cloudinary or saved to disk
const storage = multer.memoryStorage();

const resumeFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const allowedExtensions = [".pdf", ".doc", ".docx"];

  const fileNameLower = file.originalname.toLowerCase();
  const hasValidExt = allowedExtensions.some((ext) =>
    fileNameLower.endsWith(ext),
  );
  const hasValidMime = allowedMimeTypes.includes(file.mimetype);

  if (hasValidExt || hasValidMime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid resume format. Only PDF, DOC, and DOCX files are allowed.",
      ),
    );
  }
};

const certificateFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

  const fileNameLower = file.originalname.toLowerCase();
  const hasValidExt = allowedExtensions.some((ext) =>
    fileNameLower.endsWith(ext),
  );
  const hasValidMime = allowedMimeTypes.includes(file.mimetype);

  if (hasValidExt || hasValidMime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid certificate format. Only PDF, JPG, JPEG, and PNG files are allowed.",
      ),
    );
  }
};

export const uploadResumeMulter = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
  fileFilter: resumeFilter,
}).single("file");

export const uploadCertificateMulter = multer({
  storage,
  limits: { fileSize: 7 * 1024 * 1024 }, // 7MB max
  fileFilter: certificateFilter,
}).single("file");

// Multer error handling wrappers
export const handleResumeUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  uploadResumeMulter(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res
          .status(400)
          .json({
            error: "File size limit exceeded. Resume must be less than 3MB.",
          });
        return;
      }
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    } else if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
};

export const handleCertificateUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  uploadCertificateMulter(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res
          .status(400)
          .json({
            error: "File size limit exceeded. Certificate must be less than 7MB.",
          });
        return;
      }
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    } else if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
};
