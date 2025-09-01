import { useState, useRef, useEffect } from 'react';
import { useQuestionStore } from '@/stores/questionStore';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SubQuestion, Choice } from '@/types/question';
import { Plus, X } from 'lucide-react';

interface QuestionProps {
  question: SubQuestion;
  groupId: string;
  isFirst?: boolean;
}

export function Question({ question, groupId, isFirst = false }: QuestionProps) {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [content, setContent] = useState(question.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    editMode,
    updateSubQuestion,
    selectQuestion,
  } = useQuestionStore();

  const isSelected = editMode.selectedQuestionId === question.id;

  useEffect(() => {
    setContent(question.content);
  }, [question.content]);

  const handleContentClick = () => {
    if (editMode.isEditing && question.isEditable !== false) {
      setIsEditingContent(true);
      selectQuestion(groupId, question.id);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleContentBlur = () => {
    setIsEditingContent(false);
    if (content !== question.content) {
      updateSubQuestion(groupId, question.id, { content });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(question.content);
      setIsEditingContent(false);
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleContentBlur();
    }
  };

  const handleChoiceUpdate = (choiceId: string, updates: Partial<Choice>) => {
    const updatedChoices = question.choices?.map(choice =>
      choice.id === choiceId ? { ...choice, ...updates } : choice
    );
    updateSubQuestion(groupId, question.id, { choices: updatedChoices });
  };

  const handleAddChoice = () => {
    const newChoice: Choice = {
      id: `choice-${Date.now()}`,
      number: (question.choices?.length || 0) + 1,
      content: '',
    };
    const updatedChoices = [...(question.choices || []), newChoice];
    updateSubQuestion(groupId, question.id, { choices: updatedChoices });
  };

  const handleRemoveChoice = (choiceId: string) => {
    const updatedChoices = question.choices?.filter(choice => choice.id !== choiceId);
    updateSubQuestion(groupId, question.id, { choices: updatedChoices });
  };

  return (
    <div className={`
      question-container
      ${isSelected ? 'ring-2 ring-blue-500 rounded-lg p-2 -m-2' : ''}
    `}>
      {/* Question Number and Content */}
      <div className="flex gap-3 mb-3">
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-900 text-white text-sm font-medium rounded-full">
            {question.number}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          {!isEditingContent ? (
            <div 
              className={`
                question-content text-sm leading-relaxed min-h-[1.5rem] cursor-text
                ${editMode.isEditing && question.isEditable !== false ? 'hover:bg-gray-50 rounded px-1' : ''}
              `}
              onClick={handleContentClick}
            >
              {question.content || '문제 내용을 입력하세요...'}
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentBlur}
              onKeyDown={handleKeyDown}
              className="text-sm leading-relaxed border-0 p-1 bg-transparent resize-none focus-visible:ring-0 min-h-[3rem]"
              placeholder="문제 내용을 입력하세요..."
            />
          )}
        </div>

        {/* Question Points */}
        {question.points && (
          <div className="flex-shrink-0 text-xs text-muted-foreground">
            [{question.points}점]
          </div>
        )}
      </div>

      {/* Multiple Choice Options */}
      {question.type === 'multiple-choice' && question.choices && (
        <div className="ml-9 space-y-2">
          {question.choices.map((choice) => (
            <ChoiceItem
              key={choice.id}
              choice={choice}
              onUpdate={(updates) => handleChoiceUpdate(choice.id, updates)}
              onRemove={() => handleRemoveChoice(choice.id)}
              isEditing={editMode.isEditing}
              canRemove={question.choices!.length > 1}
            />
          ))}
          
          {editMode.isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddChoice}
              className="h-8 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              선택지 추가
            </Button>
          )}
        </div>
      )}

      {/* Short Answer */}
      {question.type === 'short-answer' && (
        <div className="ml-9 mt-2">
          <div className="border-b border-gray-300 w-32 h-6"></div>
        </div>
      )}

      {/* Essay Answer */}
      {question.type === 'essay' && (
        <div className="ml-9 mt-2">
          <div className="border border-gray-300 rounded h-20 bg-gray-50/30"></div>
        </div>
      )}

      {/* Fill-in-blank */}
      {question.type === 'fill-in-blank' && (
        <div className="ml-9 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">정답:</span>
            <div className="border-b border-gray-300 w-24 h-6"></div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ChoiceItemProps {
  choice: Choice;
  onUpdate: (updates: Partial<Choice>) => void;
  onRemove: () => void;
  isEditing: boolean;
  canRemove: boolean;
}

function ChoiceItem({ choice, onUpdate, onRemove, isEditing, canRemove }: ChoiceItemProps) {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [content, setContent] = useState(choice.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(choice.content);
  }, [choice.content]);

  const handleClick = () => {
    if (isEditing) {
      setIsEditingContent(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleBlur = () => {
    setIsEditingContent(false);
    if (content !== choice.content) {
      onUpdate({ content });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(choice.content);
      setIsEditingContent(false);
    }
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="flex-shrink-0 text-sm font-medium w-4">
        ②{choice.number}
      </span>
      
      <div className="flex-1">
        {!isEditingContent ? (
          <div 
            className={`
              text-sm min-h-[1.5rem] px-1 cursor-text
              ${isEditing ? 'hover:bg-gray-50 rounded' : ''}
            `}
            onClick={handleClick}
          >
            {choice.content || '선택지 내용을 입력하세요...'}
          </div>
        ) : (
          <Input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="text-sm h-8 border-0 p-1 bg-transparent focus-visible:ring-0"
            placeholder="선택지 내용을 입력하세요..."
          />
        )}
      </div>

      {isEditing && canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}