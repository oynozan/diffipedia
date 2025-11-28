import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    turbopack: {
        rules: {
            "*.svg": {
                loaders: ["@svgr/webpack"],
                as: "*.js",
            },
        },
    },
    sassOptions: {
        includePaths: [path.join(__dirname, "components")],
        prependData: `@use "@/styles/mixins" as *;`,
    },
    experimental: {
        useCache: true,
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
    },
    devIndicators: {
        position: "bottom-right",
    },
    reactCompiler: true,
    reactStrictMode: false,
};

export default nextConfig;
