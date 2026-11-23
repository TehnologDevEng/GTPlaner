import React, { useState, useRef, useEffect } from 'react';
import { Task } from '@/types';
import { GripVertical, Circle, CheckCircle2, Pencil, Trash2, Flame, FileText, ListChecks } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  onSelect?: (task: Task) => void;
  isOverlay?: boolean;
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-sky-400',
};

export const SortableTask: React.FC<Props> = ({
  task,
  onToggle,
  onUpdate,
  onDelete,
  onSelect,
  isOverlay,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.content);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: isEditing,
  });

  useEffect(() => {
    if (isEditing) {
      setEditValue(task.content);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isEditing, task.content]);

  const commitEdit = () => {
    const clean = editValue.trim();
    if (clean && clean !== task.content && onUpdate) {
      onUpdate(task.id, { content: clean });
    }
    setIsEditing(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: isEditing ? ('auto' as const) : ('none' as const),
  };

  const subtasksTotal = task.subtasks?.length || 0;
  const subtasksDone = task.subtasks?.filter((s) => s.checked).length || 0;
  const hasNotes = Boolean(task.notes && task.notes.trim().length > 0);
  const showStreak = task.columnId === 'habits' && (task.streak || 0) > 0;
  const hasMeta = showStreak || subtasksTotal > 0 || hasNotes || Boolean(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isOverlay && !isEditing ? attributes : {})}
      {...(!isOverlay && !isEditing ? listeners : {})}
      onDoubleClick={(e) => {
        if (isOverlay || !onUpdate) return;
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`group relative bg-[#161618] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-xl p-3 transition-colors shadow-sm ${
        isEditing ? 'border-[#00BCC5] cursor-text' : 'cursor-grab active:cursor-grabbing draggable-card touch-none select-none'
      } ${isDragging && !isOverlay ? 'opacity-30 scale-[0.98]' : 'opacity-100'} ${
        isOverlay
          ? 'shadow-2xl shadow-black/80 border-[#00BCC5]/50 scale-105 rotate-1 cursor-grabbing bg-[#1E1E22] ring-1 ring-[#00BCC5]/40'
          : ''
      }`}
    >
      <div className="absolute left-1.5 top-3.5 text-[#555] opacity-40 group-hover:opacity-90 transition-opacity p-0.5">
        <GripVertical size={13} />
      </div>

      <div className="flex items-start gap-2.5 pl-3.5 pr-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className="mt-[2px] text-[#8A8F98] hover:text-[#00BCC5] transition-colors shrink-0 cursor-pointer"
          aria-label="Отметить задачу"
        >
          {task.checked ? (
            <CheckCircle2 size={15} className="text-[#00BCC5]" />
          ) : (
            <Circle size={15} strokeWidth={2.3} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              maxLength={500}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsEditing(false);
                }
              }}
              className="w-full bg-transparent text-[13px] leading-snug font-medium text-[#F7F8F8] outline-none"
            />
          ) : (
            <p
              onPointerDown={(e) => {
                // Allow click without interfering with long drag
                if (e.detail === 2) e.stopPropagation();
              }}
              onClick={(e) => {
                if (isOverlay || !onSelect) return;
                e.stopPropagation();
                onSelect(task);
              }}
              className={`text-[13px] leading-snug font-medium tracking-tight mt-[1px] break-words ${
                task.checked ? 'text-[#555] line-through' : 'text-[#DEDEDE]'
              } ${onSelect ? 'cursor-pointer hover:text-white' : ''}`}
            >
              {task.content}
            </p>
          )}

          {/* Clean unboxed metadata row */}
          {!isEditing && hasMeta && (
            <div className="flex items-center flex-wrap gap-2.5 mt-1.5 text-[11px] text-[#7A7F88] tabular-nums">
              {task.priority && PRIORITY_DOT[task.priority] && (
                <span className="inline-flex items-center gap-1" title="Приоритет">
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                  <span>
                    {task.priority === 'high'
                      ? 'Высокий'
                      : task.priority === 'medium'
                      ? 'Средний'
                      : 'Низкий'}
                  </span>
                </span>
              )}
              {showStreak && (
                <span className="inline-flex items-center gap-1 text-amber-400/90 font-medium">
                  <Flame size={11} />
                  <span>{task.streak} дн.</span>
                </span>
              )}
              {subtasksTotal > 0 && (
                <span className="inline-flex items-center gap-1">
                  <ListChecks size={11} />
                  <span>
                    {subtasksDone}/{subtasksTotal}
                  </span>
                </span>
              )}
              {hasNotes && (
                <span className="inline-flex items-center gap-1" title="Есть заметка">
                  <FileText size={11} />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover quick actions */}
        {!isOverlay && !isEditing && (onUpdate || onDelete) && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 -mr-1">
            {onUpdate && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 text-[#666] hover:text-[#F7F8F8] hover:bg-[#242428] rounded transition-colors cursor-pointer"
                title="Редактировать"
                aria-label="Редактировать задачу"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1 text-[#666] hover:text-[#EA4335] hover:bg-[#EA4335]/10 rounded transition-colors cursor-pointer"
                title="Удалить"
                aria-label="Удалить задачу"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
