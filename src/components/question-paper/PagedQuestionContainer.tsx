import { useEffect, useState, type ReactNode } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { usePageCalculation } from '@/hooks/usePageCalculation';
import { PageContainer } from './PageContainer';
import type { QuestionGroup as QuestionGroupType } from '@/types/question';

interface PagedQuestionContainerProps {
  questionGroups: QuestionGroupType[];
  children: (group: QuestionGroupType, index: number) => ReactNode;
}

interface PageData {
  pageNumber: number;
  groups: QuestionGroupType[];
  height: number;
}

export function PagedQuestionContainer({ questionGroups, children }: PagedQuestionContainerProps) {
  const { layoutSettings } = useQuestionStore();
  const { PAGE_CONFIG } = usePageCalculation();
  const [pages, setPages] = useState<PageData[]>([]);

  // 페이지 분할 계산
  useEffect(() => {
    if (!questionGroups.length) return;

    const calculatePages = () => {
      const pageData: PageData[] = [];
      let currentPage: PageData = {
        pageNumber: 1,
        groups: [],
        height: 0,
      };

      // 페이지 높이 계산
      const maxPageHeight = PAGE_CONFIG.CONTENT_HEIGHT_PX - 100; // 여유 공간 확보

      questionGroups.forEach((group) => {
        // DOM에서 실제 높이 측정 (기본값 300px)
        const groupElement = document.querySelector(`[data-group-id="${group.id}"]`) as HTMLElement;
        const groupHeight = groupElement?.offsetHeight || 300;
        
        // 현재 페이지에 추가할 수 있는지 확인
        if (currentPage.height + groupHeight > maxPageHeight && currentPage.groups.length > 0) {
          // 현재 페이지를 저장하고 새 페이지 시작
          pageData.push(currentPage);
          currentPage = {
            pageNumber: currentPage.pageNumber + 1,
            groups: [group],
            height: groupHeight,
          };
        } else {
          // 현재 페이지에 추가
          currentPage.groups.push(group);
          currentPage.height += groupHeight;
        }
      });

      // 마지막 페이지 추가
      if (currentPage.groups.length > 0) {
        pageData.push(currentPage);
      }

      setPages(pageData);
    };

    // 초기 계산
    calculatePages();

    // ResizeObserver를 통한 동적 재계산
    const observer = new ResizeObserver(() => {
      // debounce를 적용해서 너무 자주 계산하지 않도록
      setTimeout(calculatePages, 200);
    });

    // 모든 문제 그룹 요소 관찰
    questionGroups.forEach((group) => {
      const element = document.querySelector(`[data-group-id="${group.id}"]`) as HTMLElement;
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [questionGroups, layoutSettings.layout, PAGE_CONFIG.CONTENT_HEIGHT_PX]);

  // 페이지가 계산되기 전에는 모든 그룹을 한 페이지에 표시
  if (pages.length === 0) {
    return (
      <PageContainer pageNumber={1}>
        <div className={
          layoutSettings.layout === 'double' 
            ? 'grid grid-cols-2 gap-6' 
            : 'space-y-6'
        }>
          {questionGroups.map((group, index) => (
            <div 
              key={group.id}
              data-group-id={group.id}
              className={`${
                layoutSettings.layout === 'single' && index > 0 ? "mt-8" : ""
              }`}
            >
              {children(group, index)}
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="space-y-8">
      {pages.map((page) => (
        <PageContainer key={page.pageNumber} pageNumber={page.pageNumber}>
          <div className={
            layoutSettings.layout === 'double' 
              ? 'grid grid-cols-2 gap-6' 
              : 'space-y-6'
          }>
            {page.groups.map((group, index) => (
              <div 
                key={group.id}
                data-group-id={group.id}
                className={`${
                  layoutSettings.layout === 'single' && index > 0 ? "mt-8" : ""
                }`}
              >
                {children(group, index)}
              </div>
            ))}
          </div>
        </PageContainer>
      ))}

      {/* 페이지 요약 정보 */}
      <div className="print:hidden text-center text-sm text-gray-500 py-4">
        총 {pages.length}페이지, {questionGroups.length}개 문제 그룹
      </div>
    </div>
  );
}