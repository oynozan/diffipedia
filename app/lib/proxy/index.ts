/* eslint-disable @typescript-eslint/no-explicit-any */

import { join } from "path";
import { readFileSync } from "fs";
import UserAgent from 'user-agents';
import axios, { type AxiosResponse } from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";

export async function proxyFetch(url: string, method: string, options?: any, retries = 5) {
    const proxy = new SocksProxyAgent(getRandomProxy());
    const userAgent = new UserAgent();

    let res: AxiosResponse<any, any>;
    try {
        res = await axios(url, {
            method,
            httpAgent: proxy,
            httpsAgent: proxy,
            ...options,
            headers: {
                ...options?.headers,
                "User-Agent": userAgent.toString(),
            },
        });
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        if (retries > 0) return proxyFetch(url, method, options, retries - 1);
        else throw new Error(`Failed to fetch ${url} after multiple retries.`);
    }

    if (res.status < 200 || res.status >= 300) {
        if (retries > 0) return proxyFetch(url, method, options, retries - 1);
        else throw new Error(`Failed to fetch ${url} after multiple retries.`);
    }

    return res.data;
}

export function getRandomProxy() {
    const listPath = join(process.cwd(), "./lib/proxy/list.txt");
    const proxies = readFileSync(listPath, "utf-8")
        .split("\n")
        .filter(Boolean)
        .map(p => p.trim());
    const randomIndex = Math.floor(Math.random() * proxies.length);
    return formatProxy(proxies[randomIndex]);
}

// IP:PORT:USERNAME:PASSWORD --> socks5://USERNAME:PASSWORD@IP:PORT
function formatProxy(proxy: string) {
    const parts = proxy.split(":");
    return `socks5://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
}
