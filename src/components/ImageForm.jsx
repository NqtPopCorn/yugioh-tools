"use client";

import { useState } from "react";
import { Upload, ImagePlus, AlertCircle, X, Loader2, Plus } from "lucide-react";

export default function ImageForm({ urlList, setUrlList, onOpenUploadModal }) {
    const [imageUrl, setImageUrl] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const checkRenderable = (url) => {
        if (!url) return Promise.resolve(false);
        if (url.startsWith("data:image/")) return Promise.resolve(true);

        return new Promise((resolve) => {
            const img = new Image();
            let isDone = false;

            const cleanup = () => {
                img.onload = null;
                img.onerror = null;
            };

            const timer = setTimeout(() => {
                if (!isDone) {
                    isDone = true;
                    cleanup();
                    img.src = "";
                    resolve(false);
                }
            }, 6000);

            img.onload = () => {
                if (!isDone) {
                    isDone = true;
                    clearTimeout(timer);
                    cleanup();
                    resolve(true);
                }
            };

            img.onerror = () => {
                if (!isDone) {
                    isDone = true;
                    clearTimeout(timer);
                    cleanup();
                    resolve(false);
                }
            };

            img.src = url;
        });
    };

    const addCard = async (num = 1) => {
        const url = imageUrl.trim();
        if (!url) {
            setWarningMessage("Vui lòng dán đường dẫn (URL) ảnh.");
            return;
        }

        setIsLoading(true);
        setWarningMessage("");

        try {
            const isOk = await checkRenderable(url);
            if (!isOk) {
                setWarningMessage(
                    "Không thể hiển thị ảnh từ liên kết này. Vui lòng kiểm tra lại URL ảnh trực tiếp (.jpg, .png, .webp...)"
                );
                return;
            }

            const newUrls = Array(num).fill(url);
            setUrlList((prev) => [...prev, ...newUrls]);
            setImageUrl("");
            setWarningMessage("");

            // Scroll to the last added card
            setTimeout(() => {
                const cards = document.querySelectorAll(".card");
                if (cards.length > 0) {
                    cards[cards.length - 1].scrollIntoView({
                        behavior: "smooth",
                    });
                }
            }, 100);
        } catch (error) {
            console.error("Add card error:", error);
            setWarningMessage("Có lỗi xảy ra khi kiểm tra ảnh.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addCard(1);
    };

    return (
        <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-2xs">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                    <ImagePlus size={16} className="text-indigo-600" />
                    <span>Thêm thẻ bài</span>
                </div>
                {onOpenUploadModal && (
                    <button
                        type="button"
                        onClick={onOpenUploadModal}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                        title="Kéo thả hoặc tải file"
                    >
                        <Upload size={13} />
                        <span>Kéo thả file</span>
                    </button>
                )}
            </div>

            <form
                id="image-form"
                onSubmit={handleSubmit}
                className="space-y-2"
            >
                <div className="flex items-center gap-2">
                    <input
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50"
                        type="text"
                        id="img-url"
                        placeholder="Dán URL ảnh ở đây..."
                        value={imageUrl}
                        disabled={isLoading}
                        onChange={(e) => {
                            setImageUrl(e.target.value);
                            if (warningMessage) setWarningMessage("");
                        }}
                    />
                    <button
                        type="button"
                        onClick={onOpenUploadModal}
                        className="p-2 flex items-center justify-center border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-indigo-600 transition-colors shadow-2xs shrink-0"
                        title="Tải lên file ảnh hoặc file decklist"
                    >
                        <Upload size={18} />
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !imageUrl.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-2xs transition-all duration-150 cursor-pointer"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Đang kiểm tra ảnh...</span>
                        </>
                    ) : (
                        <>
                            <Plus size={16} />
                            <span>Thêm vào danh sách</span>
                        </>
                    )}
                </button>
            </form>

            {warningMessage && (
                <div
                    id="warning-message"
                    role="alert"
                    className="mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200"
                >
                    <AlertCircle
                        size={16}
                        className="text-red-500 shrink-0 mt-0.5"
                    />
                    <div className="flex-1 font-medium leading-relaxed">
                        {warningMessage}
                    </div>
                    <button
                        type="button"
                        onClick={() => setWarningMessage("")}
                        className="text-red-400 hover:text-red-600 transition-colors p-0.5 rounded cursor-pointer shrink-0"
                        title="Đóng thông báo"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}


