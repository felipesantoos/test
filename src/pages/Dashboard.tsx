import React, { useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';

export const Dashboard = () => {
  const { isConnected, isLoading, error, projects, issues, refreshData, fetchIssues, issueStatuses, priorities } = useApi();
  const [resolvedIssuesCount, setResolvedIssuesCount] = useState(0);
  const [loadingResolvedIssues, setLoadingResolvedIssues] = useState(false);
  const [issueStatusData, setIssueStatusData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(false);

  // Status colors for the pie chart
  const statusColors = {
    'New': '#3B82F6',
    'In Progress': '#FBBF24',
    'Resolved': '#10B981',
    'Feedback': '#8B5CF6',
    'Closed': '#6B7280',
    'Rejected': '#EF4444'
  };

  useEffect(() => {
    if (isConnected && projects.length === 0 && issues.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  useEffect(() => {
    const getResolvedIssuesCount = async () => {
      if (!isConnected) return;
      
      setLoadingResolvedIssues(true);
      try {
        // Fetch issues with status "resolved"
        const resolvedIssues = await fetchIssues({ status: 'closed' });
        setResolvedIssuesCount(resolvedIssues.length);
      } catch (err) {
        console.error('Error fetching resolved issues:', err);
      } finally {
        setLoadingResolvedIssues(false);
      }
    };

    if (isConnected) {
      getResolvedIssuesCount();
    }
  }, [isConnected, fetchIssues]);

  // Process issue data for charts
  useEffect(() => {
    if (!isConnected || issues.length === 0) return;

    setLoadingCharts(true);
    
    try {
      // Process issue status data for pie chart
      const statusCounts: Record<string, number> = {};
      
      // Initialize with all statuses from the API
      if (issueStatuses.length > 0) {
        issueStatuses.forEach(status => {
          statusCounts[status.name] = 0;
        });
      }
      
      // Count issues by status
      issues.forEach(issue => {
        const statusName = issue.status.name;
        statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
      });
      
      // Convert to array format for chart and filter out statuses with zero issues
      const statusData = Object.entries(statusCounts)
        .filter(([_, value]) => value > 0) // Only include statuses with at least one issue
        .map(([name, value]) => ({
          name,
          value,
          color: statusColors[name as keyof typeof statusColors] || '#9CA3AF' // Default gray color
        }));
      
      setIssueStatusData(statusData);
      
      // Process priority data for bar chart
      const priorityCounts: Record<string, number> = {};
      
      // Initialize with all priorities from the API
      if (priorities.length > 0) {
        priorities.forEach(priority => {
          priorityCounts[priority.name] = 0;
        });
      }
      
      // Count issues by priority
      issues.forEach(issue => {
        const priorityName = issue.priority.name;
        priorityCounts[priorityName] = (priorityCounts[priorityName] || 0) + 1;
      });
      
      // Convert to array format for chart and filter out priorities with zero issues
      const priorityData = Object.entries(priorityCounts)
        .filter(([_, count]) => count > 0) // Only include priorities with at least one issue
        .map(([name, count]) => ({
          name,
          count
        }));
      
      setPriorityData(priorityData);
    } catch (err) {
      console.error('Error processing chart data:', err);
    } finally {
      setLoadingCharts(false);
    }
  }, [issues, issueStatuses, priorities, isConnected]);

  // Process recent activity
  const recentActivity = issues
    .sort((a, b) => new Date(b.updated_on).getTime() - new Date(a.updated_on).getTime())
    .slice(0, 4)
    .map(issue => ({
      id: issue.id,
      type: 'issue',
      title: issue.subject,
      project: issue.project.name,
      date: formatRelativeTime(new Date(issue.updated_on))
    }));

  // Helper function to format relative time
  function formatRelativeTime(date: Date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffMins > 0) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else {
      return 'just now';
    }
  }

  // Custom label renderer for pie chart to prevent overlap
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={issueStatusData[index]?.color || '#000'} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

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
              <p className="text-3xl font-bold text-gray-800">{projects.length || "-"}</p>
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
              <p className="text-3xl font-bold text-gray-800">{issues.length || "-"}</p>
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
              <p className="text-3xl font-bold text-gray-800">
                {loadingResolvedIssues ? (
                  <span className="text-xl">Loading...</span>
                ) : (
                  resolvedIssuesCount
                )}
              </p>
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
          {loadingCharts ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : issueStatusData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <Pie
                    data={issueStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={renderCustomizedLabel}
                  >
                    {issueStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} issues`, props.payload.name]} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Issues by Priority</h2>
          {loadingCharts ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : priorityData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} issues`, 'Count']} />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Issues" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {issues.length === 0 ? (
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
                    <h3 className="font-medium">{activity.title}</h3>
                    <span className="text-sm text-gray-500">{activity.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">Project: {activity.project}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {issues.length > 4 && (
          <div className="mt-4 text-center">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Import the icons used in the component
import { FolderKanban, CheckSquare } from 'lucide-react';