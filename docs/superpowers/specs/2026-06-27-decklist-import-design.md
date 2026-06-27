# Decklist Import Design

## Goal

Add a paste/import flow to the Yu-Gi-Oh PDF tool that can insert many card images at once from either YDK text or plaintext decklists. Imported images must be usable by the existing canvas/PDF export path without CORS failures.

## Current Context

The app stores printable card images in `urlList`. Manual file and clipboard image inputs already convert local images to data URLs. Remote URL input and current YGOPRODeck search results can leave remote URLs in the list, which is risky for `canvas.toDataURL()` and `jsPDF` because cross-origin images can taint the canvas.

YGOPRODeck API guidance requires keeping API/image requests low:

- `cardinfo.php` has a rate limit of 20 requests per 1 second.
- YGOPRODeck asks consumers not to continually hotlink images.
- Images from `images.ygoprodeck.com` should be downloaded once and stored or reused locally.

## Supported Input

The import textarea accepts mixed deck text. Blank lines are ignored.

YDK support:

- Ignore section markers such as `#main`, `#extra`, and `!side`.
- Ignore comment-like non-card lines.
- Parse lines that are only digits as card IDs.
- Repeated IDs create repeated cards.

Plaintext support:

- `3 Dark Magician`
- `3x Dark Magician`
- `Dark Magician x3`
- `"Dark Magician" x3`
- `Dark Magician` defaults to quantity `1`.

Each parsed item becomes `{ type: "id" | "name", value, quantity, lineNumber }`. Lines that cannot be parsed are reported to the user and skipped.

## User Flow

Add a compact "Import decklist" section in the left sidebar below the existing URL/file input. It includes:

- A textarea for pasted text.
- An import button.
- A small progress/status line showing parsed cards, resolved cards, failed cards, and inserted images.
- A warning list for skipped or unresolved lines.

When import starts, the button is disabled and progress updates while the queue runs. Successful cards are appended to the current card grid in the same order as the input.

## API And Image Flow

Resolution:

- ID lines use `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=<id>`.
- Name lines prefer exact name lookup with `name=<card name>`.
- If exact lookup fails, use `fname=<card name>&num=1&offset=0&sort=name` as a fallback and report when a fuzzy match was used.

Request safety:

- Deduplicate lookups by normalized key before calling the API.
- Use an in-memory cache for card metadata and materialized image data during the session.
- Process card metadata requests sequentially with a delay of at least 100ms between requests, staying below the documented 20 requests/second limit.
- Do not retry aggressively. Failed items are collected and shown.

Image handling:

- Use the first `card_images[0].image_url` for printing.
- Fetch each unique YGOPRODeck image once through a CORS-safe proxy strategy.
- Convert the fetched image blob to a `data:image/...` URL before appending it to `urlList`.
- Append the data URL `quantity` times so the existing grid, duplicate, save local, and PDF export behaviors continue to work.
- If image materialization fails, do not append the remote URL as a fallback; report the card as failed so PDF export remains reliable.

Proxy strategy:

- In development, use Vite's dev server proxy for YGOPRODeck image URLs.
- In production, use `VITE_YGOPRO_IMAGE_PROXY_URL` as a URL template that receives the encoded image URL. If no proxy is configured or the proxy fails, surface a clear error telling the user image import cannot safely complete.

## Component Boundaries

New pure service modules:

- `src/services/deckParser.mjs`: parse YDK and plaintext decklist lines.
- `src/services/ygoprodeckImport.mjs`: build API URLs, deduplicate jobs, rate-limit lookups, cache results, and materialize images through an injected fetcher/proxy resolver.

UI changes:

- Add `src/components/DeckImportForm.jsx`.
- Mount it from `Sidebar.jsx`, passing `setUrlList`.
- Keep existing `RightSidebar` search behavior intact for this change.

## Error Handling

The importer reports:

- Lines skipped by the parser.
- Cards not found by ID or name.
- API rate/network failures.
- Image proxy/materialization failures.

Partial success is allowed. Successfully materialized cards are inserted; failed cards stay out of `urlList`.

## Testing

Use the repository's existing Node `assert` style.

Tests before implementation:

- Parser handles YDK markers, repeated IDs, and mixed sections.
- Parser handles quantity before name, `3x`, `x3` suffix, quoted names, and default quantity.
- Parser reports unparseable lines without stopping the whole import.
- API URL builder encodes names and IDs correctly.
- Import orchestration deduplicates lookups but preserves output quantity/order.
- Image materialization returns data URLs and refuses unsafe fallback URLs on failure.

## Out Of Scope

- Persistent IndexedDB/localStorage image cache across browser sessions.
- Full deck section separation in the UI.
- Backend-hosted permanent image storage.
- Bulk download of the entire YGOPRODeck image database.
