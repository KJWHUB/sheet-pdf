import { useQuestionStore } from '@/stores/questionStore';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { QuestionGroup } from './QuestionGroup';
import { FileText, Download, Edit, Eye } from 'lucide-react';

export function QuestionPaper() {
  const {
    questionPaper,
    layoutSettings,
    editMode,
    setLayoutType,
    setEditMode,
  } = useQuestionStore();

  const handleLayoutChange = (value: string) => {
    setLayoutType(value as 'single' | 'double');
  };

  const toggleEditMode = () => {
    setEditMode(!editMode.isEditing);
  };

  if (!questionPaper) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>문제지 데이터를 불러오세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Control Panel */}
      <div className="max-w-6xl mx-auto mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">{questionPaper.title}</h1>
              <Select value={layoutSettings.layout} onValueChange={handleLayoutChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">1분할</SelectItem>
                  <SelectItem value="double">2분할</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={editMode.isEditing ? "default" : "outline"}
                size="sm"
                onClick={toggleEditMode}
              >
                {editMode.isEditing ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    미리보기
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    편집
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PDF 내보내기
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Question Paper Pages */}
      <div className="max-w-6xl mx-auto">
        <div 
          className={`paper-container ${
            layoutSettings.layout === 'double' ? 'grid grid-cols-2 gap-6' : 'grid grid-cols-1'
          }`}
        >
          {questionPaper.questionGroups.map((group, index) => (
            <QuestionGroup 
              key={group.id} 
              group={group}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Page Info */}
      <div className="max-w-6xl mx-auto mt-6">
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>총 {questionPaper.questionGroups.length}개 문제 그룹</span>
            <span>{questionPaper.totalPages} 페이지</span>
          </div>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .paper-container {
            background: white;
            box-shadow: none;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        .paper-container {
          background: white;
          min-height: 297mm; /* A4 height */
        }
        
        @page {
          size: A4;
          margin: 20mm;
        }
      `}</style>
    </div>
  );
}