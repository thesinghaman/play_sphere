/*
 * ApiResponse Class - Standardized API Response Structure
 * 
 * This class creates a consistent response envelope for all API responses,
 * ensuring that clients always receive predictable data structures regardless
 * of the endpoint. Key benefits include:
 * 
 *   1. Consistency: Every response follows the same format
 *   2. Self-documenting: Response includes success status and message
 *   3. Separation of concerns: Distinguishes between HTTP status and application success
 *   4. Flexibility: Can contain any data type (objects, arrays, primitives)
 * 
 * When paired with ApiError, this creates a complete response system where
 * both success and error cases follow predictable patterns, making client-side
 * handling more straightforward.
 */
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        
        // Automatically determine success based on HTTP status code convention
        // Status codes below 400 indicate success (1xx, 2xx, 3xx)
        this.success = statusCode < 400;
    }
}

export { ApiResponse };