import { useState, useEffect, useRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ZoomIn, ImageOff, RotateCw, Trash2, Check } from "lucide-react";

export default function SortableCard({
  url,
  index,
  isSelected = false,
  onSelect,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onPreview,
  onDelete,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const MAX_AUTO_RETRIES = 3;

  const cardContainerRef = useRef(null);
  const imgRef = useRef(null);

  // IntersectionObserver: chỉ bắt đầu đếm timeout khi thẻ đã vào vùng nhìn thấy (viewport)
  useEffect(() => {
    if (!cardContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { rootMargin: "300px" } // Preload trước 300px
    );

    observer.observe(cardContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Kiểm tra nếu ảnh đã được cache/complete trong trình duyệt
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
        setHasError(false);
      }
    }
  }, [url, retryCount]);

  // Timeout logic: Chỉ đếm timeout khi thẻ đã vào vùng viewport và chưa load xong
  useEffect(() => {
    if (!isInView || isLoaded || hasError) return;

    const timer = setTimeout(() => {
      if (!isLoaded) {
        if (retryCount < MAX_AUTO_RETRIES) {
          setRetryCount((c) => c + 1);
        } else {
          setHasError(true);
        }
      }
    }, 20000); // 20s timeout khi đã trong viewport

    return () => clearTimeout(timer);
  }, [isInView, isLoaded, hasError, url, retryCount]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  // Merge ref for sortable and intersection observer
  const setCombinedRef = useCallback(
    (node) => {
      setNodeRef(node);
      cardContainerRef.current = node;
    },
    [setNodeRef]
  );

  const transformStr = transform ? CSS.Transform.toString(transform) : "";
  const finalTransform = isDragging
    ? transformStr
    : isSelected
    ? (transformStr ? `${transformStr} translateY(-5px)` : "translateY(-5px)")
    : transformStr || undefined;

  const style = {
    transform: finalTransform,
    transition,
    zIndex: isDragging ? 99 : isSelected ? 20 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    // Tự động thử lại với backoff (1.2s, 2.4s, 3.6s) để vượt qua giới hạn rate limit của worker
    if (retryCount < MAX_AUTO_RETRIES) {
      const delay = (retryCount + 1) * 1200 + Math.random() * 400;
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, delay);
    } else {
      setHasError(true);
    }
  };

  const handleManualReload = (e) => {
    e.stopPropagation();
    setIsLoaded(false);
    setHasError(false);
    setRetryCount((prev) => prev + 1);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(index);
  };

  const imageSrc =
    retryCount > 0 && !url.startsWith("data:") && !url.startsWith("blob:")
      ? `${url}${url.includes("?") ? "&" : "?"}_retry=${retryCount}`
      : url;

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={`card relative aspect-[59/86] border rounded transition-all group overflow-hidden cursor-pointer select-none ${
        isSelected
          ? "selected border-[#ff6b6b] shadow-xl z-20"
          : hasError
          ? "bg-red-50/60 border-red-300 hover:shadow-lg"
          : "bg-gray-100 border-gray-300 hover:shadow-lg"
      }`}
      onClick={(e) => onSelect?.(e, index)}
      onContextMenu={(e) => onContextMenu(e, index)}
      onTouchStart={(e) => onTouchStart(e, index)}
      onTouchEnd={onTouchEnd}
      onDoubleClick={(e) => {
        if (hasError) return;
        e.stopPropagation();
        onPreview?.(index);
      }}
    >
      {/* Loading Skeleton & Progress Bar */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-3 z-0">
          <div className="w-full max-w-[80%] flex flex-col items-center gap-2">
            {/* Small Progress Bar */}
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner card-loading-bar" />
            <span className="text-[11px] text-gray-400 font-medium select-none">
              Đang tải...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center z-20 bg-red-50/95 transition-all">
          <div className="flex flex-col items-center justify-center transition-all group-hover:scale-95">
            <div className="p-2 bg-red-100 text-red-500 rounded-full mb-1.5 shadow-xs">
              <ImageOff size={22} />
            </div>
            <span className="text-xs font-bold text-red-600">Lỗi tải ảnh</span>
            <span className="text-[10px] text-gray-500 mt-0.5 max-w-[120px] truncate">
              Quá hạn hoặc link lỗi
            </span>
          </div>

          {/* Action buttons on error */}
          <div className="mt-3 flex items-center justify-center gap-1.5 w-full px-1">
            <button
              type="button"
              onClick={handleManualReload}
              className="flex-1 py-1 px-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-[11px] font-medium flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Tải lại ảnh này"
            >
              <RotateCw size={12} />
              <span>Tải lại</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 py-1 px-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-md text-[11px] font-medium flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Xóa thẻ này khỏi danh sách"
            >
              <Trash2 size={12} />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Image with lazy loading */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={`Card ${index + 1}`}
        loading="lazy"
        draggable={false}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-300 ${
          isLoaded && !hasError ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* --- Drag Handle (chỉ hiện khi không lỗi) --- */}
      {!hasError && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 bg-white/80 p-1 rounded-full cursor-grab active:cursor-grabbing hover:bg-white z-10 touch-none shadow-xs"
          onContextMenu={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={15} className="text-gray-600" />
        </div>
      )}

      {/* --- Checkbox Selection Button --- */}
      {!hasError && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(e, index);
          }}
          className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all cursor-pointer shadow-xs ${
            isSelected
              ? "bg-[#ff6b6b] text-white scale-105 opacity-100 shadow-md"
              : "bg-white/80 hover:bg-white text-gray-400 opacity-0 group-hover:opacity-100 hover:scale-105"
          }`}
          title={isSelected ? "Bỏ chọn thẻ này" : "Chọn thẻ này (Ctrl+Click để chọn nhiều)"}
        >
          <Check size={13} strokeWidth={3} className={isSelected ? "opacity-100" : "opacity-40"} />
        </button>
      )}

      {/* --- Preview Button (zoom icon, hiện khi hover & không lỗi) --- */}
      {!hasError && onPreview && (
        <button
          className="absolute bottom-1 right-1 bg-white/80 hover:bg-white p-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(index);
          }}
          onContextMenu={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          title="Xem toàn màn hình"
        >
          <ZoomIn size={15} className="text-gray-700" />
        </button>
      )}
    </div>
  );
}

