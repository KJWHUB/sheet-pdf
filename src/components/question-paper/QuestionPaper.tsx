import { useState } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { QuestionGroup } from './QuestionGroup';
import { PagedQuestionContainer } from './PagedQuestionContainer';
import { usePDF } from '@/hooks/usePDF';
import { FileText, Download, Edit, Eye, Loader } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

export function QuestionPaper() {
  const {
    questionPaper,
    layoutSettings,
    editMode,
    setLayoutType,
    setEditMode,
    reorderQuestionGroups,
  } = useQuestionStore();

  const { isGenerating, error, generateQuestionPaperPDF, clearError } = usePDF();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLayoutChange = (value: string) => {
    setLayoutType(value as 'single' | 'double');
  };

  const toggleEditMode = () => {
    setEditMode(!editMode.isEditing);
  };

  const handlePDFDownload = async () => {
    if (error) clearError();
    try {
      await generateQuestionPaperPDF();
    } catch (err) {
      // 에러는 이미 usePDF 훅에서 처리됨
      console.error('PDF 다운로드 실패:', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderQuestionGroups(active.id as string, over.id as string);
    }
    
    setActiveId(null);
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
    <div className={`min-h-screen ${
      editMode.isEditing 
        ? 'bg-slate-50' 
        : 'bg-gray-100'
    }`}>
      {/* Control Panel */}
      <div className="w-full px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-4 bg-white/95 backdrop-blur">
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
                  variant={editMode.isEditing ? "secondary" : "outline"}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePDFDownload}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      PDF 생성 중...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      PDF 내보내기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full px-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              <div className="flex items-center justify-between">
                <span>⚠️ {error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper Pages */}
      <div className="w-full px-6">
        <div className="flex justify-center">
          <div className="w-full max-w-none">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questionPaper.questionGroups.map(group => group.id)}
                strategy={verticalListSortingStrategy}
              >
                <PagedQuestionContainer
                  questionGroups={questionPaper.questionGroups}
                >
                  {(group, index) => (
                    <div 
                      className={`${
                        activeId === group.id ? 'transition-all duration-200 ease-out' : ''
                      }`}
                    >
                      <QuestionGroup 
                        group={group}
                        isFirst={index === 0}
                      />
                    </div>
                  )}
                </PagedQuestionContainer>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeId ? (
                  <div 
                    className="bg-white shadow-2xl border-2 border-blue-400 rounded-lg transform rotate-1 scale-105 z-[10000]"
                    style={{
                      width: '100%',
                      maxWidth: 'none',
                      cursor: 'grabbing'
                    }}
                  >
                    {(() => {
                      const group = questionPaper.questionGroups.find(g => g.id === activeId);
                      return group ? (
                        <QuestionGroup 
                          group={group}
                          isFirst={false}
                          isDragOverlay={true}
                        />
                      ) : null;
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Page Info는 PagedQuestionContainer에서 표시됨 */}

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
        
        @page {
          size: A4;
          margin: 20mm;
        }
      `}</style>
    </div>
  );
}