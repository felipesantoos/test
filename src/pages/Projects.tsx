import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { Search, Filter, ArrowUpDown, Calendar, Users, CheckSquare, AlertCircle, Plus, X, Clock, SortAsc, SortDesc, CalendarDays, CalendarClock, User } from 'lucide-react';
import { CreateProjectModal } from '../components/project/modals/CreateProjectModal';
import { format, subDays, isAfter } from 'date-fns';

export const Projects = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    projects, 
    trackers,
    refreshData, 
    fetchProjects, 
    fetchIssues,
    createProject
  } = useApi();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [projectsWithProgress, setProjectsWithProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State for creating a new project
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    identifier: '',
    description: '',
    is_public: true,
    tracker_ids: [] as number[]
  });

  // Enhanced filtering options
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'active', 'archived', 'completed'
    manager: 'all',
    createdAfter: '',
    createdBefore: '',
    updatedAfter: '',
    updatedBefore: '',
    isPublic: 'all' // 'all', 'public', 'private'
  });

  // Sorting options
  const [sortConfig, setSortConfig] = useState({
    key: 'updated_on', // 'name', 'created_on', 'updated_on', 'progress'
    direction: 'desc' as 'asc' | 'desc'
  });

  // State for managers list
  const [managers, setManagers] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && projects.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  // Extract unique managers from projects
  useEffect(() => {
    if (projects.length > 0) {
      const uniqueManagers = new Map();
      
      projects.forEach(project => {
        if (project.manager) {
          uniqueManagers.set(project.manager.id, project.manager);
        }
      });
      
      setManagers(Array.from(uniqueManagers.values()));
    }
  }, [projects]);

  // Calculate progress for each project based on issues
  useEffect(() => {
    const calculateProjectProgress = async () => {
      if (!isConnected || projects.length === 0) return;
      
      setLoading(true);
      
      try {
        const enhancedProjects = await Promise.all(
          projects.map(async (project) => {
            // Fetch all issues for this project
            const projectIssues = await fetchIssues({ projectId: project.id });
            
            // Count total and closed/resolved issues
            const totalIssues = projectIssues.length;
            const closedIssues = projectIssues.filter(issue => 
              issue.status && (issue.status.name.toLowerCase() === 'closed')
            ).length;
            
            // Calculate progress percentage
            const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
            
            // Determine if project is completed (100% progress)
            const isCompleted = progress === 100 && totalIssues > 0;
            
            return {
              ...project,
              issues_count: totalIssues,
              open_issues: totalIssues - closedIssues,
              closed_issues: closedIssues,
              progress: progress,
              members_count: project.members?.length || 0,
              isCompleted: isCompleted
            };
          })
        );
        
        setProjectsWithProgress(enhancedProjects);
        
        // Apply filters and sorting
        applyFiltersAndSort(enhancedProjects);
      } catch (err) {
        console.error('Error calculating project progress:', err);
      } finally {
        setLoading(false);
      }
    };
    
    calculateProjectProgress();
  }, [projects, isConnected]);

  // Apply filters and sorting when they change
  useEffect(() => {
    if (projectsWithProgress.length > 0) {
      applyFiltersAndSort(projectsWithProgress);
    }
  }, [searchQuery, filters, sortConfig]);

  // Apply filters and sorting to projects
  const applyFiltersAndSort = (projectsList: any[]) => {
    let filtered = [...projectsList];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(project => project.status === 1 && !project.isCompleted);
      } else if (filters.status === 'archived') {
        filtered = filtered.filter(project => project.status === 9);
      } else if (filters.status === 'completed') {
        filtered = filtered.filter(project => project.isCompleted);
      }
    }
    
    // Apply manager filter
    if (filters.manager !== 'all') {
      filtered = filtered.filter(project => 
        project.manager && project.manager.id.toString() === filters.manager
      );
    }
    
    // Apply date filters
    if (filters.createdAfter) {
      const afterDate = new Date(filters.createdAfter);
      filtered = filtered.filter(project => 
        new Date(project.created_on) >= afterDate
      );
    }
    
    if (filters.createdBefore) {
      const beforeDate = new Date(filters.createdBefore);
      beforeDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(project => 
        new Date(project.created_on) <= beforeDate
      );
    }
    
    if (filters.updatedAfter) {
      const afterDate = new Date(filters.updatedAfter);
      filtered = filtered.filter(project => 
        new Date(project.updated_on) >= afterDate
      );
    }
    
    if (filters.updatedBefore) {
      const beforeDate = new Date(filters.updatedBefore);
      beforeDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(project => 
        new Date(project.updated_on) <= beforeDate
      );
    }
    
    // Apply public/private filter
    if (filters.isPublic !== 'all') {
      const isPublic = filters.isPublic === 'public';
      filtered = filtered.filter(project => project.is_public === isPublic);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_on':
          aValue = new Date(a.created_on).getTime();
          bValue = new Date(b.created_on).getTime();
          break;
        case 'updated_on':
          aValue = new Date(a.updated_on).getTime();
          bValue = new Date(b.updated_on).getTime();
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        default:
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredProjects(filtered);
  };

  const handleSearch = () => {
    if (projectsWithProgress.length > 0) {
      applyFiltersAndSort(projectsWithProgress);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      status: 'all',
      manager: 'all',
      createdAfter: '',
      createdBefore: '',
      updatedAfter: '',
      updatedBefore: '',
      isPublic: 'all'
    });
  };

  // Handle sort change
  const handleSortChange = (key: string) => {
    setSortConfig(prevSort => {
      if (prevSort.key === key) {
        // Toggle direction if same key
        return {
          key,
          direction: prevSort.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New key, default to descending for dates, ascending for others
        const defaultDirection = (key === 'created_on' || key === 'updated_on') ? 'desc' : 'asc';
        return {
          key,
          direction: defaultDirection
        };
      }
    });
  };

  // Handle creating a new project
  const handleCreateProject = async () => {
    if (!isConnected || !newProject.name || !newProject.identifier) return;
    
    setLoadingAction(true);
    
    try {
      // Prepare project data for API
      const projectData = {
        project: {
          name: newProject.name,
          identifier: newProject.identifier,
          description: newProject.description,
          is_public: newProject.is_public,
          tracker_ids: newProject.tracker_ids.length > 0 ? newProject.tracker_ids : undefined
        }
      };
      
      // Create the project
      await createProject(projectData);
      
      // Refresh projects list
      await refreshData();
      
      // Reset form and close modal
      setNewProject({
        name: '',
        identifier: '',
        description: '',
        is_public: true,
        tracker_ids: []
      });
      
      setIsCreatingProject(false);
    } catch (err: any) {
      console.error('Error creating project:', err);
      alert(`Failed to create project: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge for project
  const getStatusBadge = (project: any) => {
    if (project.status === 9) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Archived</span>;
    } else if (project.isCompleted) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Active</span>;
    }
  };

  // Get relative time for display
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  // Get activity level based on last update
  const getActivityLevel = (updatedOn: string) => {
    const updateDate = new Date(updatedOn);
    const now = new Date();
    
    if (isAfter(updateDate, subDays(now, 7))) {
      return <span className="text-green-600 font-medium flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>High</span>;
    } else if (isAfter(updateDate, subDays(now, 30))) {
      return <span className="text-yellow-600 font-medium flex items-center"><span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>Medium</span>;
    } else {
      return <span className="text-gray-600 font-medium flex items-center"><span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>Low</span>;
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <div className="flex gap-2">
          <button 
            onClick={refreshData}
            disabled={isLoading || loading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isLoading || loading ? 'Refreshing...' : 'Refresh Projects'}
          </button>
          <button 
            onClick={() => setIsCreatingProject(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Project
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
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={handleSearch}
            >
              <Search size={16} />
              <span>Search</span>
            </button>
            <button 
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} />
              <span>{showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
            <div className="relative">
              <button 
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  const sortMenu = document.getElementById('sort-menu');
                  if (sortMenu) {
                    sortMenu.classList.toggle('hidden');
                  }
                }}
              >
                <ArrowUpDown size={16} />
                <span>Sort</span>
              </button>
              <div id="sort-menu" className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    className={`flex items-center w-full px-4 py-2 text-sm text-left ${sortConfig.key === 'name' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}
                    onClick={() => handleSortChange('name')}
                  >
                    {sortConfig.key === 'name' && sortConfig.direction === 'asc' ? <SortAsc size={16} className="mr-2" /> : <SortDesc size={16} className="mr-2" />}
                    Name
                  </button>
                  <button
                    className={`flex items-center w-full px-4 py-2 text-sm text-left ${sortConfig.key === 'created_on' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}
                    onClick={() => handleSortChange('created_on')}
                  >
                    {sortConfig.key === 'created_on' && sortConfig.direction === 'asc' ? <SortAsc size={16} className="mr-2" /> : <SortDesc size={16} className="mr-2" />}
                    Creation Date
                  </button>
                  <button
                    className={`flex items-center w-full px-4 py-2 text-sm text-left ${sortConfig.key === 'updated_on' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}
                    onClick={() => handleSortChange('updated_on')}
                  >
                    {sortConfig.key === 'updated_on' && sortConfig.direction === 'asc' ? <SortAsc size={16} className="mr-2" /> : <SortDesc size={16} className="mr-2" />}
                    Last Updated
                  </button>
                  <button
                    className={`flex items-center w-full px-4 py-2 text-sm text-left ${sortConfig.key === 'progress' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}
                    onClick={() => handleSortChange('progress')}
                  >
                    {sortConfig.key === 'progress' && sortConfig.direction === 'asc' ? <SortAsc size={16} className="mr-2" /> : <SortDesc size={16} className="mr-2" />}
                    Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="statusFilter"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="managerFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Manager
                </label>
                <select
                  id="managerFilter"
                  value={filters.manager}
                  onChange={(e) => setFilters({...filters, manager: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Managers</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="visibilityFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  id="visibilityFilter"
                  value={filters.isPublic}
                  onChange={(e) => setFilters({...filters, isPublic: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Projects</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="createdAfter" className="block text-xs text-gray-500 mb-1">
                      From
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="createdAfter"
                        value={filters.createdAfter}
                        onChange={(e) => setFilters({...filters, createdAfter: e.target.value})}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="createdBefore" className="block text-xs text-gray-500 mb-1">
                      To
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="createdBefore"
                        value={filters.createdBefore}
                        onChange={(e) => setFilters({...filters, createdBefore: e.target.value})}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="updatedAfter" className="block text-xs text-gray-500 mb-1">
                      From
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarClock size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="updatedAfter"
                        value={filters.updatedAfter}
                        onChange={(e) => setFilters({...filters, updatedAfter: e.target.value})}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="updatedBefore" className="block text-xs text-gray-500 mb-1">
                      To
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarClock size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="updatedBefore"
                        value={filters.updatedBefore}
                        onChange={(e) => setFilters({...filters, updatedBefore: e.target.value})}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Filters */}
            {(filters.status !== 'all' || filters.manager !== 'all' || filters.isPublic !== 'all' || 
              filters.createdAfter || filters.createdBefore || filters.updatedAfter || filters.updatedBefore || 
              searchQuery) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                
                {searchQuery && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: {searchQuery}
                    <X 
                      size={14} 
                      className="ml-1 cursor-pointer" 
                      onClick={() => setSearchQuery('')} 
                    />
                  </span>
                )}
                
                {filters.status !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                    <X 
                      size={14} 
                      className="ml-1 cursor-pointer" 
                      onClick={() => setFilters({...filters, status: 'all'})} 
                    />
                  </span>
                )}
                
                {filters.manager !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Manager: {managers.find(m => m.id.toString() === filters.manager)?.name || filters.manager}
                    <X 
                      size={14} 
                      className="ml-1 cursor-pointer" 
                      onClick={() => setFilters({...filters, manager: 'all'})} 
                    />
                  </span>
                )}
                
                {filters.isPublic !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Visibility: {filters.isPublic === 'public' ? 'Public' : 'Private'}
                    <X 
                      size={14} 
                      className="ml-1 cursor-pointer" 
                      onClick={() => setFilters({...filters, isPublic: 'all'})} 
                    />
                  </span>
                )}
                
                {(filters.createdAfter || filters.createdBefore) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Created: {filters.createdAfter ? `From ${filters.createdAfter}` : ''} {filters.createdBefore ? `To ${filters.createdBefore}` : ''}
                    <X 
                      size={14} 
                      className="ml-1 cursor-pointer" 
                      onClick={() => setFilters({...filters, createdAfter: '', createdBefore: ''})} 
                    />
                  </span>
                )}
                
                {(filters.updatedAfter || filters.updatedBefore) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Updated: {filters.updatedAfter ? `From ${filters.updatedAfter}` : ''} {filters.updatedBefore ? `To ${filters.updatedBefore}` : ''}
                    <X 
                      size={14} 
                      className="ml-1 cursor-pointer" 
                      onClick={() => setFilters({...filters, updatedAfter: '', updatedBefore: ''})} 
                    />
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
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSearch}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Projects List */}
      {(isLoading || loading) && filteredProjects.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error && filteredProjects.length === 0 ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center">
            <AlertCircle size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria or create a new project</p>
            <button 
              onClick={() => setIsCreatingProject(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Create New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                  {getStatusBadge(project)}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description || 'No description available'}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      Created: {formatDate(project.created_on)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      Updated: {getRelativeTime(project.updated_on)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">{project.members_count || 0} members</span>
                  </div>
                  <div className="flex items-center">
                    <CheckSquare size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">{project.issues_count || 0} issues</span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Activity:</span>
                    {getActivityLevel(project.updated_on)}
                  </div>
                  {project.manager && (
                    <div className="flex items-center">
                      <User size={14} className="text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">{project.manager.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 mt-auto">
                <Link 
                  to={`/projects/${project.id}`} 
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreatingProject && (
        <CreateProjectModal
          newProject={newProject}
          setNewProject={setNewProject}
          handleCreateProject={handleCreateProject}
          setIsCreatingProject={setIsCreatingProject}
          loadingAction={loadingAction}
          trackers={trackers}
        />
      )}
    </div>
  );
};