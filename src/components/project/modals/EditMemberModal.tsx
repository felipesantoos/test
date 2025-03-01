import React, { useState, useEffect } from 'react';

interface EditMemberModalProps {
  membership: any;
  roles: any[];
  setSelectedMembership: (membership: any | null) => void;
  handleUpdateMembership: () => void;
  loadingAction: boolean;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  membership,
  roles,
  setSelectedMembership,
  handleUpdateMembership,
  loadingAction
}) => {
  // Extract role IDs from the membership
  const initialRoleIds = membership.roles
    ? membership.roles
        .filter((role: any) => !role.inherited) // Filter out inherited roles
        .map((role: any) => role.id)
    : [];
  
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(initialRoleIds);
  
  // Update the membership when role selection changes
  useEffect(() => {
    setSelectedMembership({
      ...membership,
      role_ids: selectedRoleIds
    });
  }, [selectedRoleIds, setSelectedMembership, membership]);

  // Handle role selection
  const handleRoleChange = (roleId: number) => {
    setSelectedRoleIds(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // Get member name
  const getMemberName = () => {
    if (membership.user) {
      return membership.user.name;
    } else if (membership.group) {
      return membership.group.name;
    }
    return 'Unknown Member';
  };

  // Get member type
  const getMemberType = () => {
    if (membership.user) {
      return 'User';
    } else if (membership.group) {
      return 'Group';
    }
    return 'Unknown';
  };

  // Handle update button click
  const handleUpdate = () => {
    handleUpdateMembership();
  };

  // Handle cancel button click
  const handleCancel = () => {
    setSelectedMembership(null);
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
                  Edit Member Roles
                </h3>
                
                <div className="space-y-4">
                  {/* Member Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member
                    </label>
                    <div className="flex items-center p-2 border border-gray-300 rounded-md bg-gray-50">
                      <span className="text-sm font-medium text-gray-900">{getMemberName()}</span>
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">
                        {getMemberType()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Inherited Roles (read-only) */}
                  {membership.roles && membership.roles.some((role: any) => role.inherited) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inherited Roles (cannot be modified)
                      </label>
                      <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
                        <div className="flex flex-wrap gap-1">
                          {membership.roles
                            .filter((role: any) => role.inherited)
                            .map((role: any) => (
                              <span 
                                key={role.id} 
                                className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800"
                              >
                                {role.name}
                                <span className="ml-1 text-gray-500">(inherited)</span>
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roles
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {roles.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                          No roles available
                        </div>
                      ) : (
                        roles.map(role => (
                          <div key={role.id} className="flex items-center mb-2">
                            <input
                              id={`role-${role.id}`}
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={selectedRoleIds.includes(role.id)}
                              onChange={() => handleRoleChange(role.id)}
                            />
                            <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                              {role.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loadingAction || selectedRoleIds.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
            >
              {loadingAction ? 'Updating...' : 'Update Roles'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
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