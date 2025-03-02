import React from 'react';
import { DeleteConfirmationModal } from '../shared/DeleteConfirmationModal';

interface DeleteConfirmModalProps {
  user: any;
  handleDeleteUser: (userId: number) => Promise<boolean>;
  setUserToDelete: (user: any | null) => void;
  loadingAction: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  user,
  handleDeleteUser,
  setUserToDelete,
  loadingAction
}) => {
  return (
    <DeleteConfirmationModal
      isOpen={true}
      onClose={() => setUserToDelete(null)}
      onConfirm={() => handleDeleteUser(user.id)}
      title="Delete User"
      message="Are you sure you want to delete this user?"
      itemName={`${user.firstname} ${user.lastname}`}
      isLoading={loadingAction}
    />
  );
};