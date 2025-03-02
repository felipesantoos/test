import React from 'react';
import { DeleteConfirmationModal } from '../../shared/DeleteConfirmationModal';

interface DeleteConfirmModalProps {
  handleDeleteProject: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  loadingAction: boolean;
}

export const DeleteConfirmModal = ({ 
  handleDeleteProject, 
  setShowDeleteConfirm, 
  loadingAction 
}: DeleteConfirmModalProps) => {
  return (
    <DeleteConfirmationModal
      isOpen={true}
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={handleDeleteProject}
      title="Delete Project"
      message="Are you sure you want to delete this project? This action cannot be undone and all associated data will be permanently removed."
      isLoading={loadingAction}
    />
  );
};