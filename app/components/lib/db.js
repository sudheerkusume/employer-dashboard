// lib/mongodb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (uri) {
    if (process.env.NODE_ENV === "development") {
        // Use global variable to prevent multiple connections in development
        if (!globalThis._mongoClientPromise) {
            client = new MongoClient(uri, options);
            globalThis._mongoClientPromise = client.connect();
        }
        clientPromise = globalThis._mongoClientPromise;
    } else {
        // In production, create a reusable client promise
        client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
} else {
    // Avoid top-level crash during Next.js static page analysis / build phase
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
        console.warn("⚠️ MONGODB_URI is not set in environment variables.");
    }
    clientPromise = Promise.resolve({
        db: () => ({
            collection: () => ({
                find: () => ({ toArray: async () => [], sort: () => ({ limit: () => ({ toArray: async () => [] }) }) }),
                findOne: async () => null,
                insertOne: async () => ({ insertedId: "mock_id" }),
                updateOne: async () => ({ matchedCount: 0 }),
                deleteOne: async () => ({ deletedCount: 0 }),
            })
        })
    });
}

export default clientPromise;

