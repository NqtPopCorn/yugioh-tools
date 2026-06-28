const REQUEST_DELAY_MS = 100;
const API_BASE =
  import.meta.env?.VITE_YGOPRO_API_BASE ||
  "/ygoprodeck-api/cardinfo.php";
const IMAGE_HOST = "https://images.ygoprodeck.com";

const normalizeLookupKey = (item) =>
  `${item.type}:${item.value.trim().toLowerCase()}`;

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
  // Nếu có proxy template (kể cả local CF Worker dev), dùng nó trước
  if (productionProxyTemplate) {
    return productionProxyTemplate.replace("{url}", encodeURIComponent(imageUrl));
  }
  // Fallback dev: dùng Vite proxy (không cần template)
  if (mode === "development" && imageUrl.startsWith(IMAGE_HOST)) {
    return imageUrl.replace(IMAGE_HOST, "/ygoprodeck-image");
  }
  throw new Error("Image proxy is not configured.");
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

  const materializeImage = (imageUrl) => {
    if (imageCache.has(imageUrl)) return imageCache.get(imageUrl);
    const proxyUrl = createYgoprodeckImageProxyUrl(imageUrl, {
      mode,
      productionProxyTemplate,
    });
    // Lưu proxy URL (không fetch blob → tránh base64 tạo ra lừ, đầy localStorage)
    imageCache.set(imageUrl, proxyUrl);
    return proxyUrl;
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
          failures.push({
            lineNumber: item.lineNumber,
            value: item.value,
            reason: "Card not found",
          });
          continue;
        }

        const imageUrl = card.card_images?.[0]?.image_url;
        if (!imageUrl) {
          failures.push({
            lineNumber: item.lineNumber,
            value: item.value,
            reason: "Card image not found",
          });
          continue;
        }

        const dataUrl = materializeImage(imageUrl);
        for (let i = 0; i < item.quantity; i += 1) {
          urls.push(dataUrl);
        }
        resolved.push({
          lineNumber: item.lineNumber,
          value: item.value,
          cardName: card.name,
          quantity: item.quantity,
        });
        onProgress?.({
          urls: urls.length,
          resolved: resolved.length,
          failures: failures.length,
        });
      } catch (error) {
        failures.push({
          lineNumber: item.lineNumber,
          value: item.value,
          reason: error.message,
        });
      }
    }

    return { urls, resolved, failures };
  };

  return { importCards };
};
