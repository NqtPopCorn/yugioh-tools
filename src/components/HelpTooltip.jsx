"use client";
import { BadgeQuestionMark } from "lucide-react";

export default function HelpTooltip() {
    return (
        <button className="group/help relative">
            <BadgeQuestionMark />
            <div className="group-hover/help:block group-active/help:block hidden absolute top-6 right-0 bg-gray-500 text-white text-left p-2 rounded shadow-lg w-52 z-50">
                Hỗ trợ xuất ảnh card Yu-Gi-Oh kích thước tiêu chuẩn sang PDF để
                in.
                <br />
                <strong>Hướng dẫn sử dụng:</strong>
                <br />- Thêm ảnh: Nhập URL ảnh hoặc dán ảnh từ clipboard.
                <br />- Xóa ảnh: Double click hoặc nhấn giữ.
                <br />- Nhấn "Lưu local" để lưu vào trình duyệt.
                <br />- Nhấn "Xuất PDF" để tải xuống file PDF.
                <br />
                <div>
                    <span className="font-semibold">Nguồn ảnh đề xuất:</span>
                    <a
                        href="https://www.deviantart.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white underline hover:underline ml-1"
                    >
                        Deviantart
                    </a>
                </div>
            </div>
        </button>
    );
}
