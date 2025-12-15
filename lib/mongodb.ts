import mongoose, { ConnectOptions } from 'mongoose';

// Shape of our cached connection object stored on the global scope
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the Node.js global type with our custom cache property so TypeScript
// knows it exists. This file only runs on the server.
declare global {
  // Using `var` here ensures the property is attached to the actual Node.js global object.
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

// Reuse the existing cache if it exists, otherwise initialize a new empty cache.
// `globalThis` is used instead of `global` for broader compatibility.
const globalForMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose._mongooseCache ?? {
  conn: null,
  promise: null,
};

// Persist the cache on the global object so that it survives HMR in development.
// In production, this is effectively a singleton for the entire server runtime.
if (!globalForMongoose._mongooseCache) {
  globalForMongoose._mongooseCache = cached;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local',
  );
}

// Centralized connection options for Mongoose. Adjust as needed for your setup.
const mongooseOptions: ConnectOptions = {
  // Disable Mongoose's internal command buffering so that operations fail fast
  // if the connection is not ready instead of hanging indefinitely.
  bufferCommands: false,
  dbName: 'nextjs-mini-project',
};

/**
 * Connect to MongoDB using a singleton Mongoose connection.
 *
 * This function ensures that:
 * - Only one Mongoose connection is created per server runtime.
 * - During development with hot module reloading (HMR), the existing
 *   connection is reused instead of creating a new one on every file change.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // If we already have an active connection, reuse it.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is already in progress, await it instead of creating a new one.
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, mongooseOptions).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Optionally export the raw Mongoose instance type for use in model files.
export type MongooseInstance = typeof mongoose;