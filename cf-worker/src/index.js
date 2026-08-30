/**
 * Cloudflare Worker: YGOPRODeck Proxy
 *
 * Provides CORS proxy, rate limiting, and Edge caching for:
 * 1. Image proxy: /images?url=https%3A%2F%2Fimages.ygoprodeck.com%2F...
 * 2. Card search proxy: /search?name=...&num=18&offset=0&sort=new
 *
 * Rate limit: 20 req/s (token bucket, per-isolate)
 * CORS: Configurable via ALLOWED_ORIGINS env variable (default: *)
 * Caching:
 *  - Images: 24h browser / CDN cache
 *  - Search: 1h browser, 24h CDN cache (s-maxage) + stale-while-revalidate + Cloudflare Cache API
 */

const ALLOWED_IMAGE_HOSTS = new Set([
  "images.ygoprodeck.com",
  "ygoprodeck.com",
  "db.ygoprodeck.com",
]);

const SEARCH_API_ENDPOINT = "https://ygoprodeck.com/api/search/cards.php";
const USER_AGENT = "Mozilla/5.0 (compatible; yugioh-tools-proxy)";

/**
 * Tính toán CORS headers dựa theo biến môi trường ALLOWED_ORIGINS
 * - "*" : Cho phép tất cả origin
 * - "https://domain1, https://domain2": Chỉ cho phép domain trong whitelist
 * - Trả về null nếu origin không được phép
 */
function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const configured = env?.ALLOWED_ORIGINS || env?.CORS_ORIGIN || "*";

  // Mặc định cho phép tất cả nếu cấu hình là "*"
  if (configured.trim() === "*") {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
  }

  // Phân tích danh sách origins được phép
  const allowedOrigins = new Set(
    configured
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  // Không có header Origin (vd: curl, non-browser request)
  if (!origin) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
  }

  const normalizedOrigin = origin.trim().toLowerCase();
  if (allowedOrigins.has(normalizedOrigin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Vary": "Origin",
    };
  }

  // Origin không nằm trong danh sách được phép
  return null;
}

// --- Token Bucket Rate Limiter (20 req/s) ---
// Module-level state tồn tại trong vòng đời của một isolate.
// Không globally consistent qua nhiều CF edge node, nhưng đủ dùng cho personal/community tool.
const RATE_LIMIT_RPS = 20; // requests per second
const rateBucket = {
  tokens: RATE_LIMIT_RPS,
  lastRefillMs: Date.now(),
};

function tryConsume() {
  const now = Date.now();
  const elapsedSec = (now - rateBucket.lastRefillMs) / 1000;

  // Nạp lại token theo thời gian đã trôi qua
  rateBucket.tokens = Math.min(
    RATE_LIMIT_RPS,
    rateBucket.tokens + elapsedSec * RATE_LIMIT_RPS
  );
  rateBucket.lastRefillMs = now;

  if (rateBucket.tokens >= 1) {
    rateBucket.tokens -= 1;
    return true; // OK
  }
  return false; // Vượt giới hạn
}

/**
 * Xử lý proxy ảnh (/images?url=...)
 */
async function handleImages(url, corsHeaders, ctx) {
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: "Missing ?url= parameter" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid image URL" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!ALLOWED_IMAGE_HOSTS.has(parsedUrl.hostname)) {
    return new Response(
      JSON.stringify({ error: `Host ${parsedUrl.hostname} is not allowed` }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Kiểm tra Edge Cache API
  const cache = typeof caches !== "undefined" && caches.default ? caches.default : null;
  const cacheKey = new Request(parsedUrl.toString());

  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const responseHeaders = new Headers(cached.headers);
        Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));
        responseHeaders.set("X-Cache", "HIT");
        return new Response(cached.body, {
          status: cached.status,
          headers: responseHeaders,
        });
      }
    } catch {
      // Bỏ qua lỗi cache match
    }
  }

  let upstream;
  try {
    upstream = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": USER_AGENT },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Upstream fetch failed: ${err.message}` }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!upstream.ok) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("Content-Type") || "text/plain",
      },
    });
  }

  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
    "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    "X-Cache": "MISS",
    "X-RateLimit-Limit": String(RATE_LIMIT_RPS),
    "X-RateLimit-Remaining": String(Math.floor(rateBucket.tokens)),
  };

  const response = new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  if (cache && upstream.ok) {
    try {
      const cacheResponse = new Response(response.clone().body, {
        status: upstream.status,
        headers: responseHeaders,
      });
      if (ctx?.waitUntil) {
        ctx.waitUntil(cache.put(cacheKey, cacheResponse));
      } else {
        await cache.put(cacheKey, cacheResponse);
      }
    } catch {
      // Bỏ qua lỗi lưu cache
    }
  }

  return response;
}

/**
 * Xử lý proxy search (/search?name=...&num=...&offset=...&sort=...)
 */
async function handleSearch(url, corsHeaders, ctx) {
  const upstreamUrl = `${SEARCH_API_ENDPOINT}${url.search}`;

  // Kiểm tra Edge Cache API trước để tránh gọi upstream server nếu đã có trong cache
  const cache = typeof caches !== "undefined" && caches.default ? caches.default : null;
  const cacheKey = new Request(upstreamUrl);

  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const responseHeaders = new Headers(cached.headers);
        Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));
        responseHeaders.set("X-Cache", "HIT");
        return new Response(cached.body, {
          status: cached.status,
          headers: responseHeaders,
        });
      }
    } catch {
      // Bỏ qua lỗi cache match
    }
  }

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { "User-Agent": USER_AGENT },
      cf: { cacheTtl: 24 * 60 * 60, cacheEverything: true }, // 1 ngày
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Upstream search fetch failed: ${err.message}` }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const responseBody = await upstream.text();

  const responseHeaders = {
    ...corsHeaders,
    "Content-Type":
      upstream.headers.get("Content-Type") || "application/json; charset=UTF-8",
    // Cache-Control tối ưu: Browser cache 1 giờ, CDN edge cache 24 giờ, phục vụ stale thêm 24 giờ
    "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    "X-Cache": "MISS",
    "X-RateLimit-Limit": String(RATE_LIMIT_RPS),
    "X-RateLimit-Remaining": String(Math.floor(rateBucket.tokens)),
  };

  const response = new Response(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });

  // Lưu vào Edge Cache nếu upstream trả về 200 hoặc 400/404 (để cache cả các kết quả query không tìm thấy)
  if (cache && (upstream.status === 200 || upstream.status === 404 || upstream.status === 400)) {
    try {
      const cacheResponse = new Response(responseBody, {
        status: upstream.status,
        headers: responseHeaders,
      });
      if (ctx?.waitUntil) {
        ctx.waitUntil(cache.put(cacheKey, cacheResponse));
      } else {
        await cache.put(cacheKey, cacheResponse);
      }
    } catch {
      // Bỏ qua lỗi lưu cache
    }
  }

  return response;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request, env);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      if (!corsHeaders) {
        return new Response(
          JSON.stringify({ error: "CORS origin not allowed" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Kiểm tra CORS cho method GET nếu request có Origin header
    if (request.headers.get("Origin") && !corsHeaders) {
      return new Response(
        JSON.stringify({ error: "CORS origin not allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const safeCorsHeaders = corsHeaders || {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...safeCorsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting check
    if (!tryConsume()) {
      const retryAfterMs = Math.ceil(
        ((1 - rateBucket.tokens) / RATE_LIMIT_RPS) * 1000
      );
      return new Response(
        JSON.stringify({ error: "Too Many Requests" }),
        {
          status: 429,
          headers: {
            ...safeCorsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(retryAfterMs / 1000) || 1),
            "X-RateLimit-Limit": String(RATE_LIMIT_RPS),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, ""); // Loại bỏ trailing slash

    // Route: /images hoặc backward-compatibility (root / với ?url=)
    if (pathname === "/images" || (pathname === "" && url.searchParams.has("url"))) {
      return handleImages(url, safeCorsHeaders, ctx);
    }

    // Route: /search
    if (pathname === "/search") {
      return handleSearch(url, safeCorsHeaders, ctx);
    }

    // Default info for root / or unknown paths
    if (pathname === "" || pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "ygoprodeck-proxy",
          status: "healthy",
          routes: {
            images: "/images?url=<encoded_image_url>",
            search: "/search?name=<card_name>&num=18&offset=0&sort=new",
          },
        }),
        {
          status: 200,
          headers: {
            ...safeCorsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(RATE_LIMIT_RPS),
            "X-RateLimit-Remaining": String(Math.floor(rateBucket.tokens)),
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not Found", path: url.pathname }),
      {
        status: 404,
        headers: { ...safeCorsHeaders, "Content-Type": "application/json" },
      }
    );
  },
};
