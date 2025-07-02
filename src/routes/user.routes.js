import { Router } from "express";
import { 
    loginUser,
    registerUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

/**
 * User Router
 * 
 * Creates an Express router instance for handling all user-related endpoints.
 */
const router = Router()

/**
 * User Registration Endpoint
 * 
 * POST endpoint for creating new user accounts.
 * Uses multer middleware to handle multipart form data with file uploads.
 * Accepts both avatar and cover image files during registration.
 * 
 * Middleware chain:
 * 1. upload.fields - Processes and stores uploaded files
 * 2. registerUser - Handles the registration logic
 */
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",     // Form field name for avatar image
            maxCount: 1         // Limit to one avatar file
        },
        {
            name:"coverImage",  // Form field name for cover image
            maxCount: 1         // Limit to one cover image file
        }
    ]),
    registerUser               // Controller function to process registration
)

// User Authentication Endpoints
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

/**
 * User Profile Management Endpoints
 * 
 * All of these routes are protected with JWT authentication.
 * File upload routes use multer middleware for handling file uploads.
 */
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

/**
 * Channel and Activity Endpoints
 * 
 * Defines routes for accessing user channel profiles and viewing history:
 * - Channel Profile: Gets a user's public channel information by username
 * - Watch History: Retrieves the authenticated user's video viewing history
 * 
 * Both routes require authentication.
 * The channel profile route uses a URL parameter for the username.
 */
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router