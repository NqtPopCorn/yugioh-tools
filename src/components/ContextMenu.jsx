"use client";
import { Copy, Trash2, CheckSquare, FileDown, X } from "lucide-react";

export default function ContextMenu({
  urlList,
  setUrlList,
  selectedIndices,
  setSelectedIndices,
  onExportSelected,
}) {
  const count = selectedIndices?.size || 0;

  const handleDuplicate = () => {
    if (count > 0) {
      const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
      const duplicatedUrls = sorted.map((i) => urlList[i]);
      setUrlList((prev) => [...prev, ...duplicatedUrls]);
      setSelectedIndices(new Set());
    }
    closeMenu();
  };

  const handleDelete = () => {
    if (count > 0) {
      setUrlList((prev) =>
        prev.filter((_, index) => !selectedIndices.has(index))
      );
      setSelectedIndices(new Set());
    }
    closeMenu();
  };

  const handleSelectAll = () => {
    setSelectedIndices(new Set(urlList.map((_, i) => i)));
    closeMenu();
  };

  const handleClearSelection = () => {
    setSelectedIndices(new Set());
    closeMenu();
  };

  const handleExport = () => {
    closeMenu();
    onExportSelected?.();
  };

  const closeMenu = () => {
    const contextMenu = document.getElementById("context-menu");
    if (contextMenu) {
      contextMenu.classList.add("hidden");
    }
  };

  return (
    <div
      id="context-menu"
      className="hidden absolute z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-sm text-gray-700 overflow-hidden backdrop-blur-md"
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 border-b border-gray-100 uppercase tracking-wider">
        {count > 1 ? `Đã chọn ${count} thẻ` : `Thao tác thẻ`}
      </div>

      <button
        onClick={handleDuplicate}
        className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Copy size={15} />
        <span>Nhân bản {count > 1 ? `(${count})` : ""}</span>
      </button>

      {count > 0 && onExportSelected && (
        <button
          onClick={handleExport}
          className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <FileDown size={15} />
          <span>Xuất PDF {count > 1 ? `(${count})` : ""}</span>
        </button>
      )}

      <button
        onClick={handleDelete}
        className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Trash2 size={15} />
        <span>Xóa {count > 1 ? `(${count})` : ""}</span>
      </button>

      <div className="border-t border-gray-100 my-1" />

      <button
        onClick={handleSelectAll}
        className="w-full text-left px-3.5 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-600 transition-colors cursor-pointer"
      >
        <CheckSquare size={15} />
        <span>Chọn tất cả ({urlList.length})</span>
      </button>

      {count > 0 && (
        <button
          onClick={handleClearSelection}
          className="w-full text-left px-3.5 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-500 transition-colors cursor-pointer"
        >
          <X size={15} />
          <span>Bỏ chọn</span>
        </button>
      )}
    </div>
  );
}
