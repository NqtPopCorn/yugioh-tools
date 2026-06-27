import assert from "node:assert/strict";
import { getCardPlacements } from "../src/services/printLayout.mjs";

const yugiohCard = { width: 59, height: 86 };

const exactTwoPagePlacements = getCardPlacements(18, yugiohCard);
assert.equal(exactTwoPagePlacements.length, 18);
assert.equal(Math.max(...exactTwoPagePlacements.map((item) => item.page)), 1);
assert.equal(
    exactTwoPagePlacements.filter((item) => item.page === 0).length,
    9
);
assert.equal(
    exactTwoPagePlacements.filter((item) => item.page === 1).length,
    9
);
assert.deepEqual(exactTwoPagePlacements[8], {
    page: 0,
    x: 128,
    y: 182,
});
assert.deepEqual(exactTwoPagePlacements[9], {
    page: 1,
    x: 10,
    y: 10,
});

const partialSecondPagePlacements = getCardPlacements(10, yugiohCard);
assert.equal(Math.max(...partialSecondPagePlacements.map((item) => item.page)), 1);
assert.equal(
    partialSecondPagePlacements.filter((item) => item.page === 1).length,
    1
);

console.log("print layout tests passed");
