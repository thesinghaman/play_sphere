import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 * Generates both access and refresh tokens for user authentication
 * - Access token: Short-lived token for API access
 * - Refresh token: Longer-lived token to get new access tokens
 */
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // Find user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            throw new ApiError(404, "User not found during token generation");
        }
        
        // Call methods defined in the User model schema
        // These methods use JWT to sign tokens with user data payload
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        // Store refresh token in database for validation later
        // This way we can invalidate refresh tokens if needed
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // Skip validation to avoid required field errors
        
        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
}

/**
 * Registers a new user with complete profile information
 * - Handles file uploads for avatar and cover image
 * - Performs validation and duplicate checks
 * - Manages Cloudinary uploads for media files
 */
const registerUser = asyncHandler(async (req, res) => {
    // Extract user data from request body
    const { fullname, email, username, password } = req.body;

    // Check if any required field is empty
    // This uses array.some() to check if any field evaluates to an empty string after trimming
    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if a user with the same username or email already exists
    // $or operator in MongoDB allows matching any of multiple conditions
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists"); // 409 Conflict status
    }

    // Get file paths from multer middleware
    // The req.files object is populated by multer middleware that processes multipart/form-data
    const avatarLocalPath = req.files?.avatar?.[0]?.path; // Optional chaining for safety
    console.log("Avatar path:", avatarLocalPath);
  
    const coverLocalPath = req.files?.coverImage?.[0]?.path;
    console.log("Cover image path:", coverLocalPath);
    
    // Enforce avatar as a required field
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // Upload avatar to Cloudinary cloud service
    // This moves the local temp file to permanent cloud storage
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }
    console.log("Uploaded Avatar", avatar);

    // Upload cover image if provided (optional field)
    let coverImage = null;
    if (coverLocalPath) {
        coverImage = await uploadOnCloudinary(coverLocalPath);
        console.log("Uploaded cover image", coverImage);
    }

    try {
        // Create user document in MongoDB
        // This will also trigger password hashing via pre-save hooks in User model
        const user = await User.create({
            fullname,
            avatar: avatar.url,           // Store Cloudinary URL
            coverImage: coverImage?.url || "", // Use empty string if no cover image
            email, 
            password,                     // Will be hashed by schema pre-save hook
            username: username.toLowerCase() // Store username in lowercase for case-insensitive matching
        });
    
        // Fetch the created user without sensitive fields
        // select("-field1 -field2") excludes specified fields from the result
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );
    
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }
    
        // Return success response with created user data
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully")
        );
    } catch (error) {
        console.log("User creation failed", error);

        // Clean up resources if user creation fails
        // This prevents orphaned images in Cloudinary
        if (avatar && avatar.public_id) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage && coverImage.public_id) {
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new ApiError(500, "Something went wrong while registering the user and images were deleted");
    }
});

/**
 * Authenticates a user and provides JWT tokens for authorization
 * - Verifies credentials against database
 * - Sets HTTP-only cookies for secure token storage
 * - Returns user data and tokens in response
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    
    // Validate login credentials
    if (!email || !password) {
        throw new ApiError(400, "Email is required");
    }

    // Find user by email OR username using MongoDB $or operator
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check password using custom method defined in User model
    // This method will compare hashed passwords
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid user credentials");
    }

    // Generate fresh tokens for this session
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    
    // Get user data without sensitive fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    if (!loggedInUser) {
        throw new ApiError(500, "Could not login user");
    }

    // Configure secure cookie options
    // httpOnly: Prevents JavaScript access to cookies (XSS protection)
    // secure: Only sends cookies over HTTPS in production
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    // Set cookies and return response with user data
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)  // Set access token cookie
        .cookie("refreshToken", refreshToken, options)  // Set refresh token cookie
        .json(new ApiResponse(
            200, 
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully"
        ));
});

/**
 * Logs out a user by clearing tokens
 * - Removes refresh token from database
 * - Clears token cookies from browser
 */
const logoutUser = asyncHandler(async (req, res) => {
    // Remove refresh token from user document
    // Using $set with undefined effectively removes the field
    await User.findByIdAndUpdate(
        req.user._id,  // Current user ID from auth middleware
        {
            $set: {
                refreshToken: undefined
            }
        }, 
        { new: true }  // Return updated document
    );

    // Set cookie options for clearing
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    // Clear both token cookies and return success response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * Refreshes access token using a valid refresh token
 * - Critical for maintaining user sessions without frequent logins
 * - Verifies token authenticity and matches against stored token
 * - Issues new token pair on successful verification
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get refresh token from cookies or request body for flexibility
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshAccessToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }
    console.log("Incoming refresh token:", incomingRefreshToken);

    try {
        // Debug JWT secret to help troubleshoot token verification issues
        console.log("JWT secret:", process.env.REFRESH_TOKEN_SECRET);

        // Ensure environment variable is configured
        if (!process.env.REFRESH_TOKEN_SECRET) {
            throw new ApiError(500, "JWT secret is not defined in environment variables");
        }

        // Verify token signature and decode its payload
        // This will throw an error if token is invalid or expired
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log("Decoded token:", decodedToken);

        // Get user from decoded token ID
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            console.error("User not found for ID:", decodedToken?._id);
            throw new ApiError(401, "Invalid refresh token");
        }

        // Extra security: verify token matches what's stored in database
        // This allows for token revocation by changing stored token
        if (incomingRefreshToken !== user?.refreshToken) {
            console.error("Refresh token mismatch. Incoming:", incomingRefreshToken, "Stored:", user?.refreshToken);
            throw new ApiError(401, "Invalid refresh token");
        }

        // Set cookie options for new tokens
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        // Generate fresh token pair
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        
        // Set new cookies and return tokens in response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));
    } catch (error) {
        console.error("Error while refreshing access token:", error);
        throw new ApiError(500, "Something went wrong while refreshing access token");
    }
});

/**
 * Changes the current user's password
 * - Requires old password verification for security
 * - Updates with new hashed password
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Get current user (added by auth middleware)
    const user = await User.findById(req.user?._id);
    
    // Verify old password is correct before allowing change
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    // Set new password - will be hashed by pre-save hook
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * Gets the current authenticated user's profile data
 * - User is already attached to req object by auth middleware
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    // Simply return the user object that auth middleware attached
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ));
});

/**
 * Updates basic user account details
 * - Updates name and email fields
 * - Returns updated user document
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    // Validate required fields
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required");
    }

    // Update user with $set operator
    // $set updates only specified fields, leaving others unchanged
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true }  // Return updated document instead of original
    ).select("-password -refreshToken");  // Exclude sensitive fields

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

/**
 * Updates user's avatar image with proper resource management
 * - Deletes previous avatar from Cloudinary
 * - Uploads and stores new avatar
 * - Updates user document with new image URL
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
    // Get file path from multer middleware (single file)
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // Get user's current avatar
    const user = await User.findById(req.user?._id).select("avatar");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Extract Cloudinary public ID from current avatar URL
    // This is needed to delete the old image from cloud storage
    // Format: Extract "abc123" from "https://cloudinary.com/path/abc123.jpg"
    const currentAvatarPublicId = user.avatar
        ? user.avatar.split('/').pop().split('.')[0]  // Split by '/' and take last segment, then split by '.' and take first part
        : null;

    // Delete old avatar from Cloudinary if it exists
    if (currentAvatarPublicId) {
        await deleteFromCloudinary(currentAvatarPublicId);
        console.log(`Delete old avatar with public ID ${currentAvatarPublicId}`);
    }

    // Upload new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    // Update user record with new avatar URL
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Avatar image updated successfully")
    );
});

/**
 * Updates user's cover image with proper resource management
 * - Similar to avatar update but for cover image
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // Get user and current cover image
    const user = await User.findById(req.user?._id).select("coverImage");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Extract public ID from current cover image URL
    const currentCoverPublicId = user.coverImage
        ? user.coverImage.split('/').pop().split('.')[0]
        : null;

    // Delete old cover image from Cloudinary
    if (currentCoverPublicId) {
        await deleteFromCloudinary(currentCoverPublicId);
        console.log(`Deleted old cover image with public ID ${currentCoverPublicId}`);
    }

    // Upload new cover image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    // Update user record with new cover image URL
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

/**
 * Gets a user's channel profile with detailed subscription statistics
 * - Uses MongoDB aggregation for complex data manipulation
 * - Combines data from multiple collections (users, subscriptions)
 * - Calculates metrics and relationship to requesting user
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    // Advanced MongoDB aggregation pipeline
    // This performs complex data operations and joins in the database
    const channel = await User.aggregate([
        // Stage 1: Find the channel by username (case insensitive)
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // Stage 2: Join with subscriptions collection to get subscribers
        // $lookup is like a LEFT JOIN in SQL
        {
            $lookup: {
                from: "subscriptions",      // Target collection
                localField: "_id",          // Field from users collection
                foreignField: "channel",    // Field from subscriptions collection
                as: "subscribers"           // Array field to store matched documents
            }
        },
        // Stage 3: Join with subscriptions to get channels this user subscribes to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber", // Now matching on subscriber field
                as: "subscribedTo"
            }
        },
        // Stage 4: Add computed fields to the result
        {
            $addFields: {
                // Count total subscribers
                subscribersCount: {
                    $size: "$subscribers"   // Count array elements
                },
                // Count channels user has subscribed to
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                // Check if current user is subscribed to this channel
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // Check if user ID exists in subscribers
                        then: true,
                        else: false
                    }
                }
            }
        },
        // Stage 5: Select only fields we want to return
        {
            $project: {
                fullName: 1,                // 1 means include this field
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    // Aggregation returns an array, check if empty
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    // Return first (and only) result from aggregation
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        );
});

/**
 * Gets the user's watch history with detailed video information
 * - Uses nested MongoDB aggregation for hierarchical data
 * - Retrieves videos and their owners in a single database operation
 */
const getWatchHistory = asyncHandler(async (req, res) => {
    // Complex multi-level aggregation pipeline
    const user = await User.aggregate([
        // Stage 1: Find the current user
        // Need to convert string ID to MongoDB ObjectId
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // Stage 2: Complex lookup to get watch history videos with owner details
        {
            $lookup: {
                from: "videos",                 // Target collection
                localField: "watchHistory",     // Array field in user document
                foreignField: "_id",            // Field in videos collection
                as: "watchHistory",             // Replace watchHistory IDs with full objects
                pipeline: [
                    // Nested pipeline to process each video document
                    // Stage 2.1: For each video, lookup its owner
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",        // Video's owner field
                            foreignField: "_id",        // User ID
                            as: "owner",                // Replace owner ID with user object
                            pipeline: [
                                // Stage 2.1.1: Select only needed owner fields
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // Stage 2.2: Convert owner array to single object
                    // $lookup always returns an array, even for 1:1 relationships
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"        // Get first (and only) element
                            }
                        }
                    }
                ]
            }
        }
    ]);

    // Return the watch history array from the user document
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};