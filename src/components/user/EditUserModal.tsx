import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

interface EditUserModalProps {
  user: any;
  handleUpdateUser: (userId: number, userData: any) => Promise<boolean>;
  setSelectedUser: (user: any | null) => void;
  loadingAction: boolean;
  groups: any[];
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  handleUpdateUser,
  setSelectedUser,
  loadingAction,
  groups
}) => {
  const [userData, setUserData] = useState({
    login: user.login || '',
    firstname: user.firstname || '',
    lastname: user.lastname || '',
    mail: user.mail || '',
    password: '',
    admin: user.admin || false,
    must_change_passwd: false,
    status: user.status || 1,
    group_ids: [] as number[]
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);
  
  // Load user's groups if available
  useEffect(() => {
    if (user.groups) {
      setUserData(prev => ({
        ...prev,
        group_ids: user.groups.map((group: any) => group.id)
      }));
    }
  }, [user]);
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const validationErrors = [];
    
    if (!userData.login) validationErrors.push('Login is required');
    if (!userData.firstname) validationErrors.push('First name is required');
    if (!userData.lastname) validationErrors.push('Last name is required');
    if (!userData.mail) validationErrors.push('Email is required');
    if (resetPassword && !userData.password) validationErrors.push('Password is required when resetting password');
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors
    setErrors([]);
    
    // Prepare data for API
    const apiData = {
      user: {
        ...userData,
        // Only include password if resetting
        password: resetPassword ? userData.password : undefined
      }
    };
    
    // Submit form
    const success = await handleUpdateUser(user.id, apiData);
    
    if (success) {
      setSelectedUser(null);
    }
  };
  
  // Handle group selection (multi-select)
  const handleGroupChange = (groupId: number) => {
    setUserData(prev => {
      const newGroups = prev.group_ids.includes(groupId)
        ? prev.group_ids.filter(id => id !== groupId)
        : [...prev.group_ids, groupId];
      return { ...prev, group_ids: newGroups };
    });
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                  Edit User: {user.firstname} {user.lastname}
                </h3>
                
                {errors.length > 0 && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
                        <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstname"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={userData.firstname}
                        onChange={(e) => setUserData({ ...userData, firstname: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastname"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={userData.lastname}
                        onChange={(e) => setUserData({ ...userData, lastname: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
                      Login/Username *
                    </label>
                    <input
                      type="text"
                      id="login"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={userData.login}
                      onChange={(e) => setUserData({ ...userData, login: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={userData.mail}
                      onChange={(e) => setUserData({ ...userData, mail: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={userData.status}
                      onChange={(e) => setUserData({ ...userData, status: parseInt(e.target.value) })}
                    >
                      <option value={1}>Active</option>
                      <option value={2}>Registered</option>
                      <option value={3}>Locked</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <input
                      id="resetPassword"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={resetPassword}
                      onChange={(e) => setResetPassword(e.target.checked)}
                    />
                    <label htmlFor="resetPassword" className="ml-2 block text-sm text-gray-900">
                      Reset password
                    </label>
                  </div>
                  
                  {resetPassword && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                          value={userData.password}
                          onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                          required={resetPassword}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {resetPassword && (
                    <div className="flex items-center mb-2">
                      <input
                        id="must_change_passwd"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={userData.must_change_passwd}
                        onChange={(e) => setUserData({ ...userData, must_change_passwd: e.target.checked })}
                      />
                      <label htmlFor="must_change_passwd" className="ml-2 block text-sm text-gray-900">
                        User must change password at next login
                      </label>
                    </div>
                  )}
                  
                  <div className="flex items-center mb-2">
                    <input
                      id="admin"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={userData.admin}
                      onChange={(e) => setUserData({ ...userData, admin: e.target.checked })}
                    />
                    <label htmlFor="admin" className="ml-2 block text-sm text-gray-900">
                      Administrator
                    </label>
                  </div>
                  
                  {/* Groups */}
                  {groups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Groups
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {groups.map(group => (
                          <div key={group.id} className="flex items-center mb-2">
                            <input
                              id={`group-${group.id}`}
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={userData.group_ids.includes(group.id)}
                              onChange={() => handleGroupChange(group.id)}
                            />
                            <label htmlFor={`group-${group.id}`} className="ml-2 block text-sm text-gray-900">
                              {group.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              {loadingAction ? 'Updating...' : 'Update User'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
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