import { type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { QuestionGroup as QuestionGroupType } from '@/types/question';

interface TwoColumnLayoutProps {
  children: ReactNode;
  className?: string;
}

export function TwoColumnLayout({ children, className }: TwoColumnLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 컨텐츠를 두 칼럼으로 자동 분할
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // CSS columns를 사용한 자동 칼럼 분할
    container.style.columnCount = '2';
    container.style.columnGap = '20mm';
    container.style.columnFill = 'auto';
    container.style.columnRuleWidth = '1px';
    container.style.columnRuleStyle = 'solid';
    container.style.columnRuleColor = '#e5e7eb'; // gray-200
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "two-column-layout",
        "h-full relative",
        className
      )}
      style={{
        // CSS columns 기본 설정
        columnCount: 2,
        columnGap: '20mm',
        columnFill: 'auto',
        // 중간 분할선
        columnRule: '1px solid #e5e7eb',
      }}
    >
      {children}
    </div>
  );
}

interface ColumnBreakProps {
  children: ReactNode;
  breakBefore?: boolean;
  breakAfter?: boolean;
  breakInside?: 'auto' | 'avoid';
}

export function ColumnBreak({ 
  children, 
  breakBefore = false, 
  breakAfter = false,
  breakInside = 'auto'
}: ColumnBreakProps) {
  return (
    <div
      style={{
        breakBefore: breakBefore ? 'column' : 'auto',
        breakAfter: breakAfter ? 'column' : 'auto',
        breakInside: breakInside,
      }}
      className="column-break-container"
    >
      {children}
    </div>
  );
}

interface ManualTwoColumnLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  className?: string;
}

interface SmartTwoColumnLayoutProps {
  questionGroups: QuestionGroupType[];
  children: (group: QuestionGroupType, index: number) => ReactNode;
  maxHeight?: number;
  className?: string;
}

/**
 * 문제 그룹들을 스마트하게 좌/우 칼럼으로 분배하는 레이아웃
 */
export function SmartTwoColumnLayout({ 
  questionGroups, 
  children, 
  maxHeight = 1000, // A4 페이지 높이 (대략)
  className 
}: SmartTwoColumnLayoutProps) {
  const [leftGroups, setLeftGroups] = useState<QuestionGroupType[]>([]);
  const [rightGroups, setRightGroups] = useState<QuestionGroupType[]>([]);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // 문제 그룹의 예상 높이 계산
  const estimateGroupHeight = useCallback((group: QuestionGroupType): number => {
    let height = 50; // 기본 여백
    
    if (group.passage) {
      // 지문 높이 추정 (글자 수 기반)
      const textLength = group.passage.content?.length || 0;
      height += Math.ceil(textLength / 60) * 20; // 대략 한 줄당 60자, 줄 높이 20px
    }
    
    // 문제 수만큼 높이 추가
    height += group.subQuestions.length * 80; // 문제당 평균 80px
    
    return Math.min(height, maxHeight * 0.8); // 최대 페이지의 80%
  }, [maxHeight]);

  // 문제 그룹들을 좌/우 칼럼으로 분배
  useEffect(() => {
    if (!questionGroups.length) return;

    const left: QuestionGroupType[] = [];
    const right: QuestionGroupType[] = [];
    
    let leftHeight = 0;
    let rightHeight = 0;
    
    // 각 문제 그룹의 예상 높이를 계산하고 더 적은 쪽에 배치
    questionGroups.forEach((group) => {
      const estimatedHeight = estimateGroupHeight(group);
      
      if (leftHeight <= rightHeight) {
        left.push(group);
        leftHeight += estimatedHeight;
      } else {
        right.push(group);
        rightHeight += estimatedHeight;
      }
    });
    
    setLeftGroups(left);
    setRightGroups(right);
  }, [questionGroups, estimateGroupHeight]);

  return (
    <div 
      className={cn(
        "smart-two-column-layout",
        "grid grid-cols-2 h-full",
        className
      )}
      style={{
        gridTemplateColumns: '1fr 1fr',
        gap: '20mm',
        maxHeight: `${maxHeight}px`,
      }}
    >
      {/* 좌측 칼럼 */}
      <div 
        ref={leftColumnRef}
        className="left-column overflow-hidden"
        style={{
          borderRight: '1px solid #e5e7eb',
          paddingRight: '10mm',
          maxHeight: `${maxHeight}px`,
        }}
      >
        <div className="space-y-6">
          {leftGroups.map((group) => (
            <div 
              key={group.id}
              data-group-id={group.id}
              className="break-inside-avoid"
            >
              {children(group, questionGroups.indexOf(group))}
            </div>
          ))}
        </div>
      </div>
      
      {/* 우측 칼럼 */}
      <div 
        ref={rightColumnRef}
        className="right-column overflow-hidden"
        style={{
          paddingLeft: '10mm',
          maxHeight: `${maxHeight}px`,
        }}
      >
        <div className="space-y-6">
          {rightGroups.map((group) => (
            <div 
              key={group.id}
              data-group-id={group.id}
              className="break-inside-avoid"
            >
              {children(group, questionGroups.indexOf(group))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 수동으로 좌/우 칼럼을 명시적으로 분할하는 레이아웃
 */
export function ManualTwoColumnLayout({ 
  leftColumn, 
  rightColumn, 
  className 
}: ManualTwoColumnLayoutProps) {
  return (
    <div 
      className={cn(
        "manual-two-column-layout",
        "grid grid-cols-2 gap-6 h-full",
        className
      )}
      style={{
        gridTemplateColumns: '1fr 1fr',
        columnGap: '20mm',
      }}
    >
      {/* 좌측 칼럼 */}
      <div 
        className="left-column overflow-hidden"
        style={{
          borderRight: '1px solid #e5e7eb',
          paddingRight: '10mm',
        }}
      >
        {leftColumn}
      </div>
      
      {/* 우측 칼럼 */}
      <div 
        className="right-column overflow-hidden"
        style={{
          paddingLeft: '10mm',
        }}
      >
        {rightColumn}
      </div>
    </div>
  );
}