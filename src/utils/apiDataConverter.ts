import type { ApiQuestionGroup, ApiSubQuestion, ApiOption } from '@/types/api';
import type { QuestionPaper, QuestionGroup, SubQuestion, Choice, Passage } from '@/types/question';

/**
 * HTML 콘텐츠를 그대로 반환 (렌더링용)
 */
function processHtmlContent(html: string): string {
  if (!html) return '';
  return html.trim();
}

/**
 * API 옵션을 Choice 타입으로 변환
 */
function convertApiOptionToChoice(option: ApiOption): Choice {
  return {
    id: `choice-${option.number}`,
    number: option.number,
    content: processHtmlContent(option.content),
  };
}

/**
 * API 서브 질문을 SubQuestion 타입으로 변환
 */
function convertApiSubQuestionToSubQuestion(apiSubQuestion: ApiSubQuestion, index: number): SubQuestion {
  let questionType: SubQuestion['type'] = 'multiple-choice';
  
  switch (apiSubQuestion.type) {
    case 'CHOICE':
      questionType = 'multiple-choice';
      break;
    case 'SHORT_ANSWER':
      questionType = 'short-answer';
      break;
    case 'ESSAY':
      questionType = 'essay';
      break;
    case 'FILL_BLANK':
      questionType = 'fill-in-blank';
      break;
  }
  
  const choices = apiSubQuestion.options?.map(convertApiOptionToChoice) || [];
  
  // instruction과 question을 합쳐서 content로 사용
  let content = processHtmlContent(apiSubQuestion.question);
  if (apiSubQuestion.instruction && apiSubQuestion.instruction !== apiSubQuestion.question) {
    content = processHtmlContent(apiSubQuestion.instruction);
  }
  
  return {
    id: `question-${apiSubQuestion.id}`,
    number: index + 1,
    type: questionType,
    content,
    choices: choices.length > 0 ? choices : undefined,
    isEditable: true,
    minHeight: 100,
  };
}

/**
 * API 지문을 Passage 타입으로 변환
 */
function convertApiPassageToPassage(apiPassage: string, groupId: string): Passage {
  return {
    id: `passage-${groupId}`,
    content: processHtmlContent(apiPassage),
    isEditable: true,
  };
}

/**
 * API 질문 그룹을 QuestionGroup 타입으로 변환
 */
function convertApiQuestionGroupToQuestionGroup(apiGroup: ApiQuestionGroup): QuestionGroup {
  const subQuestions = apiGroup.subQuestions.map((subQ: ApiSubQuestion, index: number) => 
    convertApiSubQuestionToSubQuestion(subQ, index)
  );
  
  const passage = apiGroup.passage 
    ? convertApiPassageToPassage(apiGroup.passage, apiGroup.id.toString())
    : undefined;
  
  return {
    id: `group-${apiGroup.id}`,
    title: passage ? '' : undefined,
    layout: 'single',
    passage,
    subQuestions,
    isEditable: true,
    minHeight: 300,
  };
}

/**
 * API 데이터를 QuestionPaper 타입으로 변환
 */
export function convertApiDataToQuestionPaper(
  apiData: ApiQuestionGroup[], 
  subject: string
): QuestionPaper {
  const questionGroups = apiData.map(convertApiQuestionGroupToQuestionGroup);
  
  // 전체 번호 연속 증가 및 그룹 타이틀 범위 갱신
  let globalNo = 1;
  for (const group of questionGroups) {
    const start = globalNo;
    for (const q of group.subQuestions) {
      q.number = globalNo++;
    }
    const end = globalNo - 1;
    if (group.passage) {
      group.title = start === end
        ? `[${start}] 다음을 읽고 물음에 답하시오.`
        : `[${start}-${end}] 다음을 읽고 물음에 답하시오.`;
    }
  }
  
  return {
    id: `paper-${Date.now()}`,
    title: subject === 'KOREAN' ? '국어 문제지' : '수학 문제지',
    layout: 'double',
    questionGroups,
    pageBreaks: [],
    totalPages: Math.ceil(questionGroups.length / 2),
    paperSize: 'A4',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    settings: {
      showQuestionNumbers: true,
      showAnswers: false,
      allowEdit: true,
    },
  };
}
