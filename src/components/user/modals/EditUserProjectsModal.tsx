import React, { useState, useEffect } from 'react';
import { Search, FolderKanban } from 'lucide-react';

interface EditUserProjectsModalProps {
  userId: number;
  userName: string;
  userMemberships: any[];
  projects: any[];
  roles: any[];
  handleUpdateUserProjects: (updatedMemberships: any[]) => void;
  setIsEditingProjects: (isEditing: boolean) => void;
  loadingAction: boolean;
}

export const EditUserProjectsModal: React.FC<EditUserProjectsModalProps> = ({
  userId,
  userName,
  userMemberships,
  projects,
  roles,
  handleUpdateUserProjects,
  setIsEditingProjects,
  loadingAction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Record<number, any>>({});
  
  // Initialize selected projects from user memberships
  useEffect(() => {
    const initialSelectedProjects: Record<number, any> = {};
    
    userMemberships.forEach(membership => {
      if (membership.project) {
        initialSelectedProjects[membership.project.id] = {
          projectId: membership.project.id,
          membershipId: membership.id,
          roleIds: membership.roles
            ? membership.roles
                .filter((role: any) => !role.inherited)
                .map((role: any) => role.id)
            : []
        };
      }
    });
    
    setSelectedProjects(initialSelectedProjects);
  }, [userMemberships]);

  // Filter projects based on search query
  useEffect(() => {
    if (projects.length > 0) {
      if (searchQuery) {
        const filtered = projects.filter(project => {
          const projectName = project.name.toLowerCase();
          const projectIdentifier = project.identifier.toLowerCase();
          
          return projectName.includes(searchQuery.toLowerCase()) || 
                 projectIdentifier.includes(searchQuery.toLowerCase());
        });
        setFilteredProjects(filtered);
      } else {
        setFilteredProjects(projects);
      }
    }
  }, [searchQuery, projects]);

  // Toggle project selection
  const toggleProjectSelection = (project: any) => {
    setSelectedProjects(prev => {
      const newSelected = { ...prev };
      
      if (newSelected[project.id]) {
        // If already selected, remove it
        delete newSelected[project.id];
      } else {
        // If not selected, add it with default roles
        newSelected[project.id] = {
          projectId: project.id,
          membershipId: null, // New membership
          roleIds: [roles.length > 0 ? roles[0].id : null].filter(Boolean)
        };
      }
      
      return newSelected;
    });
  };

  // Toggle role selection for a project
  const toggleRoleSelection = (projectId: number, roleId: number) => {
    setSelectedProjects(prev => {
      const newSelected = { ...prev };
      
      if (!newSelected[projectId]) {
        return prev;
      }
      
      const roleIds = newSelected[projectId].roleIds || [];
      
      if (roleIds.includes(roleId)) {
        // If role is already selected, remove it
        newSelected[projectId].roleIds = roleIds.filter((id: number) => id !== roleId);
      } else {
        // If role is not selected, add it
        newSelected[projectId].roleIds = [...roleIds, roleId];
      }
      
      return newSelected;
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    // Convert selected projects to the format expected by the API
    const updatedMemberships = Object.values(selectedProjects).map(project => ({
      projectId: project.projectId,
      membershipId: project.membershipId,
      roleIds: project.roleIds
    }));
    
    handleUpdateUserProjects(updatedMemberships);
  };

  // Check if a project is selected
  const isProjectSelected = (projectId: number) => {
    return !!selectedProjects[projectId];
  };

  // Check if a role is selected for a project
  const isRoleSelected = (projectId: number, roleId: number) => {
    return selectedProjects[projectId]?.roleIds?.includes(roleId) || false;
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Projects for {userName}
                </h3>
                
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
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
                  
                  {/* Projects List */}
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    {filteredProjects.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No projects available or matching your search
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredProjects.map(project => (
                          <li 
                            key={project.id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer ${isProjectSelected(project.id) ? 'bg-indigo-50' : ''}`}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={isProjectSelected(project.id)}
                                onChange={() => toggleProjectSelection(project)}
                              />
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ml-3">
                                <FolderKanban size={16} className="text-indigo-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-500">{project.identifier}</p>
                              </div>
                            </div>
                            
                            {/* Role selection for this project */}
                            {isProjectSelected(project.id) && (
                              <div className="mt-2 ml-10 pl-3 border-l-2 border-indigo-200">
                                <p className="text-xs font-medium text-gray-500 mb-1">Select roles:</p>
                                <div className="flex flex-wrap gap-2">
                                  {roles.map(role => (
                                    <label key={role.id} className="inline-flex items-center">
                                      <input
                                        type="checkbox"
                                        className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        checked={isRoleSelected(project.id, role.id)}
                                        onChange={() => toggleRoleSelection(project.id, role.id)}
                                      />
                                      <span className="ml-1 text-xs text-gray-700">{role.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* Selected Projects Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Selected Projects: {Object.keys(selectedProjects).length}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedProjects).map(([projectId, data]) => {
                        const project = projects.find(p => p.id.toString() === projectId);
                        if (!project) return null;
                        
                        return (
                          <div key={projectId} className="bg-indigo-50 px-2 py-1 rounded-md text-xs">
                            <span className="font-medium">{project.name}</span>
                            <span className="text-gray-500 ml-1">
                              ({data.roleIds.length} {data.roleIds.length === 1 ? 'role' : 'roles'})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loadingAction}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
            >
              {loadingAction ? 'Updating...' : 'Update Projects'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingProjects(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};