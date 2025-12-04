"use client";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  ListIndentIncrease,
  ListIndentDecrease,
} from "lucide-react";
import {
  fetchImagesFromDeviantArt,
  fetchCardInfoFromYGOPRODeck,
} from "@/services/cardService";

export default function RightSidebar({ setUrlList, isOpen = true, setIsOpen }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [denviantArtResults, setDenviantArtResults] = useState([]);
  const [ygoproResults, setYgoproResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeTab, setActiveTab] = useState("ygoprodeck");

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
        const data = await fetchCardInfoFromYGOPRODeck(query, 5, 0);
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

  useEffect(() => {
    if (!query) return;
    handleSearch(query);
  }, [activeTab]);

  // --- LOGIC 2: Tìm kiếm DeviantArt và YGOProDeck ---
  const handleSearch = async (query) => {
    if (!query) return;

    setShowSuggestions(false);
    setIsLoading(true);
    if (activeTab === "deviantart") {
      setDenviantArtResults([]);
    } else if (activeTab === "ygoprodeck") {
      setYgoproResults([]);
    }

    try {
      if (activeTab === "deviantart") {
        const res = await fetchImagesFromDeviantArt(query, 0);
        setDenviantArtResults(res);
      } else if (activeTab === "ygoprodeck") {
        const data = await fetchCardInfoFromYGOPRODeck(query, 20, 0);
        if (data.data) {
          setYgoproResults(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(
        `Lỗi khi tải dữ liệu từ ${
          activeTab === "deviantart" ? "DeviantArt" : "YGOProDeck"
        }.`
      );
    } finally {
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  const handleViewMore = async () => {
    try {
      if (activeTab === "deviantart") {
        const moreResults = await fetchImagesFromDeviantArt(
          query,
          denviantArtResults.length
        );
        setDenviantArtResults((prev) => [...prev, ...moreResults]);
      } else if (activeTab === "ygoprodeck") {
        const data = await fetchCardInfoFromYGOPRODeck(
          query,
          20,
          ygoproResults.length
        );
        if (data.data) {
          setYgoproResults((prev) => [...prev, ...data.data]);
        }
      }
    } catch (error) {
      console.error("Error loading more:", error);
    }
  };

  const selectSuggestion = (name) => {
    setQuery(name);
    setShowSuggestions(false);
    setTimeout(() => handleSearch(name), 100);
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

      {/* --- Main Sidebar Container, dùng translate để làm animation(optional) --- */}
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            />
            <button
              onClick={() => handleSearch(query)}
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

        {/* Tab Switching UI */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab("ygoprodeck")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "ygoprodeck"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            YGOProDeck
          </button>
          <button
            onClick={() => setActiveTab("deviantart")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "deviantart"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Deviantart
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-100">
          {/* YGOProDeck Tab Content */}
          {activeTab === "ygoprodeck" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {ygoproResults.map((card, index) => (
                  <div
                    key={index}
                    className="group relative bg-white rounded shadow overflow-hidden aspect-[59/86]"
                  >
                    <img
                      src={card.card_images[0].image_url}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-1/2 bottom-0 left-0 right-0 bg-[#00000099] transition-all flex flex-col items-center justify-center md:opacity-0 group-hover:opacity-100">
                      <button
                        disabled={true}
                        className="text-yellow-400 italic text-sm p-2 rounded-full mb-2 transform hover:scale-110 transition-transform shadow-lg flex items-center gap-1 disabled:cursor-not-allowed"
                      >
                        Hãy copy paste thủ công
                      </button>
                      <a
                        href={card.ygoprodeck_url}
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
                <div className="text-center py-4 text-gray-500">
                  Đang tải...
                </div>
              )}
              {!isLoading && ygoproResults.length === 0 && query && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  Chưa có kết quả.
                </p>
              )}
              {ygoproResults.length > 0 && (
                <button
                  onClick={handleViewMore}
                  className="w-full mt-2 py-2 text-white bg-blue-600 rounded border border-gray-300 hover:bg-blue-700 transition-colors mt-4 mb-2"
                >
                  Xem thêm
                </button>
              )}
            </>
          )}

          {/* Deviantart Tab Content */}
          {activeTab === "deviantart" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {denviantArtResults.map((item, index) => (
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
                <div className="text-center py-4 text-gray-500">
                  Đang tải...
                </div>
              )}
              {!isLoading && denviantArtResults.length === 0 && query && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  Chưa có kết quả.
                </p>
              )}
              {denviantArtResults.length > 0 && (
                <button
                  onClick={handleViewMore}
                  className="w-full mt-2 py-2 text-white bg-blue-600 rounded border border-gray-300 hover:bg-blue-700 transition-colors mt-4 mb-2"
                >
                  Xem thêm
                </button>
              )}
            </>
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
