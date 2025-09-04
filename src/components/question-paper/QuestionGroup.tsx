import { useRef, useEffect, type JSX } from "react";
import { useQuestionStore } from "@/stores/questionStore";
import { Button } from "@/components/ui/button";
import { SplittablePassage } from "./SplittablePassage";
import { Question } from "./Question";
import { ResizableContainer } from "./ResizableContainer";
import type { QuestionGroup as QuestionGroupType } from "@/types/question";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuestionGroupProps {
  group: QuestionGroupType;
  isFirst?: boolean;
  isDragOverlay?: boolean;
}

export function QuestionGroup({ group, isDragOverlay = false }: QuestionGroupProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { editMode, selectQuestion, updateQuestionGroup } = useQuestionStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    disabled: isDragOverlay,
  });

  const isSelected = editMode.selectedGroupId === group.id;

  useEffect(() => {
    // Calculate and update height when content changes, but only if editing and selected
    if (containerRef.current && editMode.isEditing && isSelected) {
      const height = containerRef.current.scrollHeight;
      if (height !== group.height && height > 0) {
        updateQuestionGroup(group.id, { height: Math.max(500, height) });
      }
    }
  }, [group.subQuestions, group.passage, group.id, group.height, updateQuestionGroup, editMode.isEditing, isSelected]);

  const handleSelect = () => {
    if (editMode.isEditing) {
      selectQuestion(group.id);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const content = (
    <div
      ref={setNodeRef}
      style={style}
      className={`
          question-group relative
          ${isSelected ? "ring-2 ring-blue-500 rounded-lg p-2 -m-2" : ""}
          ${editMode.isEditing ? "cursor-pointer" : ""}
          ${isDragging ? "border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-lg" : ""}
        `}
      onClick={handleSelect}
    >
      {/* Group Title */}
      {group.title && (
        <div className="mb-4">
          <h2 className="text-base font-medium text-center mb-2">{group.title}</h2>
        </div>
      )}

      {/* Description */}
      {group.description && <p className="text-sm text-gray-600 mb-4 text-center">{group.description}</p>}

      {/* Passage Section */}
      {group.passage && (
        <div className="passage-section mb-6">
          <SplittablePassage
            passage={group.passage}
            groupId={group.id}
            // allowOverflow=true 로 내용이 절대 잘리지 않도록 렌더링
            maxHeight={300}
            allowOverflow={true}
            onHeightChange={(height) => {
              // 높이 변경 시 그룹 높이 업데이트
              if (editMode.isEditing && isSelected) {
                updateQuestionGroup(group.id, { height: height + 200 }); // 여백 포함
              }
            }}
          />
        </div>
      )}

      {/* Questions Section */}
      <div className="questions-section space-y-4">
        {group.subQuestions.map((question, index) => (
          <div key={question.id}>
            <Question question={question} groupId={group.id} isFirst={index === 0} />
          </div>
        ))}
      </div>

      {/* Edit Mode Indicators */}
      {editMode.isEditing && isSelected && !isDragOverlay && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      )}

      {/* Height indicator for debugging */}
      {editMode.isEditing && !isDragOverlay && (
        <div className="absolute -bottom-4 left-0 text-xs text-gray-400 bg-gray-100 px-1 rounded">H: {group.height || "auto"}px</div>
      )}
    </div>
  );

  if (isDragOverlay) {
    return content;
  }

  return (
    <ResizableContainer
      id={group.id}
      initialHeight={group.height || "auto"}
      onResize={(height) => updateQuestionGroup(group.id, { height })}
      disabled={!editMode.isEditing || !isSelected}
      minHeight={500}
    >
      {content}
    </ResizableContainer>
  );
}
