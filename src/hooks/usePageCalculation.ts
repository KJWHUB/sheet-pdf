import { useCallback, useRef, useEffect } from 'react';
import { useQuestionStore } from '@/stores/questionStore';

// A4 페이지 크기 (96 DPI 기준)
export const PAGE_CONFIG = {
  A4_WIDTH_MM: 210,
  A4_HEIGHT_MM: 297,
  DPI: 96,
  MM_TO_PX: 96 / 25.4, // 1mm = 3.78px at 96 DPI
  get A4_WIDTH_PX() {
    return this.A4_WIDTH_MM * this.MM_TO_PX;
  },
  get A4_HEIGHT_PX() {
    return this.A4_HEIGHT_MM * this.MM_TO_PX;
  },
  MARGIN_MM: 20,
  get MARGIN_PX() {
    return this.MARGIN_MM * this.MM_TO_PX;
  },
  get CONTENT_HEIGHT_PX() {
    return this.A4_HEIGHT_PX - (this.MARGIN_PX * 2);
  },
  get CONTENT_WIDTH_PX() {
    return this.A4_WIDTH_PX - (this.MARGIN_PX * 2);
  }
};

interface PageCalculationResult {
  currentPage: number;
  totalPages: number;
  remainingHeight: number;
  shouldBreak: boolean;
}

interface MeasuredElement {
  id: string;
  height: number;
  page: number;
  y: number;
}

export function usePageCalculation() {
  const { layoutSettings, questionPaper, recalculatePages } = useQuestionStore();
  const measuredElements = useRef<Map<string, MeasuredElement>>(new Map());
  const resizeObserver = useRef<ResizeObserver | null>(null);
  
  // ResizeObserver 설정
  useEffect(() => {
    resizeObserver.current = new ResizeObserver((entries) => {
      let hasChanges = false;
      
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const elementId = element.dataset.elementId;
        
        if (elementId) {
          const currentHeight = entry.contentRect.height;
          const existing = measuredElements.current.get(elementId);
          
          if (!existing || existing.height !== currentHeight) {
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges && questionPaper) {
        // 높이 변경이 있을 때 페이지 재계산 (함수가 정의된 후에 실행되도록)
        setTimeout(() => {
          recalculatePages();
        }, 100);
      }
    });
    
    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [questionPaper, recalculatePages]);

  // 요소 관찰 시작
  const observeElement = useCallback((element: HTMLElement, elementId: string) => {
    if (!resizeObserver.current) return;
    
    element.dataset.elementId = elementId;
    resizeObserver.current.observe(element);
  }, []);

  // 요소 관찰 중지
  const unobserveElement = useCallback((element: HTMLElement) => {
    if (!resizeObserver.current) return;
    
    resizeObserver.current.unobserve(element);
    const elementId = element.dataset.elementId;
    if (elementId) {
      measuredElements.current.delete(elementId);
    }
  }, []);

  // 페이지 계산
  const calculatePageLayout = useCallback((): PageCalculationResult[] => {
    if (!questionPaper) return [];
    
    const results: PageCalculationResult[] = [];
    let currentPage = 1;
    let currentY = 0;
    const pageHeight = PAGE_CONFIG.CONTENT_HEIGHT_PX - 100; // 여유 공간 확보
    
    questionPaper.questionGroups.forEach((group, index) => {
      // 다양한 selector 시도해서 요소 찾기
      let groupElement = document.querySelector(`[data-group-id="${group.id}"]`) as HTMLElement;
      if (!groupElement) {
        groupElement = document.querySelector(`[data-element-id="group-${group.id}"]`) as HTMLElement;
      }
      
      const groupHeight = groupElement?.offsetHeight || 350; // 기본값 증가
      
      // 현재 페이지에 들어갈 수 있는지 확인 (첫 번째 그룹이 아닌 경우만)
      if (index > 0 && currentY + groupHeight > pageHeight) {
        // 다음 페이지로 이동
        currentPage++;
        currentY = 0;
      }
      
      // 측정된 요소 정보 저장
      measuredElements.current.set(group.id, {
        id: group.id,
        height: groupHeight,
        page: currentPage,
        y: currentY
      });
      
      const shouldBreak = index > 0 && currentY + groupHeight > pageHeight;
      
      results.push({
        currentPage,
        totalPages: currentPage,
        remainingHeight: pageHeight - (currentY + groupHeight),
        shouldBreak
      });
      
      currentY += groupHeight + 20; // 간격 추가
    });
    
    return results;
  }, [questionPaper]);

  // 페이지 레이아웃 재계산
  const recalculatePageLayout = useCallback(() => {
    const results = calculatePageLayout();
    const totalPages = Math.max(...results.map(r => r.currentPage), 1);
    
    // Zustand 스토어 업데이트
    if (questionPaper) {
      recalculatePages();
    }
    
    return {
      results,
      totalPages,
      measuredElements: Array.from(measuredElements.current.values())
    };
  }, [calculatePageLayout, questionPaper, recalculatePages]);

  // 특정 요소가 페이지를 벗어나는지 확인
  const checkElementOverflow = useCallback((elementId: string): boolean => {
    const element = measuredElements.current.get(elementId);
    if (!element) return false;
    
    const pageHeight = layoutSettings.layout === 'double' 
      ? PAGE_CONFIG.CONTENT_HEIGHT_PX 
      : PAGE_CONFIG.CONTENT_HEIGHT_PX;
    
    return (element.y + element.height) > pageHeight;
  }, [layoutSettings.layout]);

  // 현재 페이지의 남은 높이 계산
  const getRemainingHeight = useCallback((page: number): number => {
    const pageHeight = layoutSettings.layout === 'double' 
      ? PAGE_CONFIG.CONTENT_HEIGHT_PX 
      : PAGE_CONFIG.CONTENT_HEIGHT_PX;
    
    let usedHeight = 0;
    measuredElements.current.forEach((element) => {
      if (element.page === page) {
        usedHeight += element.height;
      }
    });
    
    return Math.max(0, pageHeight - usedHeight);
  }, [layoutSettings.layout]);

  return {
    // 상수
    PAGE_CONFIG,
    
    // 함수들
    observeElement,
    unobserveElement,
    calculatePageLayout,
    recalculatePageLayout,
    checkElementOverflow,
    getRemainingHeight,
    
    // 상태
    measuredElements: measuredElements.current,
  };
}