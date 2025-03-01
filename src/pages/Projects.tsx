import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import { Search, Filter, ArrowUpDown, Calendar, Users, CheckSquare } from 'lucide-react';

export const Projects = () => {
  const { isConnected, isLoading, error, projects, issues, refreshData, fetchProjects, fetchIssues } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [projectsWithProgress, setProjectsWithProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && projects.length === 0) {
      refreshData();
    }
  }, [isConnected]);

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
              issue.status && (issue.status.name.toLowerCase() === 'closed' || issue.status.name.toLowerCase() === 'resolved')
            ).length;
            
            // Calculate progress percentage
            const progress = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;
            
            return {
              ...project,
              issues_count: totalIssues,
              open_issues: totalIssues - closedIssues,
              closed_issues: closedIssues,
              progress: progress,
              members_count: project.members?.length || 0
            };
          })
        );
        
        setProjectsWithProgress(enhancedProjects);
        
        // Apply search filter if needed
        if (searchQuery) {
          setFilteredProjects(
            enhancedProjects.filter(project => 
              project.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        } else {
          setFilteredProjects(enhancedProjects);
        }
      } catch (err) {
        console.error('Error calculating project progress:', err);
      } finally {
        setLoading(false);
      }
    };
    
    calculateProjectProgress();
  }, [projects, isConnected]);

  // Handle search query changes
  useEffect(() => {
    if (projectsWithProgress.length > 0) {
      setFilteredProjects(
        projectsWithProgress.filter(project => 
          project.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, projectsWithProgress]);

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

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
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
          disabled={isLoading || loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
        >
          {isLoading || loading ? 'Refreshing...' : 'Refresh Projects'}
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
                      {formatDate(project.updated_on)}
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
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-600">{project.open_issues || 0} open</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
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
    </div>
  );
};