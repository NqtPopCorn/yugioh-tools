"use client";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  ListIndentIncrease,
  ListIndentDecrease,
} from "lucide-react";

export default function RightSidebar({ setUrlList, isOpen = true, setIsOpen }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Ref để xử lý debounce
  const debounceTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // --- LOGIC 1: Autocomplete (YGOPRODeck API) ---
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(
            query
          )}&num=5&offset=0&sort=name`
        );
        const data = await response.json();
        if (data.data) {
          setSuggestions(data.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimeoutRef.current);
  }, [query]);

  // Ẩn gợi ý khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIC 2: Tìm kiếm DeviantArt ---
  const handleSearch = async () => {
    if (!query) return;

    setShowSuggestions(false);
    setIsLoading(true);
    setResults([]);

    const res = await fetchImagesFromDeviantArt(query, 0);
    setResults(res);
  };

  const fetchImagesFromDeviantArt = async (searchTerm, offset) => {
    const rssUrl = `https://backend.deviantart.com/rss.xml?type=deviation&q=boost:popular+${encodeURIComponent(
      searchTerm + " yugioh"
    )}&limit=20&offset=${offset}`;

    try {
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
          quality.height =
            parseInt(mediaContent[0].getAttribute("height")) || 0;
        } else if (mediaThumbnail.length > 0) {
          imageUrl =
            mediaThumbnail[mediaThumbnail.length - 1].getAttribute("url");
          quality.width =
            parseInt(
              mediaThumbnail[mediaThumbnail.length - 1].getAttribute("width")
            ) || 0;
          quality.height =
            parseInt(
              mediaThumbnail[mediaThumbnail.length - 1].getAttribute("height")
            ) || 0;
        }

        if (imageUrl)
          parsedItems.push({ title, author, imageUrl, link, quality });
      });
      return parsedItems;
    } catch (error) {
      console.error("Error fetching DeviantArt:", error);
      alert("Lỗi khi tải dữ liệu từ DeviantArt (Có thể do chặn CORS).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMore = async () => {
    const moreResults = await fetchImagesFromDeviantArt(query, results.length);
    setResults((prev) => [...prev, ...moreResults]);
  };

  const selectSuggestion = (name) => {
    setQuery(name);
    setShowSuggestions(false);
    setTimeout(() => handleSearch(), 100);
  };

  const handleAddImage = (url) => {
    setUrlList((prev) => [...prev, url]);
  };

  return (
    <>
      {/* --- Mobile Backdrop (Lớp phủ mờ khi mở trên mobile) --- */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- Main Sidebar Container --- */}
      <div
        className={`
          bg-white border-l border-gray-200 flex flex-col shadow-lg z-50
          fixed inset-y-0 right-0 
          ${isOpen ? "translate-x-0 w-[85vw]" : "translate-x-full w-[85vw]"}
          md:translate-x-0 md:static md:h-screen md:sticky md:top-0
          ${isOpen ? "md:w-80" : "md:w-0 md:overflow-hidden md:border-l-0"}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center whitespace-nowrap overflow-hidden">
          <h2 className="font-bold text-gray-700">Tìm kiếm Art</h2>

          {/* Nút Đóng (Close) tích hợp bên trong */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors"
            title="Đóng sidebar"
          >
            <ListIndentIncrease size={20} />
          </button>
        </div>

        <div className="relative px-4 py-2" ref={wrapperRef}>
          <div className="flex gap-1">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
              placeholder="Nhập tên card..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-green-600 text-white px-3 rounded hover:bg-green-700"
            >
              <Search size={16} />
            </button>
          </div>
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 left-4 right-4 bg-white border border-gray-200 rounded-b shadow-lg mt-1 max-h-60 overflow-y-auto">
              {suggestions.map((card) => (
                <li
                  key={card.id}
                  onClick={() => selectSuggestion(card.name)}
                  className="p-2 hover:bg-green-50 cursor-pointer flex items-center gap-2 border-b border-gray-100 last:border-0"
                >
                  <img
                    src={card.card_images[0].image_url_small}
                    alt=""
                    className="w-8 h-8 object-cover rounded"
                  />
                  <span className="text-sm text-gray-700 truncate">
                    {card.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-100">
          <div className="grid grid-cols-2 gap-2">
            {results.map((item, index) => (
              <div
                key={index}
                className="group relative bg-white rounded shadow overflow-hidden aspect-[59/86]"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-1/2 bottom-0 left-0 right-0 bg-[#00000099] transition-all flex flex-col items-center justify-center md:opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleAddImage(item.imageUrl)}
                    className="bg-green-500 text-white text-sm p-2 rounded-full hover:bg-green-600 mb-2 transform hover:scale-110 transition-transform shadow-lg flex items-center gap-1"
                  >
                    Add{" "}
                    <span>
                      ({item.quality.width + "x" + item.quality.height})
                    </span>
                  </button>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white text-xs hover:underline px-2 py-1 rounded"
                  >
                    Xem gốc
                  </a>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-4 text-gray-500">Đang tải...</div>
          )}
          {!isLoading && results.length === 0 && query && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Chưa có kết quả.
            </p>
          )}
          {results.length > 0 && (
            <button
              onClick={handleViewMore}
              className="w-full mt-2 py-2 text-white bg-blue-600 rounded border border-gray-300 hover:bg-blue-700 transition-colors mt-4 mb-2"
            >
              Xem thêm
            </button>
          )}
        </div>
      </div>

      {/* --- Nút Mở Nổi (Floating Open Button) --- */}
      {/* Chỉ hiện khi Sidebar bị đóng */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-24 right-0 z-40 bg-white p-2 rounded-l-md shadow-lg border border-r-0 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all"
          title="Mở tìm kiếm"
        >
          <ListIndentDecrease size={24} />
        </button>
      )}
    </>
  );
}
