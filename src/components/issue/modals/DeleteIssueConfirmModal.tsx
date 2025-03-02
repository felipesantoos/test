import React from 'react';
import { DeleteConfirmationModal } from '../../shared/DeleteConfirmationModal';

interface DeleteIssueConfirmModalProps {
  issue: any;
  onDelete: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export const DeleteIssueConfirmModal: React.FC<DeleteIssueConfirmModalProps> = ({
  issue,
  onDelete,
  onClose,
  isLoading
}) => {
  return (
    <DeleteConfirmationModal
      isOpen={true}
      onClose={onClose}
      onConfirm={onDelete}
      title="Delete Issue"
      message="Are you sure you want to delete this issue? This action cannot be undone and all associated data will be permanently removed."
      itemName={`#${issue.id}: ${issue.subject}`}
      isLoading={isLoading}
    />
  );
};