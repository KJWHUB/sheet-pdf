import { useEffect } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { QuestionPaper } from '@/components/question-paper/QuestionPaper';
import { fetchQuestionPaper } from '@/utils/sampleData';
import "./App.css";

function App() {
  const { setQuestionPaper } = useQuestionStore();

  useEffect(() => {
    const loadQuestionPaper = async () => {
      try {
        const paper = await fetchQuestionPaper();
        setQuestionPaper(paper);
      } catch (error) {
        console.error('Failed to load question paper:', error);
      }
    };

    loadQuestionPaper();
  }, [setQuestionPaper]);

  return <QuestionPaper />;
}

export default App;
