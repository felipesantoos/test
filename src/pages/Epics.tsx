import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { AlertCircle, Plus, Search, Filter, RefreshCw, Calendar, FolderKanban, Edit2, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { CreateEpicModal } from '../components/epic/CreateEpicModal';
import { EditEpicModal } from '../components/epic/EditEpicModal';
import { DeleteEpicModal } from '../components/epic/DeleteEpicModal';

export const Epics = () => {
  const { 
    isLoading, 
    error, 
    epics, 
    projects, 
    fetchEpics, 
    fetchProjects, 
    createEpic, 
    updateEpic, 
    deleteEpic 
  } = useApi();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    projectId: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  // Modal states
  const [isCreatingEpic, setIsCreatingEpic] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<any>(null);
  const [epicToDelete, setEpicToDelete] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Load epics and projects on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchEpics(),
          fetchProjects()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  // Filter epics
  const getFilteredEpics = () => {
    return epics.filter(epic => {
      // Apply search filter
      if (searchQuery && !epic.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply project filter
      if (filters.projectId !== 'all' && epic.project_id.toString() !== filters.projectId) {
        return false;
      }
      
      // Apply date filters
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (new Date(epic.created_at) < fromDate) {
          return false;
        }
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (new Date(epic.created_at) > toDate) {
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
      projectId: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Handle creating a new epic
  const handleCreateEpic = async (epicData: any) => {
    setLoadingAction(true);
    
    try {
      await createEpic(epicData);
      setIsCreatingEpic(false);
      await fetchEpics(); // Refresh epics after creation
    } catch (err: any) {
      console.error('Error creating epic:', err);
      alert(err.message || 'Failed to create epic');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle updating an epic
  const handleUpdateEpic = async (epicData: any) => {
    if (!selectedEpic) return;
    
    setLoadingAction(true);
    
    try {
      await updateEpic(selectedEpic.id, epicData);
      setSelectedEpic(null);
      await fetchEpics(); // Refresh epics after update
    } catch (err: any) {
      console.error('Error updating epic:', err);
      alert(err.message || 'Failed to update epic');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle deleting an epic
  const handleDeleteEpic = async () => {
    if (!epicToDelete) return;
    
    setLoadingAction(true);
    
    try {
      await deleteEpic(epicToDelete.id);
      setEpicToDelete(null);
      await fetchEpics(); // Refresh epics after deletion
    } catch (err: any) {
      console.error('Error deleting epic:', err);
      alert(err.message || 'Failed to delete epic');
    } finally {
      setLoadingAction(false);
    }
  };

  const filteredEpics = getFilteredEpics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Epics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fetchEpics()}
            disabled={isLoading || loadingAction}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading || loadingAction ? 'animate-spin' : ''}`} />
            {isLoading || loadingAction ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setIsCreatingEpic(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Epic
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
              placeholder="Search epics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.projectId}
              onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
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
              <span>{showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            {(filters.projectId !== 'all' || filters.dateFrom || filters.dateTo || searchQuery) && (
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

      {/* Epics List */}
      {isLoading || loadingAction ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      ) : filteredEpics.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center">
            <FolderKanban size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No epics found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first epic</p>
            <button
              onClick={() => setIsCreatingEpic(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Create Epic
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEpics.map((epic) => (
            <div key={epic.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{epic.name}</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <FolderKanban size={16} className="mr-2" />
                    <span>{getProjectName(epic.project_id)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Created {formatDate(epic.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <Link
                    to={`/epics/${epic.id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Details
                  </Link>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedEpic(epic)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Epic"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setEpicToDelete(epic)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Epic"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Epic Modal */}
      {isCreatingEpic && (
        <CreateEpicModal
          onSubmit={handleCreateEpic}
          onClose={() => setIsCreatingEpic(false)}
          loading={loadingAction}
        />
      )}

      {/* Edit Epic Modal */}
      {selectedEpic && (
        <EditEpicModal
          epic={selectedEpic}
          onSubmit={handleUpdateEpic}
          onClose={() => setSelectedEpic(null)}
          loading={loadingAction}
        />
      )}

      {/* Delete Epic Modal */}
      {epicToDelete && (
        <DeleteEpicModal
          epic={epicToDelete}
          onConfirm={handleDeleteEpic}
          onClose={() => setEpicToDelete(null)}
          loading={loadingAction}
        />
      )}
    </div>
  );
};
