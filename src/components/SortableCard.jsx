import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ZoomIn } from "lucide-react"; // Cài lucide-react hoặc dùng icon fontawesome

export default function SortableCard({
  url,
  index,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onPreview,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundImage: `url(${url})`,
    zIndex: isDragging ? 99 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card relative aspect-[59/86] bg-cover bg-center bg-no-repeat border border-gray-300 rounded hover:shadow-lg transition-shadow group"
      // XÓA touch-none ở đây để cho phép scroll
      // Giữ lại các sự kiện context menu cũ trên thẻ chính
      onContextMenu={(e) => onContextMenu(e, index)}
      onTouchStart={(e) => onTouchStart(e, index)}
      onTouchEnd={onTouchEnd}
    >
      {/* --- Drag Handle --- */}
      {/* Chỉ hiện khi hover hoặc luôn hiện trên mobile (tùy chỉnh CSS) */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-white/80 p-1 rounded-full cursor-grab active:cursor-grabbing hover:bg-white z-10 touch-none"
        // Ngăn chặn sự kiện chạm lan ra ngoài (để không kích hoạt context menu khi đang kéo)
        onContextMenu={(e) => e.stopPropagation()}
      >
        {/* Icon tay cầm (dùng Lucide hoặc FontAwesome) */}
        <GripVertical size={16} className="text-gray-600" />
      </div>
      {/* ------------------- */}

      {/* --- Preview Button (zoom icon, hiện khi hover) --- */}
      {onPreview && (
        <button
          className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onPreview(index); }}
          onContextMenu={(e) => e.stopPropagation()}
          title="Xem toàn màn hình"
        >
          <ZoomIn size={16} className="text-gray-700" />
        </button>
      )}
    </div>
  );
}

