
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();


if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL not defined in .env or Render secrets!");
}


const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
});


redis.on("connect", () => console.log(" Redis connected"));
redis.on("ready", () => console.log(" Redis ready"));
redis.on("error", (err) => console.error(" Redis error:", err));
redis.on("close", () => console.log(" Redis connection closed"));

export default redis;
