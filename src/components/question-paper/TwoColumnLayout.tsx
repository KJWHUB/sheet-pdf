import { type ReactNode, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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