import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

/**
 * Database Connection Function
 * 
 * Establishes a connection to the MongoDB database using mongoose.
 * This function handles the connection process and appropriate error handling.
 */
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB using the environment variable for connection string
        // Combined with the database name imported from constants
        const connectionInstance = await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`)
        
        console.log(`MongoDB connected ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error", error)
        
        // Exit the process with error code 1, indicating failure
        // This is crucial in containerized environments to trigger restart mechanisms
        process.exit(1)
    }
}

export default connectDB