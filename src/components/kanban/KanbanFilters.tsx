import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { useApi } from '../../context/ApiContext';
import { format } from 'date-fns';

interface KanbanFiltersProps {
  selectedProject: string;
  setSelectedProject: (id: string) => void;
  filters: {
    search: string;
    assignee: string;
    priority: string[];
    tracker: string;
    status: string[];
    dateFrom: string;
    dateTo: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    assignee: string;
    priority: string[];
    tracker: string;
    status: string[];
    dateFrom: string;
    dateTo: string;
  }>>;
  applyFilters: () => void;
  resetFilters: () => void;
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  selectedProject,
  setSelectedProject,
  filters,
  setFilters,
  applyFilters,
  resetFilters
}) => {
  const { projects, users, priorities, trackers, issueStatuses } = useApi();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  
  // Update search input when filters change
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Apply search filter on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setFilters(prev => ({ ...prev, search: searchInput }));
      applyFilters();
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
    applyFilters();
  };

  // Handle priority selection (multi-select)
  const handlePriorityChange = (priorityId: string) => {
    setFilters(prev => {
      const newPriorities = prev.priority.includes(priorityId)
        ? prev.priority.filter(id => id !== priorityId)
        : [...prev.priority, priorityId];
      return { ...prev, priority: newPriorities };
    });
  };

  // Handle status selection (multi-select)
  const handleStatusChange = (statusId: string) => {
    setFilters(prev => {
      const newStatuses = prev.status.includes(statusId)
        ? prev.status.filter(id => id !== statusId)
        : [...prev.status, statusId];
      return { ...prev, status: newStatuses };
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search issues by title or ID..."
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
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
            onClick={handleSearchClick}
          >
            <Search size={16} />
            <span>Search</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={16} />
            <span>{showAdvancedFilters ? 'Hide Filters' : 'More Filters'}</span>
          </button>
          
          {(filters.search || filters.assignee !== 'all' || filters.priority.length > 0 || 
           filters.tracker !== 'all' || filters.status.length > 0 || 
           filters.dateFrom || filters.dateTo) && (
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50"
              onClick={resetFilters}
            >
              <X size={16} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assignee Filter */}
            <div>
              <label htmlFor="assigneeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                id="assigneeFilter"
                value={filters.assignee}
                onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstname} {user.lastname}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tracker Filter */}
            <div>
              <label htmlFor="trackerFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Tracker Type
              </label>
              <select
                id="trackerFilter"
                value={filters.tracker}
                onChange={(e) => setFilters(prev => ({ ...prev, tracker: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Trackers</option>
                {trackers.map(tracker => (
                  <option key={tracker.id} value={tracker.id}>
                    {tracker.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="dateFrom"
                    value={formatDate(filters.dateFrom)}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="dateTo"
                    value={formatDate(filters.dateTo)}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Priority Filter (Multi-select) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {priorities.map(priority => (
                <div key={priority.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`priority-${priority.id}`}
                    checked={filters.priority.includes(priority.id.toString())}
                    onChange={() => handlePriorityChange(priority.id.toString())}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`priority-${priority.id}`} className="ml-2 text-sm text-gray-700">
                    {priority.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Status Filter (Multi-select) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Visibility
            </label>
            <div className="flex flex-wrap gap-2">
              {issueStatuses.map(status => (
                <div key={status.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`status-${status.id}`}
                    checked={filters.status.includes(status.id.toString())}
                    onChange={() => handleStatusChange(status.id.toString())}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`status-${status.id}`} className="ml-2 text-sm text-gray-700">
                    {status.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={applyFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Active Filters Display */}
      {(filters.search || filters.assignee !== 'all' || filters.priority.length > 0 || 
        filters.tracker !== 'all' || filters.status.length > 0 || 
        filters.dateFrom || filters.dateTo) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          
          {filters.search && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: {filters.search}
              <X 
                size={14} 
                className="ml-1 cursor-pointer" 
                onClick={() => {
                  setFilters(prev => ({ ...prev, search: '' }));
                  setSearchInput('');
                  applyFilters();
                }} 
              />
            </span>
          )}
          
          {filters.assignee !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Assignee: {filters.assignee === 'unassigned' ? 'Unassigned' : 
                users.find(u => u.id.toString() === filters.assignee)?.firstname + ' ' + 
                users.find(u => u.id.toString() === filters.assignee)?.lastname || filters.assignee}
              <X 
                size={14} 
                className="ml-1 cursor-pointer" 
                onClick={() => {
                  setFilters(prev => ({ ...prev, assignee: 'all' }));
                  applyFilters();
                }} 
              />
            </span>
          )}
          
          {filters.priority.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Priority: {filters.priority.map(p => 
                priorities.find(priority => priority.id.toString() === p)?.name
              ).join(', ')}
              <X 
                size={14} 
                className="ml-1 cursor-pointer" 
                onClick={() => {
                  setFilters(prev => ({ ...prev, priority: [] }));
                  applyFilters();
                }} 
              />
            </span>
          )}
          
          {filters.tracker !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Tracker: {trackers.find(t => t.id.toString() === filters.tracker)?.name || filters.tracker}
              <X 
                size={14} 
                className="ml-1 cursor-pointer" 
                onClick={() => {
                  setFilters(prev => ({ ...prev, tracker: 'all' }));
                  applyFilters();
                }} 
              />
            </span>
          )}
          
          {filters.status.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Status: {filters.status.map(s => 
                issueStatuses.find(status => status.id.toString() === s)?.name
              ).join(', ')}
              <X 
                size={14} 
                className="ml-1 cursor-pointer" 
                onClick={() => {
                  setFilters(prev => ({ ...prev, status: [] }));
                  applyFilters();
                }} 
              />
            </span>
          )}
          
          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Date Range: {filters.dateFrom ? formatDate(filters.dateFrom) : 'Any'} to {filters.dateTo ? formatDate(filters.dateTo) : 'Any'}
              <X 
                size={14} 
                className="ml-1 cursor-pointer" 
                onClick={() => {
                  setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
                  applyFilters();
                }} 
              />
            </span>
          )}
        </div>
      )}
    </div>
  );
};