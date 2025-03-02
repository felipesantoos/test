import React from 'react';
import { FileText, MessageSquare, Paperclip, Link as LinkIcon, Eye } from 'lucide-react';

interface IssueTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  issue: any;
}

export const IssueTabs = ({ activeTab, setActiveTab, issue }: IssueTabsProps) => {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="min-w-max">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText size={16} className="mr-2" />
              Details
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare size={16} className="mr-2" />
              History
            </button>
            
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'attachments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Paperclip size={16} className="mr-2" />
              Attachments
              {issue.attachments && issue.attachments.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {issue.attachments.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('relations')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'relations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LinkIcon size={16} className="mr-2" />
              Relations
              {issue.relations && issue.relations.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {issue.relations.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('watchers')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === 'watchers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye size={16} className="mr-2" />
              Watchers
              {issue.watchers && issue.watchers.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                  {issue.watchers.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};