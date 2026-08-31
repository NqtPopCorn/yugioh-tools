"use client";
import { useState } from "react";
import { ListIndentDecrease, HelpCircle } from "lucide-react";
import TutorialModal from "./TutorialModal";
import FileUploadModal from "./FileUploadModal";
import ImageForm from "./ImageForm";
import DeckImportForm from "./DeckImportForm";
import ActionButtons from "./ActionButtons";

export default function Sidebar({
  urlList,
  setUrlList,
  isOpen = true,
  setIsOpen,
}) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deckText, setDeckText] = useState("");

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = setIsOpen || setInternalOpen;

  const handleDeckFileLoaded = (loadedContent) => {
    setDeckText(loadedContent);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <div
        id="sidebar"
        className={`
          bg-gray-100 border-r border-gray-300 flex flex-col shadow-lg md:shadow-none z-50
          fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0 w-[85vw] max-w-xs" : "-translate-x-full w-[85vw] max-w-xs"}
          md:translate-x-0 md:static md:h-screen md:sticky md:top-0 md:w-80 md:shrink-0
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-2">
            {/* Nút Đóng Sidebar (Mobile) */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="md:hidden p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
              title="Đóng sidebar"
            >
              <ListIndentDecrease size={20} />
            </button>
            <h2 className="font-bold text-lg text-gray-800">Yu-Gi-Oh PDF</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150 cursor-pointer border border-gray-200 hover:border-indigo-200 shadow-2xs flex items-center gap-1"
              title="Xem hướng dẫn sử dụng"
            >
              <HelpCircle size={18} />
              <span className="hidden sm:inline text-xs font-medium">Hướng dẫn</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <ImageForm
            urlList={urlList}
            setUrlList={setUrlList}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
          <DeckImportForm
            setUrlList={setUrlList}
            deckText={deckText}
            setDeckText={setDeckText}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
          <ActionButtons urlList={urlList} setUrlList={setUrlList} />
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* File Upload Modal (Chỉ modal này chứa vùng Kéo thả & Upload) */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        urlList={urlList}
        setUrlList={setUrlList}
        onDeckFileLoaded={handleDeckFileLoaded}
      />
    </>
  );
}


