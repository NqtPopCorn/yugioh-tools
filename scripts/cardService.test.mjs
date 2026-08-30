import assert from "node:assert/strict";
import {
  buildYgoprodeckSearchUrl,
  normalizeSearchCard,
  searchCardsFromYGOPRODeck,
  fetchCardInfoFromYGOPRODeck,
} from "../src/services/cardService.js";

// Test 1: buildYgoprodeckSearchUrl default options
const url1 = buildYgoprodeckSearchUrl("light and darkness", {
  num: 18,
  sort: "new",
  apiBase: "https://ygoprodeck.com/api/search/cards.php",
});
assert.equal(
  url1,
  "https://ygoprodeck.com/api/search/cards.php?num=18&name=light%20and%20darkness&sort=new"
);

// Test 2: buildYgoprodeckSearchUrl with offset
const url2 = buildYgoprodeckSearchUrl("dark magician", {
  num: 18,
  offset: 18,
  sort: "new",
  apiBase: "https://ygoprodeck.com/api/search/cards.php",
});
assert.equal(
  url2,
  "https://ygoprodeck.com/api/search/cards.php?num=18&name=dark%20magician&sort=new&offset=18"
);

// Test 2b: buildYgoprodeckSearchUrl with Worker proxy endpoint (/search)
const urlProxy = buildYgoprodeckSearchUrl("dark magician", {
  num: 18,
  offset: 0,
  sort: "new",
  apiBase: "https://yugioh-image-proxy.nqt26304.workers.dev/search",
});
assert.equal(
  urlProxy,
  "https://yugioh-image-proxy.nqt26304.workers.dev/search?num=18&name=dark%20magician&sort=new"
);

// Test 3: normalizeSearchCard
const rawCard = {
  id: 77456448,
  name: "Spell Shattering Sword",
  type: "Quick-Play Spell",
  desc: "Card text...",
  pretty_url: "spell-shattering-sword-15841",
};

const normalized = normalizeSearchCard(rawCard);
assert.equal(normalized.id, 77456448);
assert.equal(normalized.name, "Spell Shattering Sword");
assert.equal(
  normalized.ygoprodeck_url,
  "https://ygoprodeck.com/card/spell-shattering-sword-15841"
);
assert.equal(normalized.card_images.length, 1);
assert.equal(
  normalized.card_images[0].image_url,
  "https://images.ygoprodeck.com/images/cards/77456448.jpg"
);
assert.equal(
  normalized.card_images[0].image_url_small,
  "https://images.ygoprodeck.com/images/cards_small/77456448.jpg"
);

// Test 4: searchCardsFromYGOPRODeck with empty query
const emptyRes = await searchCardsFromYGOPRODeck("");
assert.deepEqual(emptyRes.cards, []);

// Test 5: searchCardsFromYGOPRODeck success mock
const mockFetcher = async (url) => {
  assert(url.includes("name=light%20and%20darkness"));
  assert(url.includes("num=18"));
  assert(url.includes("sort=new"));
  return {
    ok: true,
    status: 200,
    json: async () => ({
      cards: [
        {
          id: 77456448,
          name: "Spell Shattering Sword",
          pretty_url: "spell-shattering-sword-15841",
        },
      ],
      paging: {
        current_rows: 1,
        total_rows: 71,
        rows_remaining: 70,
        next_page_offset: 18,
      },
    }),
  };
};

const searchRes = await searchCardsFromYGOPRODeck("light and darkness", {
  num: 18,
  sort: "new",
  fetcher: mockFetcher,
  apiBase: "https://ygoprodeck.com/api/search/cards.php",
});

assert.equal(searchRes.cards.length, 1);
assert.equal(searchRes.cards[0].name, "Spell Shattering Sword");
assert.equal(
  searchRes.cards[0].card_images[0].image_url,
  "https://images.ygoprodeck.com/images/cards/77456448.jpg"
);
assert.equal(searchRes.paging.rows_remaining, 70);

// Test 6: searchCardsFromYGOPRODeck with 400 No results
const notFoundFetcher = async () => ({
  ok: false,
  status: 400,
  json: async () => ({
    error: "No results matching your query were found in the database.",
  }),
});

const notFoundRes = await searchCardsFromYGOPRODeck("nonexistentcardxyz", {
  fetcher: notFoundFetcher,
  apiBase: "https://ygoprodeck.com/api/search/cards.php",
});
assert.deepEqual(notFoundRes.cards, []);
assert.equal(notFoundRes.paging, null);

// Test 8: searchCardsFromYGOPRODeck client-side cache test
let networkFetchCount = 0;
const countingFetcher = async () => {
  networkFetchCount++;
  return {
    ok: true,
    status: 200,
    json: async () => ({ cards: [{ id: 12345, name: "Cached Card" }] }),
  };
};

await searchCardsFromYGOPRODeck("cached test query", {
  fetcher: countingFetcher,
  apiBase: "https://ygoprodeck.com/api/search/cards.php",
});
assert.equal(networkFetchCount, 1);

// Second call should hit in-memory cache without triggering fetcher
const cachedResult = await searchCardsFromYGOPRODeck("cached test query", {
  fetcher: countingFetcher,
  apiBase: "https://ygoprodeck.com/api/search/cards.php",
});
assert.equal(networkFetchCount, 1);
assert.equal(cachedResult.cards[0].name, "Cached Card");

console.log("card service tests passed");
