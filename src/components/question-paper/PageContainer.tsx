import { type ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  pageNumber: number;
  totalPages?: number;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ pageNumber, totalPages, children, className }: PageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn(
        "page-container relative bg-white shadow-lg border border-gray-200 mx-auto mb-6",
        "print:shadow-none print:border-0 print:mb-0",
        "overflow-hidden", // 페이지 경계 엄격 적용
        className
      )}
      style={{
        width: '210mm', // A4 너비 고정 (mm 단위 사용)
        height: '297mm', // A4 높이 고정 (mm 단위 사용)
        padding: '20mm', // 여백 고정
        boxSizing: 'border-box',
      }}
      data-element-id={`page-${pageNumber}`}
      data-page-number={pageNumber}
      data-total-pages={totalPages}
    >
      {/* 페이지 번호 표시 */}
      <div className="print:hidden absolute top-2 right-4 text-xs text-gray-400">페이지 {pageNumber}</div>
      {typeof totalPages === 'number' && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 print:text-gray-600">
          {pageNumber}/{totalPages}
        </div>
      )}
      
      {/* 페이지 내용 */}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
}
