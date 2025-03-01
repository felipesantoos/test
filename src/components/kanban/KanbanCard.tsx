import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanCardProps {
  issue: any;
  getPriorityColor: (priority: string) => string;
  onEditIssue: (issue: any) => void;
  onViewIssue: (issueId: number) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ 
  issue,
  getPriorityColor,
  onEditIssue,
  onViewIssue
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div 
      className="bg-white rounded-md shadow-sm border border-gray-200 p-3 mb-2 hover:shadow-md transition-shadow"
      onClick={() => onViewIssue(issue.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-gray-500">#{issue.id}</span>
        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(issue.priority.name)}`}>
          {issue.priority.name}
        </span>
      </div>
      
      <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">{issue.subject}</h4>
      
      {issue.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
        <div className="flex items-center">
          <User size={12} className="mr-1" />
          <span>{issue.assigned_to ? issue.assigned_to.name : 'Unassigned'}</span>
        </div>
        <div className="flex items-center">
          <Calendar size={12} className="mr-1" />
          <span>{formatDate(issue.updated_on)}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">{issue.project.name}</span>
        <div className="flex space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewIssue(issue.id);
            }} 
            className="text-indigo-600 hover:text-indigo-800"
          >
            <Eye size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEditIssue(issue);
            }} 
            className="text-indigo-600 hover:text-indigo-800"
          >
            <Edit size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};