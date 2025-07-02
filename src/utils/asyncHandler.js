/*
 * asyncHandler - Express Async Error Handling Middleware
 * 
 * This higher-order function solves a critical issue in Express.js: by default,
 * Express cannot catch errors thrown in asynchronous route handlers. Without proper
 * handling, unhandled promise rejections can crash the entire application.
 * 
 * Key benefits:
 *   1. Error Propagation: Automatically forwards async errors to Express error handlers
 *   2. DRY Code: Eliminates repetitive try/catch blocks in route handlers
 *   3. Cleaner Routes: Allows writing async routes without error boilerplate
 *   4. Centralized Error Handling: Works with global error middleware
 * 
 * Usage pattern:
 *   router.get('/resource', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json(new ApiResponse(200, data));
 *   }));
 * 
 * This pattern is essential for modern Express applications that use async/await
 * extensively with database operations, external API calls, and other async tasks.
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        // Wrap the async function execution in Promise.resolve()
        // This ensures that any value (promise or not) is treated as a promise
        Promise.resolve(requestHandler(req, res, next))
            // If the promise rejects, pass the error to Express's next() function
            // This triggers any error handling middleware
            .catch((err) => next(err));
    };
}

export { asyncHandler };