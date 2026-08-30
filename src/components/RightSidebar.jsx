"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ListIndentIncrease,
  ListIndentDecrease,
  Plus,
  ZoomIn,
} from "lucide-react";
import {
  fetchImagesFromDeviantArt,
  searchCardsFromYGOPRODeck,
} from "@/services/cardService";
import { createYgoprodeckImageProxyUrl } from "@/services/ygoprodeckImport.mjs";
import ImageLightbox from "./ImageLightbox";

export default function RightSidebar({ setUrlList, isOpen = true, setIsOpen }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [denviantArtResults, setDenviantArtResults] = useState([]);
  const [ygoproResults, setYgoproResults] = useState([]);
  const [ygoproPaging, setYgoproPaging] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreYgopro, setHasMoreYgopro] = useState(true);
  const [hasMoreDeviantArt, setHasMoreDeviantArt] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeTab, setActiveTab] = useState("ygoprodeck");
  const [sourceError, setSourceError] = useState(null);

  // Lightbox state
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState("");

  // Ref để xử lý debounce, observer, and fetching lock
  const debounceTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);
  const observerTargetRef = useRef(null);
  const isFetchingRef = useRef(false);

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
        const res = await searchCardsFromYGOPRODeck(query, {
          num: 6,
          sort: "new",
        });
        if (res.cards && res.cards.length > 0) {
          setSuggestions(res.cards);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
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
  const handleSearch = async (searchQuery) => {
    const term = typeof searchQuery === "string" ? searchQuery : query;
    if (!term || !term.trim()) return;

    setShowSuggestions(false);
    setIsLoading(true);
    setIsLoadingMore(false);
    setSourceError(null);

    if (activeTab === "deviantart") {
      setDenviantArtResults([]);
      setHasMoreDeviantArt(true);
    } else if (activeTab === "ygoprodeck") {
      setYgoproResults([]);
      setYgoproPaging(null);
      setHasMoreYgopro(true);
    }

    try {
      if (activeTab === "deviantart") {
        const res = await fetchImagesFromDeviantArt(term.trim(), 0);
        setDenviantArtResults(res || []);
        setHasMoreDeviantArt((res?.length || 0) >= 20);
      } else if (activeTab === "ygoprodeck") {
        const res = await searchCardsFromYGOPRODeck(term.trim(), {
          num: 18,
          offset: 0,
          sort: "new",
        });
        setYgoproResults(res.cards || []);
        setYgoproPaging(res.paging || null);
        setHasMoreYgopro(
          res.paging
            ? res.paging.rows_remaining > 0
            : (res.cards?.length || 0) >= 18
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.code === "DEVIANTART_UNAVAILABLE") {
        setSourceError({
          message:
            "DeviantArt dang chan nguon RSS tim kiem, nen app chua the tu lay anh tu nguon nay.",
          searchUrl: error.searchUrl,
        });
        return;
      }
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

  // --- LOGIC 3: Infinite Scroll Load More ---
  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || isFetchingRef.current) return;
    if (!query || !query.trim()) return;

    if (activeTab === "ygoprodeck") {
      if (!hasMoreYgopro) return;
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      try {
        const offset = ygoproPaging?.next_page_offset ?? ygoproResults.length;
        const res = await searchCardsFromYGOPRODeck(query.trim(), {
          num: 18,
          offset,
          sort: "new",
        });
        if (res.cards && res.cards.length > 0) {
          setYgoproResults((prev) => [...prev, ...res.cards]);
          setYgoproPaging(res.paging || null);
          if (res.paging && res.paging.rows_remaining === 0) {
            setHasMoreYgopro(false);
          }
        } else {
          setHasMoreYgopro(false);
        }
      } catch (error) {
        console.error("Error loading more YGOProDeck cards:", error);
        setHasMoreYgopro(false);
      } finally {
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    } else if (activeTab === "deviantart") {
      if (!hasMoreDeviantArt) return;
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      try {
        const moreResults = await fetchImagesFromDeviantArt(
          query.trim(),
          denviantArtResults.length
        );
        if (moreResults && moreResults.length > 0) {
          setDenviantArtResults((prev) => [...prev, ...moreResults]);
          if (moreResults.length < 20) {
            setHasMoreDeviantArt(false);
          }
        } else {
          setHasMoreDeviantArt(false);
        }
      } catch (error) {
        console.error("Error loading more DeviantArt images:", error);
        setHasMoreDeviantArt(false);
      } finally {
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    }
  }, [
    isLoading,
    isLoadingMore,
    query,
    activeTab,
    hasMoreYgopro,
    hasMoreDeviantArt,
    ygoproPaging,
    ygoproResults.length,
    denviantArtResults.length,
  ]);

  // IntersectionObserver to trigger infinite scroll
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0.01,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore]);

  const selectSuggestion = (name) => {
    setQuery(name);
    setShowSuggestions(false);
    setTimeout(() => handleSearch(name), 100);
  };

  const handleAddImage = (url) => {
    setUrlList((prev) => [...prev, url]);
  };

  // Thêm ảnh YGOPRODeck qua proxy URL (không convert base64 → tránh tràn localStorage)
  const handleAddYgoproImage = (card) => {
    const imageUrl = card.card_images[0].image_url;
    const mode = import.meta.env.DEV ? "development" : "production";
    const productionProxyTemplate =
      import.meta.env.VITE_YGOPRO_IMAGE_PROXY_URL || "";
    try {
      const proxyUrl = createYgoprodeckImageProxyUrl(imageUrl, {
        mode,
        productionProxyTemplate,
      });
      setUrlList((prev) => [...prev, proxyUrl]);
    } catch (err) {
      console.error("Failed to build proxy URL:", err);
      alert(`Không thể tạo proxy URL: ${err.message}`);
    }
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
        <div className="flex border-b border-gray-200 bg-white p-2">
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
                    key={`${card.id}-${index}`}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxSrc(card.card_images[0].image_url);
                          setLightboxAlt(card.name);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-full mb-1.5 transform hover:scale-110 transition-transform shadow-lg flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn size={14} />
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddYgoproImage(card);
                        }}
                        className="bg-green-500 text-white text-sm px-3 py-1.5 rounded-full mb-2 transform hover:scale-110 transition-transform shadow-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        Thêm ảnh
                      </button>
                      {card.ygoprodeck_url && (
                        <a
                          href={card.ygoprodeck_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white text-xs hover:underline px-2 py-1 rounded"
                        >
                          Xem gốc
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Initial Loading */}
              {isLoading && (
                <div className="text-center py-6 text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Đang tải...</span>
                </div>
              )}

              {/* No Results */}
              {!isLoading && ygoproResults.length === 0 && query && (
                <p className="text-center text-sm text-gray-400 mt-6">
                  Chưa có kết quả.
                </p>
              )}

              {/* Infinite Scroll Sentinel & Loading More Indicator */}
              {ygoproResults.length > 0 && hasMoreYgopro && (
                <div ref={observerTargetRef} className="py-4 text-center">
                  {isLoadingMore && (
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải thêm...</span>
                    </div>
                  )}
                </div>
              )}

              {/* End of Results Indicator */}
              {ygoproResults.length > 0 && !hasMoreYgopro && !isLoading && (
                <p className="text-center text-xs text-gray-400 py-4">
                  Đã hiển thị tất cả ({ygoproResults.length}) kết quả.
                </p>
              )}
            </>
          )}

          {/* Deviantart Tab Content */}
          {activeTab === "deviantart" && (
            <>
              {sourceError && (
                <div className="mb-3 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                  <p>{sourceError.message}</p>
                  {sourceError.searchUrl && (
                    <a
                      href={sourceError.searchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block font-semibold text-yellow-800 underline"
                    >
                      Mo DeviantArt search
                    </a>
                  )}
                </div>
              )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxSrc(item.imageUrl);
                          setLightboxAlt(item.title);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-full mb-1.5 transform hover:scale-110 transition-transform shadow-lg flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn size={14} />
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddImage(item.imageUrl);
                        }}
                        className="bg-green-500 text-white text-sm p-2 rounded-full hover:bg-green-600 mb-2 transform hover:scale-110 transition-transform shadow-lg flex items-center gap-1 cursor-pointer"
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

              {/* Initial Loading */}
              {isLoading && (
                <div className="text-center py-6 text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Đang tải...</span>
                </div>
              )}

              {/* No Results */}
              {!isLoading && denviantArtResults.length === 0 && query && (
                <p className="text-center text-sm text-gray-400 mt-6">
                  Chưa có kết quả.
                </p>
              )}

              {/* Infinite Scroll Sentinel & Loading More Indicator */}
              {denviantArtResults.length > 0 && hasMoreDeviantArt && (
                <div ref={observerTargetRef} className="py-4 text-center">
                  {isLoadingMore && (
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải thêm...</span>
                    </div>
                  )}
                </div>
              )}

              {/* End of Results Indicator */}
              {denviantArtResults.length > 0 && !hasMoreDeviantArt && !isLoading && (
                <p className="text-center text-xs text-gray-400 py-4">
                  Đã hiển thị tất cả ({denviantArtResults.length}) kết quả.
                </p>
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
      {/* Lightbox */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
