import assert from "node:assert/strict";
import worker from "../cf-worker/src/index.js";

const envFromWrangler = {
  ALLOWED_ORIGINS: "https://nqtpopcorn.github.io,http://localhost:5173",
};

// Test 1: OPTIONS Preflight từ http://localhost:5173 (Hợp lệ)
const optionsLocalReq = new Request("https://worker.dev/images", {
  method: "OPTIONS",
  headers: { Origin: "http://localhost:5173" },
});
const optionsLocalRes = await worker.fetch(optionsLocalReq, envFromWrangler);
assert.equal(optionsLocalRes.status, 204);
assert.equal(
  optionsLocalRes.headers.get("Access-Control-Allow-Origin"),
  "http://localhost:5173"
);

// Test 2: OPTIONS Preflight từ https://nqtpopcorn.github.io (Hợp lệ)
const optionsProdReq = new Request("https://worker.dev/search", {
  method: "OPTIONS",
  headers: { Origin: "https://nqtpopcorn.github.io" },
});
const optionsProdRes = await worker.fetch(optionsProdReq, envFromWrangler);
assert.equal(optionsProdRes.status, 204);
assert.equal(
  optionsProdRes.headers.get("Access-Control-Allow-Origin"),
  "https://nqtpopcorn.github.io"
);

// Test 3: OPTIONS Preflight từ origin lạ (Không được phép -> 403)
const optionsBlockedReq = new Request("https://worker.dev/search", {
  method: "OPTIONS",
  headers: { Origin: "https://unauthorized-domain.com" },
});
const optionsBlockedRes = await worker.fetch(optionsBlockedReq, envFromWrangler);
assert.equal(optionsBlockedRes.status, 403);

// Test 4: Root info GET từ https://nqtpopcorn.github.io
const rootReq = new Request("https://worker.dev/", {
  method: "GET",
  headers: { Origin: "https://nqtpopcorn.github.io" },
});
const rootRes = await worker.fetch(rootReq, envFromWrangler);
assert.equal(rootRes.status, 200);
assert.equal(
  rootRes.headers.get("Access-Control-Allow-Origin"),
  "https://nqtpopcorn.github.io"
);
const rootData = await rootRes.json();
assert.equal(rootData.name, "ygoprodeck-proxy");
assert.ok(rootData.routes.images);
assert.ok(rootData.routes.search);

// Test 5: GET từ origin lạ (Không được phép -> 403)
const getBlockedReq = new Request("https://worker.dev/", {
  method: "GET",
  headers: { Origin: "http://localhost:3000" },
});
const getBlockedRes = await worker.fetch(getBlockedReq, envFromWrangler);
assert.equal(getBlockedRes.status, 403);

// Test 6: /images without ?url=
const noUrlReq = new Request("https://worker.dev/images", {
  method: "GET",
  headers: { Origin: "http://localhost:5173" },
});
const noUrlRes = await worker.fetch(noUrlReq, envFromWrangler);
assert.equal(noUrlRes.status, 400);

// Test 7: /images with disallowed upstream image host
const badHostReq = new Request(
  "https://worker.dev/images?url=https://malicious.com/image.jpg",
  {
    method: "GET",
    headers: { Origin: "http://localhost:5173" },
  }
);
const badHostRes = await worker.fetch(badHostReq, envFromWrangler);
assert.equal(badHostRes.status, 403);

// Test 8: Unknown route returns 404
const unknownReq = new Request("https://worker.dev/unknown-route", {
  method: "GET",
  headers: { Origin: "http://localhost:5173" },
});
const unknownRes = await worker.fetch(unknownReq, envFromWrangler);
assert.equal(unknownRes.status, 404);

// Test 9: Request không có header Origin (Direct API call / curl) vẫn được phép
const directReq = new Request("https://worker.dev/", { method: "GET" });
const directRes = await worker.fetch(directReq, envFromWrangler);
assert.equal(directRes.status, 200);

// Test 10: Kiểm tra Cache-Control headers trên /search
// Mock global fetch for upstream search
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (url.includes("api/search/cards.php")) {
    return new Response(JSON.stringify({ data: [{ id: 1, name: "Test" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return originalFetch(url);
};

const searchReq = new Request("https://worker.dev/search?name=Dark", {
  method: "GET",
  headers: { Origin: "http://localhost:5173" },
});
const searchRes = await worker.fetch(searchReq, envFromWrangler);
assert.equal(searchRes.status, 200);
const cacheHeader = searchRes.headers.get("Cache-Control");
assert.ok(cacheHeader && cacheHeader.includes("max-age=3600"));
assert.ok(cacheHeader && cacheHeader.includes("s-maxage=86400"));
assert.ok(cacheHeader && cacheHeader.includes("stale-while-revalidate=86400"));

globalThis.fetch = originalFetch;

console.log("worker tests passed with ALLOWED_ORIGINS='https://nqtpopcorn.github.io,http://localhost:5173'");
