"use client";

import { useRef, useState } from "react";

export default function ImageForm({ urlList, setUrlList }) {
    const [imageUrl, setImageUrl] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const imageUploadRef = useRef(new Image());

    const checkRenderable = async (url) => {
        if (url.startsWith("data:image/")) {
            return true;
        }
        try {
            const res = await fetch(url, { method: "HEAD" });
            return res.ok;
        } catch (error) {
            console.error("Image fetch error:", error);
            return false;
        }
    };

    const addCard = async (num) => {
        const url = imageUrl.trim();
        if (url) {
            if (!(await checkRenderable(url))) {
                setWarningMessage("Ảnh không thể render!");
                return;
            }
            setWarningMessage("");

            const newUrls = Array(num).fill(url);
            setUrlList((prev) => [...prev, ...newUrls]);

            // Scroll to the last added card
            setTimeout(() => {
                const cards = document.querySelectorAll(".card");
                if (cards.length > 0) {
                    cards[cards.length - 1].scrollIntoView({
                        behavior: "smooth",
                    });
                }
            }, 100);
        } else {
            alert("Vui lòng nhập URL ảnh hợp lệ.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addCard(1);
    };

    const handleChangeFileInput = (e) => {
        const file = e.target.files[0];
        console.log(file);
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => {
                setUrlList((prev) => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex items-baseline justify-between mb-4">
            <form id="image-form" onSubmit={handleSubmit} className="block">
                <input
                    className="p-2 border border-gray-300 rounded max-w-50"
                    type="text"
                    id="img-url"
                    placeholder="Dán URL ảnh ở đây..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                />
                {warningMessage && (
                    <span
                        className="text-red-500 text-sm italic mb-4 block"
                        id="warning-message"
                    >
                        {warningMessage}
                    </span>
                )}
                <input type="submit" hidden />
            </form>
            <button className="block">
                <label className="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded">
                    Import
                    <input
                        type="file"
                        accept=".jpg, .jpeg, .png"
                        multiple
                        hidden
                        onChange={(e) => handleChangeFileInput(e)}
                    />
                </label>
            </button>
        </div>
    );
}
