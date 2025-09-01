import type { ApiQuestionGroup, ApiSubQuestion, ApiOption } from '@/types/api';
import type { QuestionPaper, QuestionGroup, SubQuestion, Choice, Passage } from '@/types/question';

/**
 * HTML 태그를 제거하고 텍스트만 추출
 */
function stripHtml(html: string): string {
  if (!html) return '';
  
  // 이미지 태그를 특수문자로 변환
  let text = html.replace(/<img[^>]*>/g, '□');
  
  // 기타 HTML 태그 제거
  text = text.replace(/<[^>]*>/g, '');
  
  // HTML 엔티티 디코딩
  text = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  return text.trim();
}

/**
 * API 옵션을 Choice 타입으로 변환
 */
function convertApiOptionToChoice(option: ApiOption): Choice {
  return {
    id: `choice-${option.number}`,
    number: option.number,
    content: stripHtml(option.content),
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
  let content = stripHtml(apiSubQuestion.question);
  if (apiSubQuestion.instruction && apiSubQuestion.instruction !== apiSubQuestion.question) {
    content = stripHtml(apiSubQuestion.instruction);
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
    content: stripHtml(apiPassage),
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
  
  // 문제 번호 범위 생성
  const startNum = 1;
  const endNum = subQuestions.length;
  const title = endNum === 1 
    ? `[${startNum}] 다음을 읽고 물음에 답하시오.`
    : `[${startNum}~${endNum}] 다음을 읽고 물음에 답하시오.`;
  
  return {
    id: `group-${apiGroup.id}`,
    title: passage ? title : undefined,
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
  
  return {
    id: `paper-${Date.now()}`,
    title: subject === 'KOREAN' ? '국어 문제지' : '수학 문제지',
    layout: 'single',
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