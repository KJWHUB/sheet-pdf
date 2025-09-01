export type LayoutType = 'single' | 'double';

export type QuestionType = 'multiple-choice' | 'short-answer' | 'essay' | 'fill-in-blank';

export interface Choice {
  id: string;
  number: number;
  content: string;
  isCorrect?: boolean;
}

export interface Passage {
  id: string;
  title?: string;
  content: string;
  height?: number;
  isEditable?: boolean;
}

export interface SubQuestion {
  id: string;
  number: number;
  type: QuestionType;
  content: string;
  choices?: Choice[];
  answer?: string;
  height?: number;
  minHeight?: number;
  isEditable?: boolean;
  points?: number;
}

export interface QuestionGroup {
  id: string;
  title?: string;
  description?: string;
  passage?: Passage;
  subQuestions: SubQuestion[];
  layout: LayoutType;
  height?: number;
  minHeight?: number;
  isEditable?: boolean;
  pageNumber?: number;
}

export interface PageBreak {
  id: string;
  afterQuestionId: string;
  pageNumber: number;
}

export interface QuestionPaper {
  id: string;
  title: string;
  description?: string;
  layout: LayoutType;
  questionGroups: QuestionGroup[];
  pageBreaks: PageBreak[];
  totalPages: number;
  paperSize: 'A4' | 'Letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  settings: {
    showQuestionNumbers: boolean;
    showAnswers: boolean;
    allowEdit: boolean;
  };
}

export interface LayoutSettings {
  layout: LayoutType;
  paperSize: 'A4' | 'Letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  columnGap: number;
  pageHeight: number;
  pageWidth: number;
}

export interface EditMode {
  isEditing: boolean;
  selectedQuestionId?: string;
  selectedGroupId?: string;
}

export interface ResizeState {
  isResizing: boolean;
  resizingId?: string;
  originalHeight: number;
  currentHeight: number;
}