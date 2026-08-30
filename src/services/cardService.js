const DEVIANTART_UNAVAILABLE_CODE = "DEVIANTART_UNAVAILABLE";

export const createDeviantArtSearchUrl = (searchTerm) =>
  `https://www.deviantart.com/search/deviations?q=${encodeURIComponent(
    searchTerm + " yugioh"
  )}`;

const createDeviantArtUnavailableError = (searchTerm, response) => {
  const error = new Error(
    "DeviantArt RSS search is not available from this environment."
  );
  error.code = DEVIANTART_UNAVAILABLE_CODE;
  error.status = response?.status;
  error.searchUrl = createDeviantArtSearchUrl(searchTerm);
  return error;
};

const createDeviantArtFetchError = (searchTerm, cause) => {
  const error = createDeviantArtUnavailableError(searchTerm);
  error.cause = cause;
  return error;
};

const isBlockedDeviantArtResponse = (xmlText, response) => {
  const contentType = response.headers?.get?.("content-type") || "";

  return (
    response.status === 403 ||
    contentType.includes("text/html") ||
    /<h1>\s*403 error\s*<\/h1>/i.test(xmlText) ||
    /request blocked/i.test(xmlText)
  );
};

export const createDeviantArtRssUrl = (searchTerm, offset) => {
  const rssUrl = `https://backend.deviantart.com/rss.xml?type=deviation&q=boost:popular+${encodeURIComponent(
    searchTerm + " yugioh"
  )}&limit=20&offset=${offset}`;

  return rssUrl;
};

export const parseDeviantArtRss = (strXml) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(strXml, "text/xml");
  const items = xmlDoc.querySelectorAll("item");
  const parsedItems = [];

  items.forEach((item) => {
    const title = item.querySelector("title")?.textContent || "Unknown";
    const link = item.querySelector("link")?.textContent || "#";
    const credits = item.getElementsByTagName("media:credit");
    const author = credits.length > 0 ? credits[0].textContent : "Unknown";
    const mediaContent = item.getElementsByTagName("media:content");
    const mediaThumbnail = item.getElementsByTagName("media:thumbnail");

    let imageUrl = "";
    let quality = { width: 0, height: 0 };
    if (mediaContent.length > 0) {
      imageUrl = mediaContent[0].getAttribute("url");
      quality.width = parseInt(mediaContent[0].getAttribute("width")) || 0;
      quality.height = parseInt(mediaContent[0].getAttribute("height")) || 0;
    } else if (mediaThumbnail.length > 0) {
      imageUrl = mediaThumbnail[mediaThumbnail.length - 1].getAttribute("url");
      quality.width =
        parseInt(
          mediaThumbnail[mediaThumbnail.length - 1].getAttribute("width")
        ) || 0;
      quality.height =
        parseInt(
          mediaThumbnail[mediaThumbnail.length - 1].getAttribute("height")
        ) || 0;
    }

    if (imageUrl) parsedItems.push({ title, author, imageUrl, link, quality });
  });
  return parsedItems;
};

export const fetchImagesFromDeviantArt = async (
  searchTerm,
  offset,
  { fetcher = fetch } = {}
) => {
  const rssUrl = createDeviantArtRssUrl(searchTerm, offset);
  let response;

  try {
    response = await fetcher(rssUrl);
  } catch (error) {
    throw createDeviantArtFetchError(searchTerm, error);
  }

  if (!response.ok) {
    throw createDeviantArtUnavailableError(searchTerm, response);
  }

  const strXml = await response.text();
  if (isBlockedDeviantArtResponse(strXml, response)) {
    throw createDeviantArtUnavailableError(searchTerm, response);
  }

  return parseDeviantArtRss(strXml);
};

export const normalizeSearchCard = (card) => {
  if (!card) return null;
  const id = card.id;
  const imageUrl = `https://images.ygoprodeck.com/images/cards/${id}.jpg`;
  const imageUrlSmall = `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`;
  const imageUrlCropped = `https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg`;
  const ygoprodeckUrl = card.pretty_url
    ? `https://ygoprodeck.com/card/${card.pretty_url}`
    : card.ygoprodeck_url || `https://ygoprodeck.com/card/?search=${id}`;

  return {
    ...card,
    ygoprodeck_url: ygoprodeckUrl,
    card_images:
      card.card_images && card.card_images.length > 0
        ? card.card_images
        : [
            {
              id: id,
              image_url: imageUrl,
              image_url_small: imageUrlSmall,
              image_url_cropped: imageUrlCropped,
            },
          ],
  };
};

export const buildYgoprodeckSearchUrl = (
  query,
  {
    num = 18,
    offset = 0,
    sort = "new",
    apiBase = typeof import.meta !== "undefined" && import.meta.env?.DEV
      ? "/ygoprodeck-search-api/cards.php"
      : typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_YGOPRO_SEARCH_PROXY
      ? import.meta.env.VITE_YGOPRO_SEARCH_PROXY
      : typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_YGOPRO_SEARCH_API_BASE
      ? import.meta.env.VITE_YGOPRO_SEARCH_API_BASE
      : "https://ygoprodeck.com/api/search/cards.php",
  } = {}
) => {
  const params = new URLSearchParams();
  if (num) params.set("num", String(num));
  if (query) params.set("name", query);
  if (sort) params.set("sort", sort);
  if (offset) params.set("offset", String(offset));

  const queryString = params.toString().replace(/\+/g, "%20");
  return `${apiBase}?${queryString}`;
};

const searchCache = new Map();
const MAX_SEARCH_CACHE_ENTRIES = 100;

export const clearSearchCache = () => {
  searchCache.clear();
};

export const searchCardsFromYGOPRODeck = async (
  query,
  {
    num = 18,
    offset = 0,
    sort = "new",
    fetcher = fetch,
    apiBase,
    useCache = true,
  } = {}
) => {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    return { cards: [], data: [], paging: null };
  }

  const url = buildYgoprodeckSearchUrl(trimmed, {
    num,
    offset,
    sort,
    apiBase,
  });

  if (useCache && searchCache.has(url)) {
    return searchCache.get(url);
  }

  const response = await fetcher(url);

  if (response.status === 400 || response.status === 404) {
    const emptyResult = { cards: [], data: [], paging: null };
    if (useCache) {
      if (searchCache.size >= MAX_SEARCH_CACHE_ENTRIES) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
      }
      searchCache.set(url, emptyResult);
    }
    return emptyResult;
  }

  if (!response.ok) {
    throw new Error(`YGOPRODeck search failed with status ${response.status}`);
  }

  const result = await response.json();
  const rawCards = Array.isArray(result)
    ? result
    : result.cards || result.data || [];
  const cards = rawCards.map(normalizeSearchCard).filter(Boolean);

  const formattedResult = {
    cards,
    data: cards,
    paging: result.paging || null,
  };

  if (useCache) {
    if (searchCache.size >= MAX_SEARCH_CACHE_ENTRIES) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
    }
    searchCache.set(url, formattedResult);
  }

  return formattedResult;
};

export const fetchCardInfoFromYGOPRODeck = async (
  query,
  num = 18,
  offset = 0,
  options = {}
) => {
  return searchCardsFromYGOPRODeck(query, {
    num,
    offset,
    sort: options.sort || "new",
    fetcher: options.fetcher || fetch,
    apiBase: options.apiBase,
  });
};

