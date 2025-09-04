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
  isFirstPart?: boolean;
  isLastPart?: boolean;
}

export function PassagePartView({ title, content, partNumber, totalParts, groupId, isFirstPart, isLastPart }: PassagePartViewProps) {
  const { editMode, selectQuestion } = useQuestionStore();
  const isSelected = editMode.selectedGroupId === groupId && !editMode.selectedQuestionId;
  const borderMod = `${isFirstPart ? '' : 'border-t-0 rounded-t-none'} ${isLastPart ? '' : 'border-b-0 rounded-b-none'}`;
  return (
    <div className={`passage-container relative group mb-3 ${isSelected ? "ring-2 ring-blue-500 rounded-md p-2" : "group-hover:ring-1 group-hover:ring-blue-300 rounded-md"}`}>
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
        className={`passage-content border border-gray-300 rounded-sm p-3 pb-2 bg-gray-50/30 ${borderMod}`}
        onClick={() => editMode.isEditing && selectQuestion(groupId)}
      >
        <div
          className="text-sm leading-relaxed text-gray-900"
          dangerouslySetInnerHTML={{ __html: content || '<span class="text-gray-400">지문을 입력하세요...</span>' }}
        />
        {editMode.isEditing && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); selectQuestion(groupId); }}
            className="hidden group-hover:block absolute -top-3 left-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200"
          >
            선택
          </button>
        )}
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

// New: fine-grained fragments
interface QuestionStemPartViewProps {
  group: QuestionGroup;
  questionId: string;
  number: number;
  html: string;
  isFirstPart: boolean;
  isLastPart: boolean;
}

export function QuestionStemPartView({ group, questionId, number, html }: QuestionStemPartViewProps) {
  const { editMode, selectQuestion } = useQuestionStore();
  const isSelected = editMode.selectedQuestionId === questionId;
  return (
    <div className={`relative group ${isSelected ? 'ring-2 ring-blue-500 rounded-md p-2' : 'group-hover:ring-1 group-hover:ring-blue-300 rounded-md'}`}
         onClick={() => editMode.isEditing && selectQuestion(group.id, questionId)}>
      <div className="flex gap-2 mb-1">
        <div className="flex-shrink-0"><span className="text-sm font-medium text-gray-900">{number}.</span></div>
        <div className="flex-1 min-w-0">
          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
      {editMode.isEditing && (
        <button
          className="hidden group-hover:block absolute -top-3 left-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200"
          onClick={(e) => { e.stopPropagation(); selectQuestion(group.id, questionId); }}
        >선택</button>
      )}
    </div>
  );
}

interface ChoiceRangeViewProps {
  group: QuestionGroup;
  questionId: string;
  startIndex: number;
  endIndex: number;
}

export function ChoiceRangeView({ group, questionId, startIndex, endIndex }: ChoiceRangeViewProps) {
  const { editMode, selectQuestion } = useQuestionStore();
  const q = group.subQuestions.find(sq => sq.id === questionId)!;
  const choices = (q.choices || []).slice(startIndex, endIndex + 1);

  const getChoiceSymbol = (number: number) => {
    const symbols = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
    return symbols[number - 1] || '⑪';
  };

  const isSelected = editMode.selectedQuestionId === questionId;
  return (
    <div className={`relative group ml-6 ${isSelected ? 'ring-2 ring-blue-500 rounded-md p-2' : 'group-hover:ring-1 group-hover:ring-blue-300 rounded-md'}`}
         onClick={() => editMode.isEditing && selectQuestion(group.id, questionId)}>
      <div className="space-y-1">
        {choices.map((ch) => (
          <div key={ch.id} className="flex items-start gap-2">
            <span className="flex-shrink-0 text-sm font-medium min-w-[20px] mt-0.5">{getChoiceSymbol(ch.number)}</span>
            <div className="flex-1">
              <div className="text-sm min-h-[1.5rem] px-1" dangerouslySetInnerHTML={{ __html: ch.content }} />
            </div>
          </div>
        ))}
      </div>
      {editMode.isEditing && (
        <button
          className="hidden group-hover:block absolute -top-3 left-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200"
          onClick={(e) => { e.stopPropagation(); selectQuestion(group.id, questionId); }}
        >선택</button>
      )}
    </div>
  );
}

interface FragmentRendererProps {
  item: RenderItem;
  group: QuestionGroup;
}

export function FragmentRenderer({ item, group }: FragmentRendererProps) {
  if (item.kind === "passage-part") {
    return <PassagePartView title={item.title} content={item.content} partNumber={item.partNumber} totalParts={item.totalParts} groupId={group.id} isFirstPart={item.isFirstPart} isLastPart={item.isLastPart} />;
  }
  if (item.kind === 'question-stem-part') {
    return (
      <QuestionStemPartView
        group={group}
        questionId={item.questionId}
        number={item.number}
        html={item.content}
        isFirstPart={item.isFirstPart}
        isLastPart={item.isLastPart}
      />
    );
  }
  if (item.kind === 'choice-range') {
    return (
      <ChoiceRangeView
        group={group}
        questionId={item.questionId}
        startIndex={item.startIndex}
        endIndex={item.endIndex}
      />
    );
  }
  return <QuestionRangeView group={group} startIndex={item.startIndex} endIndex={item.endIndex} />;
}
