import React, { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import { Link } from 'react-router-dom';
import { AlertCircle, FolderKanban, Edit, Trash2, Plus, Search } from 'lucide-react';
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
  
  // Modal states
  const [isEditingProjects, setIsEditingProjects] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load user's project memberships
  useEffect(() => {
    const loadUserMemberships = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // This is a placeholder - we would need to implement an API endpoint to get all memberships for a user
        // For now, we'll simulate it by fetching memberships for each project and filtering by user
        const allMemberships: any[] = [];
        
        for (const project of projects) {
          try {
            const projectMemberships = await fetchProjectMemberships(project.id);
            const userMembershipsInProject = projectMemberships.filter(
              (membership: any) => membership.user && membership.user.id === userId
            );
            
            // Add project information to each membership
            userMembershipsInProject.forEach((membership: any) => {
              membership.project = project;
            });
            
            allMemberships.push(...userMembershipsInProject);
          } catch (err) {
            console.error(`Error fetching memberships for project ${project.id}:`, err);
          }
        }
        
        setUserMemberships(allMemberships);
        setFilteredMemberships(allMemberships);
      } catch (err: any) {
        console.error('Error loading user memberships:', err);
        setError(err.message || 'Failed to load user memberships');
      } finally {
        setLoading(false);
      }
    };
    
    if (projects.length > 0) {
      loadUserMemberships();
    }
  }, [userId, projects, fetchProjectMemberships, refreshTrigger]);

  // Filter memberships when search query changes
  useEffect(() => {
    if (userMemberships.length > 0) {
      if (searchQuery) {
        const filtered = userMemberships.filter(membership => {
          const projectName = membership.project ? membership.project.name.toLowerCase() : '';
          return projectName.includes(searchQuery.toLowerCase());
        });
        setFilteredMemberships(filtered);
      } else {
        setFilteredMemberships(userMemberships);
      }
    }
  }, [searchQuery, userMemberships]);

  // Handle updating user's project memberships
  const handleUpdateUserProjects = async (updatedMemberships: any[]) => {
    setLoadingAction(true);
    
    try {
      // This would need to be implemented based on your API
      // For now, we'll just simulate success
      console.log('Updated memberships:', updatedMemberships);
      
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

  // Check if a role is inherited
  const isRoleInherited = (role: any) => {
    return role.inherited === true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">User Projects</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditingProjects(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Edit size={16} className="mr-2" />
            Edit Projects
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
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
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? `No projects matching "${searchQuery}" found for this user.` 
                : `${userName} is not a member of any projects.`}
            </p>
            <button 
              onClick={() => setIsEditingProjects(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add to Projects
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMemberships.map((membership) => (
                  <tr key={membership.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FolderKanban size={20} className="text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link to={`/projects/${membership.project.id}`} className="hover:text-indigo-600">
                              {membership.project.name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {membership.project.identifier}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {membership.roles && membership.roles.map((role: any) => (
                          <span 
                            key={role.id} 
                            className={`px-2 py-1 text-xs rounded-full ${
                              isRoleInherited(role) 
                                ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {role.name}
                            {isRoleInherited(role) && (
                              <span className="ml-1 text-gray-500">(inherited)</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/projects/${membership.project.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Project"
                        >
                          <FolderKanban size={16} />
                        </Link>
                        <button
                          onClick={() => setIsEditingProjects(true)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Roles"
                        >
                          <Edit size={16} />
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