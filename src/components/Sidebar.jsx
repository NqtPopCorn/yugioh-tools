"use client";
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
    const handleExportPDF = () => {
        exportPDF(urlList, cardDimensions);
    };

    return (
        <div
            id="sidebar"
            className="w-full h-full sticky top-0 bg-gray-100 border-r border-gray-300 p-4 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:block md:h-screen md:w-80 md:fixed z-40 overflow-y-auto overflow-x-hidden"
        >
            <div className="flex justify-between items-center mb-4 relative">
                <h2 className="flex-grow text-center font-bold text-lg">
                    Yu-Gi-Oh PDF
                </h2>
                <HelpTooltip />
            </div>

            <ImageForm urlList={urlList} setUrlList={setUrlList} />

            <p className="text-gray-500 text-sm italic text-center mb-4">
                Hoặc dán ảnh từ clipboard
            </p>

            <ActionButtons urlList={urlList} setUrlList={setUrlList} />
            <CardSizeSettings
                cardDimensions={cardDimensions}
                setCardDimensions={setCardDimensions}
            />

            <button
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
                onClick={handleExportPDF}
            >
                <i className="fa-solid fa-file-pdf mr-2"></i>
                Xuất PDF
            </button>
        </div>
    );
}
