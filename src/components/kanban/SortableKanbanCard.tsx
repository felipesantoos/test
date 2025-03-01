import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanCard } from './KanbanCard';

interface SortableKanbanCardProps {
  issue: any;
  getPriorityColor: (priority: string) => string;
  onEditIssue: (issue: any) => void;
  statusId: string;
}

export const SortableKanbanCard: React.FC<SortableKanbanCardProps> = ({ 
  issue,
  getPriorityColor,
  onEditIssue,
  statusId
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `issue-${issue.id}`,
    data: {
      type: 'issue',
      issue,
      statusId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <KanbanCard 
        issue={issue}
        getPriorityColor={getPriorityColor}
        onEditIssue={onEditIssue}
      />
    </div>
  );
};