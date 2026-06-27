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

    try {
        for (let i = 0; i < urlList.length; i++) {
            const placement = placements[i];
            const img = await loadImage(urlList[i]);

            while (placement.page > currentPage) {
                pdf.addPage();
                currentPage += 1;
            }

            pdf.addImage(img, "JPEG", placement.x, placement.y, cardW, cardH);
        }
        pdf.save("yugioh-cards.pdf");
    } catch (error) {
        alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
        console.error("PDF Export Error:", error);
    }
};

const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 1.0));
        };
        img.onerror = reject;
        img.src = url;
    });
};
