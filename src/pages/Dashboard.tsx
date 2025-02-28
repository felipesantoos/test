import React, { useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';

export const Dashboard = () => {
  const { isConnected, isLoading, error, projects, issues, refreshData } = useApi();

  useEffect(() => {
    if (isConnected && projects.length === 0 && issues.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Connected to Redmine</h2>
        <p className="text-gray-600 mb-4">Please configure your Redmine API settings to get started.</p>
        <a href="/settings" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Go to Settings
        </a>
      </div>
    );
  }

  if (isLoading && projects.length === 0 && issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  if (error && projects.length === 0 && issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refreshData}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Mock data for demonstration
  const mockIssueStatusData = [
    { name: 'New', value: 12, color: '#3B82F6' },
    { name: 'In Progress', value: 8, color: '#FBBF24' },
    { name: 'Resolved', value: 15, color: '#10B981' },
    { name: 'Feedback', value: 5, color: '#8B5CF6' },
    { name: 'Closed', value: 25, color: '#6B7280' },
  ];

  const mockPriorityData = [
    { name: 'Low', count: 10 },
    { name: 'Normal', count: 22 },
    { name: 'High', count: 18 },
    { name: 'Urgent', count: 5 },
    { name: 'Immediate', count: 2 },
  ];

  const mockRecentActivity = [
    { id: 1, type: 'issue', title: 'Fix login page layout', project: 'Website Redesign', date: '2 hours ago' },
    { id: 2, type: 'issue', title: 'API integration failing', project: 'Mobile App', date: '5 hours ago' },
    { id: 3, type: 'issue', title: 'Update documentation', project: 'API Development', date: '1 day ago' },
    { id: 4, type: 'issue', title: 'Performance optimization', project: 'Website Redesign', date: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-3xl font-bold text-gray-800">{projects.length || 8}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FolderKanban size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open Issues</p>
              <p className="text-3xl font-bold text-gray-800">{issues.length || 25}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <CheckSquare size={24} className="text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight size={16} className="text-red-500 mr-1" />
            <span className="text-red-500 font-medium">8%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resolved Issues</p>
              <p className="text-3xl font-bold text-gray-800">40</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">24%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Resolution Time</p>
              <p className="text-3xl font-bold text-gray-800">3.2 days</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight size={16} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">15%</span>
            <span className="text-gray-500 ml-1">improvement</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Issue Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockIssueStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockIssueStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Issues by Priority</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockPriorityData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Number of Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {mockRecentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <CheckSquare size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{activity.title}</h3>
                  <span className="text-sm text-gray-500">{activity.date}</span>
                </div>
                <p className="text-sm text-gray-600">Project: {activity.project}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

// Import the icons used in the component
import { FolderKanban, CheckSquare } from 'lucide-react';