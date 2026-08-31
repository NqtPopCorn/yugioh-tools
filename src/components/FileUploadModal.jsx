"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  UploadCloud,
  Image as ImageIcon,
  FileCode,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from "lucide-react";
import { parseDecklistText } from "@/services/deckParser.mjs";
import { createYgoprodeckImporter } from "@/services/ygoprodeckImport.mjs";

export default function FileUploadModal({
  isOpen,
  onClose,
  urlList = [],
  setUrlList,
  onDeckFileLoaded, // optional callback if parent wants to sync deckText
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', text: string }

  // Deck file import state
  const [selectedFile, setSelectedFile] = useState(null);
  const [deckText, setDeckText] = useState("");
  const [importMode, setImportMode] = useState("append"); // 'append' | 'replace'
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showFailureDetails, setShowFailureDetails] = useState(false);
  const [progress, setProgress] = useState({
    urls: 0,
    resolved: 0,
    failures: 0,
  });

  const fileInputRef = useRef(null);
  const importer = useMemo(() => createYgoprodeckImporter(), []);

  // Reset states when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setDeckText("");
      setSummary(null);
      setFeedback(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isImporting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isImporting]);

  // Lock body scroll
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

  // Parsed deck count preview
  const parsedPreview = useMemo(() => {
    if (!deckText.trim()) return { items: [], totalCards: 0, skipped: [] };
    const parsed = parseDecklistText(deckText);
    const totalCards = parsed.items.reduce(
      (sum, it) => sum + (it.quantity || 1),
      0
    );
    return { items: parsed.items, totalCards, skipped: parsed.skipped };
  }, [deckText]);

  // Unified File Processor
  const handleProcessFiles = async (files) => {
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;

    setFeedback(null);
    setSummary(null);

    const imageFiles = [];
    const textFiles = [];

    fileList.forEach((file) => {
      const name = file.name.toLowerCase();
      if (
        file.type.startsWith("image/") ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".webp") ||
        name.endsWith(".gif")
      ) {
        imageFiles.push(file);
      } else {
        textFiles.push(file);
      }
    });

    // 1. Nếu là file ảnh -> chèn trực tiếp vào urlList
    if (imageFiles.length > 0) {
      const readPromises = imageFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
      );

      const loadedDataUrls = (await Promise.all(readPromises)).filter(Boolean);
      if (loadedDataUrls.length > 0) {
        setUrlList((prev) => [...prev, ...loadedDataUrls]);
        setFeedback({
          type: "success",
          text: `Đã thêm ${loadedDataUrls.length} ảnh thẻ bài vào trang in thành công!`,
        });

        setTimeout(() => {
          const cards = document.querySelectorAll(".card");
          if (cards.length > 0) {
            cards[cards.length - 1].scrollIntoView({ behavior: "smooth" });
          }
        }, 150);
      }
    }

    // 2. Nếu là file chữ/decklist (.ydk, .txt) -> đọc và chuẩn bị import
    if (textFiles.length > 0) {
      const deckFile = textFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          const parsed = parseDecklistText(content);
          const count = parsed.items.reduce(
            (sum, it) => sum + (it.quantity || 1),
            0
          );

          setDeckText(content);
          setSelectedFile({
            name: deckFile.name,
            size: `${(deckFile.size / 1024).toFixed(1)} KB`,
            count,
          });

          if (onDeckFileLoaded) {
            onDeckFileLoaded(content, deckFile.name);
          }

          if (imageFiles.length === 0) {
            setFeedback({
              type: "info",
              text: `Đã nạp file decklist "${deckFile.name}" (nhận diện ${count} thẻ). Nhấn "Import ngay" để tải ảnh!`,
            });
          }
        }
      };
      reader.readAsText(deckFile);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  // Import Decklist Cards
  const handleImportDeck = async () => {
    const parsed = parseDecklistText(deckText);
    if (parsed.items.length === 0) {
      setSummary({
        skipped: parsed.skipped,
        failures: [
          { reason: "Không tìm thấy dòng card hợp lệ nào để import." },
        ],
        inserted: 0,
        resolved: 0,
      });
      return;
    }

    setIsImporting(true);
    setProgress({ urls: 0, resolved: 0, failures: 0 });
    setSummary(null);
    setFeedback(null);

    try {
      const result = await importer.importCards(parsed.items, {
        onProgress: setProgress,
      });

      if (result.urls.length > 0) {
        if (importMode === "replace") {
          setUrlList(result.urls);
        } else {
          setUrlList((prev) => [...prev, ...result.urls]);
        }
      }

      setSummary({
        skipped: parsed.skipped,
        failures: result.failures,
        inserted: result.urls.length,
        resolved: result.resolved.length,
      });
    } catch (err) {
      console.error("Deck import error:", err);
      setSummary({
        skipped: parsed.skipped,
        failures: [{ reason: err.message || "Lỗi khi import decklist" }],
        inserted: 0,
        resolved: 0,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const progressPercent =
    parsedPreview.totalCards > 0
      ? Math.min(
          100,
          Math.round(
            ((progress.resolved + progress.failures) /
              parsedPreview.totalCards) *
              100
          )
        )
      : 0;

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center">
              <UploadCloud size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                Kéo Thả & Tải Lên File
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Tự động nhận diện file ảnh (.png, .jpg) hoặc file deck (.ydk, .txt)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Feedback alert */}
          {feedback && (
            <div
              role="alert"
              className={`p-3 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150 ${
                feedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : feedback.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-blue-50 border border-blue-200 text-blue-800"
              }`}
            >
              {feedback.type === "success" && (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              )}
              {feedback.type === "error" && (
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              )}
              {feedback.type === "info" && (
                <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">{feedback.text}</div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer shrink-0"
                title="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* VÙNG KÉO THẢ (DRAG & DROP ZONE) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/80 scale-[1.01] shadow-lg"
                : "border-indigo-200 hover:border-indigo-400 bg-gradient-to-b from-indigo-50/40 to-purple-50/20 hover:bg-indigo-50/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.ydk,.ydke,.txt,.deck"
              multiple
              className="hidden"
              id="upload-modal-file-input"
              disabled={isImporting}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessFiles(e.target.files);
                }
              }}
            />

            <label
              htmlFor="upload-modal-file-input"
              className="flex flex-col items-center justify-center cursor-pointer group select-none"
            >
              <div className="mb-3 p-3.5 rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                <UploadCloud size={32} className="group-hover:scale-110 transition-transform" />
              </div>

              <div className="space-y-1 max-w-sm">
                <p className="text-sm sm:text-base font-bold text-gray-800">
                  Kéo thả file vào đây hoặc <span className="text-indigo-600 underline underline-offset-2">chọn file</span>
                </p>
                <p className="text-xs text-gray-500">
                  Tự động phân loại xử lý theo loại file:
                </p>
              </div>

              {/* Format Badges */}
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-semibold shadow-2xs">
                  <ImageIcon size={14} className="text-indigo-500" />
                  Ảnh (.png, .jpg) &rarr; Thêm ngay
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 font-semibold shadow-2xs">
                  <FileCode size={14} className="text-emerald-500" />
                  Deck (.ydk, .txt) &rarr; Parse & Import
                </span>
              </div>
            </label>
          </div>

          {/* NẾU NẠP FILE DECKLIST -> HIỂN THỊ THÔNG TIN & NÚT IMPORT */}
          {selectedFile && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCode size={22} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {selectedFile.size} &bull; Phát hiện{" "}
                      <strong className="text-emerald-700">{parsedPreview.totalCards} thẻ</strong> hợp lệ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setDeckText("");
                    setSummary(null);
                  }}
                  disabled={isImporting}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Hủy file"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Options Mode */}
              <div className="flex items-center justify-between text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <Layers size={14} className="text-gray-500" />
                  <span>Chế độ nạp:</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadModalMode"
                      value="append"
                      checked={importMode === "append"}
                      onChange={() => setImportMode("append")}
                      disabled={isImporting}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Thêm tiếp</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadModalMode"
                      value="replace"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      disabled={isImporting}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Thay thế danh sách</span>
                  </label>
                </div>
              </div>

              {/* Import Button */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-bold text-white transition-all shadow-sm cursor-pointer"
                disabled={isImporting || !deckText.trim()}
                onClick={handleImportDeck}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>
                      Đang tải ảnh ({progress.resolved}/{parsedPreview.totalCards || "?"})...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>
                      Import {parsedPreview.totalCards} thẻ bài từ file này
                    </span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {isImporting && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-gray-600 font-semibold">
                    <span>Tiến độ:</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Đã xử lý {progress.resolved} thẻ, thêm {progress.urls} ảnh
                    {progress.failures > 0 ? `, lỗi ${progress.failures}` : ""}.
                  </p>
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-700 space-y-2">
                  {summary.inserted > 0 ? (
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>Đã thêm thành công {summary.inserted} ảnh thẻ bài!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-bold text-red-700">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>Không thêm được thẻ nào từ danh sách.</span>
                    </div>
                  )}

                  {summary.skipped.length > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Bỏ qua {summary.skipped.length} dòng không nhận dạng được.</span>
                    </div>
                  )}

                  {summary.failures.length > 0 && (
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setShowFailureDetails(!showFailureDetails)}
                        className="flex items-center justify-between w-full text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        <span>Có {summary.failures.length} mục lỗi không tìm thấy thẻ</span>
                        {showFailureDetails ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      {showFailureDetails && (
                        <ul className="max-h-28 list-disc overflow-y-auto pl-4 text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200 space-y-0.5">
                          {summary.failures.map((failure, index) => (
                            <li key={`${failure.lineNumber || "general"}-${index}`}>
                              {failure.lineNumber ? `Dòng ${failure.lineNumber}: ` : ""}
                              {failure.value ? `"${failure.value}" - ` : ""}
                              {failure.reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            Hiện có: <strong className="text-indigo-600 font-bold">{urlList.length} thẻ</strong> trong trang in
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
