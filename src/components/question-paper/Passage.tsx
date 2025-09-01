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
  } = useQuestionStore();

  const isSelected = editMode.selectedGroupId === groupId && !editMode.selectedQuestionId;

  const handleClick = () => {
    // Content editing is disabled - only group selection allowed
    if (editMode.isEditing) {
      selectQuestion(groupId);
    }
  };

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
        <div 
          className="text-sm leading-relaxed text-gray-900 min-h-[2rem] whitespace-pre-line"
          dangerouslySetInnerHTML={{
            __html: passage.content || '<span class="text-gray-400">지문을 입력하세요...</span>'
          }}
        />
      </div>
    </div>
  );
}