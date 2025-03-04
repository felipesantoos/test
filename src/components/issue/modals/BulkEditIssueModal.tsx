import React, { useState } from 'react';
import { AlertCircle, Save } from 'lucide-react';

interface BulkEditIssueModalProps {
  selectedIssues: any[];
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
  loadingAction: boolean;
  statuses: any[];
  priorities: any[];
  users: any[];
}

export const BulkEditIssueModal: React.FC<BulkEditIssueModalProps> = ({
  selectedIssues,
  onClose,
  onSave,
  loadingAction,
  statuses,
  priorities,
  users
}) => {
  const [updates, setUpdates] = useState({
    status_id: { value: '', enabled: false },
    priority_id: { value: '', enabled: false },
    assigned_to_id: { value: '', enabled: false }
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    
    // Check if at least one field is enabled
    const hasUpdates = Object.values(updates).some(field => field.enabled);
    if (!hasUpdates) {
      setError('Please select at least one field to update');
      return;
    }
    
    // Create update object with only enabled fields
    const updateData = Object.entries(updates).reduce((acc, [key, field]) => {
      if (field.enabled && field.value) {
        acc[key] = field.value === 'null' ? null : field.value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    try {
      await onSave(updateData);
    } catch (err: any) {
      setError(err.message || 'Failed to update issues');
    }
  };

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
                  Bulk Edit {selectedIssues.length} Issues
                </h3>
                
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="status_enabled"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={updates.status_id.enabled}
                        onChange={(e) => setUpdates(prev => ({
                          ...prev,
                          status_id: { ...prev.status_id, enabled: e.target.checked }
                        }))}
                      />
                      <label htmlFor="status_enabled" className="ml-2 block text-sm text-gray-900">
                        Update Status
                      </label>
                    </div>
                    <select
                      id="status"
                      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        !updates.status_id.enabled ? 'bg-gray-100' : ''
                      }`}
                      value={updates.status_id.value}
                      onChange={(e) => setUpdates(prev => ({
                        ...prev,
                        status_id: { ...prev.status_id, value: e.target.value }
                      }))}
                      disabled={!updates.status_id.enabled}
                    >
                      <option value="">Select Status</option>
                      {statuses.map(status => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Priority */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="priority_enabled"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={updates.priority_id.enabled}
                        onChange={(e) => setUpdates(prev => ({
                          ...prev,
                          priority_id: { ...prev.priority_id, enabled: e.target.checked }
                        }))}
                      />
                      <label htmlFor="priority_enabled" className="ml-2 block text-sm text-gray-900">
                        Update Priority
                      </label>
                    </div>
                    <select
                      id="priority"
                      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        !updates.priority_id.enabled ? 'bg-gray-100' : ''
                      }`}
                      value={updates.priority_id.value}
                      onChange={(e) => setUpdates(prev => ({
                        ...prev,
                        priority_id: { ...prev.priority_id, value: e.target.value }
                      }))}
                      disabled={!updates.priority_id.enabled}
                    >
                      <option value="">Select Priority</option>
                      {priorities.map(priority => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Assignee */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="assignee_enabled"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={updates.assigned_to_id.enabled}
                        onChange={(e) => setUpdates(prev => ({
                          ...prev,
                          assigned_to_id: { ...prev.assigned_to_id, enabled: e.target.checked }
                        }))}
                      />
                      <label htmlFor="assignee_enabled" className="ml-2 block text-sm text-gray-900">
                        Update Assignee
                      </label>
                    </div>
                    <select
                      id="assignee"
                      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        !updates.assigned_to_id.enabled ? 'bg-gray-100' : ''
                      }`}
                      value={updates.assigned_to_id.value}
                      onChange={(e) => setUpdates(prev => ({
                        ...prev,
                        assigned_to_id: { ...prev.assigned_to_id, value: e.target.value }
                      }))}
                      disabled={!updates.assigned_to_id.enabled}
                    >
                      <option value="">Select Assignee</option>
                      <option value="null">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstname} {user.lastname}
                        </option>
                      ))}
                    </select>
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
              <Save size={16} className="mr-2" />
              {loadingAction ? 'Updating...' : 'Update Issues'}
            </button>
            <button
              type="button"
              onClick={onClose}
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