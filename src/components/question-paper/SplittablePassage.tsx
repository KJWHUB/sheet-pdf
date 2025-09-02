import { useState, useEffect, useRef } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { splitTextForTwoColumns, splitText } from '@/utils/textSplitter';
import { type PassagePart } from '@/utils/passageUtils';
import type { Passage as PassageType } from '@/types/question';

interface SplittablePassageProps {
  passage: PassageType;
  groupId: string;
  maxHeight?: number;
  isInColumn?: boolean;
  onHeightChange?: (height: number) => void;
  /**
   * If true (default), the passage will not be visually clipped even if it exceeds the suggested maxHeight.
   * Set to false to keep legacy clamped behavior using maxHeight and overflow hidden.
   */
  allowOverflow?: boolean;
}

export function SplittablePassage({ 
  passage, 
  groupId, 
  maxHeight = 400,
  isInColumn = false,
  onHeightChange,
  allowOverflow = true,
}: SplittablePassageProps) {
  const { editMode, selectQuestion, layoutSettings } = useQuestionStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [passageParts, setPassageParts] = useState<PassagePart[]>([]);
  const [actualHeight, setActualHeight] = useState(0);

  const isSelected = editMode.selectedGroupId === groupId && !editMode.selectedQuestionId;

  // 텍스트 분할 로직
  useEffect(() => {
    if (!passage.content) {
      setPassageParts([{ content: '', isPartial: false }]);
      return;
    }

    // allowOverflow가 true면 클램핑/분할을 하지 않고 전체를 그대로 렌더링
    if (allowOverflow) {
      const textContent = passage.content.replace(/<[^>]*>/g, '');
      setPassageParts([{ content: textContent, isPartial: false }]);
      return;
    }

    const textContent = passage.content.replace(/<[^>]*>/g, '');
    
    // 2분할 모드일 때와 아닐 때 다른 처리
    if (layoutSettings.layout === 'double' && isInColumn) {
      // 2분할 모드에서는 칼럼 단위로 분할
      const columnResult = splitTextForTwoColumns(textContent, maxHeight * 0.8, 14, 1.6);
      
      if (columnResult.hasOverflow) {
        // 오버플로우가 있으면 여러 부분으로 분할
        const splitResult = splitText(textContent, { 
          maxLength: Math.floor(textContent.length / 2),
          splitOnParagraph: true 
        });
        
        const parts: PassagePart[] = splitResult.parts.map((part, index) => ({
          content: part,
          isPartial: splitResult.parts.length > 1,
          partNumber: index + 1,
          totalParts: splitResult.parts.length
        }));
        
        setPassageParts(parts);
      } else {
        setPassageParts([{ content: textContent, isPartial: false }]);
      }
    } else {
      // 1분할 모드에서는 높이 기준으로 분할
      const estimatedLines = Math.floor(maxHeight / 20); // 대략 20px per line
      const maxChars = estimatedLines * 50; // 대략 50chars per line
      
      if (textContent.length > maxChars) {
        const splitResult = splitText(textContent, { 
          maxLength: maxChars,
          splitOnParagraph: true 
        });
        
        const parts: PassagePart[] = splitResult.parts.map((part, index) => ({
          content: part,
          isPartial: splitResult.parts.length > 1,
          partNumber: index + 1,
          totalParts: splitResult.parts.length
        }));
        
        setPassageParts(parts);
      } else {
        setPassageParts([{ content: textContent, isPartial: false }]);
      }
    }
  }, [passage.content, maxHeight, layoutSettings.layout, isInColumn, allowOverflow]);

  // 실제 높이 측정
  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight;
      setActualHeight(height);
      onHeightChange?.(height);
    }
  }, [passageParts, onHeightChange]);

  const handleClick = () => {
    if (editMode.isEditing) {
      selectQuestion(groupId);
    }
  };

  // 첫 번째 부분만 렌더링 (나머지는 상위에서 처리)
  const currentPart = passageParts[0] || { content: '', isPartial: false };

  return (
    <div 
      ref={containerRef}
      className={`
        passage-container relative
        ${isSelected ? 'ring-2 ring-blue-500 rounded-md p-2 -m-2' : ''}
      `}
      style={allowOverflow ? undefined : { maxHeight: `${maxHeight}px` }}
    >
      {passage.title && (
        <h3 className="font-medium mb-3 text-gray-900">
          {passage.title}
          {currentPart.isPartial && (
            <span className="text-xs text-blue-600 ml-2">
              ({currentPart.partNumber}/{currentPart.totalParts})
            </span>
          )}
        </h3>
      )}
      
      <div 
        className={`passage-content border border-gray-300 rounded-sm p-3 bg-gray-50/30 ${allowOverflow ? '' : 'overflow-hidden'}`}
        onClick={handleClick}
        style={allowOverflow ? undefined : { maxHeight: `${maxHeight - 60}px` }} // 제목 영역 제외
      >
        <div className="text-sm leading-relaxed text-gray-900 whitespace-pre-line">
          {currentPart.content || '지문을 입력하세요...'}
        </div>
        
        {currentPart.isPartial && (
          <div className="text-xs text-blue-500 mt-2 text-right">
            계속 →
          </div>
        )}
      </div>

      {/* 디버깅 정보 (개발 모드) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-yellow-100 text-xs p-1 rounded">
          H:{actualHeight}px | Parts:{passageParts.length}
        </div>
      )}
    </div>
  );
}
