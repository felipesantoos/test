import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Plus, Search, Filter, RefreshCw, Calendar, Edit2, Trash2, X, Clock, CalendarRange } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { CreateSprintModal } from '../components/sprint/CreateSprintModal';
import { EditSprintModal } from '../components/sprint/EditSprintModal';
import { DeleteSprintModal } from '../components/sprint/DeleteSprintModal';

// Server URL from environment variable
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const Sprints = () => {
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'active', 'completed', 'upcoming'
    dateFrom: '',
    dateTo: ''
  });
  
  // Modal states
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [sprintToDelete, setSprintToDelete] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load sprints
  useEffect(() => {
    const loadSprints = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${SERVER_URL}/api/sprints`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sprints');
        }
        
        const data = await response.json();
        setSprints(data);
      } catch (err: any) {
        console.error('Error loading sprints:', err);
        setError(err.message || 'Failed to load sprints');
      } finally {
        setLoading(false);
      }
    };
    
    loadSprints();
  }, [refreshTrigger]);

  // Filter sprints
  const getFilteredSprints = () => {
    return sprints.filter(sprint => {
      // Apply search filter
      if (searchQuery && !sprint.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply status filter
      if (filters.status !== 'all') {
        const now = new Date();
        const startDate = parseISO(sprint.start_date);
        const endDate = parseISO(sprint.end_date);
        
        switch (filters.status) {
          case 'active':
            if (!isAfter(now, startDate) || !isBefore(now, endDate)) {
              return false;
            }
            break;
          case 'completed':
            if (!isAfter(now, endDate)) {
              return false;
            }
            break;
          case 'upcoming':
            if (!isBefore(now, startDate)) {
              return false;
            }
            break;
        }
      }
      
      // Apply date filters
      if (filters.dateFrom) {
        const fromDate = parseISO(filters.dateFrom);
        if (isBefore(parseISO(sprint.end_date), fromDate)) {
          return false;
        }
      }
      
      if (filters.dateTo) {
        const toDate = parseISO(filters.dateTo);
        if (isAfter(parseISO(sprint.start_date), toDate)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  // Get sprint status
  const getSprintStatus = (sprint: any) => {
    const now = new Date();
    const startDate = parseISO(sprint.start_date);
    const endDate = parseISO(sprint.end_date);
    
    if (isAfter(now, endDate)) {
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    } else if (isAfter(now, startDate) && isBefore(now, endDate)) {
      return { label: 'Active', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // Handle creating a new sprint
  const handleCreateSprint = async (sprintData: any) => {
    setLoadingAction(true);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/sprints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sprintData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create sprint');
      }
      
      setRefreshTrigger(prev => prev + 1);
      setIsCreatingSprint(false);
    } catch (err: any) {
      console.error('Error creating sprint:', err);
      alert(err.message || 'Failed to create sprint');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle updating a sprint
  const handleUpdateSprint = async (sprintData: any) => {
    if (!selectedSprint) return;
    
    setLoadingAction(true);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/sprints/${selectedSprint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sprintData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sprint');
      }
      
      setRefreshTrigger(prev => prev + 1);
      setSelectedSprint(null);
    } catch (err: any) {
      console.error('Error updating sprint:', err);
      alert(err.message || 'Failed to update sprint');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle deleting a sprint
  const handleDeleteSprint = async () => {
    if (!sprintToDelete) return;
    
    setLoadingAction(true);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/sprints/${sprintToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete sprint');
      }
      
      setRefreshTrigger(prev => prev + 1);
      setSprintToDelete(null);
    } catch (err: any) {
      console.error('Error deleting sprint:', err);
      alert(err.message || 'Failed to delete sprint');
    } finally {
      setLoadingAction(false);
    }
  };

  const filteredSprints = getFilteredSprints();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sprints</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading || loadingAction}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${loading || loadingAction ? 'animate-spin' : ''}`} />
            {loading || loadingAction ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setIsCreatingSprint(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Sprint
          </button>
        </div>
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
              placeholder="Search sprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md text-sm text-gray-700 py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="upcoming">Upcoming</option>
            </select>

            <button
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} />
              <span>{showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            {(filters.status !== 'all' || filters.dateFrom || filters.dateTo || searchQuery) && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="dateFrom" className="block text-xs text-gray-500 mb-1">
                      From
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="dateFrom"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="dateTo" className="block text-xs text-gray-500 mb-1">
                      To
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="dateTo"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sprints List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      ) : filteredSprints.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center">
            <CalendarRange size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No sprints found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first sprint</p>
            <button
              onClick={() => setIsCreatingSprint(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Create Sprint
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSprints.map((sprint) => {
            const status = getSprintStatus(sprint);
            return (
              <div key={sprint.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{sprint.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      <span>
                        {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-2" />
                      <span>Created {formatDate(sprint.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Link
                      to={`/sprints/${sprint.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedSprint(sprint)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Sprint"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setSprintToDelete(sprint)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Sprint"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Sprint Modal */}
      {isCreatingSprint && (
        <CreateSprintModal
          onSubmit={handleCreateSprint}
          onClose={() => setIsCreatingSprint(false)}
          loading={loadingAction}
        />
      )}

      {/* Edit Sprint Modal */}
      {selectedSprint && (
        <EditSprintModal
          sprint={selectedSprint}
          onSubmit={handleUpdateSprint}
          onClose={() => setSelectedSprint(null)}
          loading={loadingAction}
        />
      )}

      {/* Delete Sprint Modal */}
      {sprintToDelete && (
        <DeleteSprintModal
          sprint={sprintToDelete}
          onConfirm={handleDeleteSprint}
          onClose={() => setSprintToDelete(null)}
          loading={loadingAction}
        />
      )}
    </div>
  );
};
