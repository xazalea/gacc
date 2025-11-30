// Minimal proxy manager - fetches and rotates proxies
const PROXY_URL = 'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/https/data.json';

let cachedProxies: string[] = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getProxy(): Promise<string | undefined> {
  // Refresh cache if needed
  if (Date.now() - lastFetch > CACHE_DURATION || cachedProxies.length === 0) {
    try {
      const response = await fetch(PROXY_URL);
      const data = await response.json();
      cachedProxies = data.map((p: any) => p.proxy).filter((p: string) => p);
      lastFetch = Date.now();
    } catch (e) {
      // If fetch fails, use cached or return undefined
      if (cachedProxies.length === 0) return undefined;
    }
  }
  
  if (cachedProxies.length === 0) return undefined;
  return cachedProxies[Math.floor(Math.random() * cachedProxies.length)];
}

