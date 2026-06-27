import assert from "node:assert/strict";
import {
  buildCardInfoUrl,
  createYgoprodeckImporter,
  createYgoprodeckImageProxyUrl,
} from "../src/services/ygoprodeckImport.mjs";

assert.equal(
  buildCardInfoUrl({ type: "id", value: "46986414" }),
  "/ygoprodeck-api/cardinfo.php?id=46986414"
);
assert.equal(
  buildCardInfoUrl({ type: "name", value: "Dark Magician" }),
  "/ygoprodeck-api/cardinfo.php?name=Dark%20Magician"
);
assert.equal(
  buildCardInfoUrl(
    { type: "name", value: "Blue-Eyes White Dragon" },
    { fuzzy: true }
  ),
  "/ygoprodeck-api/cardinfo.php?fname=Blue-Eyes%20White%20Dragon&num=1&offset=0&sort=name"
);
assert.equal(
  createYgoprodeckImageProxyUrl(
    "https://images.ygoprodeck.com/images/cards/46986414.jpg",
    { mode: "development" }
  ),
  "/ygoprodeck-image/images/cards/46986414.jpg"
);
assert.equal(
  createYgoprodeckImageProxyUrl(
    "https://images.ygoprodeck.com/images/cards/46986414.jpg",
    {
      mode: "production",
      productionProxyTemplate: "https://proxy.example.com?url={url}",
    }
  ),
  "https://proxy.example.com?url=https%3A%2F%2Fimages.ygoprodeck.com%2Fimages%2Fcards%2F46986414.jpg"
);

const calls = [];
const sleeps = [];
const fakeCards = {
  "/ygoprodeck-api/cardinfo.php?id=46986414": {
    data: [
      {
        id: 46986414,
        name: "Dark Magician",
        card_images: [
          {
            image_url:
              "https://images.ygoprodeck.com/images/cards/46986414.jpg",
          },
        ],
      },
    ],
  },
  "/ygoprodeck-api/cardinfo.php?name=Blue-Eyes%20White%20Dragon": {
    data: [
      {
        id: 89631139,
        name: "Blue-Eyes White Dragon",
        card_images: [
          {
            image_url:
              "https://images.ygoprodeck.com/images/cards/89631139.jpg",
          },
        ],
      },
    ],
  },
};

const importer = createYgoprodeckImporter({
  fetcher: async (url) => {
    calls.push(url);
    if (url.startsWith("/ygoprodeck-image/")) {
      return {
        ok: true,
        blob: async () => ({ marker: url }),
      };
    }
    return {
      ok: Boolean(fakeCards[url]),
      status: fakeCards[url] ? 200 : 404,
      json: async () => fakeCards[url] || { error: "not found" },
    };
  },
  sleep: async (ms) => sleeps.push(ms),
  blobToDataUrl: async (blob) =>
    `data:image/jpeg;base64,${Buffer.from(blob.marker).toString("base64")}`,
  mode: "development",
});

const result = await importer.importCards([
  { type: "id", value: "46986414", quantity: 2, lineNumber: 1 },
  { type: "id", value: "46986414", quantity: 1, lineNumber: 2 },
  { type: "name", value: "Blue-Eyes White Dragon", quantity: 1, lineNumber: 3 },
]);

assert.equal(result.urls.length, 4);
assert.equal(result.failures.length, 0);
assert.equal(result.resolved.length, 3);
assert.equal(
  calls.filter((url) => url.includes("cardinfo.php?id=46986414")).length,
  1
);
assert.equal(
  calls.filter((url) => url.includes("images/cards/46986414.jpg")).length,
  1
);
assert.deepEqual(sleeps, [100]);

const failingImporter = createYgoprodeckImporter({
  fetcher: async (url) => {
    if (url.includes("name=Unknown")) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: "not found" }),
      };
    }
    if (url.includes("fname=Unknown")) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: "not found" }),
      };
    }
    return { ok: false, status: 500, json: async () => ({ error: "bad" }) };
  },
  sleep: async () => {},
  blobToDataUrl: async () => "data:image/jpeg;base64,x",
  mode: "development",
});

const failed = await failingImporter.importCards([
  { type: "name", value: "Unknown", quantity: 1, lineNumber: 9 },
]);

assert.equal(failed.urls.length, 0);
assert.deepEqual(failed.failures, [
  { lineNumber: 9, value: "Unknown", reason: "Card not found" },
]);

console.log("ygoprodeck import tests passed");
