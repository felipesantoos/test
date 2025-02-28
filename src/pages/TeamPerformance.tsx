import React, { useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, Users, CheckSquare, Clock } from 'lucide-react';

export const TeamPerformance = () => {
  const { isConnected, isLoading, error, users, refreshData } = useApi();

  useEffect(() => {
    if (isConnected && users.length === 0) {
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

  if (isLoading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Loading team data...</p>
      </div>
    );
  }

  // Mock data for demonstration
  const mockTeamMembers = [
    { id: 1, name: 'John Doe', role: 'Developer', avatar: 'JD', assignedIssues: 15, resolvedIssues: 12, avgResolutionTime: 2.5 },
    { id: 2, name: 'Jane Smith', role: 'Designer', avatar: 'JS', assignedIssues: 8, resolvedIssues: 7, avgResolutionTime: 1.8 },
    { id: 3, name: 'Alice Johnson', role: 'QA Engineer', avatar: 'AJ', assignedIssues: 20, resolvedIssues: 18, avgResolutionTime: 1.2 },
    { id: 4, name: 'Bob Williams', role: 'Backend Developer', avatar: 'BW', assignedIssues: 12, resolvedIssues: 9, avgResolutionTime: 3.1 },
    { id: 5, name: 'Carol Davis', role: 'Project Manager', avatar: 'CD', assignedIssues: 5, resolvedIssues: 4, avgResolutionTime: 0.9 },
  ];

  const mockIssuesPerMemberData = mockTeamMembers.map(member => ({
    name: member.name,
    assigned: member.assignedIssues,
    resolved: member.resolvedIssues
  }));

  const mockResolutionTimeData = mockTeamMembers.map(member => ({
    name: member.name,
    time: member.avgResolutionTime
  }));

  const mockWorkloadDistributionData = [
    { name: 'John Doe', value: 25, color: '#3B82F6' },
    { name: 'Jane Smith', value: 15, color: '#10B981' },
    { name: 'Alice Johnson', value: 30, color: '#F59E0B' },
    { name: 'Bob Williams', value: 20, color: '#8B5CF6' },
    { name: 'Carol Davis', value: 10, color: '#EC4899' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Team Performance</h1>
        <button 
          onClick={refreshData}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users size={20} className="text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{mockTeamMembers.length}</div>
          <p className="text-sm text-gray-500">Active contributors</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Total Issues</h2>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckSquare size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {mockTeamMembers.reduce((sum, member) => sum + member.assignedIssues, 0)}
          </div>
          <p className="text-sm text-gray-500">Assigned to team</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Avg. Resolution Time</h2>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {(mockTeamMembers.reduce((sum, member) => sum + member.avgResolutionTime, 0) / mockTeamMembers.length).toFixed(1)}
          </div>
          <p className="text-sm text-gray-500">Days per issue</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Issues Per Team Member</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockIssuesPerMemberData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Assigned Issues" fill="#3B82F6" />
                <Bar dataKey="resolved" name="Resolved Issues" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Average Resolution Time (Days)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockResolutionTimeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="time" name="Days" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workload Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Workload Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockWorkloadDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockWorkloadDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-md font-medium mb-3">Team Members</h3>
            <div className="space-y-4">
              {mockTeamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <span className="font-medium text-indigo-800">{member.avatar}</span>
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{member.assignedIssues} issues</p>
                    <p className="text-sm text-green-600">{member.resolvedIssues} resolved</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};