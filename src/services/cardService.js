export const fetchImagesFromDeviantArt = async (searchTerm, offset) => {
  const rssUrl = `https://backend.deviantart.com/rss.xml?type=deviation&q=boost:popular+${encodeURIComponent(
    searchTerm + " yugioh"
  )}&limit=20&offset=${offset}`;

  const response = await fetch(rssUrl);
  if (!response.ok) throw new Error("Network response was not ok");
  const strXml = await response.text();
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
