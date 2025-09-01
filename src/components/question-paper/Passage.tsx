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
    <div className={`
      passage-container relative
      ${editMode.isEditing && passage.isEditable !== false ? 'cursor-text hover:bg-gray-50 rounded-md p-2 -m-2' : ''}
      ${isSelected ? 'ring-2 ring-blue-500 rounded-md p-2 -m-2' : ''}
    `}>
      {passage.title && (
        <h3 className="font-medium mb-3 text-gray-900">
          {passage.title}
        </h3>
      )}
      
      <div 
        className={`passage-content ${isEditing ? 'hidden' : 'block'}`}
        onClick={handleClick}
      >
        <div 
          className="text-sm leading-relaxed text-gray-900 min-h-[2rem] whitespace-pre-line"
          dangerouslySetInnerHTML={{
            __html: passage.content || '<span class="text-gray-400">지문을 입력하세요...</span>'
          }}
        />
      </div>

      {isEditing && (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] text-sm leading-relaxed border border-gray-300 p-2 bg-white resize-none focus-visible:ring-2 focus-visible:ring-blue-500"
          placeholder="지문을 입력하세요..."
        />
      )}

      {/* Edit hint */}
      {editMode.isEditing && passage.isEditable !== false && !isEditing && (
        <div className="absolute -top-2 right-0 text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">
          클릭하여 편집
        </div>
      )}
    </div>
  );
}