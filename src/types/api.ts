export interface ApiOption {
  number: number;
  content: string;
}

export interface ApiSubQuestion {
  id: number;
  type: "CHOICE" | "SHORT_ANSWER" | "ESSAY" | "FILL_BLANK";
  subject: string;
  instruction?: string;
  question: string;
  refer: string;
  level: number;
  year: string;
  mainUnit?: string | null;
  subUnit?: string | null;
  mainCategory?: string | null;
  subCategory?: string | null;
  options?: ApiOption[];
  choiceAnswer?: number[] | null;
  shortAnswer?: string | null;
  essayAnswer?: string | null;
  solution?: string | null;
  purpose?: string | null;
  origin: string;
  isAiGenerated: boolean;
  tags: unknown[];
  questionNumber: string;
  similarity?: unknown | null;
  isServable: boolean;
  memo?: string | null;
  humanReview: string;
}

export interface ApiQuestionGroup {
  id: number;
  sourceId: number;
  pdfFileId?: number | null;
  subject: string;
  instruction?: string | null;
  passage?: string | null;
  passageMemo?: string | null;
  academicYear: string;
  passageMainUnit?: string | null;
  passageSubUnit?: string | null;
  passageClassification?: string | null;
  passageVariationLevel?: string | null;
  passagePublisher?: string | null;
  passageCurriculumRevision?: unknown;
  passageDetailSubject?: string | null;
  passageYear?: unknown;
  subQuestions: ApiSubQuestion[];
  [key: string]: unknown; // 추가 필드 허용
}

export type Subject = "MATH" | "KOREAN";