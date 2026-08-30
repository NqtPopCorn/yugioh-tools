import { jsPDF } from "jspdf";
import { getCardPlacements } from "./printLayout.mjs";

/**
 * Xuất danh sách URL thẻ bài ra file PDF khổ A4 với báo cáo tiến trình và timeout per card.
 *
 * @param {string[]} urlList - Danh sách URL ảnh thẻ bài
 * @param {{ width: number, height: number }} cardDimensions - Kích thước thẻ (mm)
 * @param {Object} options - Tùy chọn cấu hình
 * @param {boolean} [options.skipConfirm=false] - Bỏ qua hộp thoại confirm
 * @param {number} [options.timeoutPerCard=7000] - Thời gian timeout tối đa cho mỗi ảnh (ms)
 * @param {Function} [options.onProgress] - Callback báo cáo tiến độ: ({ current, total, percentage, page, totalPages, currentUrl, successCount, failedCount, failedIndices, status, isComplete }) => void
 * @param {AbortSignal} [options.signal] - Signal để hủy xuất file giữa chừng
 */
export const exportPDF = async (urlList, cardDimensions, options = {}) => {
    const {
        skipConfirm = false,
        timeoutPerCard = 7000,
        onProgress = null,
        signal = null,
    } = options;

    if (!urlList || urlList.length === 0) {
        alert("Vui lòng thêm ít nhất một thẻ trước khi xuất PDF.");
        return { success: false, reason: "empty" };
    }

    if (!skipConfirm) {
        if (urlList.length % 9 !== 0) {
            if (
                !confirm(
                    `Chưa đủ thẻ cho trang a4 cuối, bạn nên thêm ${
                        9 - (urlList.length % 9)
                    } thẻ nữa! Vẫn tiếp tục xuất PDF?`
                )
            ) {
                return { success: false, reason: "cancelled" };
            }
        }

        if (!confirm(`Bạn có chắc chắn muốn xuất ${urlList.length} thẻ không?`)) {
            return { success: false, reason: "cancelled" };
        }
    }

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const cardW = cardDimensions?.width || 62;
    const cardH = cardDimensions?.height || 90;
    const placements = getCardPlacements(urlList.length, cardDimensions);
    const totalPages = placements.length > 0
        ? Math.max(...placements.map((p) => p.page)) + 1
        : 1;

    let currentPage = 0;
    const failedIndices = [];

    // Báo cáo bắt đầu
    onProgress?.({
        current: 0,
        total: urlList.length,
        percentage: 0,
        page: 1,
        totalPages,
        currentUrl: urlList[0],
        successCount: 0,
        failedCount: 0,
        failedIndices: [],
        status: "Đang khởi tạo tài liệu PDF...",
        isComplete: false,
    });

    for (let i = 0; i < urlList.length; i++) {
        // Kiểm tra nếu người dùng yêu cầu hủy
        if (signal?.aborted) {
            throw new Error("Quá trình xuất PDF đã bị hủy bởi người dùng.");
        }

        const placement = placements[i];

        while (placement.page > currentPage) {
            pdf.addPage();
            currentPage += 1;
        }

        // Báo cáo tiến trình thẻ hiện tại
        onProgress?.({
            current: i + 1,
            total: urlList.length,
            percentage: Math.round(((i) / urlList.length) * 100),
            page: placement.page + 1,
            totalPages,
            currentUrl: urlList[i],
            successCount: i - failedIndices.length,
            failedCount: failedIndices.length,
            failedIndices: [...failedIndices],
            status: `Đang tải & xử lý thẻ ${i + 1} / ${urlList.length}...`,
            isComplete: false,
        });

        try {
            const img = await loadImageWithTimeout(urlList[i], timeoutPerCard, signal);
            pdf.addImage(img, "JPEG", placement.x, placement.y, cardW, cardH);
        } catch (err) {
            console.warn(`PDF: Không thể load ảnh thẻ ${i + 1} (${urlList[i]}):`, err);
            failedIndices.push(i + 1);
            // Vẽ placeholder thay cho ảnh bị lỗi / timeout
            pdf.setFillColor(225, 29, 72);
            pdf.rect(placement.x, placement.y, cardW, cardH, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7);
            pdf.text(
                `Thẻ #${i + 1}\nLỗi tải ảnh / Timeout`,
                placement.x + 2,
                placement.y + cardH / 2
            );
            pdf.setTextColor(0, 0, 0);
        }

        // Cập nhật tiến độ sau khi xong thẻ này
        onProgress?.({
            current: i + 1,
            total: urlList.length,
            percentage: Math.round(((i + 1) / urlList.length) * 100),
            page: placement.page + 1,
            totalPages,
            currentUrl: urlList[i],
            successCount: i + 1 - failedIndices.length,
            failedCount: failedIndices.length,
            failedIndices: [...failedIndices],
            status: `Đã xử lý xong ${i + 1} / ${urlList.length} thẻ`,
            isComplete: i === urlList.length - 1,
        });
    }

    // Báo cáo hoàn tất
    onProgress?.({
        current: urlList.length,
        total: urlList.length,
        percentage: 100,
        page: totalPages,
        totalPages,
        currentUrl: null,
        successCount: urlList.length - failedIndices.length,
        failedCount: failedIndices.length,
        failedIndices: [...failedIndices],
        status: "Đang lưu & tải file PDF xuống...",
        isComplete: true,
    });

    pdf.save("yugioh-cards.pdf");

    return {
        success: true,
        total: urlList.length,
        successCount: urlList.length - failedIndices.length,
        failedIndices,
    };
};

/**
 * Tải ảnh với timeout và AbortSignal
 */
const loadImageWithTimeout = (url, timeoutMs = 7000, signal = null) => {
    return new Promise((resolve, reject) => {
        let timer = null;
        let isDone = false;

        const cleanup = () => {
            if (timer) clearTimeout(timer);
            isDone = true;
        };

        if (signal?.aborted) {
            return reject(new Error("Thao tác bị hủy."));
        }

        const handleAbort = () => {
            cleanup();
            reject(new Error("Thao tác xuất PDF bị hủy."));
        };

        if (signal) {
            signal.addEventListener("abort", handleAbort, { once: true });
        }

        timer = setTimeout(() => {
            if (!isDone) {
                cleanup();
                reject(new Error(`Timeout sau ${timeoutMs}ms khi tải ảnh: ${url}`));
            }
        }, timeoutMs);

        loadImage(url)
            .then((res) => {
                if (!isDone) {
                    cleanup();
                    resolve(res);
                }
            })
            .catch((err) => {
                if (!isDone) {
                    cleanup();
                    reject(err);
                }
            });
    });
};

/**
 * Tải ảnh từ URL và trả về data URL để dùng trong jsPDF.
 */
const loadImage = async (url) => {
    // Nếu là data URL (base64) thì convert trực tiếp
    if (url.startsWith("data:")) {
        return await loadWithCrossOrigin(url);
    }

    // Thử với crossOrigin=anonymous trước (hoạt động với CF Worker proxy, CORS-enabled CDN)
    try {
        return await loadWithCrossOrigin(url);
    } catch {
        // ignored — thử fallback
    }

    // Fallback: fetch blob → objectURL
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
        // ignored
    }

    throw new Error(`Không thể load ảnh cho canvas: ${url}`);
};

const loadWithCrossOrigin = (url) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || 400;
            canvas.height = img.naturalHeight || 580;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            try {
                resolve(canvas.toDataURL("image/jpeg", 0.95));
            } catch (e) {
                reject(e); // tainted canvas
            }
        };
        img.onerror = () => reject(new Error(`onerror: ${url}`));
        img.src = url;
    });
