import multer from "multer";

/**
 * Multer Storage Configuration
 * 
 * Configures how and where uploaded files should be stored in the filesystem.
 * This configuration creates a disk storage engine that:
 * 1. Specifies the destination directory for temporary file storage
 * 2. Generates unique filenames to prevent collisions
 */
const storage = multer.diskStorage({
    /**
     * Destination Function
     * 
     * Determines where uploaded files should be stored.
     * 
     * @param {Request} req - Express request object
     * @param {Object} file - Information about the uploaded file
     * @param {Function} cb - Callback function to indicate destination
     */
    destination: function(req, file, cb) {
        // Store all uploaded files in the './public/temp' directory
        // First parameter (null) indicates no error
        cb(null, './public/temp')
    },
    
    /**
     * Filename Function
     * 
     * Determines what the file should be named on the filesystem.
     * Generates unique filenames to prevent overwriting existing files.
     */
    filename: function(req, file, cb) {
        // Create a unique suffix using timestamp and random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // Combine original filename with the unique suffix
        cb(null, file.originalname + '-' + uniqueSuffix)
    }
})

/**
 * Multer Upload Middleware
 * 
 * Configures and exports the multer middleware with the specified storage settings.
 * This middleware can be used in routes that need to handle file uploads.
 * 
 * Usage example in routes:
 * router.post('/upload', upload.single('image'), controller.uploadHandler)
 */
export const upload = multer({
    storage
})