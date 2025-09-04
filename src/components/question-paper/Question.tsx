import { useQuestionStore } from "@/stores/questionStore";
import type { SubQuestion, Choice } from "@/types/question";
import { ResizableContainer } from "./ResizableContainer";

interface QuestionProps {
  question: SubQuestion;
  groupId: string;
  isFirst?: boolean;
}

export function Question({ question, groupId }: QuestionProps) {
  const { editMode, selectQuestion, updateSubQuestion } = useQuestionStore();

  const isSelected = editMode.selectedQuestionId === question.id;

  const handleContentClick = () => {
    // Content editing is disabled - only group selection allowed
    if (editMode.isEditing) {
      selectQuestion(groupId, question.id);
    }
  };

  // snap height to rough line units
  const snapHeight = (h: number) => {
    const unit = Math.round(14 * 1.6); // ~22px
    return Math.max(unit, Math.round(h / unit) * unit);
  };

  const content = (
    <div
      className={`
      question-container pb-6
      ${isSelected ? "ring-2 ring-blue-500 rounded-lg p-2 -m-2" : ""}
    `}
    >
      {/* Question Number and Content */}
      <div className="flex gap-2 mb-3">
        <div className="flex-shrink-0">
          <span className="text-sm font-medium text-gray-900">{question.number}.</span>
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="question-content text-sm leading-relaxed min-h-[1.5rem]"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{
              __html: question.content || '<span class="text-gray-400">문제 내용을 입력하세요...</span>',
            }}
          />
        </div>

        {/* Question Points */}
        {question.points && <div className="flex-shrink-0 text-xs text-muted-foreground">[{question.points}점]</div>}
      </div>

      {/* Multiple Choice Options */}
      {question.type === "multiple-choice" && question.choices && (
        <div className="ml-6 space-y-1">
          {question.choices.map((choice) => (
            <ChoiceItem key={choice.id} choice={choice} />
          ))}
        </div>
      )}

      {/* Short Answer */}
      {question.type === "short-answer" && (
        <div className="ml-6 mt-2">
          <div className="border-b border-gray-300 w-32 h-6"></div>
        </div>
      )}

      {/* Essay Answer */}
      {question.type === "essay" && (
        <div className="ml-6 mt-2">
          <div className="border border-gray-300 rounded h-20 bg-gray-50/30"></div>
        </div>
      )}

      {/* Fill-in-blank */}
      {question.type === "fill-in-blank" && (
        <div className="ml-6 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">정답:</span>
            <div className="border-b border-gray-300 w-24 h-6"></div>
          </div>
        </div>
      )}
    </div>
  );

  // Non-edit or not selected → static render
  if (!editMode.isEditing || !isSelected) return content;

  // Edit + selected → resizable
  return (
    <ResizableContainer
      id={question.id}
      initialHeight={question.height || "auto"}
      minHeight={80}
      maxHeight={2000}
      onResize={(h) => updateSubQuestion(groupId, question.id, { height: snapHeight(h) })}
      disabled={false}
    >
      {content}
    </ResizableContainer>
  );
}

interface ChoiceItemProps {
  choice: Choice;
}

function ChoiceItem({ choice }: ChoiceItemProps) {
  // 번호를 원문자로 변환하는 함수
  const getChoiceSymbol = (number: number) => {
    const symbols = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
    return symbols[number - 1] || `⑪`;
  };

  return (
    <div className="flex items-start gap-2">
      <span className="flex-shrink-0 text-sm font-medium min-w-[20px] mt-0.5">{getChoiceSymbol(choice.number)}</span>

      <div className="flex-1">
        <div
          className="text-sm min-h-[1.5rem] px-1"
          dangerouslySetInnerHTML={{
            __html: choice.content || '<span class="text-gray-400">선택지 내용을 입력하세요...</span>',
          }}
        />
      </div>
    </div>
  );
}
