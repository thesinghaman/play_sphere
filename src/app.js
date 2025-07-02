/*
 * Main Express Application Configuration
 * 
 * This file serves as the central configuration point for the Express application,
 * establishing middleware, routes, and core functionality.
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";  // Processes cookies in requests
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";  
import tweetRouter from "./routes/tweet.routes.js";
import { healthCheck } from "./controllers/healthcheck.controllers.js";
import { errorHandler } from "./middlewares/error.middlewares.js";

// Initialize the Express application
const app = express();

// Middleware Configuration
// ------------------------

// Parse cookies from incoming requests - enables authentication via cookies
// Must be placed before routes to ensure cookies are available to route handlers
app.use(cookieParser());

// Serve static files from the 'public' directory
// Enables serving images, CSS, client-side JS without specific routes
app.use(express.static("public"));

// Configure Cross-Origin Resource Sharing (CORS)
// Controls which domains can access the API - critical for security
app.use(
    cors({
        // Restricts API access to the specific origin defined in environment variables
        // Prevents cross-site request forgery and unauthorized API usage
        origin: process.env.CORS_ORIGIN,
        
        // Allows cookies to be sent and received in cross-origin requests
        // Essential for authentication systems using cookies
        credentials: true,
    })
);

// Request Body Parsing
// -------------------

// Parse JSON request bodies
// Limits JSON payload size to prevent denial-of-service attacks
app.use(express.json({
    limit: "16kb"
}));

// Parse URL-encoded request bodies (typically from HTML forms)
// The 'extended' option allows for rich objects and arrays to be encoded
app.use(
    express.urlencoded({
        limit: "16kb",
        extended: true
    })
);

// Route Registration
// -----------------

app.use("/api/v1/healthCheck", healthCheck);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweets", tweetRouter); 

// Error handler should be registered AFTER routes, not before,
// other placement will prevent error handling from working correctly
app.use(errorHandler);

export { app };