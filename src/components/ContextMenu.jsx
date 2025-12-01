"use client";

export default function ContextMenu({
    urlList,
    setUrlList,
    selectedIndex,
    setSelectedIndex,
}) {
    const handleDuplicate = () => {
        if (selectedIndex !== null) {
            const duplicatedUrl = urlList[selectedIndex];
            setUrlList((prev) => [...prev, duplicatedUrl]);
            setSelectedIndex(null);
        }
        const contextMenu = document.getElementById("context-menu");
        if (contextMenu) {
            contextMenu.classList.add("hidden");
        }
    };

    const handleDelete = () => {
        if (selectedIndex !== null) {
            setUrlList((prev) =>
                prev.filter((_, index) => index !== selectedIndex)
            );
            setSelectedIndex(null);
        }
        const contextMenu = document.getElementById("context-menu");
        if (contextMenu) {
            contextMenu.classList.add("hidden");
        }
    };

    return (
        <div
            id="context-menu"
            className="hidden absolute z-50 w-40 bg-white border border-gray-300 rounded shadow-lg"
        >
            <button
                onClick={handleDuplicate}
                className="w-full text-left px-3 py-2 hover:bg-gray-100"
            >
                <i className="fa-solid fa-clone mr-2"></i>
                Nhân bản
            </button>
            <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
            >
                <i className="fa-solid fa-trash mr-2"></i>
                Xóa
            </button>
        </div>
    );
}
