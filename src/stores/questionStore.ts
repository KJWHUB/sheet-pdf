import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  QuestionPaper,
  QuestionGroup,
  SubQuestion,
  LayoutSettings,
  EditMode,
  ResizeState,
  LayoutType,
} from '@/types/question';

interface QuestionStore {
  // State
  questionPaper: QuestionPaper | null;
  layoutSettings: LayoutSettings;
  editMode: EditMode;
  resizeState: ResizeState;
  
  // Actions
  setQuestionPaper: (paper: QuestionPaper) => void;
  setPaperTitle: (title: string) => void;
  updateQuestionGroup: (groupId: string, updates: Partial<QuestionGroup>) => void;
  updateSubQuestion: (groupId: string, questionId: string, updates: Partial<SubQuestion>) => void;
  reorderQuestionGroups: (activeId: string, overId: string) => void;
  
  // Layout Actions
  setLayoutType: (layout: LayoutType) => void;
  updateLayoutSettings: (settings: Partial<LayoutSettings>) => void;
  
  // Edit Mode Actions
  setEditMode: (isEditing: boolean) => void;
  selectQuestion: (groupId?: string, questionId?: string) => void;
  
  // Resize Actions
  startResize: (id: string, originalHeight: number) => void;
  updateResize: (currentHeight: number) => void;
  endResize: () => void;
  
  // Page Actions
  recalculatePages: () => void;
  
  // Utility Actions
  reset: () => void;
}

const defaultLayoutSettings: LayoutSettings = {
  layout: 'double',
  paperSize: 'A4',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  columnGap: 20,
  pageHeight: 297, // A4 height in mm
  pageWidth: 210,  // A4 width in mm
};

const defaultEditMode: EditMode = {
  isEditing: false,
};

const defaultResizeState: ResizeState = {
  isResizing: false,
  originalHeight: 0,
  currentHeight: 0,
};

export const useQuestionStore = create<QuestionStore>()(
  devtools(
    (set) => ({
      // Initial State
      questionPaper: null,
      layoutSettings: defaultLayoutSettings,
      editMode: defaultEditMode,
      resizeState: defaultResizeState,
      
      // Actions
      setQuestionPaper: (paper) =>
        set({ questionPaper: paper }, false, 'setQuestionPaper'),

      setPaperTitle: (title) =>
        set((state) => {
          if (!state.questionPaper) return state;
          return { questionPaper: { ...state.questionPaper, title } };
        }, false, 'setPaperTitle'),
      
      updateQuestionGroup: (groupId, updates) =>
        set((state) => {
          if (!state.questionPaper) return state;
          
          const updatedGroups = state.questionPaper.questionGroups.map((group) =>
            group.id === groupId ? { ...group, ...updates } : group
          );
          
          return {
            questionPaper: {
              ...state.questionPaper,
              questionGroups: updatedGroups,
            },
          };
        }, false, 'updateQuestionGroup'),
      
      updateSubQuestion: (groupId, questionId, updates) =>
        set((state) => {
          if (!state.questionPaper) return state;
          
          const updatedGroups = state.questionPaper.questionGroups.map((group) => {
            if (group.id !== groupId) return group;
            
            const updatedSubQuestions = group.subQuestions.map((question) =>
              question.id === questionId ? { ...question, ...updates } : question
            );
            
            return { ...group, subQuestions: updatedSubQuestions };
          });
          
          return {
            questionPaper: {
              ...state.questionPaper,
              questionGroups: updatedGroups,
            },
          };
        }, false, 'updateSubQuestion'),
      
      reorderQuestionGroups: (activeId, overId) =>
        set((state) => {
          if (!state.questionPaper) return state;
          
          const groups = [...state.questionPaper.questionGroups];
          const activeIndex = groups.findIndex(group => group.id === activeId);
          const overIndex = groups.findIndex(group => group.id === overId);
          
          if (activeIndex !== -1 && overIndex !== -1) {
            const [removed] = groups.splice(activeIndex, 1);
            groups.splice(overIndex, 0, removed);
          }
          
          return {
            questionPaper: {
              ...state.questionPaper,
              questionGroups: groups,
            },
          };
        }, false, 'reorderQuestionGroups'),
      
      // Layout Actions
      setLayoutType: (layout) =>
        set((state) => ({
          layoutSettings: { ...state.layoutSettings, layout },
          questionPaper: state.questionPaper
            ? { ...state.questionPaper, layout }
            : null,
        }), false, 'setLayoutType'),
      
      updateLayoutSettings: (settings) =>
        set((state) => ({
          layoutSettings: { ...state.layoutSettings, ...settings },
        }), false, 'updateLayoutSettings'),
      
      // Edit Mode Actions
      setEditMode: (isEditing) =>
        set((state) => ({
          editMode: { ...state.editMode, isEditing },
        }), false, 'setEditMode'),
      
      selectQuestion: (groupId, questionId) =>
        set((state) => ({
          editMode: {
            ...state.editMode,
            selectedGroupId: groupId,
            selectedQuestionId: questionId,
          },
        }), false, 'selectQuestion'),
      
      // Resize Actions
      startResize: (id, originalHeight) =>
        set({
          resizeState: {
            isResizing: true,
            resizingId: id,
            originalHeight,
            currentHeight: originalHeight,
          },
        }, false, 'startResize'),
      
      updateResize: (currentHeight) =>
        set((state) => ({
          resizeState: {
            ...state.resizeState,
            currentHeight,
          },
        }), false, 'updateResize'),
      
      endResize: () =>
        set({
          resizeState: defaultResizeState,
        }, false, 'endResize'),
      
      // Page Actions
      recalculatePages: () =>
        set((state) => {
          if (!state.questionPaper) return state;
          
          // Page calculation logic will be implemented later
          // This is a placeholder for now
          return {
            questionPaper: {
              ...state.questionPaper,
              totalPages: Math.ceil(state.questionPaper.questionGroups.length / 2),
            },
          };
        }, false, 'recalculatePages'),
      
      // Utility Actions
      reset: () =>
        set({
          questionPaper: null,
          layoutSettings: defaultLayoutSettings,
          editMode: defaultEditMode,
          resizeState: defaultResizeState,
        }, false, 'reset'),
    }),
    {
      name: 'question-store',
    }
  )
);
