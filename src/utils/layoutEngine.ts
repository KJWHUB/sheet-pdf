import type { QuestionGroup, SubQuestion } from '@/types/question';
import { htmlToPlainWithBreaks, takeFirstHtmlPartByHeight } from '@/utils/passageUtils';

export type RenderItem =
  | {
      kind: 'passage-part';
      groupId: string;
      title?: string;
      content: string; // plain text content
      estHeight: number;
      partNumber: number;
      totalParts: number;
    }
  | {
      kind: 'question-range';
      groupId: string;
      startIndex: number; // inclusive
      endIndex: number; // inclusive
      estHeight: number;
    };

export interface FlowPageDouble {
  left: RenderItem[];
  right: RenderItem[];
}

export interface FlowPageSingle {
  items: RenderItem[];
}

const DEFAULT_FONT_SIZE = 14; // px
const DEFAULT_LINE_HEIGHT = 1.6; // unitless
const LINE_HEIGHT_PX = DEFAULT_FONT_SIZE * DEFAULT_LINE_HEIGHT; // ~22.4px
const CHARS_PER_LINE = 20; // heuristic for narrow columns
const ITEM_GAP = 12; // modest breathing room between items
const SAFETY_PX = LINE_HEIGHT_PX * 0.6; // lighter headroom

function plain(text?: string): string {
  return (text || '').replace(/<[^>]*>/g, '');
}

function lineCountByWidth(text: string): number {
  if (!text) return 1;
  const lines = text
    .split(/\n/)
    .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0);
  return Math.max(1, lines);
}

function estimateQuestionHeight(q: SubQuestion): number {
  // If user provided explicit height, respect it (snap/dragged value)
  if (typeof q.height === 'number' && q.height > 0) {
    return Math.ceil(q.height + ITEM_GAP);
  }
  const baseText = plain(q.content);
  const baseLines = lineCountByWidth(baseText);
  let h = 12 + baseLines * LINE_HEIGHT_PX; // question text + spacing

  switch (q.type) {
    case 'multiple-choice': {
      const choices = q.choices || [];
      let choiceHeight = 8; // container padding
      for (const c of choices) {
        const clines = lineCountByWidth(plain(c.content));
        choiceHeight += clines * LINE_HEIGHT_PX + 6; // each option spacing
      }
      h += choiceHeight + 8;
      break;
    }
    case 'short-answer':
      h += 32; // answer line
      break;
    case 'essay':
      h += 80; // answer area
      break;
    case 'fill-in-blank':
      h += 24; // small extra input line
      break;
    default:
      h += 24;
  }
  // safety margin so items don't get clipped
  return Math.ceil(h + ITEM_GAP + SAFETY_PX);
}

function estimateTextHeight(text: string, containerHeight: number): number {
  const maxLines = Math.floor(containerHeight / LINE_HEIGHT_PX);
  const lines = text
    .split(/\n/)
    .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0);
  const usedLines = Math.min(lines, maxLines);
  return usedLines * LINE_HEIGHT_PX;
}

export function paginateQuestionGroupsDouble(
  groups: QuestionGroup[],
  columnHeight: number
): FlowPageDouble[] {
  const pages: FlowPageDouble[] = [];
  let current: FlowPageDouble = { left: [], right: [] };
  let side: 'left' | 'right' = 'left';
  let remaining = { left: columnHeight, right: columnHeight };

  const pushItem = (item: RenderItem) => {
    if (side === 'left') {
      current.left.push(item);
      remaining.left -= item.estHeight;
    } else {
      current.right.push(item);
      remaining.right -= item.estHeight;
    }
  };

  const nextColumn = () => {
    if (side === 'left') {
      side = 'right';
    } else {
      // new page
      pages.push(current);
      current = { left: [], right: [] };
      side = 'left';
      remaining = { left: columnHeight, right: columnHeight };
    }
  };

  for (const group of groups) {
    // 1) Passage parts
      if (group.passage?.content) {
        // HTML 보존 + 가용 높이에 맞춰 조각을 순차 배치 (빈칸 최소화)
        let restHtml = group.passage.content;
        let partIndex = 0;
        while (restHtml && (side === 'left' ? remaining.left : remaining.right) > LINE_HEIGHT_PX * 2) {
          const avail = side === 'left' ? remaining.left : remaining.right;
          const { first, rest } = takeFirstHtmlPartByHeight(
            restHtml,
            avail,
            DEFAULT_FONT_SIZE,
            DEFAULT_LINE_HEIGHT,
            CHARS_PER_LINE
          );
          const h = estimateTextHeight(htmlToPlainWithBreaks(first), columnHeight);
          pushItem({
            kind: 'passage-part',
            groupId: group.id,
            title: partIndex === 1 ? group.title : undefined,
            content: first,
            estHeight: Math.min(h + ITEM_GAP, columnHeight),
            partNumber: ++partIndex,
            totalParts: 0, // 채우기용 (렌더러는 유무만 사용)
          });
          restHtml = rest;
          if (restHtml) nextColumn();
        }
      }

    // 2) Questions
    let i = 0;
    while (i < group.subQuestions.length) {
      const q = group.subQuestions[i];
      const qh = estimateQuestionHeight(q);
      const avail = side === 'left' ? remaining.left : remaining.right;

      if (qh > columnHeight) {
        // Extremely tall item: place it alone and move on to avoid infinite loops
        pushItem({ kind: 'question-range', groupId: group.id, startIndex: i, endIndex: i, estHeight: columnHeight });
        i += 1;
        nextColumn();
      } else if (qh <= avail) {
        // place this question as a single range item
        pushItem({ kind: 'question-range', groupId: group.id, startIndex: i, endIndex: i, estHeight: qh });
        i += 1;
      } else {
        // move to next column/page and try again
        nextColumn();
      }
    }
  }

  // push last page if has content
  if (current.left.length || current.right.length) {
    pages.push(current);
  }

  return pages;
}

export function paginateQuestionGroupsSingle(
  groups: QuestionGroup[],
  pageHeight: number
): FlowPageSingle[] {
  const pages: FlowPageSingle[] = [];
  let current: FlowPageSingle = { items: [] };
  let remaining = pageHeight;

  const push = (item: RenderItem) => {
    current.items.push(item);
    remaining -= item.estHeight;
  };

  const nextPage = () => {
    pages.push(current);
    current = { items: [] };
    remaining = pageHeight;
  };

    for (const group of groups) {
      if (group.passage?.content) {
        let restHtml = group.passage.content;
        let partIndex = 0;
        while (restHtml) {
          const { first, rest } = takeFirstHtmlPartByHeight(
            restHtml,
            remaining,
            DEFAULT_FONT_SIZE,
            DEFAULT_LINE_HEIGHT,
            CHARS_PER_LINE
          );
          const h = estimateTextHeight(htmlToPlainWithBreaks(first), pageHeight);
          if (h > remaining) nextPage();
          push({
            kind: 'passage-part',
            groupId: group.id,
            title: partIndex === 1 ? group.title : undefined,
            content: first,
            estHeight: Math.min(h + ITEM_GAP, pageHeight),
            partNumber: ++partIndex,
            totalParts: 0,
          });
          restHtml = rest;
          if (restHtml && remaining < LINE_HEIGHT_PX * 3) nextPage();
        }
      }

    let i = 0;
    while (i < group.subQuestions.length) {
      const q = group.subQuestions[i];
      const qh = estimateQuestionHeight(q);
      if (qh > pageHeight) {
        // Force place and go next page to avoid infinite loops
        push({ kind: 'question-range', groupId: group.id, startIndex: i, endIndex: i, estHeight: pageHeight });
        i += 1;
        nextPage();
      } else if (qh <= remaining) {
        push({ kind: 'question-range', groupId: group.id, startIndex: i, endIndex: i, estHeight: qh });
        i += 1;
      } else {
        nextPage();
      }
    }
  }

  if (current.items.length) pages.push(current);
  return pages;
}
