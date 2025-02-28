import React from 'react';
import { Calendar, Users, CheckSquare } from 'lucide-react';

interface ProjectHeaderProps {
  project: any;
  projectProgress: number;
  issueStats: {
    total: number;
    open: number;
    closed: number;
  };
  formatDate: (date: string) => string;
}

export const ProjectHeader = ({ project, projectProgress, issueStats, formatDate }: ProjectHeaderProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{project.name}</h1>
          <p className="text-gray-600 mb-4">{project.description || 'No description available'}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              Created: {formatDate(project.created_on)}
            </div>
            <div className="flex items-center">
              <Users size={16} className="mr-2" />
              {project.members_count || 0} members
            </div>
            <div className="flex items-center">
              <CheckSquare size={16} className="mr-2" />
              {issueStats.total} issues ({issueStats.open} open)
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-4 w-full md:w-64">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700">Project Progress</span>
            <span className="font-bold text-indigo-600">{projectProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full" 
              style={{ width: `${projectProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{issueStats.closed} completed</span>
            <span>{issueStats.open} remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
};