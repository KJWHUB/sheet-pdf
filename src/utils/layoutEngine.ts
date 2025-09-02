import type { QuestionGroup, SubQuestion } from '@/types/question';
import { splitTextByHeight } from '@/utils/textSplitter';

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

function estimateQuestionHeight(q: SubQuestion): number {
  // Rough heuristic by type
  switch (q.type) {
    case 'multiple-choice':
      return 28 + (q.choices?.length || 4) * 24 + 12; // title + options + spacing
    case 'short-answer':
      return 50;
    case 'essay':
      return 100;
    case 'fill-in-blank':
      return 60;
    default:
      return 80;
  }
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
        const text = group.passage.content.replace(/<[^>]*>/g, '');
        const split = splitTextByHeight(
          text,
          columnHeight,
          DEFAULT_FONT_SIZE,
          DEFAULT_LINE_HEIGHT,
          CHARS_PER_LINE
        );
        const parts = split.parts.length ? split.parts : [text];

        parts.forEach((part, idx) => {
          const h = estimateTextHeight(part, columnHeight);
          // If not enough remaining height in current column, move to next column/page
          if ((side === 'left' && remaining.left < h) || (side === 'right' && remaining.right < h)) {
            nextColumn();
          }

          pushItem({
            kind: 'passage-part',
            groupId: group.id,
            title: group.title,
            content: part,
            estHeight: Math.min(h, columnHeight),
            partNumber: idx + 1,
            totalParts: parts.length,
          });

          // If this passage part used almost the whole column, move to next
          if (
            (side === 'left' && remaining.left < LINE_HEIGHT_PX * 2) ||
            (side === 'right' && remaining.right < LINE_HEIGHT_PX * 2)
          ) {
            nextColumn();
          }
        });
      }

    // 2) Questions
    let i = 0;
    while (i < group.subQuestions.length) {
      const q = group.subQuestions[i];
      const qh = estimateQuestionHeight(q);
      const avail = side === 'left' ? remaining.left : remaining.right;

      if (qh <= avail) {
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
        const text = group.passage.content.replace(/<[^>]*>/g, '');
        const split = splitTextByHeight(
          text,
          pageHeight,
          DEFAULT_FONT_SIZE,
          DEFAULT_LINE_HEIGHT,
          CHARS_PER_LINE
        );
        const parts = split.parts.length ? split.parts : [text];
        parts.forEach((part, idx) => {
          const h = estimateTextHeight(part, pageHeight);
          if (remaining < h) nextPage();
          push({
            kind: 'passage-part',
            groupId: group.id,
            title: group.title,
            content: part,
            estHeight: Math.min(h, pageHeight),
            partNumber: idx + 1,
            totalParts: parts.length,
          });
          if (remaining < LINE_HEIGHT_PX * 2) nextPage();
        });
      }

    let i = 0;
    while (i < group.subQuestions.length) {
      const q = group.subQuestions[i];
      const qh = estimateQuestionHeight(q);
      if (qh <= remaining) {
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

