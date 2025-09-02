import { useState, useEffect } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Maximize, Minimize } from 'lucide-react';

interface ElementInfo {
  id: string;
  type: 'page' | 'group' | 'passage';
  height: number;
  maxHeight?: number;
  isOverflowing: boolean;
  column?: 'left' | 'right';
}

export function DebugPanel() {
  const { questionPaper, layoutSettings, editMode } = useQuestionStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [elements, setElements] = useState<ElementInfo[]>([]);
  const [showBorders, setShowBorders] = useState(false);

  // 실시간 높이 측정
  useEffect(() => {
    if (!isVisible || !questionPaper) return;

    const measureElements = () => {
      const elementInfos: ElementInfo[] = [];

      // 페이지 컨테이너들 측정
      const pageContainers = document.querySelectorAll('.page-container');
      pageContainers.forEach((container, index) => {
        const rect = container.getBoundingClientRect();
        elementInfos.push({
          id: `page-${index + 1}`,
          type: 'page',
          height: rect.height,
          maxHeight: 297 * 3.78, // A4 높이 in px
          isOverflowing: rect.height > 297 * 3.78,
        });
      });

      // 문제 그룹들 측정
      const questionGroups = document.querySelectorAll('[data-group-id]');
      questionGroups.forEach((group) => {
        const groupId = group.getAttribute('data-group-id');
        if (!groupId) return;

        const rect = group.getBoundingClientRect();
        const isInLeftColumn = group.closest('.left-column') !== null;
        const isInRightColumn = group.closest('.right-column') !== null;

        elementInfos.push({
          id: groupId,
          type: 'group',
          height: rect.height,
          isOverflowing: rect.height > 400, // 임시 임계값
          column: isInLeftColumn ? 'left' : isInRightColumn ? 'right' : undefined,
        });
      });

      // 지문들 측정
      const passages = document.querySelectorAll('.passage-container');
      passages.forEach((passage, index) => {
        const rect = passage.getBoundingClientRect();
        elementInfos.push({
          id: `passage-${index}`,
          type: 'passage',
          height: rect.height,
          maxHeight: 300,
          isOverflowing: rect.height > 300,
        });
      });

      setElements(elementInfos);
    };

    measureElements();

    // 주기적으로 업데이트
    const interval = setInterval(measureElements, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible, questionPaper]);

  // 시각적 경계선 표시/숨김
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'debug-borders';
    
    if (showBorders) {
      style.textContent = `
        .page-container {
          outline: 2px solid red !important;
          outline-offset: -2px;
        }
        .page-container::before {
          content: 'PAGE';
          position: absolute;
          top: 2px;
          left: 2px;
          background: red;
          color: white;
          font-size: 10px;
          padding: 2px;
          z-index: 1000;
        }
        [data-group-id] {
          outline: 1px solid blue !important;
          outline-offset: -1px;
        }
        .left-column {
          background: rgba(255, 0, 0, 0.1) !important;
        }
        .right-column {
          background: rgba(0, 0, 255, 0.1) !important;
        }
        .passage-container {
          outline: 1px solid green !important;
          outline-offset: -1px;
        }
      `;
    } else {
      style.textContent = '';
    }

    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('debug-borders');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [showBorders]);

  // 개발 모드가 아니면 렌더링하지 않음
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* 토글 버튼 */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        variant={isVisible ? "default" : "outline"}
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        Debug
      </Button>

      {/* 디버그 패널 */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-40">
          <Card className="w-80 max-h-96 overflow-auto">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-medium text-sm">디버그 패널</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowBorders(!showBorders)}
                  size="sm"
                  variant={showBorders ? "default" : "outline"}
                  className="text-xs"
                >
                  경계선
                </Button>
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  size="sm"
                  variant="ghost"
                >
                  {isExpanded ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            <div className="p-3">
              {/* 레이아웃 정보 */}
              <div className="mb-3">
                <div className="text-xs font-medium mb-1">레이아웃 설정</div>
                <div className="text-xs text-gray-600">
                  모드: {layoutSettings.layout === 'double' ? '2분할' : '1분할'}
                </div>
                <div className="text-xs text-gray-600">
                  편집: {editMode.isEditing ? '켜짐' : '꺼짐'}
                </div>
              </div>

              {/* 요소 정보 */}
              {isExpanded && (
                <div>
                  <div className="text-xs font-medium mb-2">요소 정보</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {elements.map((element) => (
                      <div
                        key={element.id}
                        className={`text-xs p-2 rounded border ${
                          element.isOverflowing ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {element.type.toUpperCase()} {element.id}
                            {element.column && (
                              <span className={`ml-1 px-1 rounded text-[10px] ${
                                element.column === 'left' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {element.column}
                              </span>
                            )}
                          </span>
                          {element.isOverflowing && (
                            <span className="text-red-500">⚠</span>
                          )}
                        </div>
                        <div className="text-gray-600">
                          높이: {Math.round(element.height)}px
                          {element.maxHeight && (
                            <span className="text-gray-400">
                              / {element.maxHeight}px
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 간단한 통계 */}
              <div className="mt-3 pt-2 border-t">
                <div className="text-xs text-gray-600">
                  총 요소: {elements.length}개 | 
                  오버플로우: {elements.filter(e => e.isOverflowing).length}개
                </div>
                {layoutSettings.layout === 'double' && (
                  <div className="text-xs text-gray-600">
                    좌측: {elements.filter(e => e.column === 'left').length}개 | 
                    우측: {elements.filter(e => e.column === 'right').length}개
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}