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

export const fetchCardInfoFromYGOPRODeck = async (
  query,
  num = 5,
  offset = 0
) => {
  const response = await fetch(
    `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(
      query
    )}&num=${num}&offset=${offset}&sort=name`
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  return data || [];
};
