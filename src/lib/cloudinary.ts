import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(base64Data: string, folder = "pakdropship"): Promise<string> {
  try {
    const uploadString = base64Data.startsWith("data:") 
      ? base64Data 
      : `data:image/jpeg;base64,${base64Data}`;
      
    const result = await cloudinary.uploader.upload(uploadString, {
      folder,
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to Cloudinary.");
  }
}

export default cloudinary;
