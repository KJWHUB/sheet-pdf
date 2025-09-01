import { ReactNode, useRef, useEffect } from 'react';
import { usePageCalculation } from '@/hooks/usePageCalculation';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  pageNumber: number;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ pageNumber, children, className }: PageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { PAGE_CONFIG, observeElement, unobserveElement } = usePageCalculation();

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      observeElement(element, `page-${pageNumber}`);
      
      return () => {
        unobserveElement(element);
      };
    }
  }, [pageNumber, observeElement, unobserveElement]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "page-container bg-white shadow-lg border border-gray-200 mx-auto mb-6",
        "print:shadow-none print:border-0 print:mb-0",
        className
      )}
      style={{
        width: `${PAGE_CONFIG.A4_WIDTH_PX}px`,
        minHeight: `${PAGE_CONFIG.A4_HEIGHT_PX}px`,
        padding: `${PAGE_CONFIG.MARGIN_PX}px`,
      }}
      data-element-id={`page-${pageNumber}`}
      data-page-number={pageNumber}
    >
      {/* 페이지 번호 표시 */}
      <div className="print:hidden absolute top-2 right-4 text-xs text-gray-400">
        페이지 {pageNumber}
      </div>
      
      {/* 페이지 내용 */}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
}