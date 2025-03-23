import React from 'react';
import { LayoutDashboard, CheckSquare, BarChart3, Settings, Users, GitBranch, Figma, GanttChart, Trophy, Trello } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProjectTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  project: any;
}

export const ProjectTabs = ({ activeTab, setActiveTab, project }: ProjectTabsProps) => {
  const { isAdmin } = useAuth();
  
  // Check if user is a project manager for this project
  const isProjectManager = () => {
    // This would need to be implemented based on your user roles data
    // For now, we'll just check if the user is an admin
    return isAdmin;
  };
  
  // Only show the Members tab if the user is an admin or a project manager
  const showMembersTab = isAdmin || isProjectManager();
  
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="min-w-max">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LayoutDashboard size={16} className="mr-2" />
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('issues')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'issues'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckSquare size={16} className="mr-2" />
              Issues
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'kanban'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trello size={16} className="mr-2" />
              Kanban
            </button>
            
            <button
              onClick={() => setActiveTab('gantt')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'gantt'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GanttChart size={16} className="mr-2" />
              Gantt Chart
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={16} className="mr-2" />
              Analytics
            </button>
            
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy size={16} className="mr-2" />
              Member Performance
            </button>
            
            {showMembersTab && (
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                  activeTab === 'members'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users size={16} className="mr-2" />
                Members
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('github')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'github'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GitBranch size={16} className="mr-2" />
              GitHub
            </button>
            
            <button
              onClick={() => setActiveTab('figma')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'figma'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Figma size={16} className="mr-2" />
              Figma
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings size={16} className="mr-2" />
              Settings
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};