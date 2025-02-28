import React, { useEffect, useState, useRef } from 'react';
import { useApi } from '../context/ApiContext';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  User, 
  Tag, 
  AlertCircle, 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Clock,
  X
} from 'lucide-react';
import { format } from 'date-fns';

// Interface for column definition
interface Column {
  id: string;
  label: string;
  width: number;
  sortable: boolean;
}

// Interface for sort configuration
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export const Issues = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    issues, 
    projects, 
    priorities,
    issueStatuses,
    refreshData, 
    fetchIssues,
    updateIssue,
    deleteIssue
  } = useApi();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // State for issues and loading
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
  
  // State for column resizing
  const [columns, setColumns] = useState<Column[]>([
    { id: 'id', label: 'ID', width: 80, sortable: true },
    { id: 'subject', label: 'Subject', width: 300, sortable: true },
    { id: 'project', label: 'Project', width: 150, sortable: true },
    { id: 'status', label: 'Status', width: 120, sortable: true },
    { id: 'priority', label: 'Priority', width: 120, sortable: true },
    { id: 'assignedTo', label: 'Assigned To', width: 150, sortable: true },
    { id: 'updated', label: 'Updated', width: 120, sortable: true },
    { id: 'actions', label: 'Actions', width: 120, sortable: false }
  ]);
  
  // State for column being resized
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0);
  
  // State for selected issue (for editing)
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  
  // Refs for resize handling
  const tableRef = useRef<HTMLTableElement>(null);

  // Load issues on initial render
  useEffect(() => {
    if (isConnected && issues.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  // Filter issues when filters or issues change
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
        
        if (priorityFilter !== 'all') {
          filters.priorityId = priorityFilter;
        }
        
        if (assigneeFilter !== 'all') {
          filters.assignedTo = assigneeFilter;
        }
        
        if (dateFilter === 'today') {
          filters.updatedOn = '>t-1d';
        } else if (dateFilter === 'week') {
          filters.updatedOn = '>t-7d';
        } else if (dateFilter === 'month') {
          filters.updatedOn = '>t-30d';
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
      let filtered = [...issues];
      
      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(issue => 
          issue.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(issue => 
          issue.status.name.toLowerCase() === statusFilter.toLowerCase()
        );
      }
      
      // Apply project filter
      if (projectFilter !== 'all') {
        filtered = filtered.filter(issue => 
          issue.project.id.toString() === projectFilter
        );
      }
      
      // Apply priority filter
      if (priorityFilter !== 'all') {
        filtered = filtered.filter(issue => 
          issue.priority.id.toString() === priorityFilter
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
        
        filtered = filtered.filter(issue => 
          new Date(issue.updated_on) > compareDate
        );
      }
      
      // Apply sorting
      if (sortConfig.length > 0) {
        filtered.sort((a, b) => {
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
              case 'project':
                aValue = a.project.name;
                bValue = b.project.name;
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
          
          return 0; // If all sort criteria are equal
        });
      }
      
      setFilteredIssues(filtered);
    } else {
      // Otherwise load from API
      loadIssues();
    }
  }, [issues, searchQuery, statusFilter, projectFilter, priorityFilter, assigneeFilter, dateFilter, sortConfig, isConnected]);

  // Apply filters and fetch issues from API
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
      
      if (priorityFilter !== 'all') {
        filters.priorityId = priorityFilter;
      }
      
      if (assigneeFilter !== 'all') {
        filters.assignedTo = assigneeFilter;
      }
      
      if (dateFilter === 'today') {
        filters.updatedOn = '>t-1d';
      } else if (dateFilter === 'week') {
        filters.updatedOn = '>t-7d';
      } else if (dateFilter === 'month') {
        filters.updatedOn = '>t-30d';
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

  // Reset all filters to default values
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProjectFilter('all');
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

  // Handle column resize start
  const handleResizeStart = (e: React.MouseEvent, columnId: string, initialWidth: number) => {
    e.preventDefault();
    setResizingColumnId(columnId);
    setResizeStartX(e.clientX);
    setResizeStartWidth(initialWidth);
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Handle column resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingColumnId) return;
    
    const deltaX = e.clientX - resizeStartX;
    const newWidth = Math.max(50, resizeStartWidth + deltaX); // Minimum width of 50px
    
    setColumns(columns.map(col => 
      col.id === resizingColumnId ? { ...col, width: newWidth } : col
    ));
  };

  // Handle column resize end
  const handleResizeEnd = () => {
    setResizingColumnId(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Get color class for status badge
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

  // Get color class for priority badge
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

  // Handle issue edit
  const handleEditIssue = (issue: any) => {
    setSelectedIssue(issue);
  };

  // Handle issue delete
  const handleDeleteIssue = async (issueId: number) => {
    if (!isConnected) return;
    
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteIssue(issueId);
      
      // Refresh issues
      await refreshData();
      
      alert('Issue deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting issue:', err);
      alert('Failed to delete issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
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
        <div className="flex gap-2">
          <button 
            onClick={resetFilters}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset Filters
          </button>
          <button 
            onClick={refreshData}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Issues'}
          </button>
        </div>
      </div>

      {/* Search and Basic Filters */}
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
              {issueStatuses.map(status => (
                <option key={status.id} value={status.name.toLowerCase()}>
                  {status.name}
                </option>
              ))}
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
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} />
              <span>{showAdvancedFilters ? 'Hide Filters' : 'More Filters'}</span>
            </button>
            
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={handleFilterChange}
            >
              <Search size={16} />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="priorityFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priorityFilter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>
              
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
            {(statusFilter !== 'all' || projectFilter !== 'all' || priorityFilter !== 'all' || 
              assigneeFilter !== 'all' || dateFilter !== 'all' || sortConfig.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {statusFilter}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setStatusFilter('all')} />
                  </span>
                )}
                
                {projectFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Project: {projects.find(p => p.id.toString() === projectFilter)?.name || projectFilter}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setProjectFilter('all')} />
                  </span>
                )}
                
                {priorityFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Priority: {priorities.find(p => p.id.toString() === priorityFilter)?.name || priorityFilter}
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
                    Sorted by: {sortConfig.map((sort, index) => 
                      `${sort.key} (${sort.direction})${index < sortConfig.length - 1 ? ', ' : ''}`
                    )}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setSortConfig([])} />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
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
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th 
                      key={column.id}
                      scope="col" 
                      className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: `${column.width}px`, minWidth: `${column.width}px` }}
                    >
                      <div className="flex items-center justify-between">
                        {column.sortable ? (
                          <button 
                            className="group flex items-center space-x-1 hover:text-gray-700"
                            onClick={() => handleSort(column.id)}
                          >
                            <span>{column.label}</span>
                            <span className="text-gray-400 group-hover:text-gray-700">
                              {getSortIndicator(column.id)}
                            </span>
                          </button>
                        ) : (
                          <span>{column.label}</span>
                        )}
                        
                        {/* Resizer handle */}
                        {column.id !== 'actions' && (
                          <div
                            className="absolute right-0 top-0 h-full w-4 cursor-col-resize flex items-center justify-center group"
                            onMouseDown={(e) => handleResizeStart(e, column.id, column.width)}
                          >
                            <div className="h-4/5 w-0.5 bg-gray-300 group-hover:bg-indigo-500"></div>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
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
                      {formatDate(issue.updated_on)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditIssue(issue)}
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

      {/* Issue Edit Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Edit Issue #{selectedIssue.id}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="editSubject" className="block text-sm font-medium text-gray-700 mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          id="editSubject"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={selectedIssue.subject}
                          onChange={(e) => setSelectedIssue({ ...selectedIssue, subject: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          id="editDescription"
                          rows={4}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={selectedIssue.description || ''}
                          onChange={(e) => setSelectedIssue({ ...selectedIssue, description: e.target.value })}
                        ></textarea>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            id="editStatus"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={selectedIssue.status.id}
                            onChange={(e) => setSelectedIssue({ 
                              ...selectedIssue, 
                              status: { 
                                ...selectedIssue.status, 
                                id: parseInt(e.target.value) 
                              } 
                            })}
                          >
                            {issueStatuses.map(status => (
                              <option key={status.id} value={status.id}>
                                {status.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="editPriority" className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            id="editPriority"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={selectedIssue.priority.id}
                            onChange={(e) => setSelectedIssue({ 
                              ...selectedIssue, 
                              priority: { 
                                ...selectedIssue.priority, 
                                id: parseInt(e.target.value) 
                              } 
                            })}
                          >
                            {priorities.map(priority => (
                              <option key={priority.id} value={priority.id}>
                                {priority.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="editAssignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                          Assigned To
                        </label>
                        <select
                          id="editAssignedTo"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={selectedIssue.assigned_to?.id || ''}
                          onChange={(e) => {
                            const assigneeId = e.target.value;
                            if (assigneeId) {
                              const assignee = getUniqueAssignees().find(a => a.id.toString() === assigneeId);
                              setSelectedIssue({ 
                                ...selectedIssue, 
                                assigned_to: assignee
                              });
                            } else {
                              setSelectedIssue({ 
                                ...selectedIssue, 
                                assigned_to: null
                              });
                            }
                          }}
                        >
                          <option value="">Unassigned</option>
                          {getUniqueAssignees().map(assignee => (
                            <option key={assignee.id} value={assignee.id}>
                              {assignee.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      
                      const issueData = {
                        issue: {
                          subject: selectedIssue.subject,
                          description: selectedIssue.description,
                          status_id: selectedIssue.status.id,
                          priority_id: selectedIssue.priority.id,
                          assigned_to_id: selectedIssue.assigned_to?.id || null
                        }
                      };
                      
                      await updateIssue(selectedIssue.id, issueData);
                      await refreshData();
                      setSelectedIssue(null);
                      
                      alert('Issue updated successfully.');
                    } catch (err) {
                      console.error('Error updating issue:', err);
                      alert('Failed to update issue. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={!selectedIssue.subject || loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
                >
                  {loading ? 'Updating...' : 'Update Issue'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};