import { useState } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { QuestionGroup } from './QuestionGroup';
import { FileText, Download, Edit, Eye } from 'lucide-react';
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
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  PDF 내보내기
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Question Paper Pages */}
      <div className="w-full px-6">
        <div className="flex justify-center">
          {/* 현재는 단일 페이지로 모든 문제 그룹 표시 */}
          <div 
            className={`bg-white border ${
              editMode.isEditing 
                ? 'shadow-lg border-slate-300 rounded-lg' 
                : 'shadow-2xl border-gray-300'
            }`}
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm'
            }}
          >
            {/* 페이지 헤더 */}
            <div className="print:hidden mb-4 pb-2 border-b border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>페이지 1</span>
                <span>{questionPaper.questionGroups.length}개 문제 그룹</span>
                {editMode.isEditing && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    편집 모드
                  </span>
                )}
              </div>
            </div>
            
            {/* 문제 그룹들 */}
            <div className="space-y-6">
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
                  {questionPaper.questionGroups.map((group, index) => (
                    <div 
                      key={group.id} 
                      className={`${index > 0 ? "mt-8" : ""} ${
                        activeId === group.id ? 'transition-all duration-200 ease-out' : ''
                      }`}
                    >
                      <QuestionGroup 
                        group={group}
                        isFirst={index === 0}
                      />
                    </div>
                  ))}
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
      </div>

      {/* Page Info */}
      <div className="w-full px-6 mt-6 pb-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-4 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>총 {questionPaper.questionGroups.length}개 문제 그룹</span>
              <span>1 페이지</span>
            </div>
          </Card>
        </div>
      </div>

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