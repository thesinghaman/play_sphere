/*
 * Cloudinary Integration Module
 * 
 * This module provides a clean abstraction for file operations with Cloudinary,
 * a cloud-based media management service.
 */

import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary with credentials from environment variables
// This approach keeps sensitive keys out of the codebase
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Uploads a file to Cloudinary and removes the local copy
const uploadOnCloudinary = async (localFilePath) => {
    try {
        // Return null if no file path is provided
        if(!localFilePath) return null;
        
        console.log("Uploading file:", localFilePath);

        // Verify file exists before attempting upload
        // This prevents unnecessary API calls to Cloudinary
        if (!fs.existsSync(localFilePath)) {
            console.log("File does not exist:", localFilePath);
            return null;
        }

        // Upload to Cloudinary with automatic format detection
        // This ensures optimal handling of different file types (images, videos, etc.)
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        console.log("File uploaded on Cloudinary:", response.url);

        // Remove local file after successful upload
        // This prevents accumulation of temporary files on the server
        fs.unlinkSync(localFilePath);
        return response;
    } catch(error) {
        console.log("Error uploading to Cloudinary:", error);

        // Clean up local file even if upload fails
        // This ensures no orphaned files remain after errors
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

// Deletes a file from Cloudinary storage
const deleteFromCloudinary = async (publicId) => {
    try {
        // Validate publicId to prevent unnecessary API calls
        if (!publicId) {
            console.log("No publicId provided for deletion");
            return null;
        }
        
        // Request deletion from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary:", publicId);
        return result;
    } catch (error) {
        console.log("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };