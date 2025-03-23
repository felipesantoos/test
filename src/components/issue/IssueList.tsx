import React, { useState } from "react";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  ArrowUpDown,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Settings
} from "lucide-react";
import { DeleteIssueConfirmModal } from "./modals/DeleteIssueConfirmModal";
import { BulkEditIssueModal } from "./modals/BulkEditIssueModal";
import { BulkDeleteConfirmModal } from './modals/BulkDeleteConfirmModal';
import { Link } from "react-router-dom";
import "./styles.css";

const getEpicColor = (epic: any) => {
  if (!epic || epic === "-") return "#ffffff";
  let hash = 0;
  for (let i = 0; i < epic.length; i++) {
    hash = epic.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 85%)`;
};

interface IssueListProps {
  issues: any[];
  loading: boolean;
  getStatusColorClass: (status: string) => string;
  getPriorityColorClass: (priority: string) => string;
  formatDate: (date: string) => string;
  handleDeleteIssue: (id: number) => void;
  handleEditIssue: (issue: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (assignee: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  projectFilter?: string;
  setProjectFilter?: (project: string) => void;
  epicFilter?: string;
  setEpicFilter?: (epic: string) => void;
  projects?: any[];
  issueStatuses: any[];
  priorities: any[];
  users: any[];
  getUniqueAssignees: () => any[];
  resetFilters: () => void;
  handleFilterChange: () => void;
  onViewIssue: (id: number) => void;
  onBulkUpdate?: (issueIds: number[], updates: any) => Promise<void>;
  handleBulkDelete?: (issueIds: number[]) => Promise<void>;
  getEpicValue: (issue: any) => string;
  getUniqueEpics: () => string[]
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  loading,
  getStatusColorClass,
  getPriorityColorClass,
  formatDate,
  handleDeleteIssue,
  handleEditIssue,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  dateFilter,
  setDateFilter,
  projectFilter,
  setProjectFilter,
  epicFilter,
  setEpicFilter,
  projects,
  issueStatuses,
  priorities,
  users,
  getUniqueAssignees,
  resetFilters,
  handleFilterChange,
  onViewIssue,
  onBulkUpdate,
  handleBulkDelete,
  getEpicValue,
  getUniqueEpics
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
  const [issueToDelete, setIssueToDelete] = useState<any | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [loadingBulkEdit, setLoadingBulkEdit] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [loadingBulkDelete, setLoadingBulkDelete] = useState(false);
  
  // New state for toggling closed issues
  const [showClosed, setShowClosed] = useState(false);

  // Handle column sorting
  const handleSort = (columnId: string) => {
    const currentSortIndex = sortConfig.findIndex(sort => sort.key === columnId);
    let newSortConfig = [...sortConfig];
    
    if (currentSortIndex >= 0) {
      const currentSort = sortConfig[currentSortIndex];
      if (currentSort.direction === 'asc') {
        newSortConfig[currentSortIndex] = { key: columnId, direction: 'desc' };
      } else {
        newSortConfig.splice(currentSortIndex, 1);
      }
    } else {
      newSortConfig.push({ key: columnId, direction: 'asc' });
    }
    
    setSortConfig(newSortConfig);
  };

  // Handle issue deletion
  const handleDelete = async () => {
    if (!issueToDelete) return;
    
    setLoadingDelete(true);
    try {
      await handleDeleteIssue(issueToDelete.id);
      setIssueToDelete(null);
    } finally {
      setLoadingDelete(false);
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async (updates: any) => {
    if (!onBulkUpdate || selectedIssues.length === 0) return;
    
    setLoadingBulkEdit(true);
    try {
      await onBulkUpdate(selectedIssues, updates);
      setSelectedIssues([]);
      setShowBulkEditModal(false);
    } finally {
      setLoadingBulkEdit(false);
    }
  };

  // Handle bulk delete
  const handleBulkDeleteConfirm = async () => {
    if (!handleBulkDelete || selectedIssues.length === 0) return;
    
    setLoadingBulkDelete(true);
    try {
      await handleBulkDelete(selectedIssues);
      setSelectedIssues([]);
      setShowBulkDeleteModal(false);
    } finally {
      setLoadingBulkDelete(false);
    }
  };

  // Handle select all issues
  const handleSelectAll = () => {
    if (selectedIssues.length === displayedIssues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(displayedIssues.map(issue => issue.id));
    }
  };

  // Handle single issue selection
  const handleSelectIssue = (issueId: number) => {
    setSelectedIssues(prev => {
      if (prev.includes(issueId)) {
        return prev.filter(id => id !== issueId);
      } else {
        return [...prev, issueId];
      }
    });
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

  // Apply sorting to issues and filter by epic
  const sortedIssues = [...issues].sort((a, b) => {
    if (sortConfig.length > 0) {
      for (const sort of sortConfig) {
        let aValue, bValue;
        
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
            aValue = a.project?.name;
            bValue = b.project?.name;
            break;
          case 'status':
            aValue = a.status.name;
            bValue = b.status.name;
            break;
          case 'priority':
            aValue = a.priority.id;
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
          case 'epic':
            aValue = getEpicValue(a);
            bValue = getEpicValue(b);
            break;
          default:
            aValue = a[sort.key];
            bValue = b[sort.key];
        }
        
        if (aValue < bValue) {
          return sort.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sort.direction === 'asc' ? 1 : -1;
        }
      }
    }
    
    return a.id - b.id;
  }).filter(issue => {
    // Apply epic filter
    if (epicFilter !== 'all') {
      if (epicFilter === 'none') {
        return getEpicValue(issue) === '-';
      }
      return getEpicValue(issue) === epicFilter;
    }
    return true;
  });

  // Filter and reorder issues based on the showClosed toggle
  const displayedIssues = showClosed 
    ? [
        ...sortedIssues.filter(issue => issue.status.name !== 'Closed'),
        ...sortedIssues.filter(issue => issue.status.name === 'Closed')
      ]
    : sortedIssues.filter(issue => issue.status.name !== 'Closed');

  return (
    <div className="space-y-6">
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
              {issueStatuses.map(status => (
                <option key={status.id} value={status.name.toLowerCase()}>
                  {status.name}
                </option>
              ))}
            </select>

            {projectFilter !== undefined && setProjectFilter !== undefined && projects && (
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
            )}

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

            {/* Toggle Closed Issues */}
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={() => setShowClosed(!showClosed)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Show Closed</span>
            </label>

            {/* Bulk Actions */}
            {selectedIssues.length > 0 && (
              <>
                <button
                  onClick={() => setShowBulkEditModal(true)}
                  className="flex items-center space-x-1 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Settings size={16} />
                  <span>Bulk Edit ({selectedIssues.length})</span>
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="flex items-center space-x-1 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  <Trash2 size={16} />
                  <span>Delete ({selectedIssues.length})</span>
                </button>
              </>
            )}
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

            <div>
              <label htmlFor="epicFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Epic
              </label>
              <select
                id="epicFilter"
                value={epicFilter}
                onChange={(e) => setEpicFilter && setEpicFilter(e.target.value)}
                className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Epics</option>
                <option value="none">No Epic</option>
                {getUniqueEpics().map(epic => (
                  <option key={epic} value={epic}>
                    {epic}
                  </option>
                ))}
              </select>
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

                {projectFilter !== 'all' && projects && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Project: {projects.find(p => p.id.toString() === projectFilter)?.name || projectFilter}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setProjectFilter && setProjectFilter('all')} />
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
                    Sorted by: {sortConfig.map((sort, index) => {
                      let fieldName = sort.key;
                      if (fieldName === 'assignedTo') fieldName = 'Assigned To';
                      return `${fieldName} (${sort.direction})${index < sortConfig.length - 1 ? ', ' : ''}`;
                    })}
                    <X size={14} className="ml-1 cursor-pointer" onClick={() => setSortConfig([])} />
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  Clear All Filters
                  <X size={14} className="ml-1" />
                </button>
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
      ) : displayedIssues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No issues found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Select All Checkbox */}
                  <th scope="col" className="sticky left-0 z-30 bg-gray-50 px-6 border-r border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedIssues.length === displayedIssues.length}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>

                  {/* ID Column */}
                  <th 
                    scope="col" 
                    className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      <span>ID</span>
                      {getSortIndicator('id')}
                    </div>
                  </th>

                  {/* Fixed Subject Column */}
                  <th 
                    scope="col" 
                    className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                    onClick={() => handleSort('subject')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Subject</span>
                      <span className="text-gray-400">{getSortIndicator('subject')}</span>
                    </div>
                  </th>

                  {/* Scrollable Columns */}
                  {projectFilter !== undefined && (
                    <th 
                      scope="col" 
                      className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                      style={{ minWidth: "200px" }}
                      onClick={() => handleSort('project')}
                    >
                      <div className="flex items-center justify-between">
                        <span>Project</span>
                        <span className="text-gray-400">{getSortIndicator('project')}</span>
                      </div>
                    </th>
                  )}
                  <th 
                    scope="col" 
                    className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                    style={{ minWidth: "150px" }}
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className="text-gray-400">{getSortIndicator('status')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                    style={{ minWidth: "150px" }}
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Priority</span>
                      <span className="text-gray-400">{getSortIndicator('priority')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                    style={{ minWidth: "150px" }}
                    onClick={() => handleSort('epic')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Epic</span>
                      <span className="text-gray-400">{getSortIndicator('epic')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                    style={{ minWidth: "200px" }}
                    onClick={() => handleSort('assignedTo')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Assigned To</span>
                      <span className="text-gray-400">{getSortIndicator('assignedTo')}</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer border-r border-gray-200"
                    style={{ minWidth: "150px" }}
                    onClick={() => handleSort('updated')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Updated</span>
                      <span className="text-gray-400">{getSortIndicator('updated')}</span>
                    </div>
                  </th>

                  {/* Actions Column */}
                  <th 
                    scope="col" 
                    className="sticky right-0 z-30 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                    style={{ 
                      width: "120px",
                      minWidth: "120px",
                      boxShadow: '-4px 0 6px -2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    {/* Checkbox */}
                    <td
                      scope="col"
                      className="sticky left-0 z-30 bg-gray-50 px-6 border-r border-gray-200"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectedIssues.includes(issue.id)}
                          onChange={() => handleSelectIssue(issue.id)}
                        />
                      </div>
                    </td>

                    {/* ID Column */}
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200"
                      style={{ 
                        width: "100px",
                        minWidth: "100px"
                      }}
                    >
                      #{issue.id}
                    </td>

                    {/* Fixed Subject Column */}
                    <td 
                      className="px-6 py-4 border-r border-gray-200"
                      style={{ 
                        width: "400px",
                        minWidth: "400px",
                        maxWidth: "400px"
                      }}
                    >
                      <div
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600 multiline-truncate"
                        title={issue.subject}
                        onClick={() => onViewIssue(issue.id)}
                      >
                        {issue.subject}
                      </div>
                    </td>

                    {/* Scrollable Columns */}
                    {projectFilter !== undefined && (
                      <td 
                        className="px-6 py-4 whitespace-nowrap border-r border-gray-200"
                        style={{ minWidth: "200px" }}
                      >
                        <div className="text-sm text-gray-900">
                          {issue.project.name}
                        </div>
                      </td>
                    )}

                    <td 
                      className="px-6 py-4 whitespace-nowrap border-r border-gray-200"
                      style={{ minWidth: "150px" }}
                    >
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(issue.status.name)}`}>
                        {issue.status.name}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap border-r border-gray-200"
                      style={{ minWidth: "150px" }}
                    >
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColorClass(issue.priority.name)}`}>
                        {issue.priority.name}
                      </span>
                    </td>

                    <td 
                      className="px-6 py-4 whitespace-nowrap border-r border-gray-200"
                      style={{ minWidth: "150px" }}
                    >
                      <span
                        style={{ backgroundColor: getEpicColor(getEpicValue(issue)) }}
                        className="px-2 py-1 rounded text-sm text-gray-900 inline-block"
                      >
                        {getEpicValue(issue)}
                      </span>
                    </td>

                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200"
                        style={{ minWidth: "200px" }}
                      >
                        {issue.assigned_to ? issue.assigned_to.name : '-'}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200"
                        style={{ minWidth: "150px" }}
                      >
                        {formatDate(issue.updated_on)}
                      </td>

                    {/* Actions Column */}
                    <td 
                        className="sticky right-0 z-20 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-right border-l border-gray-200"
                        style={{ 
                          width: "120px",
                          minWidth: "120px",
                          boxShadow: '-4px 0 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                      <div className="flex justify-end space-x-3">
                        <Link 
                          to={`/issues/${issue.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="View Issue"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleEditIssue(issue)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Issue"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setIssueToDelete(issue)}
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

      {/* Delete Confirmation Modal */}
      {issueToDelete && (
        <DeleteIssueConfirmModal
          issue={issueToDelete}
          onDelete={handleDelete}
          onClose={() => setIssueToDelete(null)}
          isLoading={loadingDelete}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <BulkEditIssueModal
          selectedIssues={displayedIssues.filter(issue => selectedIssues.includes(issue.id))}
          onClose={() => setShowBulkEditModal(false)}
          onSave={handleBulkUpdate}
          loadingAction={loadingBulkEdit}
          statuses={issueStatuses}
          priorities={priorities}
          users={users}
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteConfirmModal
          selectedIssues={displayedIssues.filter(issue => selectedIssues.includes(issue.id))}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDeleteConfirm}
          isLoading={loadingBulkDelete}
        />
      )}
    </div>
  );
};

// Interface for sort configuration
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}
