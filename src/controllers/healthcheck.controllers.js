import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"; 

/**
 * Health Check Controller
 * 
 * This controller provides an endpoint to verify the application is running properly.
 * It's wrapped with asyncHandler to properly handle any potential errors that might occur
 * during execution, ensuring consistent error responses across the application.
 */
const healthCheck = asyncHandler(async (req, res) => {
    // Return a successful response with HTTP status code 200
    // Uses the ApiResponse utility to ensure consistent response structure
    return res
        .status(200)  // Sets the HTTP status code to 200 (OK)
        .json(new ApiResponse(200, "OK", "Health check passed"))  // Formats the response using the ApiResponse class
})

export { healthCheck }