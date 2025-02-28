import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronUp, ChevronDown, X, Clock, ArrowUpDown } from 'lucide-react';

// Interface for sort configuration
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface IssuesTabProps {
  projectId: number;
  issues: any[];
  loading: boolean;
  getStatusColorClass: (status: string) => string;
  getPriorityColorClass: (priority: string) => string;
  formatDate: (date: string) => string;
  handleDeleteIssue: (id: number) => void;
  setSelectedIssue: (issue: any) => void;
  setIsCreatingIssue: (isCreating: boolean) => void;
}

export const IssuesTab = ({ 
  projectId, 
  issues, 
  loading, 
  getStatusColorClass, 
  getPriorityColorClass, 
  formatDate,
  handleDeleteIssue,
  setSelectedIssue,
  setIsCreatingIssue
}: IssuesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
  
  // Get unique statuses from issues
  const getUniqueStatuses = () => {
    const statuses = new Set();
    
    issues.forEach(issue => {
      if (issue.status) {
        statuses.add(issue.status.name.toLowerCase());
      }
    });
    
    return Array.from(statuses) as string[];
  };
  
  // Get unique priorities from issues
  const getUniquePriorities = () => {
    const priorities = new Set();
    
    issues.forEach(issue => {
      if (issue.priority) {
        priorities.add(issue.priority.name.toLowerCase());
      }
    });
    
    return Array.from(priorities) as string[];
  };
  
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
  
  // Filter issues based on search query and filters
  const filteredIssues = issues.filter(issue => {
    // Apply search filter
    if (searchQuery && !issue.subject.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && issue.status.name.toLowerCase() !== statusFilter) {
      return false;
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all' && issue.priority.name.toLowerCase() !== priorityFilter) {
      return false;
    }
    
    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && issue.assigned_to) {
        return false;
      } else if (assigneeFilter !== 'unassigned' && 
                (!issue.assigned_to || issue.assigned_to.id.toString() !== assigneeFilter)) {
        return false;
      }
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let compareDate = new Date();
      
      if (dateFilter === 'today') {
        compareDate.setDate(now.getDate() - 1);
      } else if (dateFilter === 'week') {
        compareDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'month') {
        compareDate.setDate(now.getDate() - 30);
      }
      
      if (new Date(issue.updated_on) <= compareDate) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    if (sortConfig.length > 0) {
      for (const sort of sortConfig) {
        let aValue, bValue;
        
        // Extract values based on sort key
        switch (sort.key) {
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'subject':
            aValue = a.subject;
            bValue = b.subject;
            break;
          case 'status':
            aValue = a.status.name;
            bValue = b.status.name;
            break;
          case 'priority':
            aValue = a.priority.id; // Sort by priority ID for correct ordering
            bValue = b.priority.id;
            break;
          case 'assignedTo':
            aValue = a.assigned_to ? a.assigned_to.name : '';
            bValue = b.assigned_to ? b.assigned_to.name : '';
            break;
          case 'updated':
            aValue = new Date(a.updated_on).getTime();
            bValue = new Date(b.updated_on).getTime();
            break;
          default:
            aValue = a[sort.key];
            bValue = b[sort.key];
        }
        
        // Compare values
        if (aValue < bValue) {
          return sort.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sort.direction === 'asc' ? 1 : -1;
        }
      }
    }
    
    // Default sort by ID if no sort config
    return a.id - b.id;
  });

  // Reset all filters to default values
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setDateFilter('all');
    setSortConfig([]);
  };

  // Handle column sorting
  const handleSort = (columnId: string) => {
    // Find the column in the current sort config
    const currentSortIndex = sortConfig.findIndex(sort => sort.key === columnId);
    
    // Create a new sort config array
    let newSortConfig = [...sortConfig];
    
    if (currentSortIndex >= 0) {
      // Column is already in sort config
      const currentSort = sortConfig[currentSortIndex];
      
      if (currentSort.direction === 'asc') {
        // Change direction to desc
        newSortConfig[currentSortIndex] = { key: columnId, direction: 'desc' };
      } else {
        // Remove this sort criteria
        newSortConfig.splice(currentSortIndex, 1);
      }
    } else {
      // Add new sort criteria
      newSortConfig.push({ key: columnId, direction: 'asc' });
    }
    
    setSortConfig(newSortConfig);
  };

  // Get the current sort direction for a column
  const getSortDirection = (columnId: string): 'asc' | 'desc' | null => {
    const sort = sortConfig.find(s => s.key === columnId);
    return sort ? sort.direction : null;
  };

  // Get sort indicator for column header
  const getSortIndicator = (columnId: string) => {
    const direction = getSortDirection(columnId);
    const sortIndex = sortConfig.findIndex(s => s.key === columnId);
    
    if (direction === 'asc') {
      return (
        <div className="flex items-center">
          <ChevronUp size={14} />
          {sortIndex > 0 && <span className="text-xs ml-1">{sortIndex + 1}</span>}
        </div>
      );
    } else if (direction === 'desc') {
      return (
        <div className="flex items-center">
          <ChevronDown size={14} />
          {sortIndex > 0 && <span className="text-xs ml-1">{sortIndex + 1}</span>}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Project Issues</h2>
        <div className="flex gap-2">
          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || 
            assigneeFilter !== 'all' || dateFilter !== 'all' || sortConfig.length > 0) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={() => setIsCreatingIssue(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus size={16} className="mr-2" />
            Create Issue
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
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
              {getUniqueStatuses().map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              {getUniquePriorities().map(priority => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
            
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} />
              <span>{showAdvancedFilters ? 'Hide Filters' : 'More Filters'}</span>
            </button>
            
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setSortConfig([])}
              disabled={sortConfig.length === 0}
            >
              <ArrowUpDown size={16} />
              <span>Clear Sort</span>
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="assigneeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  id="assigneeFilter"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Assignees</option>
                  <option value="unassigned">Unassigned</option>
                  {getUniqueAssignees().map(assignee => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Updated
                </label>
                <select
                  id="dateFilter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Any Time</option>
                  <option value="today">Last 24 Hours</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
            
            {/* Active Filters */}
            {(statusFilter !== 'all' || priorityFilter !== 'all' || 
              assigneeFilter !== 'all' || dateFilter !== 'all' || sortConfig.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setStatusFilter('all')} />
                  </span>
                )}
                
                {priorityFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Priority: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setPriorityFilter('all')} />
                  </span>
                )}
                
                {assigneeFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Assignee: {assigneeFilter === 'unassigned' ? 'Unassigned' : 
                      getUniqueAssignees().find(a => a.id.toString() === assigneeFilter)?.name || assigneeFilter}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setAssigneeFilter('all')} />
                  </span>
                )}
                
                {dateFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Updated: {dateFilter === 'today' ? 'Last 24 Hours' : 
                      dateFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setDateFilter('all')} />
                  </span>
                )}
                
                {sortConfig.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Sorted by: {sortConfig.map((sort, index) => {
                      let fieldName = sort.key;
                      if (fieldName === 'assignedTo') fieldName = 'Assigned To';
                      return `${fieldName} (${sort.direction})${index < sortConfig.length - 1 ? ', ' : ''}`;
                    })}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setSortConfig([])} />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Issues Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No issues found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center justify-between">
                      <span>ID</span>
                      <span className="text-gray-400">{getSortIndicator('id')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('subject')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Subject</span>
                      <span className="text-gray-400">{getSortIndicator('subject')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className="text-gray-400">{getSortIndicator('status')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Priority</span>
                      <span className="text-gray-400">{getSortIndicator('priority')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('assignedTo')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Assigned To</span>
                      <span className="text-gray-400">{getSortIndicator('assignedTo')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('updated')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Updated</span>
                      <span className="text-gray-400">{getSortIndicator('updated')}</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                        <a 
                          href={`/issues/${issue.id}`} 
                          className="hover:text-indigo-600"
                        >
                          {issue.subject}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(issue.status.name)}`}>
                        {issue.status.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColorClass(issue.priority.name)}`}>
                        {issue.priority.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.assigned_to ? issue.assigned_to.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(issue.updated_on)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Issue"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteIssue(issue.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Issue"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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