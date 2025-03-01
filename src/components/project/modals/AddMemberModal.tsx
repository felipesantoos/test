import React, { useState, useEffect } from 'react';
import { Search, Users, User } from 'lucide-react';

interface AddMemberModalProps {
  users: any[];
  roles: any[];
  handleAddMember: (memberData: any) => void;
  setIsAddingMember: (isAdding: boolean) => void;
  loadingAction: boolean;
  existingMemberships: any[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  users,
  roles,
  handleAddMember,
  setIsAddingMember,
  loadingAction,
  existingMemberships
}) => {
  const [memberType, setMemberType] = useState<'user' | 'group'>('user');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  
  // Get existing user IDs to filter out users who are already members
  const existingUserIds = existingMemberships
    .filter(m => m.user)
    .map(m => m.user.id);
  
  // Filter available users (those who are not already members)
  const availableUsers = users.filter(user => !existingUserIds.includes(user.id));
  
  // Filter users based on search query
  useEffect(() => {
    if (availableUsers.length > 0) {
      if (searchQuery) {
        const filtered = availableUsers.filter(user => {
          const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
          const login = user.login.toLowerCase();
          const email = user.mail ? user.mail.toLowerCase() : '';
          
          return fullName.includes(searchQuery.toLowerCase()) || 
                 login.includes(searchQuery.toLowerCase()) ||
                 email.includes(searchQuery.toLowerCase());
        });
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers(availableUsers);
      }
    }
  }, [searchQuery, availableUsers]);

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

  // Handle form submission
  const handleSubmit = () => {
    const memberData: any = {
      role_ids: selectedRoleIds
    };
    
    if (memberType === 'user') {
      if (!selectedUserId) {
        alert('Please select a user');
        return;
      }
      memberData.user_id = selectedUserId;
    } else {
      if (!selectedGroupId) {
        alert('Please select a group');
        return;
      }
      memberData.group_id = selectedGroupId;
    }
    
    handleAddMember(memberData);
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
                  Add Project Member
                </h3>
                
                <div className="space-y-4">
                  {/* Member Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-indigo-600"
                          checked={memberType === 'user'}
                          onChange={() => setMemberType('user')}
                        />
                        <span className="ml-2 text-sm text-gray-700">User</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-indigo-600"
                          checked={memberType === 'group'}
                          onChange={() => setMemberType('group')}
                        />
                        <span className="ml-2 text-sm text-gray-700">Group</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* User Selection */}
                  {memberType === 'user' && (
                    <div>
                      <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                        Select User
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                        {filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No users available or matching your search
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                              <li 
                                key={user.id}
                                className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedUserId === user.id ? 'bg-indigo-50' : ''}`}
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <User size={16} className="text-indigo-600" />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user.firstname} {user.lastname}</p>
                                    <p className="text-xs text-gray-500">{user.mail}</p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Group Selection (placeholder) */}
                  {memberType === 'group' && (
                    <div>
                      <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Group
                      </label>
                      <select
                        id="group"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Select a group</option>
                        {/* This would need to be populated with actual groups */}
                        <option value="1">Developers</option>
                        <option value="2">Managers</option>
                        <option value="3">Testers</option>
                      </select>
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
              onClick={handleSubmit}
              disabled={
                loadingAction || 
                selectedRoleIds.length === 0 || 
                (memberType === 'user' && !selectedUserId) ||
                (memberType === 'group' && !selectedGroupId)
              }
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
            >
              {loadingAction ? 'Adding...' : 'Add Member'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
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