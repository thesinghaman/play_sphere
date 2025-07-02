/*
 * ApiError Class - Standardized API Error Handling
 * 
 * This class extends JavaScript's native Error class to create a consistent
 * error structure specifically designed for API responses. It enables more
 * informative error responses by including:
 *   - HTTP status codes for appropriate client handling
 *   - Detailed error messages
 *   - Multiple error details for complex validation scenarios
 *   - Stack traces for debugging in development
 * 
 * Using a dedicated error class:
 *   1. Ensures consistent error formatting across the entire API
 *   2. Simplifies error middleware implementation
 *   3. Makes error handling more predictable for frontend consumers
 *   4. Improves debugging by preserving error context
 */
class ApiError extends Error {
    
    constructor(
        statusCode, 
        message = "Something went wrong", 
        errors = [], 
        stack = ""
    ) {
        super(message);
        
        this.statusCode = statusCode;
        this.data = null;       // No data returned in error scenarios
        this.message = message;
        this.success = false;   // Explicitly marks response as failed
        this.errors = errors;   // Allows returning multiple error details

        // Preserve existing stack trace if provided, otherwise generate a new one
        // This helps maintain the original error context when re-throwing
        if(stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };