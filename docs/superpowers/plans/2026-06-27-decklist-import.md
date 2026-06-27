# Decklist Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paste/import flow that turns YDK text and plaintext decklists into printable, CORS-safe card images in the existing PDF grid.

**Architecture:** Keep parsing and YGOPRODeck import orchestration in pure `.mjs` services so they can be tested with Node `assert`. The React UI only owns textarea state, progress display, and appending returned data URLs to `urlList`. Images are materialized to data URLs before entering `urlList`, avoiding remote hotlink/CORS failures during PDF export.

**Tech Stack:** React 19, Vite 7, Node `assert` script tests, YGOPRODeck `cardinfo.php`, Vite dev proxy, `FileReader`/Blob data URL conversion.

---

## File Structure

- Create `src/services/deckParser.mjs`: parses YDK and plaintext decklist lines into normalized import entries and warnings.
- Create `scripts/deckParser.test.mjs`: Node `assert` tests for YDK markers, repeated IDs, quantity formats, default quantity, and skipped lines.
- Create `src/services/ygoprodeckImport.mjs`: builds API/proxy URLs, deduplicates card lookups, rate-limits metadata requests, caches metadata/image data, materializes image blobs to data URLs, and preserves input order/quantity.
- Create `scripts/ygoprodeckImport.test.mjs`: Node `assert` tests with injected fake fetcher, fake sleep, and fake blob converter.
- Modify `vite.config.mjs`: add dev proxy routes for YGOPRODeck API and image hosts.
- Create `src/components/DeckImportForm.jsx`: textarea importer UI with progress, import button, and warning/error list.
- Modify `src/components/Sidebar.jsx`: mount `DeckImportForm` below `ImageForm`.
- Modify `package.json`: add a `test` script that runs all script tests. Keep existing scripts untouched.

Do not stage unrelated existing changes in `package.json`, `src/components/RightSidebar.jsx`, `src/services/cardService.js`, `src/services/print.js`, `scripts/`, or `src/services/printLayout.mjs` unless they are part of the current task and have been reviewed.

---

### Task 1: Deck Parser

**Files:**
- Create: `src/services/deckParser.mjs`
- Create: `scripts/deckParser.test.mjs`

- [ ] **Step 1: Write the failing parser test**

Create `scripts/deckParser.test.mjs`:

```js
import assert from "node:assert/strict";
import { parseDecklistText } from "../src/services/deckParser.mjs";

const input = `
#created by sample
#main
46986414
46986414
3 Dark Magician
3x Blue-Eyes White Dragon
"Dark Magician Girl" x2
Red-Eyes Black Dragon x3
Monster Reborn
not a real ??? line
#extra
89631139
!side
Side note ignored
`;

const result = parseDecklistText(input);

assert.deepEqual(result.items, [
  { type: "id", value: "46986414", quantity: 1, lineNumber: 4 },
  { type: "id", value: "46986414", quantity: 1, lineNumber: 5 },
  { type: "name", value: "Dark Magician", quantity: 3, lineNumber: 6 },
  { type: "name", value: "Blue-Eyes White Dragon", quantity: 3, lineNumber: 7 },
  { type: "name", value: "Dark Magician Girl", quantity: 2, lineNumber: 8 },
  { type: "name", value: "Red-Eyes Black Dragon", quantity: 3, lineNumber: 9 },
  { type: "name", value: "Monster Reborn", quantity: 1, lineNumber: 10 },
  { type: "id", value: "89631139", quantity: 1, lineNumber: 13 },
]);

assert.deepEqual(result.skipped, [
  { lineNumber: 11, line: "not a real ??? line", reason: "Unrecognized decklist line" },
  { lineNumber: 15, line: "Side note ignored", reason: "Unrecognized decklist line" },
]);

assert.deepEqual(parseDecklistText("   ").items, []);
assert.deepEqual(parseDecklistText("Dark Magician x0").skipped, [
  { lineNumber: 1, line: "Dark Magician x0", reason: "Quantity must be between 1 and 99" },
]);

console.log("deck parser tests passed");
```

- [ ] **Step 2: Run the parser test to verify it fails**

Run: `node scripts/deckParser.test.mjs`

Expected: FAIL with module-not-found for `src/services/deckParser.mjs`.

- [ ] **Step 3: Implement the parser**

Create `src/services/deckParser.mjs`:

```js
const MAX_QUANTITY = 99;

const SECTION_MARKERS = new Set(["#main", "#extra", "!side"]);

const normalizeName = (value) =>
  value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");

const createSkipped = (lineNumber, line, reason) => ({
  lineNumber,
  line,
  reason,
});

const toQuantity = (rawQuantity) => {
  const quantity = Number.parseInt(rawQuantity, 10);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return null;
  }
  return quantity;
};

const parsePlaintextLine = (line, lineNumber) => {
  const prefixMatch = line.match(/^(\d{1,2})\s*x?\s+(.+)$/i);
  if (prefixMatch) {
    const quantity = toQuantity(prefixMatch[1]);
    const value = normalizeName(prefixMatch[2]);
    if (!quantity) return { skipped: createSkipped(lineNumber, line, "Quantity must be between 1 and 99") };
    if (value) return { item: { type: "name", value, quantity, lineNumber } };
  }

  const suffixMatch = line.match(/^(.+?)\s+x\s*(\d{1,2})$/i);
  if (suffixMatch) {
    const value = normalizeName(suffixMatch[1]);
    const quantity = toQuantity(suffixMatch[2]);
    if (!quantity) return { skipped: createSkipped(lineNumber, line, "Quantity must be between 1 and 99") };
    if (value) return { item: { type: "name", value, quantity, lineNumber } };
  }

  const defaultName = normalizeName(line);
  if (/^[\w\s,'’:&.!?+\-/]+$/.test(defaultName) && /[A-Za-z]/.test(defaultName)) {
    return { item: { type: "name", value: defaultName, quantity: 1, lineNumber } };
  }

  return { skipped: createSkipped(lineNumber, line, "Unrecognized decklist line") };
};

export const parseDecklistText = (text) => {
  const items = [];
  const skipped = [];
  const lines = String(text || "").split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    const lowerLine = line.toLowerCase();

    if (!line || SECTION_MARKERS.has(lowerLine) || lowerLine.startsWith("#created")) {
      return;
    }

    if (/^\d+$/.test(line)) {
      items.push({ type: "id", value: line, quantity: 1, lineNumber });
      return;
    }

    const parsed = parsePlaintextLine(line, lineNumber);
    if (parsed.item) items.push(parsed.item);
    if (parsed.skipped) skipped.push(parsed.skipped);
  });

  return { items, skipped };
};
```

- [ ] **Step 4: Run the parser test to verify it passes**

Run: `node scripts/deckParser.test.mjs`

Expected: PASS and prints `deck parser tests passed`.

- [ ] **Step 5: Commit the parser**

Run:

```bash
git add src/services/deckParser.mjs scripts/deckParser.test.mjs
git commit -m "feat: parse decklist imports"
```

Expected: commit includes only the parser service and parser test.

---

### Task 2: YGOPRODeck Import Service

**Files:**
- Create: `src/services/ygoprodeckImport.mjs`
- Create: `scripts/ygoprodeckImport.test.mjs`

- [ ] **Step 1: Write the failing import service test**

Create `scripts/ygoprodeckImport.test.mjs`:

```js
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
  buildCardInfoUrl({ type: "name", value: "Blue-Eyes White Dragon" }, { fuzzy: true }),
  "/ygoprodeck-api/cardinfo.php?fname=Blue-Eyes%20White%20Dragon&num=1&offset=0&sort=name"
);
assert.equal(
  createYgoprodeckImageProxyUrl("https://images.ygoprodeck.com/images/cards/46986414.jpg", {
    mode: "development",
  }),
  "/ygoprodeck-image/images/cards/46986414.jpg"
);
assert.equal(
  createYgoprodeckImageProxyUrl("https://images.ygoprodeck.com/images/cards/46986414.jpg", {
    mode: "production",
    productionProxyTemplate: "https://proxy.example.com?url={url}",
  }),
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
        card_images: [{ image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg" }],
      },
    ],
  },
  "/ygoprodeck-api/cardinfo.php?name=Blue-Eyes%20White%20Dragon": {
    data: [
      {
        id: 89631139,
        name: "Blue-Eyes White Dragon",
        card_images: [{ image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg" }],
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
  blobToDataUrl: async (blob) => `data:image/jpeg;base64,${Buffer.from(blob.marker).toString("base64")}`,
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
      return { ok: false, status: 404, json: async () => ({ error: "not found" }) };
    }
    if (url.includes("fname=Unknown")) {
      return { ok: false, status: 404, json: async () => ({ error: "not found" }) };
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
```

- [ ] **Step 2: Run the import service test to verify it fails**

Run: `node scripts/ygoprodeckImport.test.mjs`

Expected: FAIL with module-not-found for `src/services/ygoprodeckImport.mjs`.

- [ ] **Step 3: Implement the import service**

Create `src/services/ygoprodeckImport.mjs`:

```js
const REQUEST_DELAY_MS = 100;
const API_BASE = "/ygoprodeck-api/cardinfo.php";
const IMAGE_HOST = "https://images.ygoprodeck.com";

const normalizeLookupKey = (item) => `${item.type}:${item.value.trim().toLowerCase()}`;

export const buildCardInfoUrl = (item, { fuzzy = false } = {}) => {
  const param = item.type === "id" ? "id" : fuzzy ? "fname" : "name";
  const query = new URLSearchParams({ [param]: item.value });
  if (fuzzy && item.type === "name") {
    query.set("num", "1");
    query.set("offset", "0");
    query.set("sort", "name");
  }
  return `${API_BASE}?${query.toString().replace(/\+/g, "%20")}`;
};

export const createYgoprodeckImageProxyUrl = (
  imageUrl,
  { mode = "production", productionProxyTemplate = "" } = {}
) => {
  if (mode === "development" && imageUrl.startsWith(IMAGE_HOST)) {
    return imageUrl.replace(IMAGE_HOST, "/ygoprodeck-image");
  }
  if (!productionProxyTemplate) {
    throw new Error("Image proxy is not configured.");
  }
  return productionProxyTemplate.replace("{url}", encodeURIComponent(imageUrl));
};

const defaultBlobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const extractCard = (payload) => {
  if (!payload?.data?.length) return null;
  return payload.data[0];
};

export const createYgoprodeckImporter = ({
  fetcher = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  blobToDataUrl = defaultBlobToDataUrl,
  mode = import.meta.env?.DEV ? "development" : "production",
  productionProxyTemplate = import.meta.env?.VITE_YGOPRO_IMAGE_PROXY_URL || "",
} = {}) => {
  const cardCache = new Map();
  const imageCache = new Map();

  const fetchCard = async (item) => {
    const key = normalizeLookupKey(item);
    if (cardCache.has(key)) return cardCache.get(key);

    let response = await fetcher(buildCardInfoUrl(item));
    if (!response.ok && item.type === "name") {
      response = await fetcher(buildCardInfoUrl(item, { fuzzy: true }));
    }
    if (!response.ok) {
      cardCache.set(key, null);
      return null;
    }

    const card = extractCard(await response.json());
    cardCache.set(key, card);
    return card;
  };

  const materializeImage = async (imageUrl) => {
    if (imageCache.has(imageUrl)) return imageCache.get(imageUrl);
    const proxyUrl = createYgoprodeckImageProxyUrl(imageUrl, {
      mode,
      productionProxyTemplate,
    });
    const response = await fetcher(proxyUrl);
    if (!response.ok) {
      throw new Error("Image proxy request failed.");
    }
    const dataUrl = await blobToDataUrl(await response.blob());
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      throw new Error("Image proxy did not return a usable image.");
    }
    imageCache.set(imageUrl, dataUrl);
    return dataUrl;
  };

  const importCards = async (items, { onProgress } = {}) => {
    const urls = [];
    const failures = [];
    const resolved = [];
    const uniqueKeysSeen = new Set();
    let lookupCount = 0;

    for (const item of items) {
      const key = normalizeLookupKey(item);
      const isNewLookup = !uniqueKeysSeen.has(key) && !cardCache.has(key);
      uniqueKeysSeen.add(key);

      if (isNewLookup && lookupCount > 0) {
        await sleep(REQUEST_DELAY_MS);
      }
      if (isNewLookup) lookupCount += 1;

      try {
        const card = await fetchCard(item);
        if (!card) {
          failures.push({ lineNumber: item.lineNumber, value: item.value, reason: "Card not found" });
          continue;
        }

        const imageUrl = card.card_images?.[0]?.image_url;
        if (!imageUrl) {
          failures.push({ lineNumber: item.lineNumber, value: item.value, reason: "Card image not found" });
          continue;
        }

        const dataUrl = await materializeImage(imageUrl);
        for (let i = 0; i < item.quantity; i += 1) {
          urls.push(dataUrl);
        }
        resolved.push({ lineNumber: item.lineNumber, value: item.value, cardName: card.name, quantity: item.quantity });
        onProgress?.({ urls: urls.length, resolved: resolved.length, failures: failures.length });
      } catch (error) {
        failures.push({ lineNumber: item.lineNumber, value: item.value, reason: error.message });
      }
    }

    return { urls, resolved, failures };
  };

  return { importCards };
};
```

- [ ] **Step 4: Run the import service test to verify it passes**

Run: `node scripts/ygoprodeckImport.test.mjs`

Expected: PASS and prints `ygoprodeck import tests passed`.

- [ ] **Step 5: Commit the import service**

Run:

```bash
git add src/services/ygoprodeckImport.mjs scripts/ygoprodeckImport.test.mjs
git commit -m "feat: import ygoprodeck card images safely"
```

Expected: commit includes only the import service and import service test.

---

### Task 3: Vite Proxy And Test Script

**Files:**
- Modify: `vite.config.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing configuration verification**

Run: `npm test`

Expected: FAIL because `package.json` has no `test` script yet.

- [ ] **Step 2: Add test script**

Modify `package.json` scripts to include:

```json
"test": "node scripts/printLayout.test.mjs && node scripts/deviantArtService.test.mjs && node scripts/deckParser.test.mjs && node scripts/ygoprodeckImport.test.mjs"
```

Keep all existing scripts.

- [ ] **Step 3: Add Vite dev proxy**

Modify `vite.config.mjs`:

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    proxy: {
      "/ygoprodeck-api": {
        target: "https://db.ygoprodeck.com/api/v7",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ygoprodeck-api/, ""),
      },
      "/ygoprodeck-image": {
        target: "https://images.ygoprodeck.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ygoprodeck-image/, ""),
      },
    },
  },
  base: "/yugioh-tools/",
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: all script tests pass.

- [ ] **Step 5: Commit config**

Run:

```bash
git add package.json vite.config.mjs
git commit -m "chore: add deck import test and proxy config"
```

Expected: commit includes only `package.json` and `vite.config.mjs`. If `package.json` has unrelated dirty edits, inspect and preserve them instead of reverting.

---

### Task 4: Deck Import UI

**Files:**
- Create: `src/components/DeckImportForm.jsx`
- Modify: `src/components/Sidebar.jsx`

- [ ] **Step 1: Add the UI component**

Create `src/components/DeckImportForm.jsx`:

```jsx
"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { parseDecklistText } from "@/services/deckParser.mjs";
import { createYgoprodeckImporter } from "@/services/ygoprodeckImport.mjs";

export default function DeckImportForm({ setUrlList }) {
  const [deckText, setDeckText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState({ urls: 0, resolved: 0, failures: 0 });

  const importer = useMemo(() => createYgoprodeckImporter(), []);

  const handleImport = async () => {
    const parsed = parseDecklistText(deckText);
    if (parsed.items.length === 0) {
      setSummary({
        skipped: parsed.skipped,
        failures: [{ reason: "Không tìm thấy dòng card hợp lệ để import." }],
        inserted: 0,
      });
      return;
    }

    setIsImporting(true);
    setProgress({ urls: 0, resolved: 0, failures: 0 });
    setSummary(null);

    try {
      const result = await importer.importCards(parsed.items, {
        onProgress: setProgress,
      });
      if (result.urls.length > 0) {
        setUrlList((prev) => [...prev, ...result.urls]);
      }
      setSummary({
        skipped: parsed.skipped,
        failures: result.failures,
        inserted: result.urls.length,
        resolved: result.resolved.length,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mb-4 rounded border border-gray-300 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FileText size={16} />
        Import decklist
      </div>
      <textarea
        className="min-h-32 w-full resize-y rounded border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none"
        placeholder={'#main\n46986414\n3 Dark Magician\n"Dark Magician Girl" x2'}
        value={deckText}
        disabled={isImporting}
        onChange={(event) => setDeckText(event.target.value)}
      />
      <button
        type="button"
        className="mt-2 w-full rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        disabled={isImporting}
        onClick={handleImport}
      >
        {isImporting ? "Đang import..." : "Import ảnh"}
      </button>
      {isImporting && (
        <p className="mt-2 text-xs text-gray-600">
          Đã xử lý {progress.resolved} card, thêm {progress.urls} ảnh, lỗi {progress.failures}.
        </p>
      )}
      {summary && (
        <div className="mt-2 space-y-1 text-xs text-gray-700">
          <p>Đã thêm {summary.inserted} ảnh.</p>
          {summary.skipped.length > 0 && (
            <p className="text-yellow-700">Bỏ qua {summary.skipped.length} dòng không nhận dạng được.</p>
          )}
          {summary.failures.length > 0 && (
            <div className="text-red-600">
              <p>Lỗi {summary.failures.length} mục:</p>
              <ul className="max-h-24 list-disc overflow-y-auto pl-4">
                {summary.failures.slice(0, 6).map((failure, index) => (
                  <li key={`${failure.lineNumber || "general"}-${index}`}>
                    {failure.lineNumber ? `Dòng ${failure.lineNumber}: ` : ""}
                    {failure.value ? `${failure.value} - ` : ""}
                    {failure.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Mount the component in Sidebar**

Modify `src/components/Sidebar.jsx` imports:

```js
import DeckImportForm from "./DeckImportForm";
```

Render it immediately after the paste-image helper text:

```jsx
<p className="text-gray-500 text-sm italic text-center mb-2">
  Hoặc dán ảnh từ clipboard
</p>

<DeckImportForm setUrlList={setUrlList} />
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: all script tests pass.

- [ ] **Step 5: Commit UI**

Run:

```bash
git add src/components/DeckImportForm.jsx src/components/Sidebar.jsx
git commit -m "feat: add decklist import form"
```

Expected: commit includes only the new UI component and sidebar mount.

---

### Task 5: Manual Verification

**Files:**
- No planned file changes.

- [ ] **Step 1: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite serves the app at `http://127.0.0.1:5173/yugioh-tools/` or the next available port.

- [ ] **Step 2: Verify YDK import**

Paste this into the new import textarea:

```text
#main
46986414
89631139
!side
83764718
```

Click `Import ảnh`.

Expected: three card images appear in the grid, progress finishes, and no remote `https://images.ygoprodeck.com/...` URL is appended to `urlList`.

- [ ] **Step 3: Verify plaintext import**

Paste this:

```text
3 Dark Magician
3x Blue-Eyes White Dragon
"Dark Magician Girl" x2
Monster Reborn
```

Click `Import ảnh`.

Expected: nine images appear in the grid.

- [ ] **Step 4: Verify PDF export**

Click `Xuất PDF`, confirm prompts, and save.

Expected: PDF exports without CORS/canvas errors.

- [ ] **Step 5: Final status**

Run: `git status --short`

Expected: only unrelated pre-existing dirty files remain, or a clean tree if those were committed separately by the user.

---

## Self-Review

Spec coverage:

- YDK and plaintext parsing are covered by Task 1.
- API URL construction, dedupe, cache, request delay, fuzzy fallback, image data URL materialization, and unsafe fallback refusal are covered by Task 2.
- Vite development proxy and production proxy environment variable are covered by Task 2 and Task 3.
- Sidebar import UI, progress, partial failure reporting, and appending to `urlList` are covered by Task 4.
- PDF export reliability is covered by Task 5 manual verification.

Placeholder scan:

- The plan contains no TBD/TODO placeholders.
- Code snippets define every new exported function used later.

Type consistency:

- Parser outputs `{ type, value, quantity, lineNumber }`, matching importer inputs.
- Importer returns `{ urls, resolved, failures }`, matching UI usage.
