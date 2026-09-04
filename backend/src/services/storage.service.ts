import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadResult {
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  public_id?: string;
}

/**
 * Upload a file directly to Cloudinary
 */
export const uploadFileToStorage = async (
  file: Express.Multer.File,
  subFolder: "resumes" | "certificates"
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured) {
    throw new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file."
    );
  }

  const originalName = path.basename(file.originalname);
  const mimeType = file.mimetype;
  const fileSize = file.size;

  return new Promise((resolve, reject) => {
    const resourceType = mimeType.startsWith("image/") ? "image" : "raw";
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `skillbridge/${subFolder}`,
        resource_type: resourceType,
        public_id: `${Date.now()}_${path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary upload error:", error);
          return reject(
            new Error("Cloudinary upload failed: " + (error?.message || "Unknown error"))
          );
        }
        resolve({
          file_url: result.secure_url,
          file_name: originalName,
          file_type: mimeType,
          file_size: fileSize,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

/**
 * Delete a file directly from Cloudinary
 */
export const deleteFileFromStorage = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) return;
  if (!isCloudinaryConfigured) {
    console.warn("Cloudinary not configured, skipping cloud file deletion.");
    return;
  }

  try {
    if (fileUrl.includes("cloudinary.com")) {
      const parts = fileUrl.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex !== -1) {
        const publicPath = parts.slice(uploadIndex + 2).join("/").replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicPath, { resource_type: "raw" });
        await cloudinary.uploader.destroy(publicPath, { resource_type: "image" });
      }
    }
  } catch (err) {
    console.error("Error deleting file from Cloudinary:", err);
  }
};
