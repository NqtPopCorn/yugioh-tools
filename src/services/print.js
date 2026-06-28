import { jsPDF } from "jspdf";
import { getCardPlacements } from "./printLayout.mjs";

export const exportPDF = async (urlList, cardDimensions) => {
    if (urlList.length === 0) {
        alert("Vui lòng thêm ít nhất một thẻ trước khi xuất PDF.");
        return;
    }

    if (urlList.length % 9 !== 0) {
        if (
            !confirm(
                `Chưa đủ thẻ cho trang a4 cuối, bạn nên thêm ${
                    9 - (urlList.length % 9)
                } thẻ nữa! Vẫn tiếp tục xuất PDF?`
            )
        ) {
            return;
        }
    }

    if (!confirm(`Bạn có chắc chắn muốn xuất ${urlList.length} thẻ không?`)) {
        return;
    }

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const cardW = cardDimensions.width;
    const cardH = cardDimensions.height;
    const placements = getCardPlacements(urlList.length, cardDimensions);
    let currentPage = 0;
    const failedIndices = [];

    for (let i = 0; i < urlList.length; i++) {
        const placement = placements[i];

        while (placement.page > currentPage) {
            pdf.addPage();
            currentPage += 1;
        }

        try {
            const img = await loadImage(urlList[i]);
            pdf.addImage(img, "JPEG", placement.x, placement.y, cardW, cardH);
        } catch (err) {
            console.warn(`PDF: Không thể load ảnh thẻ ${i + 1}:`, err);
            failedIndices.push(i + 1);
            // Vẽ placeholder đỏ thay cho ảnh bị lỗi
            pdf.setFillColor(220, 80, 80);
            pdf.rect(placement.x, placement.y, cardW, cardH, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(6);
            pdf.text(`Thẻ ${i + 1}\nLỗi ảnh`, placement.x + 2, placement.y + cardH / 2);
            pdf.setTextColor(0, 0, 0);
        }
    }

    pdf.save("yugioh-cards.pdf");

    if (failedIndices.length > 0) {
        alert(
            `Xuất PDF xong!\n\nCảnh báo: ${failedIndices.length} thẻ bị lỗi ảnh (thẻ số: ${failedIndices.join(", ")}).\n` +
            `Nguyên nhân thường gặp: ảnh từ DeviantArt hoặc URL ngoài không có CORS header → không đưa vào canvas được.\n` +
            `Giải pháp: dùng ảnh từ YGOProDeck hoặc upload file trực tiếp.`
        );
    }
};

/**
 * Tải ảnh từ URL và trả về data URL để dùng trong jsPDF.
 * Thử theo thứ tự:
 *   1. crossOrigin=anonymous (dành cho proxy URL / CORS-enabled CDN / data:)
 *   2. fetch() blob → object URL (fallback nếu server chặn crossOrigin nhưng cho phép CORS fetch)
 */
const loadImage = async (url) => {
    // Thử với crossOrigin=anonymous trước (hoạt động với CF Worker proxy, data URLs)
    try {
        return await loadWithCrossOrigin(url);
    } catch {
        // ignored — thử fallback
    }

    // Fallback: fetch blob → objectURL (một số server chặn crossOrigin nhưng cho CORS fetch)
    try {
        const resp = await fetch(url, { mode: "cors" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        try {
            return await loadWithCrossOrigin(objectUrl);
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    } catch {
        // ignored — cả hai đều thất bại
    }

    throw new Error(`Không thể load ảnh cho canvas: ${url}`);
};

const loadWithCrossOrigin = (url) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            try {
                resolve(canvas.toDataURL("image/jpeg", 1.0));
            } catch (e) {
                reject(e); // tainted canvas
            }
        };
        img.onerror = () => reject(new Error(`onerror: ${url}`));
        img.src = url;
    });

