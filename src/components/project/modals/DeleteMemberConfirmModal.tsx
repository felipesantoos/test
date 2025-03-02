import React from 'react';
import { DeleteConfirmationModal } from '../../shared/DeleteConfirmationModal';

interface DeleteMemberConfirmModalProps {
  membership: any;
  handleDeleteMembership: () => void;
  setMembershipToDelete: (membership: any | null) => void;
  loadingAction: boolean;
}

export const DeleteMemberConfirmModal: React.FC<DeleteMemberConfirmModalProps> = ({
  membership,
  handleDeleteMembership,
  setMembershipToDelete,
  loadingAction
}) => {
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
      return 'user';
    } else if (membership.group) {
      return 'group';
    }
    return 'member';
  };

  return (
    <DeleteConfirmationModal
      isOpen={true}
      onClose={() => setMembershipToDelete(null)}
      onConfirm={handleDeleteMembership}
      title="Remove Member"
      message={`Are you sure you want to remove this ${getMemberType()} from the project? They will no longer have access to the project based on this membership.`}
      itemName={getMemberName()}
      isLoading={loadingAction}
    />
  );
};