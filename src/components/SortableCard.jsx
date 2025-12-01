// src/components/SortableCard.jsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableCard({
    url,
    index,
    onContextMenu,
    onTouchStart,
    onTouchEnd,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: index }); // Dùng index làm ID vì URL có thể trùng nhau

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundImage: `url(${url})`,
        zIndex: isDragging ? 99 : "auto", // Khi kéo thì bài nổi lên trên
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="card aspect-[59/86] bg-cover bg-center bg-no-repeat border border-gray-300 rounded cursor-grab hover:shadow-lg transition-shadow touch-none"
            // Gắn lại các sự kiện chuột phải/cảm ứng từ code cũ
            onContextMenu={(e) => onContextMenu(e, index)}
            onTouchStart={(e) => onTouchStart(e, index)}
            onTouchEnd={onTouchEnd}
        ></div>
    );
}
