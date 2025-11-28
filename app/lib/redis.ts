import "server-only";

import Redis from "ioredis";

declare global {
    // eslint-disable-next-line no-var
    var __diffipediaRedisClient: Redis | null | undefined;
}

const createRedisClient = (): Redis | null => {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
    const redisPassword = process.env.REDIS_PASSWORD;
    const useTls = process.env.REDIS_TLS === "true";

    if (!redisUrl && !redisHost) {
        if (process.env.NODE_ENV !== "production") {
            console.warn(
                "Redis is not configured. Set REDIS_URL or REDIS_HOST/REDIS_PORT to enable caching.",
            );
        }

        return null;
    }

    try {
        if (redisUrl) {
            return new Redis(redisUrl, {
                enableAutoPipelining: true,
            });
        }

        return new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword || undefined,
            tls: useTls ? {} : undefined,
            enableAutoPipelining: true,
        });
    } catch (error) {
        console.error("Failed to initialize Redis client:", error);
        return null;
    }
};

export const redis: Redis | null =
    global.__diffipediaRedisClient ?? (global.__diffipediaRedisClient = createRedisClient());

export const isRedisEnabled = Boolean(redis);


