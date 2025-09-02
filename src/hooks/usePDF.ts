import { useState, useCallback } from 'react';
import { generatePDF, generatePDFFromElement, type PdfOptions } from '@/utils/pdfGenerator';
import { useQuestionStore } from '@/stores/questionStore';

interface UsePDFReturn {
  isGenerating: boolean;
  error: string | null;
  generateQuestionPaperPDF: () => Promise<void>;
  generatePDFFromCustomElement: (element: HTMLElement, options?: PdfOptions) => Promise<void>;
  clearError: () => void;
}

export function usePDF(): UsePDFReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { questionPaper } = useQuestionStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateQuestionPaperPDF = useCallback(async () => {
    if (!questionPaper) {
      setError('문제지 데이터가 없습니다.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const filename = `${questionPaper.title.replace(/[^a-z0-9가-힣]/gi, '_')}_${
        new Date().toISOString().split('T')[0]
      }`;

      await generatePDF({
        filename,
        quality: 0.95,
        scale: 2,
        backgroundColor: '#ffffff',
        removeBackground: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('PDF 생성 실패:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [questionPaper]);

  const generatePDFFromCustomElement = useCallback(async (
    element: HTMLElement, 
    options: PdfOptions = {}
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      await generatePDFFromElement(element, {
        quality: 0.95,
        scale: 2,
        backgroundColor: '#ffffff',
        removeBackground: false,
        ...options,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('PDF 생성 실패:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    generateQuestionPaperPDF,
    generatePDFFromCustomElement,
    clearError,
  };
}