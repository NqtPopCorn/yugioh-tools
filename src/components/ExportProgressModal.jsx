"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Layers,
  Sparkles,
} from "lucide-react";

/**
 * Modal hiển thị tiến trình xuất PDF toàn màn hình kèm timeout bảo vệ.
 */
export default function ExportProgressModal({
  isOpen,
  progress = {},
  onCancel,
  onClose,
}) {
  const {
    current = 0,
    total = 0,
    percentage = 0,
    page = 1,
    totalPages = 1,
    currentUrl = null,
    successCount = 0,
    failedCount = 0,
    failedIndices = [],
    status = "Đang chuẩn bị...",
    isComplete = false,
  } = progress;

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="mb-4 relative">
          {isComplete ? (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 animate-bounce duration-700">
              <CheckCircle2 size={36} />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 relative">
              <FileDown size={30} className="animate-pulse" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-xs">
                <Loader2 size={12} className="animate-spin text-amber-900" />
              </div>
            </div>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-lg sm:text-xl">
          {isComplete ? "Xuất PDF Thành Công!" : "Đang Xuất File PDF"}
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
          {isComplete
            ? "File PDF khổ A4 chuẩn kích thước đã được tạo và đang tải xuống trình duyệt."
            : status}
        </p>

        {/* Mini Live Card Thumbnail Preview */}
        {!isComplete && currentUrl && (
          <div className="my-4 flex items-center gap-3 bg-gray-50 border border-gray-200/80 rounded-2xl p-2.5 w-full max-w-xs shadow-2xs">
            <div className="w-11 h-16 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shrink-0 shadow-xs">
              <img
                src={currentUrl}
                alt="Current card"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                <Sparkles size={12} />
                <span>Đang xử lý thẻ #{current}</span>
              </div>
              <p className="text-[10px] text-gray-500 truncate mt-0.5 font-mono">
                {currentUrl.startsWith("data:") ? "Ảnh từ Clipboard/Upload" : currentUrl}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-1">
                <Clock size={10} />
                <span>Timeout bảo vệ: 7s</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-gray-600">Tiến độ xuất</span>
            <span className="text-indigo-600 font-mono text-sm font-bold">
              {percentage}%
            </span>
          </div>

          <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
              }`}
              style={{ width: `${Math.max(percentage, 5)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-gray-100">
          <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Thẻ bài</p>
            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">
              {current} / {total}
            </p>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Trang A4</p>
            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5">
              {page} / {totalPages}
            </p>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Thành công</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5">
              {successCount}
              {failedCount > 0 && (
                <span className="text-rose-500 ml-1 font-semibold text-[10px]">
                  ({failedCount} lỗi)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Warning if any card failed/timed out */}
        {failedCount > 0 && (
          <div className="mt-3.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-left w-full">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-tight">
              Có <strong>{failedCount} thẻ</strong> bị lỗi tải hoặc timeout (thẻ #{failedIndices.join(", #")}). Hệ thống đã tự động chèn ô màu đỏ thay thế để không làm gián đoạn file in.
            </p>
          </div>
        )}

        {/* Actions Button */}
        <div className="mt-5 w-full flex items-center justify-center gap-3">
          {isComplete ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer"
            >
              Hoàn tất & Đóng
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="py-2 px-4 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-gray-200 flex items-center gap-1.5"
            >
              <X size={14} />
              <span>Hủy xuất PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
