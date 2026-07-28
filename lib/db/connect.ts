import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  // Mongoose builds indexes in the background and swallows failures silently
  // (e.g. a unique index refusing to build because duplicate data already
  // exists) — force it here once per process so a broken index surfaces in
  // logs instead of silently never protecting anything.
  const { Startup } = await import("./models/Startup");
  Startup.syncIndexes().catch((err) => {
    console.error("Startup.syncIndexes() failed — the unique (owner, tournament) index is NOT enforced:", err);
  });

  const { Tournament } = await import("./models/Tournament");
  Tournament.syncIndexes().catch((err) => {
    console.error("Tournament.syncIndexes() failed — the unique activeLock index is NOT enforced:", err);
  });

  return cache.conn;
}

export default dbConnect;
