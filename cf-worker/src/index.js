/**
 * Cloudflare Worker: YGOPRODeck Image Proxy
 *
 * Fetches images from images.ygoprodeck.com and adds CORS headers
 * so the browser can use them as blobs from any origin.
 *
 * Usage: https://<worker-url>/?url=https%3A%2F%2Fimages.ygoprodeck.com%2F...
 */

const ALLOWED_HOST = "images.ygoprodeck.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing ?url= parameter", { status: 400 });
    }

    // Security: chỉ cho phép fetch từ images.ygoprodeck.com
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    if (parsedUrl.hostname !== ALLOWED_HOST) {
      return new Response(`Only ${ALLOWED_HOST} is allowed`, { status: 403 });
    }

    // Fetch ảnh từ YGOPRODeck
    let upstream;
    try {
      upstream = await fetch(parsedUrl.toString(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; yugioh-tools-proxy)" },
      });
    } catch (err) {
      return new Response(`Upstream fetch failed: ${err.message}`, { status: 502 });
    }

    if (!upstream.ok) {
      return new Response(`Upstream returned ${upstream.status}`, {
        status: upstream.status,
      });
    }

    // Trả về với CORS headers + cache 24h
    const response = new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });

    return response;
  },
};
