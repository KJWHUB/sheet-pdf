import { useState, useRef, useEffect } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import type { Passage as PassageType } from '@/types/question';

interface PassageProps {
  passage: PassageType;
  groupId: string;
}

export function Passage({ passage, groupId }: PassageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(passage.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    editMode,
    updateQuestionGroup,
    selectQuestion,
  } = useQuestionStore();

  const isSelected = editMode.selectedGroupId === groupId && !editMode.selectedQuestionId;

  useEffect(() => {
    setContent(passage.content);
  }, [passage.content]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isEditing]);

  const handleClick = () => {
    if (editMode.isEditing && passage.isEditable !== false) {
      setIsEditing(true);
      selectQuestion(groupId);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (content !== passage.content) {
      // Update the passage content in the store
      updateQuestionGroup(groupId, {
        passage: { ...passage, content }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(passage.content); // Reset to original
      setIsEditing(false);
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleBlur();
    }
  };

  return (
    <Card className={`
      passage-container p-4 border-l-4 border-l-blue-200 bg-blue-50/30
      ${editMode.isEditing && passage.isEditable !== false ? 'cursor-text hover:bg-blue-50/50' : ''}
      ${isSelected ? 'ring-2 ring-blue-500' : ''}
    `}>
      {passage.title && (
        <h3 className="font-medium mb-3 text-blue-900">
          {passage.title}
        </h3>
      )}
      
      <div 
        className={`passage-content ${isEditing ? 'hidden' : 'block'}`}
        onClick={handleClick}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 min-h-[2rem]">
          {passage.content || '지문을 입력하세요...'}
        </div>
      </div>

      {isEditing && (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] text-sm leading-relaxed border-0 p-0 bg-transparent resize-none focus-visible:ring-0"
          placeholder="지문을 입력하세요..."
        />
      )}

      {/* Edit hint */}
      {editMode.isEditing && passage.isEditable !== false && !isEditing && (
        <div className="absolute top-2 right-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          클릭하여 편집
        </div>
      )}
    </Card>
  );
}