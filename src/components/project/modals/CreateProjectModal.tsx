import React from 'react';

interface CreateProjectModalProps {
  newProject: any;
  setNewProject: (project: any) => void;
  handleCreateProject: () => void;
  setIsCreatingProject: (isCreating: boolean) => void;
  loadingAction: boolean;
  trackers: any[];
}

export const CreateProjectModal = ({ 
  newProject, 
  setNewProject, 
  handleCreateProject, 
  setIsCreatingProject, 
  loadingAction,
  trackers
}: CreateProjectModalProps) => {
  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Create New Project
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                      Identifier *
                    </label>
                    <input
                      type="text"
                      id="identifier"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newProject.identifier}
                      onChange={(e) => setNewProject({ ...newProject, identifier: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Only lowercase letters (a-z), numbers, dashes and underscores are allowed. Must start with a letter.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newProject.description || ''}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="trackers" className="block text-sm font-medium text-gray-700 mb-1">
                      Trackers
                    </label>
                    <div className="mt-1 space-y-2">
                      {trackers.map(tracker => (
                        <div key={tracker.id} className="flex items-center">
                          <input
                            id={`tracker-${tracker.id}`}
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={newProject.tracker_ids?.includes(tracker.id) || false}
                            onChange={(e) => {
                              const currentTrackers = newProject.tracker_ids || [];
                              if (e.target.checked) {
                                setNewProject({ 
                                  ...newProject, 
                                  tracker_ids: [...currentTrackers, tracker.id] 
                                });
                              } else {
                                setNewProject({ 
                                  ...newProject, 
                                  tracker_ids: currentTrackers.filter((id: number) => id !== tracker.id) 
                                });
                              }
                            }}
                          />
                          <label htmlFor={`tracker-${tracker.id}`} className="ml-2 block text-sm text-gray-900">
                            {tracker.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="is_public"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={newProject.is_public || false}
                      onChange={(e) => setNewProject({ ...newProject, is_public: e.target.checked })}
                    />
                    <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                      Public project
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleCreateProject}
              disabled={!newProject.name || !newProject.identifier || loadingAction}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
            >
              {loadingAction ? 'Creating...' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingProject(false)}
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