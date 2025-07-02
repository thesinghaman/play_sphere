import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";  // Library for password hashing
import jwt from "jsonwebtoken";

const userSchema = new Schema (
    {
        username : {
            type : String,
            required : true,  // Field must be provided
            unique: true,     // Must be unique across all documents
            lowercase: true,  // Automatically converted to lowercase
            trim: true,       // Removes whitespace from both ends
            index: true       // Creates database index for faster queries
        },
        email : {
            type : String,
            required : true,
            unique: true,     // Ensures email uniqueness
            lowercase: true,  // Standardizes email format
            trim: true        // Prevents whitespace issues
        },
        fullname : {
            type : String,
            required : true,
            trim: true,
            index: true       // Indexed for faster searching by name
        },
        avatar : {
            type : String,    // Stores path or URL to avatar image
            required : true   // Users must have an avatar
        },
        coverImage : {
            type : String,    // Optional cover image for user profile
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,  // References to Video documents
                ref: "Video"                  // Model name for population
            }
        ],
        password: {
            type: String,
            requried: [true, "Password is required"]  // Custom error message
        },
        refreshToken : {
            type: String      // Stores JWT refresh token for authentication
        }
    },
    { 
        timestamps : true     // Automatically adds createdAt and updatedAt fields
    }
)


/**
 * Password Hashing Middleware
 * 
 * This pre-save hook automatically hashes the user's password before saving
 * to the database. It only runs when the password field has been modified.
 */
userSchema.pre("save", async function(next) {
    // Skip hashing if password hasn't changed
    if(!this.isModified("password")) return next()

    // Hash the password with a cost factor of 12
    // Higher values increase security but also processing time
    this.password = await bcrypt.hash(this.password, 12)

    next()
})

/**
 * Password Verification Method
 * 
 * Compares a plaintext password against the stored hash.
 * Returns true if password matches, false otherwise.
 * 
 * @param {String} password - The plaintext password to verify
 * @returns {Promise<Boolean>} - True if password matches
 */
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

/**
* Method added to the userSchema that generates a JWT access token for authentication
* This method will be available on any user document retrieved from MongoDB
* Using a regular function (not arrow function) so 'this' refers to the user document
*/
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        // Include user identifiers in the token payload
        _id: this._id,     // MongoDB document ID (unique identifier)
        email: this.email, // User's email address, useful for identification
        username: this.username, // Username, often used in UI displays
        fullname: this.fullname
        
        // Note: Only include non-sensitive data that's needed for authentication/authorization
        // Don't include passwords or other sensitive information in tokens
      },
      
      // Use a secret key stored in environment variables for security
      // This key is used to sign the token and verify it hasn't been tampered with
      // Should be a strong, random string, at least 32 characters
      process.env.ACCESS_TOKEN_SECRET,
      
      {
        // Set token expiration time from environment variables
        // Short expiry (15m-1h) is recommended for access tokens
        // Format examples: '15m', '1h', '7d' (15 minutes, 1 hour, 7 days)
        // After this time, the token will be invalid and the user will need to refresh
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
    )
};

/**
 * Refresh Token Generation Method
 * 
 * Creates a longer-lived JWT containing minimal user information.
 * Used to request new access tokens without requiring re-authentication.
 */
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,  // Only includes user ID for security
                            // Minimizes sensitive data in long-lived token
        },
        process.env.REFRESH_TOKEN_SECRET,  // Different secret from access token
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY  // Longer expiration
        }
    )
}

/**
 * Hey Mongoose, I want to build a new structure in the database.
 * This document will be called "User", and the schema that will be followed 
 * (i.e., the structure that my database will follow) will refer to "userSchema".
 */
export const User = mongoose.model("User", userSchema);