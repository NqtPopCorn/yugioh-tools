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
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [cardDimensions, setCardDimensions] = useState(() => {
    try {
      const saved = localStorage.getItem("yugiohCardDimensions");
      return saved ? JSON.parse(saved) : { width: 62, height: 90 };
    } catch {
      return { width: 62, height: 90 };
    }
  });
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
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = () => {
            setUrlList((prev) => [...prev, reader.result]);
          };
          reader.readAsDataURL(file);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar
        urlList={urlList}
        setUrlList={setUrlList}
        cardDimensions={cardDimensions}
        setCardDimensions={setCardDimensions}
      />
      <MainContent
        urlList={urlList}
        setUrlList={setUrlList}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
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
