"use client";
import { useState, useEffect } from "react";
import { X, FileDown, Check, Layers, AlertTriangle, Sparkles, Loader2 } from "lucide-react";

const PRESET_FORMATS = [
  {
    id: "59x86-fit",
    name: "62 x 90 mm (Fit Sleeve)",
    description: "Vừa vặn bọc bài (Sleeve), chuẩn 9 thẻ/trang A4",
    width: 62,
    height: 90,
    badge: "Khuyên dùng",
  },
  {
    id: "59x86",
    name: "59 x 86 mm (Kích thước gốc)",
    description: "Kích thước thẻ Yu-Gi-Oh! OCG / TCG gốc",
    width: 59,
    height: 86,
    badge: "Chuẩn OCG",
  },
  {
    id: "63x88",
    name: "63 x 88 mm (Standard TCG)",
    description: "Kích thước chuẩn Pokémon, Magic: The Gathering",
    width: 63,
    height: 88,
    badge: "Standard",
  },
  {
    id: "custom",
    name: "Tùy chỉnh (Custom)",
    description: "Nhập kích thước chiều rộng x chiều cao bất kỳ",
    width: null,
    height: null,
    badge: "Tự chọn",
  },
];

export default function ExportPdfModal({
  isOpen,
  onClose,
  urlList = [],
  cardDimensions,
  setCardDimensions,
  onExport,
  isExporting = false,
}) {
  const [selectedPreset, setSelectedPreset] = useState("59x86-fit");
  const [customWidth, setCustomWidth] = useState(cardDimensions?.width || 62);
  const [customHeight, setCustomHeight] = useState(cardDimensions?.height || 90);

  // Sync selectedPreset when modal opens or cardDimensions change
  useEffect(() => {
    if (!isOpen) return;
    const match = PRESET_FORMATS.find(
      (p) =>
        p.id !== "custom" &&
        p.width === cardDimensions?.width &&
        p.height === cardDimensions?.height
    );
    if (match) {
      setSelectedPreset(match.id);
    } else {
      setSelectedPreset("custom");
      setCustomWidth(cardDimensions?.width || 62);
      setCustomHeight(cardDimensions?.height || 90);
    }
  }, [isOpen, cardDimensions]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isExporting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  if (!isOpen) return null;

  // Active dimensions
  const activeWidth =
    selectedPreset === "custom"
      ? customWidth
      : PRESET_FORMATS.find((p) => p.id === selectedPreset)?.width || 62;
  const activeHeight =
    selectedPreset === "custom"
      ? customHeight
      : PRESET_FORMATS.find((p) => p.id === selectedPreset)?.height || 90;

  // Layout calculation
  // A4: 210 x 297 mm, margin 10mm => printable 190 x 277 mm
  const cols = Math.max(1, Math.floor(190 / (activeWidth || 1)));
  const rows = Math.max(1, Math.floor(277 / (activeHeight || 1)));
  const cardsPerPage = cols * rows;

  const totalCards = urlList.length;
  const a4Pages = Math.ceil(totalCards / cardsPerPage) || (totalCards > 0 ? 1 : 0);
  const remainder = totalCards % cardsPerPage;
  const missingForFullPage = remainder === 0 ? 0 : cardsPerPage - remainder;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    if (preset.id !== "custom") {
      const newDims = { width: preset.width, height: preset.height };
      setCardDimensions?.(newDims);
    }
  };

  const handleCustomWidthChange = (val) => {
    const w = Number.parseFloat(val) || 0;
    setCustomWidth(w);
    setCardDimensions?.({ width: w, height: customHeight });
  };

  const handleCustomHeightChange = (val) => {
    const h = Number.parseFloat(val) || 0;
    setCustomHeight(h);
    setCardDimensions?.({ width: customWidth, height: h });
  };

  const handleConfirmExport = () => {
    const finalDims = {
      width: Number.parseFloat(activeWidth) || 62,
      height: Number.parseFloat(activeHeight) || 90,
    };
    setCardDimensions?.(finalDims);
    onExport(finalDims);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => !isExporting && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-indigo-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
              <FileDown size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Tùy Chọn Định Dạng Xuất PDF
              </h3>
              <p className="text-xs text-gray-500">
                Chọn kích thước thẻ bài và cấu hình trang in A4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors disabled:opacity-50"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Format Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5">
              Định dạng kích thước thẻ
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_FORMATS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-semibold text-sm text-gray-800">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">
                      {preset.description}
                    </p>
                    <span
                      className={`inline-block self-start text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-blue-200/70 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom dimensions inputs if "custom" is selected */}
          {selectedPreset === "custom" && (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-gray-700 block">
                Kích thước tùy chỉnh (mm):
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">
                    Chiều rộng (mm)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="200"
                    step="0.5"
                    value={customWidth}
                    onChange={(e) => handleCustomWidthChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
                    placeholder="Rộng (mm)"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">
                    Chiều cao (mm)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="280"
                    step="0.5"
                    value={customHeight}
                    onChange={(e) => handleCustomHeightChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
                    placeholder="Cao (mm)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary / Layout details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-600 pb-2 border-b border-slate-200">
              <span className="font-medium">Kích thước áp dụng:</span>
              <span className="font-bold text-gray-900">
                {activeWidth} × {activeHeight} mm
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 pb-2 border-b border-slate-200">
              <span className="font-medium">Bố cục trang in A4:</span>
              <span className="font-bold text-gray-900">
                {cardsPerPage} thẻ / trang ({cols} cột × {rows} hàng)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 pb-2 border-b border-slate-200">
              <span className="font-medium">Tổng số thẻ & trang:</span>
              <span className="font-bold text-blue-600">
                {totalCards} thẻ → {a4Pages} trang A4
              </span>
            </div>

            {missingForFullPage > 0 && (
              <div className="flex items-start gap-2 pt-1 text-amber-700 text-xs">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Trang cuối có <b>{remainder}</b> thẻ (thiếu <b>{missingForFullPage}</b> thẻ để lấp đầy trang {cardsPerPage} thẻ).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200/70 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmExport}
            disabled={totalCards === 0 || isExporting}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang tạo PDF...
              </>
            ) : (
              <>
                <FileDown size={16} />
                Bắt đầu xuất PDF ({totalCards} thẻ)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
