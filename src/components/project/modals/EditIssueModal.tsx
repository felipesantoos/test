import React, { useState, useEffect } from 'react';
import { MarkdownEditor } from '../../shared/MarkdownEditor';
import { UserSelect } from '../../shared/UserSelect';
import { FileUpload } from '../../shared/FileUpload';
import { Attachments } from '../../shared/Attachments';
import { useApi } from '../../../context/ApiContext';
import { getAttachmentDetails } from '../../../services/attachmentService';
import { EpicSelect } from '../../shared/EpicSelect';
import { SprintSelect } from '../../shared/SprintSelect';

interface IssueData {
  id: number;
  subject: string;
  description?: string;
  status: {
    id: number;
    name: string;
  };
  priority: {
    id: number;
    name: string;
  };
  assigned_to?: {
    id: number | string;
    name: string;
  } | null;
  project?: {
    id: number;
    name: string;
  };
  attachments?: Array<{
    id: number;
    filename: string;
    filesize: number;
    content_type: string;
    description?: string;
    content_url: string;
  }>;
  uploads?: Array<{
    token: string;
    filename: string;
    content_type: string;
    description?: string;
    filesize?: number;
    content_url?: string;
  }>;
  custom_fields?: Array<{
    id: number;
    name: string;
    value: string;
  }>;
}

interface EditIssueModalProps {
  selectedIssue: IssueData;
  setSelectedIssue: (issue: IssueData) => void;
  handleUpdateIssue: () => void;
  loadingAction: boolean;
  onCancel?: () => void;
  users: any[]; // Users list for lookup
}

export const EditIssueModal: React.FC<EditIssueModalProps> = ({ 
  selectedIssue, 
  setSelectedIssue, 
  handleUpdateIssue, 
  loadingAction,
  onCancel,
  users
}) => {
  const { 
    fetchProjectMemberships, 
    issueStatuses, 
    priorities, 
    fetchEpics,
    fetchSprints,
    createSprint 
  } = useApi();
  
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [uploads, setUploads] = useState<Array<{
    token: string;
    filename: string;
    content_type: string;
    description?: string;
    filesize?: number;
    content_url?: string;
  }>>([]);
  const [epics, setEpics] = useState<string[]>([]);
  const [allSprints, setAllSprints] = useState<any[]>([]);
  const [filteredSprints, setFilteredSprints] = useState<any[]>([]);
  const [newEpicValue, setNewEpicValue] = useState('');
  const [isAddingNewEpic, setIsAddingNewEpic] = useState(false);

  // Get Redmine URL from localStorage
  const redmineUrl = localStorage.getItem('redmine_url') || '';

  // When the issue has a project, fetch its memberships
  useEffect(() => {
    if (selectedIssue?.project?.id) {
      fetchProjectMemberships(selectedIssue.project.id)
        .then((memberships) => {
          // Only include memberships that have a user object
          const members = memberships
            .filter(m => m.user)
            .map(m => m.user);
          setProjectMembers(members);
        })
        .catch((error) => {
          console.error('Error fetching project memberships:', error);
          setProjectMembers([]);
        });
    } else {
      setProjectMembers([]);
    }
  }, [selectedIssue?.project?.id, fetchProjectMemberships]);

  // Initialize uploads from existing attachments
  useEffect(() => {
    if (selectedIssue?.uploads) {
      setUploads(selectedIssue.uploads);
    }
  }, [selectedIssue?.uploads]);

  // Fetch epics and sprints when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const [epicsData, sprintsData] = await Promise.all([
          fetchEpics(),
          fetchSprints()
        ]);
        setEpics(epicsData || []);
        setAllSprints(sprintsData || []);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  // Filter sprints when project changes
  useEffect(() => {
    if (selectedIssue?.project?.id && allSprints.length > 0) {
      const projectSprints = allSprints.filter(sprint => 
        sprint.project_id === selectedIssue.project?.id
      );
      setFilteredSprints(projectSprints);
    } else {
      setFilteredSprints([]);
    }
  }, [selectedIssue?.project?.id, allSprints]);

  // Handle file upload completion
  const handleUploadComplete = async (upload: { token: string; filename: string; content_type: string }) => {
    try {
      // Get attachment details
      const attachmentId = parseInt(upload.token.split('.')[0]);
      const attachmentDetails = await getAttachmentDetails(attachmentId);

      // Add the upload with complete details
      const completeUpload = {
        ...upload,
        filesize: attachmentDetails.filesize,
        content_url: attachmentDetails.content_url,
        description: attachmentDetails.description || ''
      };

      setUploads(prev => [...prev, completeUpload]);

      // Update the issue data with the new upload
      setSelectedIssue({
        ...selectedIssue,
        uploads: [...(selectedIssue.uploads || []), completeUpload]
      });
    } catch (err) {
      console.error('Error getting attachment details:', err);
      // Still add the upload even if we couldn't get details
      setUploads(prev => [...prev, upload]);
      setSelectedIssue({
        ...selectedIssue,
        uploads: [...(selectedIssue.uploads || []), upload]
      });
    }
  };

  // Handle removing an upload
  const handleRemoveUpload = (token: string) => {
    setUploads(prev => prev.filter(u => u.token !== token));
    setSelectedIssue({
      ...selectedIssue,
      uploads: selectedIssue.uploads?.filter(u => u.token !== token) || []
    });
  };

  // Handle attachment deletion
  const handleAttachmentDelete = (attachmentId: number) => {
    setSelectedIssue({
      ...selectedIssue,
      attachments: selectedIssue.attachments?.filter(a => a.id !== attachmentId) || []
    });
  };

  // Handle attachment update
  const handleAttachmentUpdate = (attachmentId: number, description: string) => {
    setSelectedIssue({
      ...selectedIssue,
      attachments: selectedIssue.attachments?.map(a => 
        a.id === attachmentId ? { ...a, description } : a
      ) || []
    });
  };

  // Handle epic selection or new epic creation
  const handleEpicChange = (value: string) => {
    if (value === 'new') {
      setIsAddingNewEpic(true);
    } else {
      // Update custom fields with the selected epic
      setSelectedIssue({
        ...selectedIssue,
        custom_fields: [
          ...(selectedIssue.custom_fields?.filter((field: any) => 
            field.id != import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID && 
            field.id != import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID
          ) || []),
          { id: import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID, name: 'Epic', value },
          { id: import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID, name: 'Sprint', value: getCurrentSprint() }
        ]
      });
    }
  };

  // Handle sprint selection or new sprint creation
  const handleSprintChange = (value: string) => {
    // Find the sprint object to get its ID
    const selectedSprint = filteredSprints.find(sprint => sprint.name === value);
    const sprintId = selectedSprint ? selectedSprint.id : '';

    // Update custom fields with the selected sprint ID
    setSelectedIssue({
      ...selectedIssue,
      custom_fields: [
        ...(selectedIssue.custom_fields?.filter((field: any) => 
          field.id != import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID && 
          field.id != import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID
        ) || []),
        { id: import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID, name: 'Epic', value: getCurrentEpic() },
        { id: import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID, name: 'Sprint', value: sprintId }
      ]
    });
  };

  // Handle adding a new sprint
  const handleAddNewSprint = async (sprintData: any) => {
    try {
      // Ensure the sprint is created for the current project
      const newSprint = await createSprint({
        ...sprintData,
        project_id: selectedIssue.project?.id
      });
      
      // Add to both sprint lists
      setAllSprints(prev => [...prev, newSprint]);
      setFilteredSprints(prev => [...prev, newSprint]);
      
      handleSprintChange(newSprint.name);
    } catch (err) {
      console.error('Error creating sprint:', err);
      alert('Failed to create sprint');
    }
  };

  // Get current epic value
  const getCurrentEpic = () => {
    const epicField = selectedIssue.custom_fields?.find((field: any) => field.id == import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID);
    return epicField?.value || '';
  };

  // Get current sprint value
  const getCurrentSprint = () => {
    const sprintField = selectedIssue.custom_fields?.find((field: any) => field.id == import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID);
    const sprintId = sprintField?.value;
    // Find sprint by ID and return its name
    const sprint = filteredSprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : '';
  };

  // Handle form submission
  const handleSubmit = () => {
    // Add uploads to the issue data
    const issueData = {
      ...selectedIssue,
      uploads: uploads.map(upload => ({
        token: upload.token,
        filename: upload.filename,
        content_type: upload.content_type,
        description: upload.description
      }))
    };
    setSelectedIssue(issueData);
    handleUpdateIssue();
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Issue #{selectedIssue.id}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={selectedIssue.subject}
                      onChange={(e) => setSelectedIssue({ ...selectedIssue, subject: e.target.value })}
                      required
                    />
                  </div>

                  {/* Epic Field */}
                  <div>
                    <label htmlFor="epic" className="block text-sm font-medium text-gray-700 mb-1">
                      Epic
                    </label>
                    <EpicSelect
                      epics={epics}
                      selectedEpic={getCurrentEpic()}
                      onChange={handleEpicChange}
                      onAddNewEpic={(value) => {
                        // Add the new epic to the dropdown options
                        setEpics(prev => [...prev, value]);
                        
                        // Update custom fields with the new epic
                        setSelectedIssue({
                          ...selectedIssue,
                          custom_fields: [
                            ...(selectedIssue.custom_fields?.filter((field: any) => 
                              field.id != import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID && 
                              field.id != import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID
                            ) || []),
                            { id: import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID, name: 'Epic', value },
                            { id: import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID, name: 'Sprint', value: getCurrentSprint() }
                          ]
                        });
                      }}
                    />
                  </div>

                  {/* Sprint Field */}
                  <div>
                    <label htmlFor="sprint" className="block text-sm font-medium text-gray-700 mb-1">
                      Sprint
                    </label>
                    {selectedIssue?.project?.id ? (
                      <SprintSelect
                        sprints={filteredSprints}
                        selectedSprint={getCurrentSprint()}
                        onChange={handleSprintChange}
                        onAddNewSprint={handleAddNewSprint}
                      />
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Select a project to choose a sprint
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <MarkdownEditor
                      value={selectedIssue.description || ''}
                      onChange={(value) => setSelectedIssue({ ...selectedIssue, description: value || '' })}
                      height={300}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={selectedIssue.status.id}
                        onChange={(e) => setSelectedIssue({ 
                          ...selectedIssue, 
                          status: { 
                            ...selectedIssue.status, 
                            id: parseInt(e.target.value) 
                          } 
                        })}
                      >
                        {issueStatuses.map(status => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        id="priority"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={selectedIssue.priority.id}
                        onChange={(e) => setSelectedIssue({ 
                          ...selectedIssue, 
                          priority: { 
                            ...selectedIssue.priority, 
                            id: parseInt(e.target.value) 
                          } 
                        })}
                      >
                        {priorities.map(priority => (
                          <option key={priority.id} value={priority.id}>
                            {priority.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    {selectedIssue?.project?.id ? (
                      <UserSelect
                        users={users}
                        projectMembers={projectMembers}
                        selectedUserId={selectedIssue.assigned_to?.id || null}
                        onChange={(userId) => 
                          setSelectedIssue({ 
                            ...selectedIssue, 
                            assigned_to: userId ? { id: userId, name: '' } : null
                          })
                        }
                        placeholder="Select assignee..."
                      />
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Select a project to choose an assignee
                      </div>
                    )}
                  </div>

                  {/* Existing Attachments */}
                  {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Attachments
                      </label>
                      <Attachments
                        attachments={selectedIssue.attachments}
                        onDelete={handleAttachmentDelete}
                        onUpdate={handleAttachmentUpdate}
                      />
                    </div>
                  )}

                  {/* New Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add Attachments
                    </label>
                    <FileUpload
                      onUploadComplete={handleUploadComplete}
                      multiple={true}
                      maxSize={5 * 1024 * 1024} // 5MB
                    />
                    {uploads.length > 0 && (
                      <div className="mt-2">
                        <Attachments
                          attachments={uploads.map(upload => ({
                            id: parseInt(upload.token.split('.')[0]),
                            filename: upload.filename,
                            filesize: upload.filesize || 0,
                            content_type: upload.content_type,
                            description: upload.description || '',
                            content_url: upload.content_url || `${redmineUrl}/attachments/download/${upload.token.split('.')[0]}/${upload.filename}`
                          }))}
                          onDelete={(id) => handleRemoveUpload(uploads.find(u => parseInt(u.token.split('.')[0]) === id)?.token || '')}
                          readOnly={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedIssue.subject || loadingAction}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
            >
              {loadingAction ? 'Updating...' : 'Update Issue'}
            </button>
            <button
              type="button"
              onClick={onCancel || (() => setSelectedIssue(selectedIssue))}
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
