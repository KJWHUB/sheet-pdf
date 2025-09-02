import { useState, useRef, useCallback, type ReactNode } from 'react';
import { useQuestionStore } from '@/stores/questionStore';

interface ResizableContainerProps {
  id: string;
  children: ReactNode;
  initialHeight: number | 'auto';
  minHeight?: number;
  maxHeight?: number;
  onResize?: (height: number) => void;
  disabled?: boolean;
}

export function ResizableContainer({
  id,
  children,
  initialHeight,
  minHeight = 100,
  maxHeight = 2000,
  onResize,
  disabled = false,
}: ResizableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentHeight, setCurrentHeight] = useState<number | 'auto'>(initialHeight);
  
  const {
    startResize,
    updateResize,
    endResize,
    resizeState,
  } = useQuestionStore();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = containerRef.current?.offsetHeight || minHeight;
    
    startResize(id, startHeight);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
      
      setCurrentHeight(newHeight);
      updateResize(newHeight);
      onResize?.(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      endResize();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, id, minHeight, maxHeight, startResize, updateResize, endResize, onResize]);

  const containerStyle = {
    height: currentHeight === 'auto' ? 'auto' : `${currentHeight}px`,
    minHeight: `${minHeight}px`,
    maxHeight: `${maxHeight}px`,
  };

  return (
    <div 
      ref={containerRef}
      className={`
        relative
        ${isResizing ? 'select-none' : ''}
        ${disabled ? '' : 'resize-container'}
      `}
      style={containerStyle}
    >
      {children}
      
      {/* Resize Handle */}
      {!disabled && (
        <div
          className={`
            absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize
            bg-transparent hover:bg-blue-200/50 transition-colors
            flex items-center justify-center
            ${isResizing ? 'bg-blue-300/50' : ''}
          `}
          onMouseDown={handleMouseDown}
        >
          <div className={`
            w-12 h-1 bg-gray-400 rounded-full opacity-0 hover:opacity-100 transition-opacity
            ${isResizing ? 'opacity-100 bg-blue-500' : ''}
          `} />
        </div>
      )}
      
      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          {Math.round(resizeState.currentHeight)}px
        </div>
      )}

      {/* Visual feedback during resize */}
      {isResizing && (
        <div className="absolute inset-0 bg-blue-100/20 border-2 border-blue-300 border-dashed rounded pointer-events-none" />
      )}
    </div>
  );
}