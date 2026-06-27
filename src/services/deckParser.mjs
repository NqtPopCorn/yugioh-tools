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
    if (!quantity) {
      return {
        skipped: createSkipped(
          lineNumber,
          line,
          "Quantity must be between 1 and 99"
        ),
      };
    }
    if (value) {
      return { item: { type: "name", value, quantity, lineNumber } };
    }
  }

  const suffixMatch = line.match(/^(.+?)\s+x\s*(\d{1,2})$/i);
  if (suffixMatch) {
    const value = normalizeName(suffixMatch[1]);
    const quantity = toQuantity(suffixMatch[2]);
    if (!quantity) {
      return {
        skipped: createSkipped(
          lineNumber,
          line,
          "Quantity must be between 1 and 99"
        ),
      };
    }
    if (value) {
      return { item: { type: "name", value, quantity, lineNumber } };
    }
  }

  const defaultName = normalizeName(line);
  if (/^[\w\s,':&.!+\-/]+$/.test(defaultName) && /[A-Za-z]/.test(defaultName)) {
    return { item: { type: "name", value: defaultName, quantity: 1, lineNumber } };
  }

  return {
    skipped: createSkipped(lineNumber, line, "Unrecognized decklist line"),
  };
};

export const parseDecklistText = (text) => {
  const items = [];
  const skipped = [];
  const lines = String(text || "").split(/\r?\n/);
  let currentSection = null;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    const lowerLine = line.toLowerCase();

    if (!line || lowerLine.startsWith("#created")) {
      return;
    }

    if (SECTION_MARKERS.has(lowerLine)) {
      currentSection = lowerLine;
      return;
    }

    if (/^\d+$/.test(line)) {
      items.push({ type: "id", value: line, quantity: 1, lineNumber });
      return;
    }

    if (currentSection === "!side") {
      skipped.push(
        createSkipped(lineNumber, line, "Unrecognized decklist line")
      );
      return;
    }

    const parsed = parsePlaintextLine(line, lineNumber);
    if (parsed.item) items.push(parsed.item);
    if (parsed.skipped) skipped.push(parsed.skipped);
  });

  return { items, skipped };
};
