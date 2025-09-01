import type { QuestionPaper } from '@/types/question';

export const sampleQuestionPaper: QuestionPaper = {
  id: 'paper-1',
  title: '국어 문제지',
  description: '다음 글을 읽고 물음에 답하시오.',
  layout: 'double',
  totalPages: 2,
  paperSize: 'A4',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  settings: {
    showQuestionNumbers: true,
    showAnswers: false,
    allowEdit: true,
  },
  pageBreaks: [],
  questionGroups: [
    {
      id: 'group-1',
      title: '[1~3] 다음 글을 읽고 물음에 답하시오.',
      layout: 'single',
      isEditable: true,
      passage: {
        id: 'passage-1',
        content: `민중 궁기는 일상적으로 유용하게 활용할 수 있는 독서 전략이다. 민중 궁기는 정보를 머릿속에 저장하고 기억한 내용을 떠올리는 데 도움이 된다. 독자로 하여금 표시한 부분에 주위를 기울이도록 해 정보를 머릿속에 저장하도록 돕고, 표시한 부분이 독자에게 시각적 자극을 주어 기억한 내용을 떠올리는 데 단서가 되기 때문이다. 이러한 점에서 민중 궁기는 일반적인 독서 상황뿐 아니라 학습 상황에서도 유용하다. 또한 민중 궁기는 방대한 정보를 가진데 주요한 정보를 추리는 데에도 효과적이며, 표시한 부분이 집중의 실처에 깊은 역할을 하여 독자가 내용을 다시 찾아보는 데에도 유익하다.

독상적으로 독자는 글을 읽는 중에 머리에서 민중 궁기를 한다. 그러나 보편 민족이 많아지고 학습에서 민중 궁기의 효과가 줄어든다. 또한 민중 궁기를 신중하게 하지 않으면 잘못 표시한 민족을 잘제하기 위해 되돌아가느라 독서의 효율이 방해받게 되므로 효과적으로 민중 궁기를 하는 것이 중요하다.

민중 궁기의 효과를 얻기 위한 방법에는 몇 가지가 있다. 우선 글을 읽는 중에는 문장이나 문단에 나타난 정보 간의 상대적 중요도를 결정할 때까지 민중 궁기를 잠시 미뤄두거나 주요한 정보에 민중 궁기를 하다. 이때 주요한 정보는 독서 목적에 따라 달라질 수 있다는 점을 고려하다 한다. 또한 자신만의 민중 궁기 표시 체계를 세워 민족 이에에 다른 기호도 사용할 수 있다. 민중 궁기 표시 체계는 민족 콩기가 머리 정확 능는 것이며, 예를 하나의 기준으로 유옆 수 있는 정보들 등한 기호를 부여거나 순차적인 번호를 부여기도 하는 것 같이다. 이는 기본적인 민중 궁기를 확장한 방식이라 할 수 있다.

민중 궁기는 어떤 수준의 독서력도 쉽게 사용할 수 있는는 점 때문에 연결 없이 능숙하게 사용할 수 있고 오래되어 온 것이다. 그러나 본격적으로 민중 궁기는 주요한 정보가 무엇인지에 대한 판단이 선행되어야 한다는 점에서 단순하지 않다. (가) 민중 궁기의 방법을 이해하고 잘 사용하는 것은 글을 능숙적으로 읽어 나가는 데 도움이 될 수 있다.`,
        isEditable: true,
      },
      subQuestions: [
        {
          id: 'q1',
          number: 1,
          type: 'multiple-choice',
          content: '위 글의 내용과 일치하지 않는 것은?',
          isEditable: true,
          choices: [
            {
              id: 'q1-c1',
              number: 1,
              content: '민중 궁기는 일반적인 독서 상황에서 도움이 된다.',
            },
            {
              id: 'q1-c2',
              number: 2,
              content: '글 전체에 주의를 기울일 수 있도록 글을 읽고 있는 때에는 민중 궁기를 하지 않는다.',
            },
            {
              id: 'q1-c3',
              number: 3,
              content: '민중 궁기는 누구나 연결 없이도 능숙하게 사용할 수 있는 전략이다.',
            },
            {
              id: 'q1-c4',
              number: 4,
              content: '민중 궁기로 표시한 부분을 독자가 내용을 다시 찾아보는 데 유용하다.',
            },
            {
              id: 'q1-c5',
              number: 5,
              content: '민중 궁기로 표시한 부분이 독자에게 시각적 자극을 주어 기억한 내용을 떠올리는 데 도움이 된다.',
            },
          ],
        },
        {
          id: 'q2',
          number: 2,
          type: 'multiple-choice',
          content: '(가)에 해당하는 내용으로 가장 적절한 것은?',
          isEditable: true,
          choices: [
            {
              id: 'q2-c1',
              number: 1,
              content: '글을 다시 읽을 때를 대비해서 되돌아 많은 부분에 민중 궁기를 하며 읽는다.',
            },
            {
              id: 'q2-c2',
              number: 2,
              content: '글 전체에 주의를 기울일 수 있도록 글을 읽고 있는 때에는 민중 궁기를 하지 않는다.',
            },
            {
              id: 'q2-c3',
              number: 3,
              content: '정보의 중요성을 판단하기 어려우면 우선 민중 궁기를 한 후 작성 그대로 민주슨다.',
            },
            {
              id: 'q2-c4',
              number: 4,
              content: '우요한 정보를 주일 수 있도록 자신이 만든 민중 궁기 표시 체계에 따라 민중 궁기를 한다.',
            },
            {
              id: 'q2-c5',
              number: 5,
              content: '글에 밑줄이는 어찌가 의미가 비슷한 문장이 나올 때마다 바로바로 민중 궁기를 하며 글을 읽는다.',
            },
          ],
        },
        {
          id: 'q3',
          number: 3,
          type: 'multiple-choice',
          content: '윗글을 바탕으로 학생이 다음과 같이 민중 궁기를 했다고 할 때, 이에 대한 평가로 적절하지 않은 것은? [3점]',
          points: 3,
          isEditable: true,
          choices: [
            {
              id: 'q3-c1',
              number: 1,
              content: '독서 목적을 고려하면, 1문단에서 \'___\'로 표시한 부분은 적절하지 않게 민중 궁기를 하였군.',
            },
            {
              id: 'q3-c2',
              number: 2,
              content: '독서 목적을 고려하면, 1문단에서 \'ㅁ\'~\'ㅂ\'과 같이 순차적인 번호로 표시한 부분은 적절하지 않게 민중 궁기를 하였군.',
            },
            {
              id: 'q3-c3',
              number: 3,
              content: '2문단에서 \'___\'로 표시한 부분을 보니, 독서 목적에 관련된 주요 정보를 위주하는 기술을 한다.',
            },
            {
              id: 'q3-c4',
              number: 4,
              content: '독서 목적을 고려하면, 2문단에서는 \'저트리는 때와 정단 노율이 같은 일대에 \'ㄱ\'을 두하였군.',
            },
            {
              id: 'q3-c5',
              number: 5,
              content: '독서 목적을 고려하였구니, 독서 목적과 관련이 있게 부여한 다른 표시와 함께 3문단에 민중 궁기를 하였군.',
            },
          ],
        },
      ],
    },
  ],
};

// Mock API function
export const fetchQuestionPaper = async (): Promise<QuestionPaper> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return sampleQuestionPaper;
};