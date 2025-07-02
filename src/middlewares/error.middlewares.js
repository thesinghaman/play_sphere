import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";

/**
 * Global Error Handler Middleware
 * 
 * This middleware serves as a centralized error processor for the entire application.
 * It normalizes different types of errors into a consistent ApiError format and
 * determines appropriate status codes based on error types.
 * 
 * @param {Error} err - The error object passed from previous middleware or route handlers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function (unused but required by Express)
 * @returns {Response} - Returns a formatted error response with appropriate status code
 */
const errorHandler = (err, req, res, next) => {
    // Start with the original error
    let error = err

    // If the error is not already an instance of our custom ApiError class
    if(!(error instanceof ApiError)) {
        // Determine appropriate status code:
        // - Use existing statusCode if available
        // - Use 400 (Bad Request) for Mongoose validation errors
        // - Use 500 (Internal Server Error) for all other errors
        const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500

        // Use the original error message or a generic fallback
        const message = error.message || "Something went wrong"
        
        // Create a new ApiError with standardized format
        // Include original validation errors if available
        error = new ApiError(statusCode, message, error?.errors || [], err.stack)
    }

    // Prepare the response object
    // Include stack trace only in development environment for debugging
    const response = {
        // This spreads all properties from the error object into the new response
        // object. It's essentially copying all the enumerable properties from the
        // source object into the target object.
        ...error,

        // This is using the spread operator again, but with a conditional expression:
        // If process.env.NODE_ENV === "development" is true, it spreads {stack: error.stack} into the response object
        // If false, it spreads an empty object {}, which effectively adds nothing
        ...(process.env.NODE_ENV === "development" ? {stack : error.stack} : {})
    }

    // Send the error response with appropriate status code
    return res.status(error.statusCode).json(response)
}

export { errorHandler }