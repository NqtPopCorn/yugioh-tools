import assert from "node:assert/strict";
import {
    createDeviantArtSearchUrl,
    fetchImagesFromDeviantArt,
} from "../src/services/cardService.js";

const blockedFetch = async () => ({
    ok: false,
    status: 403,
    statusText: "Forbidden",
    headers: new Map([["content-type", "text/html"]]),
    text: async () => "<html><h1>403 ERROR</h1></html>",
});

await assert.rejects(
    () =>
        fetchImagesFromDeviantArt("Dark Magician", 0, {
            fetcher: blockedFetch,
        }),
    (error) => {
        assert.equal(error.code, "DEVIANTART_UNAVAILABLE");
        assert.equal(error.status, 403);
        assert.equal(
            error.searchUrl,
            "https://www.deviantart.com/search/deviations?q=Dark%20Magician%20yugioh"
        );
        return true;
    }
);

await assert.rejects(
    () =>
        fetchImagesFromDeviantArt("Dark Magician", 0, {
            fetcher: async () => {
                throw new TypeError("Failed to fetch");
            },
        }),
    (error) => {
        assert.equal(error.code, "DEVIANTART_UNAVAILABLE");
        assert.equal(error.cause.message, "Failed to fetch");
        return true;
    }
);

assert.equal(
    createDeviantArtSearchUrl("Blue-Eyes White Dragon"),
    "https://www.deviantart.com/search/deviations?q=Blue-Eyes%20White%20Dragon%20yugioh"
);

console.log("deviantart service tests passed");
