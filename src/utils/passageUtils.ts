import { splitTextForTwoColumns, splitText } from './textSplitter';
import type { Passage as PassageType } from '@/types/question';

export interface PassagePart {
  content: string;
  isPartial: boolean;
  partNumber?: number;
  totalParts?: number;
}

/**
 * HTML 문자열에서 줄바꿈 정보를 최대한 보존하며 순수 텍스트로 변환
 * - <br>, 블록 요소의 닫힘 태그를 줄바꿈으로 치환
 * - 나머지 태그 제거
 */
export function htmlToPlainWithBreaks(html: string): string {
  if (!html) return '';
  let s = html;
  // BR → 개행
  s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  // 블록 레벨 요소 닫힘 시 개행 추가
  s = s.replace(/<\s*\/(p|div|li|h[1-6]|ul|ol|blockquote|pre)\s*>/gi, '\n');
  // 여는 태그 제거(개행은 위에서 처리)
  s = s.replace(/<[^>]+>/g, '');
  // HTML 엔티티 최소 처리
  s = s.replace(/&nbsp;/gi, ' ');
  return s;
}

/**
 * HTML을 블록 단위로 나누고, 높이 추정치 기준으로 부분 HTML들을 반환합니다.
 * 태그는 그대로 보존되며, 가능한 한 블록 경계에서만 분할합니다.
 */
export function splitHtmlByEstimatedHeight(
  html: string,
  containerHeight: number,
  fontSize: number = 14,
  lineHeight: number = 1.6,
  charsPerLine: number = 20
): { parts: string[]; splitMethod: 'html-block' } {
  const linePx = fontSize * lineHeight;
  const maxLines = Math.max(1, Math.floor(containerHeight / linePx));
  const maxChars = maxLines * charsPerLine;
  const orphanThresholdChars = Math.max(charsPerLine, Math.floor(charsPerLine * 1.5)); // 1~1.5줄 남기면 다음 칼럼으로

  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 단일 루트 요소라면 루트 보존
  const singleRoot = temp.children.length === 1 && temp.childNodes.length === 1;
  const rootEl = singleRoot ? (temp.children[0] as HTMLElement) : null;
  const nodes = rootEl ? Array.from(rootEl.childNodes) : Array.from(temp.childNodes);

  const blocks: string[] = [];
  nodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = (n.textContent ?? '').trim();
      if (text) blocks.push(text);
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as HTMLElement;
      if (el.tagName.toLowerCase() === 'br') {
        blocks.push('<br />');
      } else {
        blocks.push(el.outerHTML);
      }
    }
  });

  const parts: string[] = [];
  let current: string[] = [];
  let currentChars = 0;

  const flush = () => {
    if (!current.length) return;
    const inner = current.join('');
    if (rootEl) {
      const attrs = Array.from(rootEl.attributes)
        .map((a) => `${a.name}="${a.value}"`)
        .join(' ');
      const wrapped = `<${rootEl.tagName.toLowerCase()}${attrs ? ' ' + attrs : ''}>${inner}</${rootEl.tagName.toLowerCase()}>`;
      parts.push(wrapped);
    } else {
      parts.push(inner);
    }
    current = [];
    currentChars = 0;
  };

  for (const b of blocks) {
    const textForMeasure = htmlToPlainWithBreaks(b);
    const size = Math.max(1, textForMeasure.length);
    const willBe = currentChars + size;
    const leftover = maxChars - willBe;

    // 1) 넘치면 우선 flush
    if (currentChars > 0 && willBe > maxChars) {
      flush();
    }
    // 2) 남는 공간이 너무 적으면(고아 줄 방지) 미리 넘기기
    else if (currentChars > 0 && leftover > 0 && leftover < orphanThresholdChars) {
      flush();
    }

    current.push(b);
    currentChars += size;
  }
  flush();

  return { parts: parts.length ? parts : [html], splitMethod: 'html-block' };
}

/**
 * 여러 페이지에 걸쳐 표시되는 지문을 위한 유틸리티 함수
 */
export function getPassageParts(passage: PassageType, maxHeight: number, layoutSettings: { layout: string }): PassagePart[] {
  if (!passage.content) return [{ content: '', isPartial: false }];

  const textContent = htmlToPlainWithBreaks(passage.content);
  
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
