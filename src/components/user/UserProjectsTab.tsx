import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import { Link } from 'react-router-dom';
import { AlertCircle, FolderKanban, Edit, Plus, Search } from 'lucide-react';
import { EditUserProjectsModal } from './modals/EditUserProjectsModal';

interface UserProjectsTabProps {
  userId: number;
  userName: string;
}

export const UserProjectsTab: React.FC<UserProjectsTabProps> = ({ userId, userName }) => {
  const { fetchProjectMemberships, projects, roles } = useApi();
  
  const [userMemberships, setUserMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMemberships, setFilteredMemberships] = useState<any[]>([]);
  
  // Modal state
  const [isEditingProjects, setIsEditingProjects] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Server URL from environment variable
  const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load user memberships
  useEffect(() => {
    const loadMemberships = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch user details with memberships
        const redmineUrl = localStorage.getItem('redmine_url') || '';
        
        const response = await fetch(`${SERVER_URL}/api/users/${userId}?redmineUrl=${encodeURIComponent(redmineUrl)}&include=memberships`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user memberships');
        }
        
        const data = await response.json();
        
        if (data.user && data.user.memberships) {
          setUserMemberships(data.user.memberships);
          setFilteredMemberships(data.user.memberships);
        } else {
          setUserMemberships([]);
          setFilteredMemberships([]);
        }
      } catch (err: any) {
        console.error('Error fetching user memberships:', err);
        setError(err.message || 'Failed to load user memberships');
      } finally {
        setLoading(false);
      }
    };
    
    loadMemberships();
  }, [userId, refreshTrigger, SERVER_URL]);

  // Filter memberships when search query changes
  useEffect(() => {
    if (userMemberships.length > 0) {
      if (searchQuery) {
        const filtered = userMemberships.filter(membership => {
          const projectName = membership.project?.name?.toLowerCase() || '';
          
          return projectName.includes(searchQuery.toLowerCase());
        });
        setFilteredMemberships(filtered);
      } else {
        setFilteredMemberships(userMemberships);
      }
    }
  }, [searchQuery, userMemberships]);

  // Handle updating user projects
  const handleUpdateUserProjects = async (updatedMemberships: any[]) => {
    setLoadingAction(true);
    
    try {
      // Process each membership update
      for (const membership of updatedMemberships) {
        const redmineUrl = localStorage.getItem('redmine_url') || '';
        
        if (membership.membershipId) {
          // Update existing membership
          const membershipData = {
            membership: {
              role_ids: membership.roleIds
            }
          };
          
          await fetch(`${SERVER_URL}/api/memberships/${membership.membershipId}?redmineUrl=${encodeURIComponent(redmineUrl)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(membershipData)
          });
        } else {
          // Add new membership
          const membershipData = {
            membership: {
              user_id: userId,
              role_ids: membership.roleIds
            }
          };
          
          await fetch(`${SERVER_URL}/api/projects/${membership.projectId}/memberships?redmineUrl=${encodeURIComponent(redmineUrl)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(membershipData)
          });
        }
      }
      
      // Refresh memberships
      setRefreshTrigger(prev => prev + 1);
      setIsEditingProjects(false);
    } catch (err: any) {
      console.error('Error updating user projects:', err);
      alert(`Failed to update user projects: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Get role names for a membership
  const getRoleNames = (membership: any) => {
    if (!membership.roles || membership.roles.length === 0) {
      return 'No roles';
    }
    
    return membership.roles.map((role: any) => role.name).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">User Projects</h2>
        <button 
          onClick={() => setIsEditingProjects(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Edit size={16} className="mr-2" />
          Edit Projects
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
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
          />
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      ) : filteredMemberships.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex flex-col items-center">
            <FolderKanban size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
            <p className="text-gray-500 mb-4">This user is not a member of any projects or none match your search criteria</p>
            <button 
              onClick={() => setIsEditingProjects(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Projects
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemberships.map((membership) => (
            <div key={membership.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FolderKanban size={20} className="text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {membership.project?.name || 'Unknown Project'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {membership.project?.identifier || ''}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Roles:</h4>
                  <div className="flex flex-wrap gap-1">
                    {membership.roles && membership.roles.map((role: any) => (
                      <span 
                        key={role.id} 
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          role.inherited 
                            ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {role.name}
                        {role.inherited && (
                          <span className="ml-1 text-gray-500">(inherited)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                <Link 
                  to={`/projects/${membership.project?.id}`} 
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                >
                  View Project
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit User Projects Modal */}
      {isEditingProjects && (
        <EditUserProjectsModal
          userId={userId}
          userName={userName}
          userMemberships={userMemberships}
          projects={projects}
          roles={roles}
          handleUpdateUserProjects={handleUpdateUserProjects}
          setIsEditingProjects={setIsEditingProjects}
          loadingAction={loadingAction}
        />
      )}
    </div>
  );
};