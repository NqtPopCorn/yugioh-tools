"use client";

export default function ActionButtons({ urlList, setUrlList }) {
    const addCard = async (count) => {
        const urlInput = document.getElementById("img-url");
        const url = urlInput?.value.trim();

        if (url) {
            const checkRenderable = async (url) => {
                if (url.startsWith("data:image/")) return true;
                try {
                    const res = await fetch(url, { method: "HEAD" });
                    return res.ok;
                } catch (error) {
                    return false;
                }
            };

            if (!(await checkRenderable(url))) {
                const warningElement =
                    document.getElementById("warning-message");
                if (warningElement) {
                    warningElement.textContent = "Ảnh không thể render!";
                }
                return;
            }

            const newUrls = Array(count).fill(url);
            setUrlList((prev) => [...prev, ...newUrls]);
            urlInput.value = "";

            // Clear warning message
            const warningElement = document.getElementById("warning-message");
            if (warningElement) {
                warningElement.textContent = "";
            }
        } else {
            alert("Vui lòng nhập URL ảnh hợp lệ.");
        }
    };

    const handleSaveLocal = () => {
        try {
            localStorage.setItem("yugiohCardUrls", JSON.stringify(urlList));
            alert("Đã lưu thành công vào Local Storage!");
        } catch (error) {
            alert(
                "Không thể lưu local nhiều 'ảnh được dán trực tiếp', hãy thử bằng đường dẫn hoặc xuất PDF để lưu lại các thẻ của bạn."
            );
        }
    };

    const clearCards = () => {
        if (confirm("Bạn có chắc chắn muốn xóa tất cả các thẻ không?")) {
            setUrlList([]);
        }
    };

    return (
        <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-2">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={() => addCard(1)}
                >
                    Thêm x1
                </button>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={() => addCard(3)}
                >
                    Thêm x3
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    onClick={handleSaveLocal}
                >
                    <i className="fa-solid fa-floppy-disk mr-2"></i>
                    Lưu local
                </button>
                <button
                    onClick={clearCards}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    <i className="fa-solid fa-trash mr-2"></i>
                    Xóa tất cả
                </button>
            </div>
        </div>
    );
}
