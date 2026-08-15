import { Redis } from "@upstash/redis";

// Upstash credentials are optional infra — null when unset so importers can
// fall back to a weaker (per-instance) strategy instead of crashing at
// module load on a missing url/token.
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

export default redis;
