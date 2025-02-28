import React from 'react';
import { LayoutDashboard, CheckSquare, BarChart3, Settings } from 'lucide-react';

interface ProjectTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ProjectTabs = ({ activeTab, setActiveTab }: ProjectTabsProps) => {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
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
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'issues'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckSquare size={16} className="mr-2" />
            Issues
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 size={16} className="mr-2" />
            Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
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
  );
};