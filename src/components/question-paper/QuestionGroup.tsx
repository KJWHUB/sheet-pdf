import { useRef, useEffect } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Passage } from './Passage';
import { Question } from './Question';
import { ResizableContainer } from './ResizableContainer';
import type { QuestionGroup as QuestionGroupType } from '@/types/question';
import { GripVertical } from 'lucide-react';

interface QuestionGroupProps {
  group: QuestionGroupType;
  isFirst?: boolean;
}

export function QuestionGroup({ group, isFirst = false }: QuestionGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    editMode,
    selectQuestion,
    updateQuestionGroup,
  } = useQuestionStore();

  const isSelected = editMode.selectedGroupId === group.id;

  useEffect(() => {
    // Calculate and update height when content changes
    if (containerRef.current) {
      const height = containerRef.current.scrollHeight;
      if (height !== group.height) {
        updateQuestionGroup(group.id, { height });
      }
    }
  }, [group.subQuestions, group.passage, group.id, updateQuestionGroup]);

  const handleSelect = () => {
    if (editMode.isEditing) {
      selectQuestion(group.id);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`
        question-group relative
        ${isSelected ? 'ring-2 ring-blue-500 rounded-lg p-2 -m-2' : ''}
        ${editMode.isEditing ? 'cursor-pointer' : ''}
      `}
      onClick={handleSelect}
    >
      {/* Group Title */}
      {group.title && (
        <div className="mb-4">
          <h2 className="text-base font-medium text-center mb-2">
            {group.title}
          </h2>
        </div>
      )}

      {/* Description */}
      {group.description && (
        <p className="text-sm text-gray-600 mb-4 text-center">
          {group.description}
        </p>
      )}

      {/* Passage Section */}
      {group.passage && (
        <div className="passage-section mb-6">
          <Passage passage={group.passage} groupId={group.id} />
        </div>
      )}

      {/* Questions Section */}
      <div className="questions-section space-y-4">
        {group.subQuestions.map((question, index) => (
          <div key={question.id}>
            <Question 
              question={question} 
              groupId={group.id}
              isFirst={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Edit Mode Indicators */}
      {editMode.isEditing && isSelected && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      )}

      {/* Height indicator for debugging */}
      {editMode.isEditing && (
        <div className="absolute -bottom-4 left-0 text-xs text-gray-400 bg-gray-100 px-1 rounded">
          H: {group.height || 'auto'}px
        </div>
      )}
    </div>
  );
}