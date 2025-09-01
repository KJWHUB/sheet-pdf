# PDF 문제지 편집기 구현 계획

## 프로젝트 개요
shadcn/ui + Tailwind CSS 기반으로 API 데이터를 활용한 편집 가능한 PDF 문제지 시스템 구현

## 주요 요구사항
1. **PDF 화면과 일치하는 문제지 형식** - API 데이터 기반 렌더링
2. **1분할/2분할 레이아웃 지원** - 동적 레이아웃 전환
3. **동적 높이 계산** - 문제 렌더링 시 자동 페이지 분할
4. **크기 조절 가능** - 드래그로 문제 영역 확대/축소
5. **실시간 재배치** - 높이 변경 시 자동 문제 이동
6. **PDF/인쇄 기능** - 편집 내용 그대로 출력

## 데이터 구조
```typescript
- QuestionGroup (최상위 문제 그룹)
  └── SubQuestions (개별 문제들)
  └── Passage (지문)
```

## 기술 스택
- **Frontend**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **상태관리**: Zustand
- **PDF생성**: html2canvas + jspdf
- **리사이징**: 커스텀 드래그 핸들러
- **높이계산**: ResizeObserver

## 구현 단계별 계획

### 1단계: 프로젝트 기반 설정 (30분)
#### 라이브러리 설치
```bash
npm install zustand html2canvas jspdf
pnpm dlx shadcn@latest add card input textarea select separator
```

#### 폴더 구조
```
src/
├── components/
│   ├── question-paper/     # 문제지 관련 컴포넌트
│   │   ├── QuestionPaper.tsx
│   │   ├── QuestionGroup.tsx
│   │   ├── Question.tsx
│   │   ├── Passage.tsx
│   │   └── ResizableContainer.tsx
│   └── ui/                 # shadcn/ui 컴포넌트
├── hooks/                  # 커스텀 훅
│   ├── usePageCalculation.ts
│   ├── useResize.ts
│   └── usePDF.ts
├── stores/                 # zustand 스토어
│   └── questionStore.ts
├── types/                  # 타입 정의
│   └── question.ts
└── utils/                  # 유틸리티
    ├── pageCalculation.ts
    └── pdfGenerator.ts
```

### 2단계: 데이터 구조 및 상태 관리 (45분)
#### TypeScript 인터페이스
```typescript
interface QuestionGroup {
  id: string;
  title?: string;
  passage?: Passage;
  subQuestions: SubQuestion[];
  layout: 'single' | 'double';
  height?: number;
}

interface SubQuestion {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  content: string;
  choices?: Choice[];
  height?: number;
}

interface Passage {
  id: string;
  content: string;
  height?: number;
}
```

#### Zustand 스토어
- 문제지 데이터 관리
- 편집 모드 상태
- 레이아웃 설정
- 페이지 분할 상태

### 3단계: 기본 레이아웃 시스템 (60분)
- A4 크기 기준 페이지 컨테이너
- 1분할/2분할 토글 기능
- CSS Grid 기반 반응형 레이아웃
- 페이지 경계 시각화

### 4단계: 문제 컴포넌트 구현 (90분)
- **QuestionGroup**: 문제 그룹 래퍼
- **Passage**: 지문 표시 및 편집
- **Question**: 개별 문제 렌더링
- **MultipleChoice**: 객관식 선택지
- 편집 가능한 텍스트 영역

### 5단계: 동적 높이 계산 및 페이지 분할 (120분)
#### 핵심 기능
- ResizeObserver로 실시간 높이 감지
- 페이지 높이 초과 시 자동 분할
- 문제 단위 페이지 이동
- 페이지 브레이크 처리

#### 알고리즘
1. 각 문제의 렌더링된 높이 측정
2. 누적 높이가 페이지 한계 초과 시 분할
3. 분할된 문제들을 다음 페이지로 이동
4. 레이아웃 재계산 및 업데이트

### 6단계: 리사이징 기능 (75분)
- 드래그 핸들을 통한 영역 조절
- 리사이징 시 다른 요소들 자동 재배치
- 최소/최대 높이 제한
- 상태 저장 및 복원

### 7단계: 인쇄/PDF 기능 (60분)
- CSS `@media print` 스타일
- html2canvas로 HTML을 이미지 변환
- jspdf로 PDF 생성
- 페이지 분할 최적화

### 8단계: UI/UX 개선 (45분)
- 실제 문제지와 동일한 스타일
- 편집 모드 툴바
- 반응형 디자인
- 접근성 개선

### 9단계: 테스트 및 최적화 (30분)
- 성능 최적화
- 크로스 브라우저 테스트
- 인쇄 품질 검증

## 주요 기술적 과제

### 1. 높이 계산 정확도
- 텍스트 렌더링 후 실제 높이 측정
- 폰트, 줄간격, 패딩 등 고려
- 브라우저 간 차이 해결

### 2. 페이지 분할 로직
- 문제를 중간에 자르지 않고 통째로 이동
- 지문과 문제의 연관성 유지
- 최적 분할점 찾기

### 3. 실시간 리사이징
- 부드러운 UI 반응
- 성능 최적화 (debouncing/throttling)
- 상태 동기화

### 4. PDF 품질 보장
- 고해상도 이미지 생성
- 텍스트 선명도 유지
- 레이아웃 일관성

## 커밋 전략
각 단계별로 기능 완성 시 커밋:
- `feat: setup project structure and dependencies`
- `feat: implement data types and zustand store`
- `feat: create basic layout system`
- `feat: implement question components`
- `feat: add dynamic height calculation and page breaks`
- `feat: implement resizing functionality`
- `feat: add PDF export feature`
- `feat: improve UI/UX and styling`
- `feat: optimize performance and add tests`

## 예상 작업 시간
총 **7-8시간** (각 단계별 30분-2시간)