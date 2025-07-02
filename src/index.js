/*
 * Application Entry Point
 * 
 * This file serves as the main entry point for the application, handling:
 * 1. Environment configuration loading
 * 2. Database connection establishment
 * 3. HTTP server initialization
 */

import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.db.js";

// Load environment variables from .env file
// This must be done early to ensure all parts of the app have access to configuration
dotenv.config({
    path: "./.env"
});

// Use environment-defined port or fallback to 8001 if not specified
// This allows for flexibility in deployment environments
const PORT = process.env.PORT || 8001;

// Database Connection and Server Initialization
// --------------------------------------------
// The Promise chain ensures proper sequential startup:
// 1. First establish database connection
// 2. Only start the HTTP server if the database connects successfully
// 3. Log errors if database connection fails

connectDB()
    .then(() => {
        // Database connected successfully, now start the HTTP server
        app.listen(PORT, () => {
            console.log(`Server is running on ${PORT}`);
        });
    })
    .catch((error) => {
        // Database connection failed, log the error
        // Server will not start if database connection fails, preventing partial functionality
        console.log("MongoDB connection error ", error);
    });