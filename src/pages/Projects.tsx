import React, { useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import { Search, Filter, ArrowUpDown, Calendar, Users, CheckSquare } from 'lucide-react';

export const Projects = () => {
  const { isConnected, isLoading, error, projects, refreshData, fetchProjects } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && projects.length === 0) {
      refreshData();
    }
  }, [isConnected]);

  useEffect(() => {
    if (projects.length > 0) {
      setFilteredProjects(
        projects.filter(project => 
          project.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      // Mock data for demonstration
      setFilteredProjects([
        { 
          id: 1, 
          name: 'Website Redesign', 
          description: 'Complete overhaul of the company website with new design and features',
          created_on: '2023-01-15',
          updated_on: '2023-06-20',
          status: 'active',
          issues_count: 24,
          open_issues: 8,
          members_count: 6,
          progress: 65
        },
        { 
          id: 2, 
          name: 'Mobile App Development', 
          description: 'Creating a new mobile application for both iOS and Android platforms',
          created_on: '2023-03-10',
          updated_on: '2023-06-18',
          status: 'active',
          issues_count: 42,
          open_issues: 15,
          members_count: 8,
          progress: 40
        },
        { 
          id: 3, 
          name: 'API Integration', 
          description: 'Integrating third-party APIs and services into our platform',
          created_on: '2023-02-05',
          updated_on: '2023-06-15',
          status: 'active',
          issues_count: 18,
          open_issues: 3,
          members_count: 4,
          progress: 85
        },
        { 
          id: 4, 
          name: 'Database Migration', 
          description: 'Migrating from legacy database to new cloud-based solution',
          created_on: '2023-04-20',
          updated_on: '2023-06-10',
          status: 'active',
          issues_count: 12,
          open_issues: 5,
          members_count: 3,
          progress: 50
        },
        { 
          id: 5, 
          name: 'Security Audit', 
          description: 'Comprehensive security review and implementation of best practices',
          created_on: '2023-05-15',
          updated_on: '2023-06-05',
          status: 'active',
          issues_count: 8,
          open_issues: 2,
          members_count: 2,
          progress: 75
        }
      ]);
    }
  }, [projects, searchQuery]);

  const handleSearch = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    
    try {
      const fetchedProjects = await fetchProjects();
      
      // Apply search filter client-side
      const filtered = searchQuery 
        ? fetchedProjects.filter(project => 
            project.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : fetchedProjects;
        
      setFilteredProjects(filtered);
    } catch (err) {
      console.error('Error searching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Not Connected to Redmine</h2>
          <p className="text-gray-600 mb-4">Please configure your Redmine API settings to get started.</p>
          <a href="/settings" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <button 
          onClick={refreshData}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Projects'}
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
            <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
              <ArrowUpDown size={16} />
              <span>Sort</span>
            </button>
          </div>
        </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {new Date(project.updated_on).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">{project.members_count} members</span>
                  </div>
                  <div className="flex items-center">
                    <CheckSquare size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">{project.issues_count} issues</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-600">{project.open_issues} open</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <a 
                  href={`/projects/${project.id}`} 
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};