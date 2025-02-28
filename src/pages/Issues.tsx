import React, { useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import { Search, Filter, ArrowUpDown, Calendar, User, Tag, AlertCircle } from 'lucide-react';

export const Issues = () => {
  const { isConnected, isLoading, error, issues, projects, refreshData, fetchIssues } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && issues.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  useEffect(() => {
    const loadIssues = async () => {
      if (!isConnected) return;
      
      setLoading(true);
      
      try {
        const filters: any = {};
        
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        
        if (projectFilter !== 'all') {
          filters.projectId = projectFilter;
        }
        
        const fetchedIssues = await fetchIssues(filters);
        
        // Apply search filter client-side
        const filtered = searchQuery 
          ? fetchedIssues.filter(issue => 
              issue.subject.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : fetchedIssues;
          
        setFilteredIssues(filtered);
      } catch (err) {
        console.error('Error loading issues:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (issues.length > 0) {
      // Filter existing issues client-side if we already have them
      setFilteredIssues(
        issues.filter(issue => 
          issue.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (statusFilter === 'all' || issue.status.name.toLowerCase() === statusFilter.toLowerCase()) &&
          (projectFilter === 'all' || issue.project.id.toString() === projectFilter)
        )
      );
    } else {
      // Otherwise load from API
      loadIssues();
    }
  }, [issues, searchQuery, statusFilter, projectFilter, isConnected]);

  const handleFilterChange = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    
    try {
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (projectFilter !== 'all') {
        filters.projectId = projectFilter;
      }
      
      const fetchedIssues = await fetchIssues(filters);
      
      // Apply search filter client-side
      const filtered = searchQuery 
        ? fetchedIssues.filter(issue => 
            issue.subject.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : fetchedIssues;
        
      setFilteredIssues(filtered);
    } catch (err) {
      console.error('Error loading issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'feedback':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'immediate':
        return 'bg-red-100 text-red-800 font-bold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Issues</h1>
        <button 
          onClick={refreshData}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Issues'}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={handleFilterChange}
            >
              <Filter size={16} />
              <span>Apply Filters</span>
            </button>
            
            <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              <ArrowUpDown size={16} />
              <span>Sort</span>
            </button>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {(isLoading || loading) && filteredIssues.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error && filteredIssues.length === 0 ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center">
            <AlertCircle size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No issues found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{issue.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <a href={`/issues/${issue.id}`} className="hover:text-indigo-600">
                          {issue.subject}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{issue.project.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status.name)}`}>
                        {issue.status.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priority.name)}`}>
                        {issue.priority.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.assigned_to ? issue.assigned_to.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(issue.updated_on).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};