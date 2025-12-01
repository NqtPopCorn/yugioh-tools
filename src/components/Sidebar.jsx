"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react"; // Cần cài lucide-react nếu chưa có
import HelpTooltip from "./HelpTooltip";
import ImageForm from "./ImageForm";
import ActionButtons from "./ActionButtons";
import CardSizeSettings from "./CardSizeSettings";
import { exportPDF } from "../services/print";

export default function Sidebar({
  urlList,
  setUrlList,
  cardDimensions,
  setCardDimensions,
}) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const handleExportPDF = () => {
    exportPDF(urlList, cardDimensions);
  };

  return (
    <div
      id="sidebar"
      className="w-full bg-gray-100 border-r border-gray-300 transform transition-transform duration-300 ease-in-out
            sticky top-0 z-40 border-b md:border-b-0
            md:translate-x-0 md:block md:h-screen md:w-80 md:static md:overflow-y-auto"
    >
      <div className="p-4">
        {/* Header Area */}
        <div className="flex justify-between items-center mb-4 relative">
          <h2 className="flex-grow text-center font-bold text-lg">
            Yu-Gi-Oh PDF
          </h2>

          <div className="flex items-center gap-2">
            <HelpTooltip />

            {/* Nút Toggle chỉ hiện ở Mobile */}
            <button
              className="md:hidden p-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
              {isMobileExpanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Phần Input Ảnh - LUÔN HIỂN THỊ (theo yêu cầu) */}
        <ImageForm urlList={urlList} setUrlList={setUrlList} />

        <p className="text-gray-500 text-sm italic text-center mb-2">
          Hoặc dán ảnh từ clipboard
        </p>

        {/* Phần mở rộng: Settings, Actions, Export */}
        {/* Logic: Ẩn trên mobile trừ khi được expand. Luôn hiện trên Desktop (md:block) */}
        <div
          className={`${isMobileExpanded ? "block" : "hidden"} md:block mt-4`}
        >
          <ActionButtons urlList={urlList} setUrlList={setUrlList} />

          <hr className="my-4 border-gray-300" />

          <CardSizeSettings
            cardDimensions={cardDimensions}
            setCardDimensions={setCardDimensions}
          />

          <button
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2 shadow-sm"
            onClick={handleExportPDF}
          >
            <i className="fa-solid fa-file-pdf mr-2"></i>
            Xuất PDF
          </button>
        </div>
      </div>
    </div>
  );
}
