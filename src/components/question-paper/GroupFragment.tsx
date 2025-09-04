import { useQuestionStore } from "@/stores/questionStore";
import type { QuestionGroup } from "@/types/question";
import type { RenderItem } from "@/utils/layoutEngine";
import { Question } from "./Question";

interface PassagePartViewProps {
  title?: string;
  content: string; // HTML preserved
  partNumber: number;
  totalParts: number;
  groupId: string;
}

export function PassagePartView({ title, content, partNumber, totalParts, groupId }: PassagePartViewProps) {
  const { editMode, selectQuestion } = useQuestionStore();
  const isSelected = editMode.selectedGroupId === groupId && !editMode.selectedQuestionId;
  return (
    <div className={`passage-container relative mb-3 ${isSelected ? "ring-2 ring-blue-500 rounded-md p-2 -m-2" : ""}`}>
      {title && (
        <h3 className="font-medium mb-3 text-gray-900">
          {title}
          {totalParts > 1 && (
            <span className="text-xs text-blue-600 ml-2">
              ({partNumber}/{totalParts})
            </span>
          )}
        </h3>
      )}
      <div
        className="passage-content border border-gray-300 rounded-sm p-3 pb-4 bg-gray-50/30"
        onClick={() => editMode.isEditing && selectQuestion(groupId)}
      >
        <div
          className="text-sm leading-relaxed text-gray-900"
          dangerouslySetInnerHTML={{ __html: content || '<span class="text-gray-400">지문을 입력하세요...</span>' }}
        />
      </div>
    </div>
  );
}

interface QuestionRangeViewProps {
  group: QuestionGroup;
  startIndex: number;
  endIndex: number;
}

export function QuestionRangeView({ group, startIndex, endIndex }: QuestionRangeViewProps) {
  const questions = group.subQuestions.slice(startIndex, endIndex + 1);
  return (
    <div className="questions-section space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id}>
          <Question question={q} groupId={group.id} isFirst={idx === 0} />
        </div>
      ))}
    </div>
  );
}

interface FragmentRendererProps {
  item: RenderItem;
  group: QuestionGroup;
}

export function FragmentRenderer({ item, group }: FragmentRendererProps) {
  if (item.kind === "passage-part") {
    return <PassagePartView title={item.title} content={item.content} partNumber={item.partNumber} totalParts={item.totalParts} groupId={group.id} />;
  }
  return <QuestionRangeView group={group} startIndex={item.startIndex} endIndex={item.endIndex} />;
}
