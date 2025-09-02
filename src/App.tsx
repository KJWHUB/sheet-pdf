import { useEffect, useState } from "react";
import { useQuestionStore } from "@/stores/questionStore";
import { QuestionPaper } from "@/components/question-paper/QuestionPaper";
import { convertApiDataToQuestionPaper } from "@/utils/apiDataConverter";
import api from "@/api";
import type { Subject, ApiQuestionGroup } from "@/types/api";
import "./App.css";

function App() {
  const { setQuestionPaper } = useQuestionStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestionPaper = async () => {
      try {
        setLoading(true);
        setError(null);

        // 기본적으로 국어 데이터를 로드
        const subject: Subject = "KOREAN";
        const apiData = await api.getQuestions(subject);

        // API 데이터를 QuestionPaper 형태로 변환
        const paper = convertApiDataToQuestionPaper(apiData as ApiQuestionGroup[], subject);
        setQuestionPaper(paper);
      } catch (error) {
        console.error("Failed to load question paper:", error);
        setError("문제지를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestionPaper();
  }, [setQuestionPaper]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>문제지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full">
      <QuestionPaper />
    </main>
  );
}

export default App;
