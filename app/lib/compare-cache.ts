import "server-only";

import { createHash } from "node:crypto";

import { redis } from "@/lib/redis";

const KEY_PREFIX = "diffipedia:compare";
const ttlFromEnv = Number(
    process.env.COMPARE_CACHE_TTL_SECONDS ?? process.env.REDIS_CACHE_TTL ?? "600",
);
export const COMPARE_CACHE_TTL_SECONDS =
    Number.isFinite(ttlFromEnv) && ttlFromEnv > 0 ? ttlFromEnv : 600;

export const buildCompareCacheKey = (
    bucket: string,
    grokipedia: string | null | undefined,
    wikipedia: string | null | undefined,
): string => {
    const hash = createHash("sha256")
        .update(grokipedia ?? "")
        .update("::")
        .update(wikipedia ?? "")
        .digest("hex");

    return `${KEY_PREFIX}:${bucket}:${hash}`;
};

export async function getCompareCacheValue<T>(key: string): Promise<T | null> {
    if (!redis) {
        return null;
    }

    try {
        const cachedValue = await redis.get(key);
        if (!cachedValue) {
            return null;
        }

        return JSON.parse(cachedValue) as T;
    } catch (error) {
        console.error(`[compare-cache] Failed to read cache key ${key}:`, error);
        return null;
    }
}

export async function setCompareCacheValue<T>(
    key: string,
    value: T,
    ttlSeconds = COMPARE_CACHE_TTL_SECONDS,
): Promise<void> {
    if (!redis) {
        return;
    }

    try {
        await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (error) {
        console.error(`[compare-cache] Failed to write cache key ${key}:`, error);
    }
}


