"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  BookOpen,
  Rocket,
  PlusCircle,
  MousePointer,
  Keyboard,
  Printer,
  Sparkles,
  ExternalLink,
  Copy,
  Upload,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Layers,
  RotateCw,
  Trash2,
  ZoomIn,
  Sliders,
  Check,
} from "lucide-react";

const TABS = [
  { id: "quickstart", label: "Bắt đầu nhanh", icon: Rocket, badge: "3 bước" },
  { id: "add-cards", label: "Cách thêm thẻ", icon: PlusCircle, badge: "5 cách" },
  { id: "manage", label: "Thao tác & Sắp xếp", icon: MousePointer, badge: "Mẹo" },
  { id: "shortcuts", label: "Phím tắt", icon: Keyboard, badge: "Hotkeys" },
  { id: "print-tips", label: "Kích thước & In ấn", icon: Printer, badge: "Chuẩn mm" },
  { id: "resources", label: "Nguồn ảnh HD", icon: Sparkles, badge: "Đề xuất" },
];

export default function TutorialModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("quickstart");
  const [copiedShortcut, setCopiedShortcut] = useState(null);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
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

  if (!isOpen || typeof document === "undefined") return null;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedShortcut(id);
    setTimeout(() => setCopiedShortcut(null), 1500);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-200 flex flex-col h-[88vh] sm:h-auto sm:max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (shrink-0) */}
        <div className="p-3.5 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg md:text-xl truncate">
                  Hướng Dẫn Sử Dụng
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 hidden xs:block sm:block line-clamp-1">
                Dàn trang, sắp xếp và in ấn bài Yu-Gi-Oh! chuẩn kích thước A4 & sleeve
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200 shrink-0 ml-2"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs (shrink-0) */}
        <div className="bg-gray-50/80 border-b border-gray-200 px-3 sm:px-5 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max py-2.5 sm:py-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-sm border border-indigo-100 font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-transparent"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-indigo-600" : "text-gray-500"} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-200/80 text-gray-600"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body (flex-1 min-h-0) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 text-gray-700 text-sm space-y-6">
          {/* TAB 1: QUICK START */}
          {activeTab === "quickstart" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-100">
                <h4 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Rocket size={20} />
                  Quy trình 3 bước in bài hoàn hảo
                </h4>
                <p className="text-xs sm:text-sm text-indigo-100 mt-1">
                  Chỉ cần 3 bước đơn giản để tạo ngay file PDF chuẩn khổ A4 sẵn sàng gửi đến tiệm in.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-end justify-start pl-3 pb-2 font-black text-lg">
                    1
                  </div>
                  <div className="p-2 w-fit bg-indigo-100 text-indigo-700 rounded-lg mb-3">
                    <PlusCircle size={20} />
                  </div>
                  <h5 className="font-bold text-gray-900 mb-1">1. Thêm ảnh thẻ</h5>
                  <p className="text-xs text-gray-600 flex-1 leading-relaxed">
                    Dán URL ảnh, tải file từ máy, dán ảnh từ clipboard (<strong>Ctrl+V</strong>), import decklist YDK hoặc tìm trên sidebar phải.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-end justify-start pl-3 pb-2 font-black text-lg">
                    2
                  </div>
                  <div className="p-2 w-fit bg-purple-100 text-purple-700 rounded-lg mb-3">
                    <MousePointer size={20} />
                  </div>
                  <h5 className="font-bold text-gray-900 mb-1">2. Sắp xếp & Chọn thẻ</h5>
                  <p className="text-xs text-gray-600 flex-1 leading-relaxed">
                    Kéo thả để sắp xếp thứ tự in, chuột phải xoay/nhân bản thẻ, hoặc dùng chế độ chọn nhiều thẻ để thao tác hàng loạt.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-end justify-start pl-3 pb-2 font-black text-lg">
                    3
                  </div>
                  <div className="p-2 w-fit bg-emerald-100 text-emerald-700 rounded-lg mb-3">
                    <Printer size={20} />
                  </div>
                  <h5 className="font-bold text-gray-900 mb-1">3. Xuất file PDF</h5>
                  <p className="text-xs text-gray-600 flex-1 leading-relaxed">
                    Nhấn <strong>"Xuất PDF"</strong>, chọn kích thước <strong>62 x 90 mm (Fit Sleeve)</strong> và tải về file PDF chứa 9 thẻ/trang A4.
                  </p>
                </div>
              </div>

              {/* Highlights callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
                <Lightbulb size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <p className="font-bold">Mẹo tiết kiệm giấy in:</p>
                  <p className="text-amber-800">
                    Mỗi trang A4 chứa đúng <strong>9 thẻ</strong> (3 cột x 3 hàng). Hãy thêm số thẻ là bội số của 9 (ví dụ: 18, 27, 36, 45 thẻ) để tận dụng trọn vẹn từng trang in mà không lãng phí giấy trắng.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD CARDS */}
          {activeTab === "add-cards" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <PlusCircle size={18} className="text-indigo-600" />
                Tổng hợp 5 cách thêm thẻ bài vào trang in
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Method 1: Clipboard */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <Copy size={16} />
                    </div>
                    <span>1. Dán từ Clipboard (Ctrl + V)</span>
                    <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      Nhanh nhất
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Chuột phải "Sao chép hình ảnh" (Copy Image) từ bất kỳ trang web nào (Facebook, Deviantart, Pinterest...), sau đó nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-800 font-mono text-[11px]">Ctrl + V</kbd> ở bất cứ đâu trên giao diện để thêm ngay.
                  </p>
                </div>

                {/* Method 2: Direct URL */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Search size={16} />
                    </div>
                    <span>2. Dán link ảnh (URL)</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Dán link ảnh trực tiếp (kết thúc bằng <code>.jpg</code>, <code>.png</code>, <code>.webp</code>) vào ô input ở thanh bên trái và nhấn Enter.
                  </p>
                </div>

                {/* Method 3: Upload from device */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                    <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <Upload size={16} />
                    </div>
                    <span>3. Tải file từ máy tính</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Bấm vào icon <strong>Upload</strong> ở cạnh ô URL để chọn cùng lúc nhiều file ảnh từ máy tính của bạn (.jpg, .jpeg, .png).
                  </p>
                </div>

                {/* Method 4: Decklist text / YDK */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                    <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <span>4. Import Decklist YDK / Text</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Dán toàn bộ danh sách Passcode ID hoặc Tên bài từ YGOPRO / YGOPRODeck / EDOPro vào khung "Import decklist" để hệ thống tự động tải hàng loạt thẻ.
                  </p>
                </div>

                {/* Method 5: Sidebar Card Search */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-colors md:col-span-2">
                  <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
                    <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                      <Sparkles size={16} />
                    </div>
                    <span>5. Tìm kiếm & Thêm từ kho dữ liệu YGOPRODeck (Sidebar Phải)</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Mở thanh tìm kiếm ở bên phải màn hình, gõ tên lá bài (tiếng Anh hoặc tiếng Nhật), xem chi tiết hiệu ứng và bấm <strong>+1, +2, +3</strong> để thêm ngay số lượng card mong muốn vào trang in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CARD MANAGEMENT */}
          {activeTab === "manage" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <MousePointer size={18} className="text-indigo-600" />
                Các thao tác quản lý thẻ bài chuyên nghiệp
              </h4>

              <div className="space-y-3">
                {/* Drag and Drop */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row items-start gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Kéo thả sắp xếp thứ tự in (Drag & Drop)</h5>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Nhấn giữ vào bất kỳ thẻ nào (hoặc biểu tượng tay cầm 6 chấm) rồi kéo sang vị trí khác để hoán đổi thứ tự in trong file PDF.
                    </p>
                  </div>
                </div>

                {/* Multi-selection */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Chế độ chọn nhiều thẻ (Multi-Select)</h5>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      - <strong>Click thẻ:</strong> Chọn hoặc bỏ chọn một thẻ cụ thể.<br />
                      - <strong>Shift + Click:</strong> Chọn liên tiếp một dải thẻ từ thẻ trước đó đến thẻ hiện tại.<br />
                      - <strong>Ctrl + A:</strong> Chọn toàn bộ tất cả các thẻ.<br />
                      - Khi có thẻ được chọn, thanh công cụ bên dưới sẽ hiển thị để <strong>Nhân bản</strong>, <strong>Xuất PDF riêng</strong>, hoặc <strong>Xóa hàng loạt</strong>.
                    </p>
                  </div>
                </div>

                {/* Context menu & Double click */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row items-start gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                    <RotateCw size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Menu chuột phải & Nhấn giữ (Mobile)</h5>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Chuột phải vào thẻ bất kỳ (hoặc nhấn giữ trên điện thoại) để mở Menu thao tác nhanh:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                        <ZoomIn size={12} /> Xem phóng to HD
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                        <RotateCw size={12} /> Xoay ảnh 90°
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                        <Copy size={12} /> Nhân bản (x1, x2, x3)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-rose-50 text-rose-700 px-2 py-1 rounded-md font-medium">
                        <Trash2 size={12} /> Xóa thẻ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHORTCUTS */}
          {activeTab === "shortcuts" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Keyboard size={18} className="text-indigo-600" />
                Danh sách phím tắt hữu ích (Cheatsheet)
              </h4>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Phím tắt</th>
                      <th className="py-3 px-4">Hành động</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">V</kbd>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">Dán ảnh từ Clipboard</td>
                      <td className="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">Dán trực tiếp ảnh card vừa copy</td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">A</kbd>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">Chọn tất cả thẻ</td>
                      <td className="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">Bật chọn toàn bộ danh sách</td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Shift</kbd> + <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Click</kbd>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">Chọn dải nhiều thẻ</td>
                      <td className="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">Chọn liên tục từ thẻ A đến thẻ B</td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Delete</kbd> / <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Backspace</kbd>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">Xóa các thẻ đã chọn</td>
                      <td className="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">Xóa nhanh các thẻ đang tick chọn</td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Esc</kbd>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">Bỏ chọn / Đóng bảng</td>
                      <td className="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">Hủy chọn thẻ hoặc đóng popup/modal</td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded shadow-2xs">Double Click</kbd>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">Xóa nhanh 1 thẻ</td>
                      <td className="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">Click đúp vào ảnh để xóa ngay</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PRINT TIPS & SIZES */}
          {activeTab === "print-tips" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Printer size={18} className="text-indigo-600" />
                Kích thước thẻ bài & Cài đặt máy in chuẩn từng milimet
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 62 x 90 mm */}
                <div className="border-2 border-indigo-500 bg-indigo-50/30 rounded-xl p-4 relative">
                  <span className="absolute top-3 right-3 text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Khuyên Dùng
                  </span>
                  <h5 className="font-bold text-indigo-950 text-sm">62 x 90 mm (Fit Sleeve)</h5>
                  <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                    Kích thước chuẩn khi nhét bài vào bọc bảo vệ (Sleeve tiêu chuẩn Yu-Gi-Oh!). Đảm bảo 9 thẻ vừa vặn tuyệt đối trên 1 trang A4.
                  </p>
                </div>

                {/* 59 x 86 mm */}
                <div className="border border-gray-200 bg-white rounded-xl p-4">
                  <h5 className="font-bold text-gray-900 text-sm">59 x 86 mm (Chuẩn OCG / TCG)</h5>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Kích thước thật của phôi thẻ bài chính hãng Konami khi không sử dụng bọc bài (Sleeve).
                  </p>
                </div>

                {/* 63 x 88 mm */}
                <div className="border border-gray-200 bg-white rounded-xl p-4">
                  <h5 className="font-bold text-gray-900 text-sm">63 x 88 mm (Standard TCG)</h5>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Kích thước chuẩn cho thẻ Pokémon TCG, Magic: The Gathering (MTG), One Piece, Weiss Schwarz.
                  </p>
                </div>

                {/* Custom */}
                <div className="border border-gray-200 bg-white rounded-xl p-4">
                  <h5 className="font-bold text-gray-900 text-sm">Tùy chỉnh (Custom Dimension)</h5>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Tự do nhập kích thước chiều rộng x chiều cao bất kỳ theo nhu cầu in ấn đặc thù.
                  </p>
                </div>
              </div>

              {/* Printer Settings Guide */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <h5 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-600" />
                  Cấu hình khi bấm In (Ctrl + P) trên trình duyệt hoặc máy in:
                </h5>
                <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>Khổ giấy (Paper size):</strong> Chọn <code>A4 (210 x 297 mm)</code>.
                  </li>
                  <li>
                    <strong>Tỷ lệ (Scale):</strong> Bắt buộc chọn <strong>100%</strong> hoặc <strong>Actual Size</strong> (Không chọn "Fit to Printable Area" hay "Fit to Paper" vì máy in sẽ tự co nhỏ lại làm lệch kích cỡ chuẩn).
                  </li>
                  <li>
                    <strong>Lề giấy (Margins):</strong> Chọn <code>None</code> (Không lề) hoặc <code>Default</code>.
                  </li>
                  <li>
                    <strong>Chất liệu giấy đề xuất:</strong> Giấy <strong>Couche 300gsm (C300)</strong> hoặc <strong>Ivory 300gsm</strong> cán màng bóng/mờ để bài có độ cứng cáp và bề mặt đẹp nhất.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: RESOURCES */}
          {activeTab === "resources" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />
                Nguồn ảnh chất lượng cao & Mẹo tìm art đẹp
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DeviantArt Card */}
                <div className="border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl p-4.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-indigo-950 text-base">DeviantArt (Khuyên dùng)</h5>
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Art HD / 4K
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Nguồn bài Proxy, Orica, Custom Art và Full Art đẹp nhất từ cộng đồng artist Yu-Gi-Oh toàn cầu. Độ phân giải cực cao, in ra chữ và hình nét căng.
                    </p>
                    <p className="text-[11px] text-indigo-800 bg-indigo-100/60 p-2 rounded-lg mb-4 font-mono">
                      Từ khóa tìm kiếm gợi ý: <br />
                      <code>yugioh proxy [tên card]</code> hoặc <code>yugioh orica [tên card]</code>
                    </p>
                  </div>
                  <a
                    href="https://www.deviantart.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <span>Mở DeviantArt</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* YGOPRODeck Card */}
                <div className="border border-gray-200 bg-white rounded-xl p-4.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-gray-900 text-base">YGOPRODeck Database</h5>
                      <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                        Official Art
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Kho dữ liệu thẻ bài chính hãng Konami đầy đủ tất cả các set bài OCG & TCG, Rush Duel kèm Passcode ID và effect chi tiết.
                    </p>
                    <p className="text-[11px] text-gray-700 bg-gray-100 p-2 rounded-lg mb-4">
                      Bạn cũng có thể tra cứu và thêm trực tiếp ngay trong ứng dụng qua <strong>thanh tìm kiếm bên phải</strong>!
                    </p>
                  </div>
                  <a
                    href="https://ygoprodeck.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <span>Mở YGOPRODeck</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Local Storage Save Tip */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <p className="font-bold mb-0.5">Lưu danh sách bài vào trình duyệt:</p>
                  <p className="text-emerald-800 leading-relaxed">
                    Nhấn nút <strong>"Lưu local"</strong> ở thanh menu bên trái để lưu lại danh sách URL bài. Trình duyệt sẽ tự động tải lại danh sách này ở những lần truy cập sau.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500 hidden sm:flex items-center gap-1.5">
            <span>Mẹo: Nhấn</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-700 font-mono text-[10px]">
              Esc
            </kbd>
            <span>hoặc click bên ngoài để đóng</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer flex items-center gap-1.5"
            >
              <Check size={16} />
              <span>Đã hiểu</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
