"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RightSidebar from "@/components/RightSidebar";

export default function App() {
  const [urlList, setUrlList] = useState(() => {
    try {
      const saved = localStorage.getItem("yugiohCardUrls");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cardDimensions, setCardDimensions] = useState(() => {
    try {
      const saved = localStorage.getItem("yugiohCardDimensions");
      return saved ? JSON.parse(saved) : { width: 62, height: 90 };
    } catch {
      return { width: 62, height: 90 };
    }
  });
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);


  // Auto-save urlList to localStorage whenever it changes
  // Chỉ lưu HTTP/HTTPS URLs, bỏ qua base64 (data:image/) để tránh tràn quota
  useEffect(() => {
    try {
      const saveable = urlList.filter((url) => !url.startsWith("data:"));
      localStorage.setItem("yugiohCardUrls", JSON.stringify(saveable));
    } catch {
      // ignore quota errors
    }
  }, [urlList]);

  // Auto-save cardDimensions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("yugiohCardDimensions", JSON.stringify(cardDimensions));
  }, [cardDimensions]);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e) => {
      // Bỏ qua khi đang focus vào ô input / textarea / contenteditable
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || activeEl?.isContentEditable) {
        return;
      }

      const items = e.clipboardData?.items || [];
      let handledImage = false;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                setUrlList((prev) => [...prev, reader.result]);
              }
            };
            reader.readAsDataURL(file);
            handledImage = true;
          }
        }
      }

      // Nếu không có image blob từ clipboard, kiểm tra text có phải base64 (data:image/)
      if (!handledImage && e.clipboardData) {
        const text = e.clipboardData.getData("text/plain")?.trim();
        if (text && text.startsWith("data:image/")) {
          e.preventDefault();
          const lines = text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.startsWith("data:image/"));
          if (lines.length > 0) {
            setUrlList((prev) => [...prev, ...lines]);
          } else {
            setUrlList((prev) => [...prev, text]);
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        urlList={urlList}
        setUrlList={setUrlList}
        isOpen={isLeftSidebarOpen}
        setIsOpen={setIsLeftSidebarOpen}
      />
      <MainContent
        urlList={urlList}
        setUrlList={setUrlList}
        cardDimensions={cardDimensions}
        setCardDimensions={setCardDimensions}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        isLeftSidebarOpen={isLeftSidebarOpen}
      />

      {/* Sidebar Phải - Tìm kiếm */}
      <RightSidebar
        setUrlList={setUrlList}
        isOpen={isRightSidebarOpen}
        setIsOpen={setIsRightSidebarOpen}
      />
    </div>
  );
}
