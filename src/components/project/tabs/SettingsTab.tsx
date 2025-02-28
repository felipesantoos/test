import React from 'react';
import { Edit, Archive, Trash2 } from 'lucide-react';

interface SettingsTabProps {
  project: any;
  formatDate: (date: string) => string;
  setIsEditingProject: (isEditing: boolean) => void;
  setShowArchiveConfirm: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
}

export const SettingsTab = ({ 
  project, 
  formatDate, 
  setIsEditingProject, 
  setShowArchiveConfirm, 
  setShowDeleteConfirm 
}: SettingsTabProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Project Settings</h2>
      
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-md font-semibold mb-4">Project Management</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsEditingProject(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit size={16} className="mr-2" />
            Edit Project Details
          </button>
          
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Archive size={16} className="mr-2" />
            {project.status === 9 ? 'Unarchive Project' : 'Archive Project'}
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Project
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-md font-semibold mb-4">Project Information</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-gray-500">Project ID</div>
            <div className="col-span-2">{project.id}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-gray-500">Identifier</div>
            <div className="col-span-2">{project.identifier}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-gray-500">Created On</div>
            <div className="col-span-2">{formatDate(project.created_on)}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-gray-500">Updated On</div>
            <div className="col-span-2">{formatDate(project.updated_on)}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-gray-500">Status</div>
            <div className="col-span-2">
              {project.status === 1 ? 'Active' : project.status === 9 ? 'Archived' : 'Unknown'}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium text-gray-500">Visibility</div>
            <div className="col-span-2">{project.is_public ? 'Public' : 'Private'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};