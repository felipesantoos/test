import React, { useState, useEffect } from 'react';
import { useApi } from '../../../context/ApiContext';
import { Plus, Trash2, Edit, AlertCircle, RefreshCw, Search, UserPlus, UserX, Shield, Users, User } from 'lucide-react';
import { AddMemberModal } from '../modals/AddMemberModal';
import { EditMemberModal } from '../modals/EditMemberModal';
import { DeleteMemberConfirmModal } from '../modals/DeleteMemberConfirmModal';

interface MembersTabProps {
  projectId: number;
}

export const MembersTab: React.FC<MembersTabProps> = ({ projectId }) => {
  const { 
    fetchProjectMemberships, 
    fetchRoles, 
    users, 
    addProjectMember, 
    updateMembership, 
    deleteMembership,
    isLoading: apiLoading
  } = useApi();
  
  const [memberships, setMemberships] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMemberships, setFilteredMemberships] = useState<any[]>([]);
  
  // Modal states
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [membershipToDelete, setMembershipToDelete] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load memberships and roles
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch memberships
        const membershipsData = await fetchProjectMemberships(projectId);
        setMemberships(membershipsData);
        setFilteredMemberships(membershipsData);
        
        // Fetch roles
        const rolesData = await fetchRoles();
        setRoles(rolesData);
      } catch (err: any) {
        console.error('Error loading memberships data:', err);
        setError(err.message || 'Failed to load memberships data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [projectId, fetchProjectMemberships, fetchRoles, refreshTrigger]);

  // Filter memberships when search query changes
  useEffect(() => {
    if (memberships.length > 0) {
      if (searchQuery) {
        const filtered = memberships.filter(membership => {
          const name = membership.user 
            ? `${membership.user.name}`.toLowerCase() 
            : membership.group 
              ? `${membership.group.name}`.toLowerCase() 
              : '';
          
          return name.includes(searchQuery.toLowerCase());
        });
        setFilteredMemberships(filtered);
      } else {
        setFilteredMemberships(memberships);
      }
    }
  }, [searchQuery, memberships]);

  // Handle adding a new member
  const handleAddMember = async (memberData: any) => {
    if (!memberData.user_id && !memberData.group_id) {
      alert('Please select a user or group to add');
      return;
    }
    
    if (!memberData.role_ids || memberData.role_ids.length === 0) {
      alert('Please select at least one role');
      return;
    }
    
    setLoadingAction(true);
    
    try {
      await addProjectMember(projectId, { membership: memberData });
      
      // Refresh memberships
      setRefreshTrigger(prev => prev + 1);
      setIsAddingMember(false);
    } catch (err: any) {
      console.error('Error adding member:', err);
      alert(`Failed to add member: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle updating a membership
  const handleUpdateMembership = async () => {
    if (!selectedMembership) return;
    
    if (!selectedMembership.role_ids || selectedMembership.role_ids.length === 0) {
      alert('Please select at least one role');
      return;
    }
    
    setLoadingAction(true);
    
    try {
      const membershipData = {
        membership: {
          role_ids: selectedMembership.role_ids
        }
      };
      
      await updateMembership(selectedMembership.id, membershipData);
      
      // Refresh memberships
      setRefreshTrigger(prev => prev + 1);
      setSelectedMembership(null);
    } catch (err: any) {
      console.error('Error updating membership:', err);
      alert(`Failed to update membership: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle deleting a membership
  const handleDeleteMembership = async () => {
    if (!membershipToDelete) return;
    
    setLoadingAction(true);
    
    try {
      await deleteMembership(membershipToDelete.id);
      
      // Refresh memberships
      setRefreshTrigger(prev => prev + 1);
      setMembershipToDelete(null);
    } catch (err: any) {
      console.error('Error deleting membership:', err);
      alert(`Failed to delete membership: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Check if a role is inherited
  const isRoleInherited = (role: any) => {
    return role.inherited === true;
  };

  // Check if a membership is inherited
  const isMembershipInherited = (membership: any) => {
    if (!membership.roles || membership.roles.length === 0) return false;
    
    // If any role is inherited, the membership is considered inherited
    return membership.roles.some((role: any) => isRoleInherited(role));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Project Members</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleManualRefresh}
            disabled={loading || loadingAction}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${(loading || loadingAction) ? 'animate-spin' : ''}`} />
            {loading || loadingAction ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setIsAddingMember(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <UserPlus size={16} className="mr-2" />
            Add Member
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
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Members List */}
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
            <Users size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No members found</h3>
            <p className="text-gray-500 mb-4">This project doesn't have any members yet or none match your search criteria</p>
            <button 
              onClick={() => setIsAddingMember(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <UserPlus size={16} className="mr-2" />
              Add Member
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
                    Member
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
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
                  <tr key={membership.id} className={`hover:bg-gray-50 ${isMembershipInherited(membership) ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          {membership.user ? (
                            <User size={20} className="text-indigo-600" />
                          ) : (
                            <Users size={20} className="text-indigo-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {membership.user ? membership.user.name : membership.group ? membership.group.name : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {membership.user ? 'User' : membership.group ? 'Group' : 'Unknown'}
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
                        {!isMembershipInherited(membership) && (
                          <>
                            <button
                              onClick={() => setSelectedMembership(membership)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Roles"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setMembershipToDelete(membership)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove Member"
                            >
                              <UserX size={16} />
                            </button>
                          </>
                        )}
                        {isMembershipInherited(membership) && (
                          <span className="text-gray-400 italic text-xs">Inherited from group</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddingMember && (
        <AddMemberModal
          users={users}
          roles={roles}
          handleAddMember={handleAddMember}
          setIsAddingMember={setIsAddingMember}
          loadingAction={loadingAction}
          existingMemberships={memberships}
        />
      )}

      {/* Edit Member Modal */}
      {selectedMembership && (
        <EditMemberModal
          membership={selectedMembership}
          roles={roles}
          setSelectedMembership={setSelectedMembership}
          handleUpdateMembership={handleUpdateMembership}
          loadingAction={loadingAction}
        />
      )}

      {/* Delete Member Confirmation Modal */}
      {membershipToDelete && (
        <DeleteMemberConfirmModal
          membership={membershipToDelete}
          handleDeleteMembership={handleDeleteMembership}
          setMembershipToDelete={setMembershipToDelete}
          loadingAction={loadingAction}
        />
      )}
    </div>
  );
};