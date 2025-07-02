import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controllers.js";

/**
 * Health Check Router
 * 
 * Creates an Express router instance for handling health check endpoints.
 * This router is typically mounted at a path like '/health' or '/api/health'
 * in the main application.
 */
const router = Router()

/**
 * Health Check Endpoint
 * 
 * Defines a GET endpoint at the root path of this router.
 * When accessed, it will execute the healthCheck controller function.
 * 
 * This endpoint allows monitoring tools, load balancers, and orchestration
 * systems to verify that the application is running correctly.
 */
router.route("/").get(healthCheck)

export default router