import { useEffect, useState, type ReactNode } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { usePageCalculation } from '@/hooks/usePageCalculation';
import { PageContainer } from './PageContainer';
import { SmartTwoColumnLayout } from './TwoColumnLayout';
import type { QuestionGroup as QuestionGroupType } from '@/types/question';
import { paginateQuestionGroupsDouble, paginateQuestionGroupsSingle } from '@/utils/layoutEngine';
import type { FlowPageDouble, FlowPageSingle } from '@/utils/layoutEngine';
import { FragmentRenderer } from './GroupFragment';

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
  const [flowPagesDouble, setFlowPagesDouble] = useState<FlowPageDouble[]>([]);
  const [flowPagesSingle, setFlowPagesSingle] = useState<FlowPageSingle[]>([]);

  // 페이지 분할 계산 (기존 그룹 단위)
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

  // 새로운 플로우 레이아웃 계산 (콘텐츠 누락 방지, 칼럼/페이지 연속)
  useEffect(() => {
    if (!questionGroups.length) return;
    const columnHeight = 950; // 기존 주석 기준
    if (layoutSettings.layout === 'double') {
      const fp = paginateQuestionGroupsDouble(questionGroups, columnHeight);
      setFlowPagesDouble(fp);
      setFlowPagesSingle([]);
    } else {
      const fp = paginateQuestionGroupsSingle(questionGroups, columnHeight);
      setFlowPagesSingle(fp);
      setFlowPagesDouble([]);
    }
  }, [questionGroups, layoutSettings.layout]);

  // 페이지가 계산되기 전에는 모든 그룹을 한 페이지에 표시
  // 초기 계산 전 프리뷰 (기존)
  if (pages.length === 0 && flowPagesDouble.length === 0 && flowPagesSingle.length === 0) {
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

  // 새 플로우 레이아웃 우선 적용
  if (flowPagesDouble.length > 0 || flowPagesSingle.length > 0) {
    if (layoutSettings.layout === 'double') {
      return (
        <div className="space-y-8">
          {flowPagesDouble.map((pg, pageIndex) => (
            <PageContainer key={pageIndex + 1} pageNumber={pageIndex + 1}>
              <div className="grid grid-cols-2 gap-6">
                {/* left */}
                <div className="space-y-6" style={{ borderRight: '1px solid #e5e7eb', paddingRight: '10mm' }}>
                  {(pg.left ?? []).map((item, idx) => {
                    const group = questionGroups.find(g => g.id === item.groupId)!;
                    return (
                      <div key={`${item.kind}-${idx}`} data-group-id={group.id}>
                        <FragmentRenderer item={item} group={group} />
                      </div>
                    );
                  })}
                </div>
                {/* right */}
                <div className="space-y-6" style={{ paddingLeft: '10mm' }}>
                  {(pg.right ?? []).map((item, idx) => {
                    const group = questionGroups.find(g => g.id === item.groupId)!;
                    return (
                      <div key={`${item.kind}-${idx}`} data-group-id={group.id}>
                        <FragmentRenderer item={item} group={group} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </PageContainer>
          ))}
          <div className="print:hidden text-center text-sm text-gray-500 py-4">
            총 {flowPagesDouble.length}페이지, {questionGroups.length}개 문제 그룹
          </div>
        </div>
      );
    }

    // single layout using one column
    return (
      <div className="space-y-8">
        {flowPagesSingle.map((pg, pageIndex) => (
          <PageContainer key={pageIndex + 1} pageNumber={pageIndex + 1}>
            <div className="space-y-6">
              {(pg.items ?? []).map((item, idx) => {
                const group = questionGroups.find(g => g.id === item.groupId)!;
                return (
                  <div key={`${item.kind}-${idx}`} data-group-id={group.id}>
                    <FragmentRenderer item={item} group={group} />
                  </div>
                );
              })}
            </div>
          </PageContainer>
        ))}
        <div className="print:hidden text-center text-sm text-gray-500 py-4">
          총 {flowPagesSingle.length}페이지, {questionGroups.length}개 문제 그룹
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pages.map((page) => (
        <PageContainer key={page.pageNumber} pageNumber={page.pageNumber}>
          {layoutSettings.layout === 'double' ? (
            <SmartTwoColumnLayout 
              questionGroups={page.groups}
              maxHeight={950} // A4 컨텐츠 영역 높이 (약 257mm - 여백)
            >
              {children}
            </SmartTwoColumnLayout>
          ) : (
            <div className="space-y-6">
              {page.groups.map((group, index) => (
                <div 
                  key={group.id}
                  data-group-id={group.id}
                  className={index > 0 ? "mt-8" : ""}
                >
                  {children(group, index)}
                </div>
              ))}
            </div>
          )}
        </PageContainer>
      ))}

      {/* 페이지 요약 정보 */}
      <div className="print:hidden text-center text-sm text-gray-500 py-4">
        총 {pages.length}페이지, {questionGroups.length}개 문제 그룹
      </div>
    </div>
  );
}
