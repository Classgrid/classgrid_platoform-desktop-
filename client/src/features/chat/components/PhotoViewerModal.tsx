import { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface PhotoViewerModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function PhotoViewerModal({ src, alt = "Photo", onClose }: PhotoViewerModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Scroll to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  };

  // Pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top bar — transparent, just the X button */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <div /> {/* spacer */}
        <Button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-200 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Image container — completely centered */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-150"
          
        />
      </div>

      {/* Bottom zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
        <Button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-white text-xs font-bold min-w-[3ch] text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button
          onClick={() => setScale((s) => Math.min(5, s + 0.25))}
          className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-white/20" />
        <Button
          onClick={resetView}
          className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
