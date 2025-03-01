import React, { useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, Trophy, Users, CheckSquare, Clock, Filter, RefreshCw, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO, subDays } from 'date-fns';

export const MemberPerformance = () => {
  const { isConnected, isLoading, error, users, fetchIssues, refreshData } = useApi();
  const [loading, setLoading] = useState(true);
  const [memberPerformance, setMemberPerformance] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'all'>('month');
  const [filterType, setFilterType] = useState<'resolved' | 'assigned' | 'updates' | 'time'>('resolved');
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [workloadDistribution, setWorkloadDistribution] = useState<any[]>([]);

  // Load issues and calculate member performance
  useEffect(() => {
    const loadMemberPerformance = async () => {
      if (!isConnected) return;
      
      setLoading(true);
      
      try {
        // Fetch all issues
        const allIssues = await fetchIssues({
          include: 'journals,relations,children'
        });
        
        // Create a map of members
        const membersMap = new Map();
        
        // Initialize with all users
        users.forEach(user => {
          membersMap.set(user.id, {
            id: user.id,
            name: `${user.firstname} ${user.lastname}`,
            assignedIssues: 0,
            resolvedIssues: 0,
            totalUpdates: 0,
            avgResolutionTime: 0,
            resolutionTimes: [],
            lastActivity: null
          });
        });
        
        // Get date range based on selected time range
        const now = new Date();
        let startDate = now;
        
        switch (timeRange) {
          case 'week':
            startDate = subDays(now, 7);
            break;
          case 'month':
            startDate = subDays(now, 30);
            break;
          case 'quarter':
            startDate = subDays(now, 90);
            break;
          case 'all':
            // No date filtering
            break;
        }
        
        // Process issues to calculate performance metrics
        allIssues.forEach(issue => {
          // Skip issues without an assignee
          if (!issue.assigned_to) return;
          
          const assigneeId = issue.assigned_to.id;
          
          // Initialize member if not already in the map
          if (!membersMap.has(assigneeId)) {
            membersMap.set(assigneeId, {
              id: assigneeId,
              name: issue.assigned_to.name,
              assignedIssues: 0,
              resolvedIssues: 0,
              totalUpdates: 0,
              avgResolutionTime: 0,
              resolutionTimes: [],
              lastActivity: null
            });
          }
          
          const member = membersMap.get(assigneeId);
          
          // Count assigned issues
          member.assignedIssues++;
          
          // Check if issue is resolved or closed
          const isResolved = issue.status && 
            (issue.status.name.toLowerCase() === 'resolved' || 
             issue.status.name.toLowerCase() === 'closed');
          
          // Apply time range filter if needed
          const issueUpdatedDate = parseISO(issue.updated_on);
          const isInTimeRange = timeRange === 'all' || issueUpdatedDate >= startDate;
          
          if (isResolved && isInTimeRange) {
            member.resolvedIssues++;
            
            // Calculate resolution time if both created and closed dates are available
            if (issue.created_on && issue.closed_on) {
              const createdDate = parseISO(issue.created_on);
              const closedDate = parseISO(issue.closed_on);
              const resolutionDays = Math.max(0, (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
              
              member.resolutionTimes.push(resolutionDays);
            }
          }
          
          // Count updates (journals)
          if (issue.journals && isInTimeRange) {
            const userJournals = issue.journals.filter((journal: any) => 
              journal.user && journal.user.id === assigneeId
            );
            
            member.totalUpdates += userJournals.length;
            
            // Update last activity date
            if (userJournals.length > 0) {
              const latestJournal = userJournals.reduce((latest: any, current: any) => {
                return new Date(latest.created_on) > new Date(current.created_on) ? latest : current;
              });
              
              const journalDate = new Date(latestJournal.created_on);
              
              if (!member.lastActivity || journalDate > member.lastActivity) {
                member.lastActivity = journalDate;
              }
            }
          }
        });
        
        // Calculate average resolution time for each member
        membersMap.forEach(member => {
          if (member.resolutionTimes.length > 0) {
            const totalTime = member.resolutionTimes.reduce((sum: number, time: number) => sum + time, 0);
            member.avgResolutionTime = parseFloat((totalTime / member.resolutionTimes.length).toFixed(1));
          }
        });
        
        // Convert map to array and sort by the selected metric
        const performanceArray = Array.from(membersMap.values());
        
        // Filter out members with no activity
        const activeMembers = performanceArray.filter(member => 
          member.assignedIssues > 0 || member.resolvedIssues > 0 || member.totalUpdates > 0
        );
        
        setMemberPerformance(activeMembers);
        
        // Set top performers based on selected filter
        const sortedMembers = [...activeMembers].sort((a, b) => {
          switch (filterType) {
            case 'resolved':
              return b.resolvedIssues - a.resolvedIssues;
            case 'assigned':
              return b.assignedIssues - a.assignedIssues;
            case 'updates':
              return b.totalUpdates - a.totalUpdates;
            case 'time':
              // Sort by average resolution time (ascending - faster is better)
              if (a.avgResolutionTime === 0) return 1;
              if (b.avgResolutionTime === 0) return -1;
              return a.avgResolutionTime - b.avgResolutionTime;
            default:
              return 0;
          }
        });
        
        setTopPerformers(sortedMembers.slice(0, 5));
        
        // Prepare data for charts
        const chartData = activeMembers.map(member => ({
          name: member.name,
          resolved: member.resolvedIssues,
          assigned: member.assignedIssues,
          updates: member.totalUpdates,
          time: member.avgResolutionTime
        }));
        
        setPerformanceData(chartData);
        
        // Prepare workload distribution data
        const totalAssigned = activeMembers.reduce((sum, member) => sum + member.assignedIssues, 0);
        
        const workloadData = activeMembers
          .filter(member => member.assignedIssues > 0)
          .map((member, index) => ({
            name: member.name,
            value: member.assignedIssues,
            percentage: totalAssigned > 0 ? Math.round((member.assignedIssues / totalAssigned) * 100) : 0,
            color: getChartColor(index)
          }));
        
        setWorkloadDistribution(workloadData);
      } catch (err) {
        console.error('Error loading member performance data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadMemberPerformance();
  }, [isConnected, fetchIssues, users, timeRange, filterType, refreshData]);

  // Get color for chart
  const getChartColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4'];
    return colors[index % colors.length];
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return format(date, 'MMM d, yyyy');
  };

  // Download performance data as CSV
  const downloadCSV = () => {
    // Create CSV content
    const headers = ['Name', 'Assigned Issues', 'Resolved Issues', 'Updates', 'Avg. Resolution Time (days)', 'Last Activity'];
    const rows = memberPerformance.map(member => [
      member.name,
      member.assignedIssues,
      member.resolvedIssues,
      member.totalUpdates,
      member.avgResolutionTime,
      formatDate(member.lastActivity)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `member-performance-${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Connected to Redmine</h2>
        <p className="text-gray-600 mb-4">Please configure your Redmine API settings to get started.</p>
        <Link to="/settings" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Loading member performance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Member Performance</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refreshData()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh Data
          </button>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${timeRange === 'week' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeRange('week')}
              >
                Week
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeRange === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeRange('month')}
              >
                Month
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeRange === 'quarter' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeRange('quarter')}
              >
                Quarter
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeRange === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeRange('all')}
              >
                All Time
              </button>
            </div>
            
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${filterType === 'resolved' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setFilterType('resolved')}
              >
                Resolved
              </button>
              <button
                className={`px-3 py-1 text-sm ${filterType === 'assigned' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setFilterType('assigned')}
              >
                Assigned
              </button>
              <button
                className={`px-3 py-1 text-sm ${filterType === 'updates' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setFilterType('updates')}
              >
                Updates
              </button>
              <button
                className={`px-3 py-1 text-sm ${filterType === 'time' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setFilterType('time')}
              >
                Resolution Time
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users size={20} className="text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{memberPerformance.length}</div>
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
            {memberPerformance.reduce((sum, member) => sum + member.assignedIssues, 0)}
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
            {memberPerformance.length > 0 
              ? (memberPerformance.reduce((sum, member) => sum + member.avgResolutionTime, 0) / memberPerformance.length).toFixed(1) 
              : '0'}
          </div>
          <p className="text-sm text-gray-500">Days per issue</p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Trophy size={20} className="text-yellow-500 mr-2" />
          Top Performers
        </h2>
        
        {topPerformers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No performance data available for the selected time period.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topPerformers.map((member, index) => (
                <div key={member.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <span className="font-medium text-indigo-800">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Resolved:</span>
                      <span className="font-medium">{member.resolvedIssues}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Assigned:</span>
                      <span className="font-medium">{member.assignedIssues}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Updates:</span>
                      <span className="font-medium">{member.totalUpdates}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Avg. Time:</span>
                      <span className="font-medium">{member.avgResolutionTime} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {filterType === 'resolved' ? 'Resolved Issues' : 
             filterType === 'assigned' ? 'Assigned Issues' : 
             filterType === 'updates' ? 'Issue Updates' : 
             'Average Resolution Time (Days)'}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey={
                    filterType === 'resolved' ? 'resolved' : 
                    filterType === 'assigned' ? 'assigned' : 
                    filterType === 'updates' ? 'updates' : 'time'
                  } 
                  name={
                    filterType === 'resolved' ? 'Resolved Issues' : 
                    filterType === 'assigned' ? 'Assigned Issues' : 
                    filterType === 'updates' ? 'Updates' : 
                    'Avg. Resolution Time (Days)'
                  } 
                  fill="#3B82F6" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Workload Distribution</h2>
          {workloadDistribution.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No workload data available.</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workloadDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {workloadDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} issues (${props.payload.percentage}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Member Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Member Performance Details</h2>
        </div>
        
        {memberPerformance.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No performance data available for the selected time period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Issues
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolved Issues
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Resolution Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberPerformance.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Users size={20} className="text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckSquare size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{member.assignedIssues}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckSquare size={16} className="text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">{member.resolvedIssues}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.totalUpdates}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{member.avgResolutionTime} days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.lastActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};