"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RightSidebar from "@/components/RightSidebar";

export default function App() {
  const [urlList, setUrlList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [cardDimensions, setCardDimensions] = useState(() => {
    try {
      const saved = localStorage.getItem("yugiohCardDimensions");
      return saved ? JSON.parse(saved) : { width: 59, height: 86 };
    } catch {
      return { width: 59, height: 86 };
    }
  });
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Load saved URLs from localStorage on component mount
  useEffect(() => {
    try {
      const savedUrls = localStorage.getItem("yugiohCardUrls");
      if (savedUrls) setUrlList(JSON.parse(savedUrls));
    } catch { /* ignore parse errors */ }
  }, []);

  // Auto-save urlList to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("yugiohCardUrls", JSON.stringify(urlList));
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
