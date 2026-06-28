import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

/**
 * ImageLightbox — Full-screen preview overlay
 *
 * Props:
 *   src        : string   — current image URL
 *   alt        : string   — alt text
 *   onClose    : fn       — close handler
 *   onPrev     : fn|null  — go to previous image (undefined = hide arrow)
 *   onNext     : fn|null  — go to next image    (undefined = hide arrow)
 *   counter    : string   — e.g. "3 / 10"
 */
export default function ImageLightbox({
  src,
  alt = "",
  onClose,
  onPrev,
  onNext,
  counter,
}) {
  // Keyboard navigation
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [handleKey]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      {/* Counter */}
      {counter && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm select-none pointer-events-none">
          {counter}
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all"
        title="Đóng (Esc)"
      >
        <X size={22} />
      </button>

      {/* Prev button */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all"
          title="Trước (←)"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next button */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-all"
          title="Tiếp (→)"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Image */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "calc(100vw - 100px)",
          maxHeight: "calc(100vh - 80px)",
          objectFit: "contain",
          borderRadius: "8px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
          userSelect: "none",
          transition: "opacity 0.15s ease",
        }}
        draggable={false}
      />

      {/* Alt / name label */}
      {alt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center max-w-[80vw] truncate select-none pointer-events-none">
          {alt}
        </div>
      )}
    </div>
  );
}
