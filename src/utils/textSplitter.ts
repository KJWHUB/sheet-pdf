interface TextSplitOptions {
  maxLength?: number;
  splitOnSentence?: boolean;
  splitOnParagraph?: boolean;
  preserveHtml?: boolean;
}

interface SplitResult {
  parts: string[];
  originalLength: number;
  splitMethod: 'paragraph' | 'sentence' | 'word' | 'character';
}

/**
 * 텍스트를 여러 부분으로 분할하는 유틸리티
 */
export function splitText(text: string, options: TextSplitOptions = {}): SplitResult {
  const {
    maxLength = 1000,
    splitOnSentence = true,
    splitOnParagraph = true,
    preserveHtml = false,
  } = options;

  if (text.length <= maxLength) {
    return {
      parts: [text],
      originalLength: text.length,
      splitMethod: 'paragraph'
    };
  }

  let parts: string[] = [];
  let splitMethod: SplitResult['splitMethod'] = 'paragraph';

  // HTML 태그가 포함된 경우 처리
  if (preserveHtml && text.includes('<')) {
    return splitHtmlText(text, maxLength);
  }

  // 1. 문단 단위로 분할 시도
  if (splitOnParagraph) {
    const paragraphs = text.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      parts = balanceParagraphs(paragraphs, maxLength);
      splitMethod = 'paragraph';
      if (parts.every(part => part.length <= maxLength)) {
        return { parts, originalLength: text.length, splitMethod };
      }
    }
  }

  // 2. 문장 단위로 분할 시도
  if (splitOnSentence) {
    const sentences = text.split(/[.!?]\s+/);
    if (sentences.length > 1) {
      parts = balanceSentences(sentences, maxLength);
      splitMethod = 'sentence';
      if (parts.every(part => part.length <= maxLength)) {
        return { parts, originalLength: text.length, splitMethod };
      }
    }
  }

  // 3. 단어 단위로 분할
  const words = text.split(/\s+/);
  if (words.length > 1) {
    parts = balanceWords(words, maxLength);
    splitMethod = 'word';
    if (parts.every(part => part.length <= maxLength)) {
      return { parts, originalLength: text.length, splitMethod };
    }
  }

  // 4. 마지막 수단: 글자 단위 분할
  parts = [];
  for (let i = 0; i < text.length; i += maxLength) {
    parts.push(text.substring(i, i + maxLength));
  }
  splitMethod = 'character';

  return { parts, originalLength: text.length, splitMethod };
}

/**
 * 문단들을 균형있게 분배
 */
function balanceParagraphs(paragraphs: string[], maxLength: number): string[] {
  const parts: string[] = [];
  let currentPart = '';

  for (const paragraph of paragraphs) {
    const withNewParagraph = currentPart + (currentPart ? '\n\n' : '') + paragraph;
    
    if (withNewParagraph.length <= maxLength) {
      currentPart = withNewParagraph;
    } else {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = paragraph;
      } else {
        // 단일 문단이 너무 긴 경우 문장 단위로 분할
        const sentenceParts = splitText(paragraph, { maxLength, splitOnParagraph: false });
        parts.push(...sentenceParts.parts);
      }
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  return parts;
}

/**
 * 문장들을 균형있게 분배
 */
function balanceSentences(sentences: string[], maxLength: number): string[] {
  const parts: string[] = [];
  let currentPart = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i] + (i < sentences.length - 1 ? '. ' : '');
    const withNewSentence = currentPart + sentence;

    if (withNewSentence.length <= maxLength) {
      currentPart = withNewSentence;
    } else {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = sentence;
      } else {
        // 단일 문장이 너무 긴 경우 단어 단위로 분할
        const wordParts = splitText(sentence, { maxLength, splitOnSentence: false });
        parts.push(...wordParts.parts);
      }
    }
  }

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  return parts;
}

/**
 * 단어들을 균형있게 분배
 */
function balanceWords(words: string[], maxLength: number): string[] {
  const parts: string[] = [];
  let currentPart = '';

  for (const word of words) {
    const withNewWord = currentPart + (currentPart ? ' ' : '') + word;

    if (withNewWord.length <= maxLength) {
      currentPart = withNewWord;
    } else {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = word;
      } else {
        // 단일 단어가 너무 긴 경우
        parts.push(word);
      }
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  return parts;
}

/**
 * HTML 태그가 포함된 텍스트 분할
 */
function splitHtmlText(html: string, maxLength: number): SplitResult {
  // 단순 구현: HTML 태그를 고려하지 않고 텍스트만 추출해서 분할
  const textOnly = html.replace(/<[^>]*>/g, '');
  
  // 원본 HTML 구조를 유지하면서 분할하는 복잡한 로직은 필요시 구현
  return {
    parts: textOnly.length > maxLength ? [html.substring(0, maxLength)] : [html], // 임시로 원본 반환
    originalLength: html.length,
    splitMethod: 'paragraph'
  };
}

/**
 * 칼럼 높이를 기준으로 텍스트 분할
 */
export function splitTextByHeight(
  text: string, 
  containerHeight: number,
  fontSize: number = 16,
  lineHeight: number = 1.5
): SplitResult {
  // 대략적인 줄 수 계산
  const lineHeightPx = fontSize * lineHeight;
  const maxLines = Math.floor(containerHeight / lineHeightPx);
  const charactersPerLine = 40; // 대략적인 글자 수
  const maxLength = maxLines * charactersPerLine;

  return splitText(text, { maxLength });
}

/**
 * 2칼럼 레이아웃을 위한 텍스트 분할
 */
export function splitTextForTwoColumns(
  text: string,
  columnHeight: number,
  fontSize: number = 14,
  lineHeight: number = 1.6
): { leftColumn: string; rightColumn: string; hasOverflow: boolean } {
  const result = splitTextByHeight(text, columnHeight, fontSize, lineHeight);
  
  if (result.parts.length === 1) {
    return {
      leftColumn: result.parts[0],
      rightColumn: '',
      hasOverflow: false
    };
  }

  if (result.parts.length === 2) {
    return {
      leftColumn: result.parts[0],
      rightColumn: result.parts[1],
      hasOverflow: false
    };
  }

  // 3개 이상인 경우 오버플로 발생
  const leftColumn = result.parts[0];
  const rightColumn = result.parts[1];
  const remainingText = result.parts.slice(2).join(' ');
  
  return {
    leftColumn,
    rightColumn: rightColumn + (remainingText ? '...' : ''),
    hasOverflow: remainingText.length > 0
  };
}