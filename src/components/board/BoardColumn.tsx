import React, { useState, useRef, useEffect } from 'react';
import { BoardColumnId, Column, Task } from '@/types';
import { Plus, Pencil } from 'lucide-react';
import { SortableTask } from './SortableTask';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { COLUMN_META } from '@/constants/columns';

interface Props {
  column: Column;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (columnId: string, content: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onRenameColumn: (columnId: BoardColumnId, newTitle: string) => void;
}

export const BoardColumn: React.FC<Props> = ({
  column,
  tasks,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
  onRenameColumn,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [colTitleInput, setColTitleInput] = useState(column.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });

  useEffect(() => {
    setColTitleInput(column.title);
  }, [column.title]);

  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 10);
    }
  }, [isRenaming]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(column.id, newTaskText.trim());
      setNewTaskText('');
    }
    setIsAdding(false);
  };

  const commitRename = () => {
    onRenameColumn(column.id, colTitleInput);
    setIsRenaming(false);
  };

  const columnColor = COLUMN_META[column.id]?.dotColor || 'bg-[#00BCC5]';

  return (
    <div className="w-[290px] sm:w-[300px] shrink-0 flex flex-col max-h-full">
      <div className="group/col flex items-center justify-between mb-3 px-1 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full shrink-0 ${columnColor}`} />
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={colTitleInput}
              maxLength={60}
              onChange={(e) => setColTitleInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === 'Escape') {
                  setColTitleInput(column.title);
                  setIsRenaming(false);
                }
              }}
              className="w-full bg-[#161618] border border-[#00BCC5] rounded px-1.5 py-0.5 text-[13px] font-medium text-[#F7F8F8] outline-none"
            />
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h3
                onDoubleClick={() => setIsRenaming(true)}
                title="Двойной клик для переименования"
                className="font-medium text-[#F7F8F8] text-[13px] tracking-tight truncate cursor-text"
              >
                {column.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsRenaming(true)}
                className="p-0.5 text-[#555] hover:text-[#F7F8F8] opacity-0 group-hover/col:opacity-100 transition-opacity cursor-pointer shrink-0"
                title="Переименовать колонку"
                aria-label="Переименовать колонку"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
        </div>
        <span className="text-[11px] font-medium text-[#8A8F98] tabular-nums shrink-0">
          {tasks.length}
        </span>
      </div>

      {/* Scrollable area for cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2 pb-2 min-h-[100px] rounded-xl transition-colors ${
          isOver ? 'bg-[#1A1A1C]/50' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onSelect={onSelectTask}
            />
          ))}
        </SortableContext>

        {isAdding ? (
          <form onSubmit={handleAdd} className="mt-2">
            <input
              type="text"
              autoFocus
              maxLength={500}
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setNewTaskText('');
                  setIsAdding(false);
                }
              }}
              className="w-full bg-[#161618] border border-[#00BCC5] rounded-xl p-3 text-[13px] text-[#F7F8F8] outline-none"
              placeholder={
                column.id === 'habits' ? 'Новая привычка...' : 'Введите задачу...'
              }
            />
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-[13px] text-[#8A8F98] hover:text-[#F7F8F8] p-2 hover:bg-[#1A1A1C] rounded-lg transition-colors mt-1 w-full text-left font-medium cursor-pointer"
          >
            <Plus size={14} />
            <span>{column.id === 'habits' ? 'Новая привычка' : 'Новая задача'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
