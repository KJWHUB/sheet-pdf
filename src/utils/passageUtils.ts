import { splitTextForTwoColumns, splitText } from './textSplitter';
import type { Passage as PassageType } from '@/types/question';

export interface PassagePart {
  content: string;
  isPartial: boolean;
  partNumber?: number;
  totalParts?: number;
}

/**
 * 여러 페이지에 걸쳐 표시되는 지문을 위한 유틸리티 함수
 */
export function getPassageParts(passage: PassageType, maxHeight: number, layoutSettings: { layout: string }): PassagePart[] {
  if (!passage.content) return [{ content: '', isPartial: false }];

  const textContent = passage.content.replace(/<[^>]*>/g, '');
  
  if (layoutSettings.layout === 'double') {
    // 2분할 모드에서는 칼럼 기준으로 분할
    const result = splitTextForTwoColumns(textContent, maxHeight * 0.8, 14, 1.6);
    
    if (result.hasOverflow) {
      const splitResult = splitText(textContent, { 
        maxLength: Math.floor(textContent.length / 2),
        splitOnParagraph: true 
      });
      
      return splitResult.parts.map((part, index) => ({
        content: part,
        isPartial: splitResult.parts.length > 1,
        partNumber: index + 1,
        totalParts: splitResult.parts.length
      }));
    }
  } else {
    // 1분할 모드에서는 높이 기준으로 분할
    const estimatedLines = Math.floor(maxHeight / 20);
    const maxChars = estimatedLines * 50;
    
    if (textContent.length > maxChars) {
      const splitResult = splitText(textContent, { 
        maxLength: maxChars,
        splitOnParagraph: true 
      });
      
      return splitResult.parts.map((part, index) => ({
        content: part,
        isPartial: splitResult.parts.length > 1,
        partNumber: index + 1,
        totalParts: splitResult.parts.length
      }));
    }
  }

  return [{ content: textContent, isPartial: false }];
}