import React from 'react';

interface CreateIssueModalProps {
  newIssue: any;
  setNewIssue: (issue: any) => void;
  handleCreateIssue: () => void;
  setIsCreatingIssue: (isCreating: boolean) => void;
  loadingAction: boolean;
}

export const CreateIssueModal = ({ 
  newIssue, 
  setNewIssue, 
  handleCreateIssue, 
  setIsCreatingIssue, 
  loadingAction 
}: CreateIssueModalProps) => {
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
                  Create New Issue
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newIssue.subject}
                      onChange={(e) => setNewIssue({ ...newIssue, subject: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newIssue.description}
                      onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newIssue.status_id}
                        onChange={(e) => setNewIssue({ ...newIssue, status_id: parseInt(e.target.value) })}
                      >
                        <option value={1}>New</option>
                        <option value={2}>In Progress</option>
                        <option value={3}>Resolved</option>
                        <option value={4}>Feedback</option>
                        <option value={5}>Closed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        id="priority"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newIssue.priority_id}
                        onChange={(e) => setNewIssue({ ...newIssue, priority_id: parseInt(e.target.value) })}
                      >
                        <option value={1}>Low</option>
                        <option value={2}>Normal</option>
                        <option value={3}>High</option>
                        <option value={4}>Urgent</option>
                        <option value={5}>Immediate</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      id="assignedTo"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newIssue.assigned_to_id}
                      onChange={(e) => setNewIssue({ ...newIssue, assigned_to_id: e.target.value })}
                      placeholder="User ID (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleCreateIssue}
              disabled={!newIssue.subject || loadingAction}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
            >
              {loadingAction ? 'Creating...' : 'Create Issue'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingIssue(false)}
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