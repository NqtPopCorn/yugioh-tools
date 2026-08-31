// src/components/MainContent.jsx
"use client";
import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  FileDown,
  Layers,
  LayoutGrid,
  Loader2,
  Copy,
  Trash2,
  CheckSquare,
  X,
  Menu,
  Undo2,
  Redo2,
} from "lucide-react";
import { exportPDF } from "../services/print";

import ContextMenu from "./ContextMenu";
import SortableCard from "./SortableCard";
import ImageLightbox from "./ImageLightbox";
import ExportPdfModal from "./ExportPdfModal";
import ExportProgressModal from "./ExportProgressModal";

export default function MainContent({
  urlList,
  setUrlList,
  cardDimensions = { width: 62, height: 90 },
  setCardDimensions,
  onToggleLeftSidebar,
  isLeftSidebarOpen,
  undo,
  redo,
  canUndo,
  canRedo,
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [customExportList, setCustomExportList] = useState(null);

  // Full-screen Progress Modal state
  const [exportProgress, setExportProgress] = useState(null);
  const [isExportProgressOpen, setIsExportProgressOpen] = useState(false);
  const abortControllerRef = useRef(null);

  // Multi-select state
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

  const totalCards = urlList.length;
  const a4Pages = Math.ceil(totalCards / 9);
  const remainder = totalCards % 9;
  const missingForFullPage = remainder === 0 ? 0 : 9 - remainder;

  const handleOpenExportModal = () => {
    if (totalCards === 0) return;
    setCustomExportList(null); // Xuất toàn bộ
    setIsExportModalOpen(true);
  };

  const handleExportSelected = () => {
    if (selectedIndices.size === 0) return;
    const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
    const selectedUrls = sorted.map((i) => urlList[i]);
    setCustomExportList(selectedUrls);
    setIsExportModalOpen(true);
  };

  const handleExecuteExport = async (dimensions) => {
    const listToExport = customExportList || urlList;
    if (listToExport.length === 0) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsExporting(true);
    setIsExportModalOpen(false); // Đóng modal cấu hình
    setIsExportProgressOpen(true); // Mở Fullscreen Progress Modal

    setExportProgress({
      current: 0,
      total: listToExport.length,
      percentage: 0,
      page: 1,
      totalPages: Math.ceil(listToExport.length / 9) || 1,
      currentUrl: listToExport[0],
      successCount: 0,
      failedCount: 0,
      failedIndices: [],
      status: "Đang khởi tạo tài liệu PDF...",
      isComplete: false,
    });

    try {
      await exportPDF(listToExport, dimensions, {
        skipConfirm: true,
        timeoutPerCard: 7000,
        signal: controller.signal,
        onProgress: (prog) => {
          setExportProgress(prog);
        },
      });
      // Giữ modal mở ở trạng thái hoàn tất để người dùng xem kết quả/thống kê và chủ động bấm đóng
    } catch (err) {
      if (controller.signal.aborted) {
        console.log("PDF export was cancelled.");
        setIsExportProgressOpen(false);
        setCustomExportList(null);
      } else {
        console.error("Export PDF error:", err);
        alert(`Lỗi xuất PDF: ${err.message || err}`);
        setIsExportProgressOpen(false);
        setCustomExportList(null);
      }
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExportProgressOpen(false);
    setIsExporting(false);
    setCustomExportList(null);
  };

  // --- MULTI-SELECT HANDLERS ---
  const handleCardSelect = (e, index) => {
    if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) {
      // Range selection với Shift + Click
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      setSelectedIndices((prev) => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(i);
        }
        return next;
      });
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle single item với Ctrl + Click
      setSelectedIndices((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
      setLastSelectedIndex(index);
    } else {
      // Normal click: toggle selection
      setSelectedIndices((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
      setLastSelectedIndex(index);
    }
  };

  const handleSelectAll = () => {
    setSelectedIndices(new Set(urlList.map((_, i) => i)));
  };

  const handleClearSelection = () => {
    setSelectedIndices(new Set());
    setLastSelectedIndex(null);
  };

  const handleDuplicateSelected = () => {
    if (selectedIndices.size === 0) return;
    const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
    const duplicatedUrls = sorted.map((i) => urlList[i]);
    setUrlList((prev) => [...prev, ...duplicatedUrls]);
    setSelectedIndices(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    const count = selectedIndices.size;
    if (confirm(`Bạn có chắc chắn muốn xóa ${count} thẻ đã chọn không?`)) {
      setUrlList((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
      setSelectedIndices(new Set());
    }
  };

  // Keyboard shortcuts (Ctrl+A, Escape, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      // Ctrl + A -> Chọn tất cả
      if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        if (urlList.length > 0) {
          e.preventDefault();
          setSelectedIndices(new Set(urlList.map((_, i) => i)));
        }
      }

      // Escape -> Bỏ chọn
      if (e.key === "Escape") {
        setSelectedIndices(new Set());
      }

      // Delete / Backspace -> Xóa các thẻ đã chọn
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIndices.size > 0
      ) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [urlList, selectedIndices]);

  // Cấu hình cảm biến để nhận diện thao tác kéo (chuột + cảm ứng)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }), // Di chuyển chuột 10px mới tính là kéo (tránh click nhầm)
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 }, // Giữ 250ms để kéo trên mobile
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Xử lý khi thả bài ra
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setUrlList((items) => {
        const oldIndex = active.id;
        const newIndex = over.id;
        return arrayMove(items, oldIndex, newIndex);
      });
      // Clear selection sau khi sắp xếp lại để tránh nhầm index
      setSelectedIndices(new Set());
    }
  };

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () =>
    setLightboxIndex((i) => (i > 0 ? i - 1 : urlList.length - 1));
  const nextLightbox = () =>
    setLightboxIndex((i) => (i < urlList.length - 1 ? i + 1 : 0));

  // Logic Context Menu (Chuột phải)
  const handleContextMenu = (e, index) => {
    e.preventDefault();
    setSelectedIndices((prev) => {
      if (prev.has(index)) {
        return prev;
      }
      return new Set([index]);
    });
    setLastSelectedIndex(index);

    const contextMenu = document.getElementById("context-menu");
    if (contextMenu) {
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.style.top = `${e.pageY}px`;
      contextMenu.classList.remove("hidden");
    }
  };

  // Logic Mobile Long Press
  const [pressTimer, setPressTimer] = useState(null);

  const handleTouchStart = (e, index) => {
    if (e.touches.length === 1) {
      const timer = setTimeout(() => {
        setSelectedIndices((prev) => {
          if (prev.has(index)) {
            return prev;
          }
          return new Set([index]);
        });
        setLastSelectedIndex(index);

        const touch = e.touches[0];
        const contextMenu = document.getElementById("context-menu");
        if (contextMenu) {
          contextMenu.style.left = `${touch.pageX}px`;
          contextMenu.style.top = `${touch.pageY}px`;
          contextMenu.classList.remove("hidden");
        }
      }, 700);
      setPressTimer(timer);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  // Ẩn menu khi click ra ngoài
  useEffect(() => {
    const handleClick = () => {
      const contextMenu = document.getElementById("context-menu");
      if (contextMenu) contextMenu.classList.add("hidden");
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="flex-1 md:mt-0 p-0 md:p-6 select-none flex flex-col min-w-0 pb-24">
      {/* Top Header: Chiều rộng 100% (width full), trên mobile là app header toàn màn hình (sticky top-0) */}
      <div className="sticky top-0 md:top-4 z-30 w-full bg-white/95 backdrop-blur-md border-b md:border border-gray-200/90 md:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 mb-4 md:mb-6 shadow-xs md:shadow-sm flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Nút Toggle mở Sidebar Trái (Chỉ hiện ở Mobile) */}
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            className="md:hidden p-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg transition-colors cursor-pointer border border-gray-200 shrink-0 flex items-center justify-center"
            title="Mở menu công cụ & nhập ảnh"
            aria-label="Mở menu công cụ"
          >
            <Menu size={19} />
          </button>

          {/* Icon Trang Trí (Ẩn trên mobile để tiết kiệm diện tích cho tiêu đề) */}
          <div className="hidden sm:flex p-2 bg-blue-50 text-blue-600 rounded-lg items-center justify-center shrink-0">
            <LayoutGrid size={20} />
          </div>

          {/* Tiêu đề & Badges */}
          <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="font-bold text-gray-800 text-sm sm:text-base md:text-lg leading-tight truncate">
                <span className="md:hidden">Yu-Gi-Oh PDF</span>
                <span className="hidden md:inline">Bàn In Thẻ Bài</span>
              </h1>
              <span className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 leading-none">
                {totalCards} thẻ
              </span>
              {totalCards > 0 && (
                <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 leading-none">
                  {a4Pages} trang
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 hidden lg:block">
              {totalCards === 0
                ? "Chưa có thẻ bài nào. Hãy dán ảnh (Ctrl+V) hoặc chọn ảnh từ menu bên trái / phải."
                : missingForFullPage > 0
                ? `Cần thêm ${missingForFullPage} thẻ để lấp đầy trang A4 cuối (${remainder}/9 thẻ).`
                : "Đã đủ 9 thẻ/trang cho tất cả các trang A4."}
            </p>
          </div>
        </div>

        {/* Action Controls: Undo/Redo & Export PDF */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Nút Hoàn tác (Undo) & Làm lại (Redo) */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 text-gray-700 hover:text-indigo-600 hover:bg-white active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-all cursor-pointer"
              title="Hoàn tác thao tác vừa rồi (Ctrl + Z)"
              aria-label="Hoàn tác"
            >
              <Undo2 size={16} />
            </button>
            <div className="h-4 w-px bg-gray-200 mx-0.5" />
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 text-gray-700 hover:text-indigo-600 hover:bg-white active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-all cursor-pointer"
              title="Làm lại thao tác vừa hoàn tác (Ctrl + Y hoặc Ctrl + Shift + Z)"
              aria-label="Làm lại"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {/* Nút Xuất PDF */}
          <button
            onClick={handleOpenExportModal}
            disabled={totalCards === 0 || isExporting}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-xs shrink-0 ${
              totalCards === 0
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : isExporting
                ? "bg-blue-400 text-white cursor-wait"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-200 hover:shadow-md cursor-pointer active:scale-98"
            }`}
            title={totalCards === 0 ? "Thêm thẻ bài để xuất PDF" : "Tùy chọn format và xuất file PDF"}
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                <span className="hidden xs:inline sm:inline">Đang xuất...</span>
              </>
            ) : (
              <>
                <FileDown size={15} className="sm:w-[18px] sm:h-[18px]" />
                <span className="font-semibold">Xuất PDF ({totalCards})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid thẻ bài */}
      <div className="px-3 md:px-0 flex-1 flex flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* rectSortingStrategy là thuật toán dành riêng cho dạng lưới (Grid) */}
          <SortableContext
            items={urlList.map((_, i) => i)}
            strategy={rectSortingStrategy}
          >
            {totalCards === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400 bg-gray-50/50">
                <Layers size={48} className="mb-3 text-gray-300 stroke-1" />
                <p className="font-medium text-gray-600 mb-1">Canvas đang trống</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Bạn có thể nhấn <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">Ctrl + V</kbd> để dán ảnh/base64, hoặc tìm kiếm thẻ từ sidebar.
                </p>
              </div>
            ) : (
              <div
                id="card-container"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              >
                {urlList.map((url, index) => (
                  <SortableCard
                    key={`${index}-${url}`} // Key kết hợp để React render đúng
                    index={index}
                    url={url}
                    isSelected={selectedIndices.has(index)}
                    onSelect={handleCardSelect}
                    onContextMenu={handleContextMenu}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onPreview={openLightbox}
                    onDelete={(targetIndex) => {
                      setUrlList((prev) => prev.filter((_, i) => i !== targetIndex));
                      setSelectedIndices((prev) => {
                        const next = new Set(prev);
                        next.delete(targetIndex);
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* Floating Action Bar khi có multi-select (Responsive icon-first) */}
      {selectedIndices.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 backdrop-blur-md text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl border border-gray-700/80 flex items-center gap-2 sm:gap-3 max-w-[95vw] animate-in slide-in-from-bottom-5 duration-200">
          {/* Badge số lượng thẻ đã chọn */}
          <div className="flex items-center gap-1.5 pl-0.5 pr-1 sm:pr-2">
            <span className="min-w-[24px] h-[24px] px-1 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {selectedIndices.size}
            </span>
            <span className="text-xs text-gray-300 font-medium hidden md:inline whitespace-nowrap">
              đã chọn
            </span>
          </div>

          <div className="h-5 w-px bg-gray-700 shrink-0" />

          {/* Nhóm nút Action */}
          <div className="flex items-center gap-2 sm:gap-2">
            {/* Chọn tất cả / Bỏ chọn */}
            <button
              type="button"
              onClick={() => {
                if (selectedIndices.size === urlList.length) {
                  handleClearSelection();
                } else {
                  handleSelectAll();
                }
              }}
              className="p-2.5 sm:px-2.5 sm:py-1.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl sm:rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer text-gray-200"
              title={
                selectedIndices.size === urlList.length
                  ? "Bỏ chọn tất cả (Esc)"
                  : "Chọn tất cả thẻ (Ctrl + A)"
              }
              aria-label="Chọn tất cả hoặc bỏ chọn"
            >
              <CheckSquare size={16} className="text-gray-300" />
              <span className="hidden lg:inline">
                {selectedIndices.size === urlList.length
                  ? "Bỏ chọn"
                  : "Chọn tất cả"}
              </span>
            </button>

            {/* Nhân bản */}
            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="p-2.5 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl sm:rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={`Nhân bản ${selectedIndices.size} thẻ đã chọn`}
              aria-label="Nhân bản các thẻ đã chọn"
            >
              <Copy size={16} />
              <span className="hidden sm:inline">Nhân bản</span>
            </button>

            {/* Xuất PDF riêng */}
            <button
              type="button"
              onClick={handleExportSelected}
              className="p-2.5 sm:px-3 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl sm:rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={`Xuất PDF riêng cho ${selectedIndices.size} thẻ đã chọn`}
              aria-label="Xuất PDF riêng các thẻ đã chọn"
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>

            {/* Xóa */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="p-2.5 sm:px-3 sm:py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl sm:rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={`Xóa ${selectedIndices.size} thẻ đã chọn (Delete)`}
              aria-label="Xóa các thẻ đã chọn"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Xóa</span>
            </button>

            {/* Đóng / Hủy chọn */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-2 hover:bg-gray-800 active:bg-gray-700 rounded-xl sm:rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer ml-1"
              title="Bỏ chọn (Esc)"
              aria-label="Bỏ chọn"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        urlList={urlList}
        setUrlList={setUrlList}
        selectedIndices={selectedIndices}
        setSelectedIndices={setSelectedIndices}
        onExportSelected={handleExportSelected}
      />

      {/* Export PDF Configuration Modal */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setCustomExportList(null);
        }}
        urlList={customExportList || urlList}
        cardDimensions={cardDimensions}
        setCardDimensions={setCardDimensions}
        onExport={handleExecuteExport}
        isExporting={isExporting}
      />

      {/* Full-Screen PDF Export Progress Modal (with Timeout per card) */}
      <ExportProgressModal
        isOpen={isExportProgressOpen}
        progress={exportProgress || {}}
        onCancel={handleCancelExport}
        onClose={() => {
          setIsExportProgressOpen(false);
          setCustomExportList(null);
        }}
      />

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          src={urlList[lightboxIndex]}
          alt={`Card ${lightboxIndex + 1}`}
          onClose={closeLightbox}
          onPrev={urlList.length > 1 ? prevLightbox : undefined}
          onNext={urlList.length > 1 ? nextLightbox : undefined}
          counter={`${lightboxIndex + 1} / ${urlList.length}`}
        />
      )}
    </div>
  );
}
