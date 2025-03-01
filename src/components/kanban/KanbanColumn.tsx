import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableKanbanCard } from './SortableKanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  issues: any[];
  getPriorityColor: (priority: string) => string;
  onEditIssue: (issue: any) => void;
  onViewIssue: (issueId: number) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  id, 
  title, 
  issues,
  getPriorityColor,
  onEditIssue,
  onViewIssue
}) => {
  const { setNodeRef } = useDroppable({
    id: id
  });

  // Get color for column header based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'feedback':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col w-[300px] h-full bg-gray-50 rounded-lg shadow">
      <div className={`p-3 font-medium text-center rounded-t-lg ${getStatusColor(title)}`}>
        <h3 className="font-semibold">{title}</h3>
        <div className="text-xs mt-1">{issues.length} issues</div>
      </div>
      
      <div 
        ref={setNodeRef} 
        className="flex-1 p-2 overflow-y-auto min-h-[500px] max-h-[calc(100vh-250px)]"
      >
        <SortableContext 
          items={issues.map(issue => `issue-${issue.id}`)} 
          strategy={verticalListSortingStrategy}
        >
          {issues.map(issue => (
            <SortableKanbanCard 
              key={issue.id}
              issue={issue}
              getPriorityColor={getPriorityColor}
              onEditIssue={onEditIssue}
              onViewIssue={onViewIssue}
              statusId={id}
            />
          ))}
        </SortableContext>
        
        {issues.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
            No issues
          </div>
        )}
      </div>
    </div>
  );
};