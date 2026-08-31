"use client";
import { useState, useEffect } from "react";
import { useHistoryState } from "@/hooks/useHistoryState";
import { Undo2, Redo2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MainContent from "@/components/MainContent";
import RightSidebar from "@/components/RightSidebar";

export default function App() {
  const {
    state: urlList,
    setState: setUrlList,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
  } = useHistoryState(() => {
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
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-save urlList to localStorage whenever it changes
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

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do NOT intercept if typing inside an input, textarea, or contenteditable
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        activeEl?.isContentEditable
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl + Shift + Z -> Redo
          redo();
        } else {
          // Ctrl + Z -> Undo
          undo();
        }
      } else if (e.key === "y" || e.key === "Y") {
        // Ctrl + Y -> Redo
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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
  }, [setUrlList]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
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
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Sidebar Phải - Tìm kiếm */}
      <RightSidebar
        setUrlList={setUrlList}
        isOpen={isRightSidebarOpen}
        setIsOpen={setIsRightSidebarOpen}
      />

      {/* Toast Notification cho Undo / Redo */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] bg-gray-900/90 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-xl backdrop-blur-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-gray-700/50">
          {toastMessage.icon === "undo" ? (
            <Undo2 size={16} className="text-indigo-400" />
          ) : (
            <Redo2 size={16} className="text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

