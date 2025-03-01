import React, { useState, useEffect } from 'react';
import { useApi } from '../../../context/ApiContext';
import { AlertCircle, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

interface GanttChartTabProps {
  projectId: number;
}

export const GanttChartTab: React.FC<GanttChartTabProps> = ({ projectId }) => {
  const { fetchIssues } = useApi();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30));
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Load issues for the project
  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch issues with start and due dates
        const projectIssues = await fetchIssues({ 
          projectId, 
          include: 'attachments,relations,children,journals,watchers'
        });
        
        // Filter issues that have start_date or due_date
        const issuesWithDates = projectIssues.filter(issue => 
          issue.start_date || issue.due_date
        );
        
        setIssues(issuesWithDates);
        setFilteredIssues(issuesWithDates);
      } catch (err: any) {
        console.error('Error loading issues for Gantt chart:', err);
        setError('Failed to load issues. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadIssues();
  }, [projectId, fetchIssues]);

  // Update timeframe
  useEffect(() => {
    const today = new Date();
    
    switch (timeframe) {
      case 'month':
        setEndDate(addDays(today, 30));
        break;
      case 'quarter':
        setEndDate(addDays(today, 90));
        break;
      case 'year':
        setEndDate(addDays(today, 365));
        break;
    }
    
    setStartDate(today);
  }, [timeframe]);

  // Apply filters
  useEffect(() => {
    if (issues.length === 0) return;
    
    let filtered = [...issues];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => 
        issue.status.name.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(issue => !issue.assigned_to);
      } else {
        filtered = filtered.filter(issue => 
          issue.assigned_to && issue.assigned_to.id.toString() === assigneeFilter
        );
      }
    }
    
    setFilteredIssues(filtered);
  }, [issues, statusFilter, assigneeFilter]);

  // Get unique assignees from issues
  const getUniqueAssignees = () => {
    const assignees = new Map();
    
    issues.forEach(issue => {
      if (issue.assigned_to) {
        assignees.set(issue.assigned_to.id, issue.assigned_to);
      }
    });
    
    return Array.from(assignees.values());
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setAssigneeFilter('all');
  };

  // Generate dates for the Gantt chart
  const generateDates = () => {
    const dates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  };

  // Get color for issue status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-500';
      case 'in progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'feedback':
        return 'bg-purple-500';
      case 'closed':
        return 'bg-gray-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Calculate position and width for Gantt bar
  const calculateBarStyle = (issue: any) => {
    const startDateObj = issue.start_date ? parseISO(issue.start_date) : new Date(startDate);
    const dueDateObj = issue.due_date ? parseISO(issue.due_date) : addDays(startDateObj, 1);
    
    // Calculate days from start of chart
    const daysFromStart = Math.max(0, differenceInDays(startDateObj, startDate));
    
    // Calculate duration in days
    const duration = Math.max(1, differenceInDays(dueDateObj, startDateObj));
    
    // Calculate position and width as percentages
    const totalDays = differenceInDays(endDate, startDate) || 1;
    const left = (daysFromStart / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return {
      left: `${left}%`,
      width: `${Math.min(width, 100 - left)}%`
    };
  };

  // Download Gantt chart as CSV
  const downloadCSV = () => {
    // Create CSV content
    const headers = ['ID', 'Subject', 'Status', 'Assignee', 'Start Date', 'Due Date'];
    const rows = filteredIssues.map(issue => [
      issue.id,
      issue.subject,
      issue.status.name,
      issue.assigned_to ? issue.assigned_to.name : 'Unassigned',
      issue.start_date || '',
      issue.due_date || ''
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
    link.setAttribute('download', `gantt-chart-project-${projectId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    
    try {
      const projectIssues = await fetchIssues({ 
        projectId, 
        include: 'attachments,relations,children,journals,watchers'
      });
      
      const issuesWithDates = projectIssues.filter(issue => 
        issue.start_date || issue.due_date
      );
      
      setIssues(issuesWithDates);
      setFilteredIssues(issuesWithDates);
    } catch (err) {
      console.error('Error refreshing Gantt data:', err);
    } finally {
      setLoading(false);
    }
  };

  const dates = generateDates();
  const uniqueAssignees = getUniqueAssignees();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Project Gantt Chart</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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

      {/* Filters and Timeframe */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="feedback">Feedback</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {uniqueAssignees.map(assignee => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
            
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={resetFilters}
            >
              <Filter size={16} />
              <span>Reset Filters</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Timeframe:</span>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${timeframe === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeframe('month')}
              >
                Month
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeframe === 'quarter' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeframe('quarter')}
              >
                Quarter
              </button>
              <button
                className={`px-3 py-1 text-sm ${timeframe === 'year' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-700'}`}
                onClick={() => setTimeframe('year')}
              >
                Year
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center">
            <Calendar size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No issues with dates</h3>
            <p className="text-gray-500">There are no issues with start or due dates to display in the Gantt chart.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header with dates */}
              <div className="flex border-b border-gray-200">
                <div className="w-64 flex-shrink-0 p-3 font-medium text-gray-700 border-r border-gray-200">
                  Issue
                </div>
                <div className="flex-1 flex">
                  {dates.map((date, index) => (
                    <div 
                      key={index} 
                      className={`w-10 flex-shrink-0 p-1 text-center text-xs font-medium ${
                        date.getDate() === 1 ? 'bg-gray-100' : ''
                      } ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''}`}
                    >
                      {date.getDate() === 1 || index === 0 ? (
                        <div>
                          <div>{format(date, 'MMM')}</div>
                          <div>{date.getDate()}</div>
                        </div>
                      ) : (
                        <div>{date.getDate()}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Gantt rows */}
              {filteredIssues.map(issue => (
                <div key={issue.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                  <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200">
                    <div className="font-medium text-sm">#{issue.id}: {issue.subject}</div>
                    <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full ${getStatusColor(issue.status.name)} text-white`}>
                        {issue.status.name}
                      </span>
                      <span>
                        {issue.assigned_to ? issue.assigned_to.name : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 relative p-2">
                    {/* Gantt bar */}
                    <div 
                      className={`absolute h-6 rounded-sm ${getStatusColor(issue.status.name)} opacity-80 hover:opacity-100 transition-opacity`}
                      style={calculateBarStyle(issue)}
                      title={`${issue.subject} (${formatDate(issue.start_date)} - ${formatDate(issue.due_date)})`}
                    >
                      <div className="px-2 text-xs text-white truncate h-full flex items-center">
                        #{issue.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};