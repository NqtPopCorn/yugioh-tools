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
  {
    lineNumber: 11,
    line: "not a real ??? line",
    reason: "Unrecognized decklist line",
  },
  {
    lineNumber: 15,
    line: "Side note ignored",
    reason: "Unrecognized decklist line",
  },
]);

assert.deepEqual(parseDecklistText("   ").items, []);
assert.deepEqual(parseDecklistText("Dark Magician x0").skipped, [
  {
    lineNumber: 1,
    line: "Dark Magician x0",
    reason: "Quantity must be between 1 and 99",
  },
]);

console.log("deck parser tests passed");
