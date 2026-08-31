"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from "lucide-react";
import { parseDecklistText } from "@/services/deckParser.mjs";
import { createYgoprodeckImporter } from "@/services/ygoprodeckImport.mjs";

export default function DeckImportForm({
  setUrlList,
  onOpenUploadModal,
  deckText = "",
  setDeckText,
}) {
  const [localDeckText, setLocalDeckText] = useState("");
  const currentDeckText = setDeckText ? deckText : localDeckText;
  const setCurrentDeckText = setDeckText || setLocalDeckText;

  const [importMode, setImportMode] = useState("append"); // 'append' | 'replace'
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [progress, setProgress] = useState({
    urls: 0,
    resolved: 0,
    failures: 0,
  });

  const importer = useMemo(() => createYgoprodeckImporter(), []);

  // Tính toán số lượng thẻ hợp lệ được nhận diện trong thời gian thực
  const parsedPreview = useMemo(() => {
    if (!currentDeckText.trim())
      return { items: [], totalCards: 0, skipped: [] };
    const parsed = parseDecklistText(currentDeckText);
    const totalCards = parsed.items.reduce(
      (sum, it) => sum + (it.quantity || 1),
      0
    );
    return { items: parsed.items, totalCards, skipped: parsed.skipped };
  }, [currentDeckText]);

  const handleImport = async () => {
    const parsed = parseDecklistText(currentDeckText);
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
    } catch (error) {
      console.error("Import error:", error);
      setSummary({
        skipped: parsed.skipped,
        failures: [{ reason: error.message || "Lỗi khi import decklist" }],
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

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-2xs">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-700">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-emerald-600" />
          <span>Import Decklist</span>
        </div>
        {onOpenUploadModal ? (
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
            title="Tải file .ydk, .txt từ máy tính"
          >
            <Upload size={13} />
            <span>Tải file .ydk</span>
          </button>
        ) : (
          parsedPreview.totalCards > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
              <Sparkles size={12} />
              {parsedPreview.totalCards} thẻ
            </span>
          )
        )}
      </div>

      {/* Textarea for manual paste */}
      <div className="mb-2">
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-gray-300 p-2 text-xs font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50"
          placeholder={'Dán mã thẻ, danh sách bài hoặc link ydke://:\n#main\n46986414\n3 Dark Magician\n"Dark Magician Girl" x2\nydke://...'}
          value={currentDeckText}
          disabled={isImporting}
          onChange={(event) => {
            setCurrentDeckText(event.target.value);
            if (summary) setSummary(null);
          }}
        />
      </div>

      {/* Options: Mode (Append / Replace) */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1.5 font-medium">
          <Layers size={14} className="text-gray-500" />
          <span>Chế độ:</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="decklistImportMode"
              value="append"
              checked={importMode === "append"}
              onChange={() => setImportMode("append")}
              disabled={isImporting}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <span>Thêm tiếp</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="decklistImportMode"
              value="replace"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
              disabled={isImporting}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <span>Thay thế</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 transition-all shadow-2xs cursor-pointer"
        disabled={isImporting || !currentDeckText.trim()}
        onClick={handleImport}
      >
        {isImporting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>
              Đang import ({progress.resolved}/
              {parsedPreview.totalCards || "?"})...
            </span>
          </>
        ) : (
          <>
            <Upload size={16} />
            <span>
              {parsedPreview.totalCards > 0
                ? `Import ${parsedPreview.totalCards} thẻ bài`
                : "Bắt đầu Import"}
            </span>
          </>
        )}
      </button>

      {/* Progress Bar when importing */}
      {isImporting && (
        <div className="mt-2.5 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Tiến độ tải ảnh:</span>
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

      {/* Summary / Result notification */}
      {summary && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-700 space-y-2">
          {summary.inserted > 0 ? (
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Đã thêm thành công {summary.inserted} ảnh thẻ bài!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>Không thêm được thẻ nào từ danh sách.</span>
            </div>
          )}

          {summary.skipped.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                Bỏ qua {summary.skipped.length} dòng không nhận dạng được.
              </span>
            </div>
          )}

          {summary.failures.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full text-red-600 font-medium hover:underline cursor-pointer"
              >
                <span>Có {summary.failures.length} mục lỗi không tìm thấy thẻ</span>
                {showDetails ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {showDetails && (
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
  );
}


