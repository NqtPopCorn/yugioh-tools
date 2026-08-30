"use client";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import TutorialModal from "./TutorialModal";

export default function HelpTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150 cursor-pointer border border-gray-200 hover:border-indigo-200 shadow-2xs flex items-center gap-1"
        title="Xem hướng dẫn sử dụng"
      >
        <HelpCircle size={18} />
        <span className="hidden sm:inline text-xs font-medium">Hướng dẫn</span>
      </button>

      <TutorialModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
