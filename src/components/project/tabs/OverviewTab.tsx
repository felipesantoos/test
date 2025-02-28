import React from 'react';
import { Calendar, CheckSquare, Clock, Users, ArrowUpRight } from 'lucide-react';

interface OverviewTabProps {
  project: any;
  issueStats: {
    total: number;
    open: number;
    closed: number;
  };
  recentActivity: any[];
  formatDate: (date: string) => string;
}

export const OverviewTab = ({ project, issueStats, recentActivity, formatDate }: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Project Overview</h2>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
            <div className="bg-blue-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{issueStats.total}</div>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Open Issues</h3>
            <div className="bg-yellow-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{issueStats.open}</div>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-red-500 mr-1" />
            <span className="text-red-500 font-medium">8%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Closed Issues</h3>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{issueStats.closed}</div>
          <div className="flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">24%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
      </div>
      
      {/* Project Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold mb-4">Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-gray-800">{project.description || 'No description available'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Created On</h4>
              <p className="text-gray-800">{formatDate(project.created_on)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
              <p className="text-gray-800">{formatDate(project.updated_on)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
              <p className="text-gray-800">
                {project.status === 1 ? 'Active' : project.status === 9 ? 'Archived' : 'Unknown'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Visibility</h4>
              <p className="text-gray-800">{project.is_public ? 'Public' : 'Private'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Identifier</h4>
              <p className="text-gray-800">{project.identifier}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No recent activity available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="bg-blue-100 p-2 rounded-full mr-4">
                  <CheckSquare size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{activity.title}</h4>
                    <span className="text-sm text-gray-500">{activity.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">Status: {activity.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};