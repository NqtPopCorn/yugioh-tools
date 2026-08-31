"use client";

import { Save, Trash2 } from "lucide-react";

export default function ActionButtons({ urlList, setUrlList }) {
  const handleSaveLocal = () => {
    try {
      const saveable = urlList.filter((url) => !url.startsWith("data:"));
      localStorage.setItem("yugiohCardUrls", JSON.stringify(saveable));
      const skipped = urlList.length - saveable.length;
      if (skipped > 0) {
        alert(
          `Đã lưu ${saveable.length} thẻ. (${skipped} thẻ dùng ảnh paste/upload không thể lưu link, sẽ mất khi reload)`
        );
      } else {
        alert("Đã lưu thành công vào Local Storage!");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Không thể lưu local. Hãy thử xuất PDF để lưu lại các thẻ.");
    }
  };

  const clearCards = () => {
    if (urlList.length === 0) return;
    if (confirm("Bạn có chắc chắn muốn xóa tất cả các thẻ không?")) {
      setUrlList([]);
    }
  };

  return (
    <div className="space-y-2 mb-4">
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-2xs cursor-pointer"
          onClick={handleSaveLocal}
        >
          <Save size={16} />
          Lưu local
        </button>
        <button
          type="button"
          onClick={clearCards}
          disabled={urlList.length === 0}
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <Trash2 size={16} />
          Xóa tất cả
        </button>
      </div>
    </div>
  );
}



