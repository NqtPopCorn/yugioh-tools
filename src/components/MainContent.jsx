// src/components/MainContent.jsx
"use client";
import { useEffect, useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor,
    MouseSensor,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";

import ContextMenu from "./ContextMenu";
import SortableCard from "./SortableCard";

export default function MainContent({
    urlList,
    setUrlList,
    selectedIndex,
    setSelectedIndex,
}) {
    // Cấu hình cảm biến để nhận diện thao tác kéo (chuột + cảm ứng)
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }), // Di chuyển chuột 10px mới tính là kéo (tránh click nhầm)
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 }, // Giữ 250ms để kéo trên mobile
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Xử lý khi thả bài ra
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setUrlList((items) => {
                const oldIndex = active.id;
                const newIndex = over.id;
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Logic Context Menu (Chuột phải) chuyển từ DOM listener sang React Handler
    const handleContextMenu = (e, index) => {
        e.preventDefault();
        setSelectedIndex(index);
        const contextMenu = document.getElementById("context-menu");
        if (contextMenu) {
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.classList.remove("hidden");
        }
    };

    // Logic Mobile Long Press (như code cũ)
    const [pressTimer, setPressTimer] = useState(null);

    const handleTouchStart = (e, index) => {
        if (e.touches.length === 1) {
            const timer = setTimeout(() => {
                setSelectedIndex(index);
                const touch = e.touches[0];
                const contextMenu = document.getElementById("context-menu");
                if (contextMenu) {
                    contextMenu.style.left = `${touch.pageX}px`;
                    contextMenu.style.top = `${touch.pageY}px`;
                    contextMenu.classList.remove("hidden");
                }
            }, 800);
            setPressTimer(timer);
        }
    };

    const handleTouchEnd = () => {
        if (pressTimer) clearTimeout(pressTimer);
    };

    // Ẩn menu khi click ra ngoài
    useEffect(() => {
        const handleClick = () => {
            const contextMenu = document.getElementById("context-menu");
            if (contextMenu) contextMenu.classList.add("hidden");
        };
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    return (
        <div className="flex-1 md:mt-0 p-6 md:ml-80 select-none">
            {/* select-none để tránh bôi đen text khi kéo */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* rectSortingStrategy là thuật toán dành riêng cho dạng lưới (Grid) */}
                <SortableContext
                    items={urlList.map((_, i) => i)}
                    strategy={rectSortingStrategy}
                >
                    <div
                        id="card-container"
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    >
                        {urlList.map((url, index) => (
                            <SortableCard
                                key={`${index}-${url}`} // Key kết hợp để React render đúng
                                index={index}
                                url={url}
                                onContextMenu={handleContextMenu}
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <ContextMenu
                urlList={urlList}
                setUrlList={setUrlList}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
            />
        </div>
    );
}
