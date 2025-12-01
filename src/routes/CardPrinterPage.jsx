"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RightSidebar from "@/components/RightSidebar";
import { ListIndentDecrease, ListIndentIncrease } from "lucide-react";

export default function App() {
  const [urlList, setUrlList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [cardDimensions, setCardDimensions] = useState({
    width: 59,
    height: 86,
  });
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Load saved URLs from localStorage on component mount
  useEffect(() => {
    const savedUrls = localStorage.getItem("yugiohCardUrls");
    if (savedUrls) {
      const parsedUrls = JSON.parse(savedUrls);
      setUrlList(parsedUrls);
    }
  }, []);

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
