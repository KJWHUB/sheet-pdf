import type { QuestionGroup } from '@/types/question';
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
      isFirstPart?: boolean;
      isLastPart?: boolean;
    }
  | {
      kind: 'question-stem-part';
      groupId: string;
      questionId: string;
      number: number;
      content: string; // html part
      estHeight: number;
      isFirstPart: boolean;
      isLastPart: boolean;
    }
  | {
      kind: 'choice-range';
      groupId: string;
      questionId: string;
      startIndex: number; // inclusive
      endIndex: number;   // inclusive
      estHeight: number;
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
const ITEM_GAP = 8; // small breathing room between items
// SAFETY_PX removed; fragmentation path measures per part

// (legacy estimate function removed; fragmentation path derives heights per part)

function estimateTextHeight(text: string, containerHeight: number): number {
  const maxLines = Math.floor(containerHeight / LINE_HEIGHT_PX);
  const lines = text
    .split(/\n/)
    .reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0);
  const usedLines = Math.min(lines, maxLines);
  return usedLines * LINE_HEIGHT_PX;
}

function estimateChoiceHeight(html: string): number {
  const t = htmlToPlainWithBreaks(html);
  const lines = Math.max(1, Math.ceil(t.length / CHARS_PER_LINE));
  return lines * LINE_HEIGHT_PX + 6; // small spacing per item
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
          const isFirst = partIndex === 0;
          const hasNext = !!rest;
          pushItem({
            kind: 'passage-part',
            groupId: group.id,
            title: isFirst ? group.title : undefined,
            content: first,
            estHeight: Math.min(h + ITEM_GAP, columnHeight),
            partNumber: partIndex + 1,
            totalParts: 0,
            isFirstPart: isFirst,
            isLastPart: !hasNext,
          });
          partIndex += 1;
          restHtml = rest;
          // keep filling the same column while space remains; column switch happens when space is too small
        }
      }

    // 2) Questions (fine-grained fragmentation: stem parts + choice ranges)
    for (const q of group.subQuestions) {
      // 2-1) Question stem: split by available height as needed
      let restStem = q.content || '';
      let stemPartIndex = 0;
      while (restStem) {
        const avail = side === 'left' ? remaining.left : remaining.right;
        if (avail < LINE_HEIGHT_PX * 1.2) { nextColumn(); continue; }
        const { first, rest } = takeFirstHtmlPartByHeight(
          restStem,
          avail,
          DEFAULT_FONT_SIZE,
          DEFAULT_LINE_HEIGHT,
          CHARS_PER_LINE
        );
        const h = estimateTextHeight(htmlToPlainWithBreaks(first), columnHeight);
        pushItem({
          kind: 'question-stem-part',
          groupId: group.id,
          questionId: q.id,
          number: q.number,
          content: first,
          estHeight: Math.min(h + ITEM_GAP, columnHeight),
          isFirstPart: stemPartIndex === 0,
          isLastPart: !rest,
        });
        stemPartIndex += 1;
        restStem = rest;
        // continue same column while we still have space; switch if space too small
        if (restStem) {
          const rem = side === 'left' ? remaining.left : remaining.right;
          if (rem <= LINE_HEIGHT_PX * 2) nextColumn();
        } else break;
      }

      // 2-2) Choices: pack by available height, allow multiple ranges
      const choices = q.choices || [];
      let ci = 0;
      while (ci < choices.length) {
        let avail = side === 'left' ? remaining.left : remaining.right;
        if (avail < LINE_HEIGHT_PX * 1.2) { nextColumn(); continue; }
        let end = ci - 1;
        let hsum = 0;
        for (let k = ci; k < choices.length; k++) {
          const ch = estimateChoiceHeight(choices[k].content);
          if (k === ci && ch > columnHeight) { // pathological, force place one
            end = k; hsum = Math.min(ch, columnHeight); break;
          }
          if (hsum + ch <= avail) { hsum += ch; end = k; }
          else break;
        }
        if (end < ci) { nextColumn(); continue; }
        pushItem({
          kind: 'choice-range',
          groupId: group.id,
          questionId: q.id,
          startIndex: ci,
          endIndex: end,
          estHeight: Math.min(hsum + ITEM_GAP, columnHeight),
        });
        ci = end + 1;
        // continue using same column unless remaining is too small
        if (ci < choices.length) {
          const rem = side === 'left' ? remaining.left : remaining.right;
          if (rem <= LINE_HEIGHT_PX * 2) nextColumn();
        }
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
          const isFirst = partIndex === 0;
          const hasNext = !!rest;
          push({
            kind: 'passage-part',
            groupId: group.id,
            title: isFirst ? group.title : undefined,
            content: first,
            estHeight: Math.min(h + ITEM_GAP, pageHeight),
            partNumber: partIndex + 1,
            totalParts: 0,
            isFirstPart: isFirst,
            isLastPart: !hasNext,
          });
          partIndex += 1;
          restHtml = rest;
          if (restHtml && remaining < LINE_HEIGHT_PX * 3) nextPage();
        }
      }

    for (const q of group.subQuestions) {
      // stem parts
      let restStem = q.content || '';
      let stemPartIndex = 0;
      while (restStem) {
        if (remaining < LINE_HEIGHT_PX * 1.2) nextPage();
        const { first, rest } = takeFirstHtmlPartByHeight(
          restStem,
          remaining,
          DEFAULT_FONT_SIZE,
          DEFAULT_LINE_HEIGHT,
          CHARS_PER_LINE
        );
        const h = estimateTextHeight(htmlToPlainWithBreaks(first), pageHeight);
        push({
          kind: 'question-stem-part',
          groupId: group.id,
          questionId: q.id,
          number: q.number,
          content: first,
          estHeight: Math.min(h + ITEM_GAP, pageHeight),
          isFirstPart: stemPartIndex === 0,
          isLastPart: !rest,
        });
        stemPartIndex += 1;
        restStem = rest;
        if (restStem) nextPage();
      }
      // choices
      const choices = q.choices || [];
      let ci = 0;
      while (ci < choices.length) {
        if (remaining < LINE_HEIGHT_PX * 1.2) nextPage();
        let end = ci - 1; let hsum = 0;
        for (let k = ci; k < choices.length; k++) {
          const ch = estimateChoiceHeight(choices[k].content);
          if (k === ci && ch > pageHeight) { end = k; hsum = Math.min(ch, pageHeight); break; }
          if (hsum + ch <= remaining) { hsum += ch; end = k; } else break;
        }
        if (end < ci) { nextPage(); continue; }
        push({
          kind: 'choice-range',
          groupId: group.id,
          questionId: q.id,
          startIndex: ci,
          endIndex: end,
          estHeight: Math.min(hsum + ITEM_GAP, pageHeight),
        });
        ci = end + 1;
        if (ci < choices.length) nextPage();
      }
    }
  }

  if (current.items.length) pages.push(current);
  return pages;
}
