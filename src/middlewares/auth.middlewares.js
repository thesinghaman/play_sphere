// Import required dependencies
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * JWT Verification Middleware
 * 
 * This middleware authenticates users by verifying their JWT tokens.
 * It extracts the token from either cookies or the Authorization header,
 * verifies it, retrieves the corresponding user, and attaches the user
 * object to the request for use in subsequent route handlers.
 */
const verifyJWT = asyncHandler(async (req, _, next) => {
    // Extract token from either cookies or Authorization header
    // When from Authorization header, remove the "Bearer " prefix
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    // If no token is present, throw an authentication error
    if (!token) {
        throw new ApiError(401, "Not authorized, no token");
    }

    try {
        console.log("Token found:", token);

        // Verify the token using the secret key stored in environment variables
        // This validates the token's signature and expiration
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded Token:", decodedToken);

        // Use the user ID from the decoded token to find the user in database
        // Select all fields except password and refreshToken for security
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        console.log("User found:", user);

        // If user doesn't exist in database despite having a valid token
        if (!user) { 
            throw new ApiError(401, "User not found");
        }

        // Attach the user object to the request for use in subsequent middleware or controllers
        req.user = user;

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error("Error during JWT verification:", error);
        throw new ApiError(401, "Not authorized, token failed");
    }
})

export { verifyJWT }