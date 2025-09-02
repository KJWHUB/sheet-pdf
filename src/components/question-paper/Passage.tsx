import { useQuestionStore } from '@/stores/questionStore';
import type { Passage as PassageType } from '@/types/question';

interface PassageProps {
  passage: PassageType;
  groupId: string;
}

export function Passage({ passage, groupId }: PassageProps) {
  const {
    editMode,
    selectQuestion,
    layoutSettings,
  } = useQuestionStore();

  const isSelected = editMode.selectedGroupId === groupId && !editMode.selectedQuestionId;

  const handleClick = () => {
    // Content editing is disabled - only group selection allowed
    if (editMode.isEditing) {
      selectQuestion(groupId);
    }
  };

  // 텍스트 컨텐츠 추출 (HTML 태그 제거)
  const textContent = passage.content?.replace(/<[^>]*>/g, '') || '';
  
  // 2분할 모드에서 긴 지문 분할 처리
  const shouldSplitColumns = layoutSettings.layout === 'double' && textContent.length > 400;
  let hasOverflow = false;
  
  if (shouldSplitColumns) {
    // 긴 텍스트에 대한 오버플로우 체크
    hasOverflow = textContent.length > 800;
  }

  // All editing functions disabled - content is read-only

  return (
    <div className={`
      passage-container relative
      ${isSelected ? 'ring-2 ring-blue-500 rounded-md p-2 -m-2' : ''}
    `}>
      {passage.title && (
        <h3 className="font-medium mb-3 text-gray-900">
          {passage.title}
        </h3>
      )}
      
      <div 
        className="passage-content border border-gray-300 rounded-sm p-3 bg-gray-50/30"
        onClick={handleClick}
      >
        {shouldSplitColumns ? (
          <div className="two-column-passage">
            <div 
              className="text-sm leading-relaxed text-gray-900"
              style={{
                columnCount: 2,
                columnGap: '16px',
                columnRule: '1px solid #e5e7eb',
                columnFill: 'balance',
                breakInside: 'avoid',
              }}
            >
              <div className="whitespace-pre-line">
                {textContent || '지문을 입력하세요...'}
              </div>
            </div>
            {hasOverflow && (
              <div className="text-xs text-red-500 mt-2">
                ⚠️ 지문이 길어서 일부가 잘렸습니다.
              </div>
            )}
          </div>
        ) : (
          <div 
            className="text-sm leading-relaxed text-gray-900 min-h-[2rem] whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: passage.content || '<span class="text-gray-400">지문을 입력하세요...</span>'
            }}
          />
        )}
      </div>
    </div>
  );
}