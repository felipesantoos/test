import React, { useState, useEffect } from 'react';
import { MarkdownEditor } from '../../shared/MarkdownEditor';
import { UserSelect } from '../../shared/UserSelect';
import { FileUpload } from '../../shared/FileUpload';
import { Attachments } from '../../shared/Attachments';
import { useApi } from '../../../context/ApiContext';
import { getAttachmentDetails } from '../../../services/attachmentService';
import { EpicSelect } from '../../shared/EpicSelect';
import { SprintSelect } from '../../shared/SprintSelect';

interface CreateIssueModalProps {
  newIssue: any;
  setNewIssue: (issue: any) => void;
  handleCreateIssue: () => void;
  setIsCreatingIssue: (isCreating: boolean) => void;
  loadingAction: boolean;
  projects?: any[]; // Optional projects list for selection
  users: any[]; // Users list for lookup
  projectMemberships?: any[];
  projectEpics?: any[];
  projectSprints?: any[];
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ 
  newIssue, 
  setNewIssue, 
  handleCreateIssue, 
  setIsCreatingIssue, 
  loadingAction,
  projects,
  users,
  projectMemberships,
  projectEpics,
  projectSprints
}) => {
  const { 
    fetchProjectMemberships,
    fetchEpics,
    createEpic,
    fetchSprints,
    createSprint,
    refreshData
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
  const [allEpics, setAllEpics] = useState<any[]>([]);
  const [filteredEpics, setFilteredEpics] = useState<any[]>([]);
  const [allSprints, setAllSprints] = useState<any[]>([]);
  const [filteredSprints, setFilteredSprints] = useState<any[]>([]);

  // Use passed project members if available
  useEffect(() => {
    if (projectMemberships) {
      setProjectMembers(projectMemberships);
    } else if (newIssue.project_id) { // Only fetch if not provided
      fetchProjectMemberships(newIssue.project_id)
        .then((memberships) => {
          const members = memberships
            .filter(m => m.user)
            .map(m => m.user);
          setProjectMembers(members);
        })
        .catch((error) => {
          console.error('Error fetching project memberships:', error);
          setProjectMembers([]);
        });
    }
  }, [newIssue.project_id, projectMemberships]);

  // Fetch epics and sprints when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        if (projectEpics && projectSprints) {
          setAllEpics(projectEpics);
          setAllSprints(projectSprints);
        } else {
          const [epicsData, sprintsData] = await Promise.all([
            fetchEpics(),
            fetchSprints()
          ]);
          setAllEpics(epicsData || []);
          setAllSprints(sprintsData || []);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, [projectEpics, projectSprints]);

  // Filter epics and sprints when project changes
  useEffect(() => {
    if (newIssue.project_id) {
      if (projectEpics) {
        setFilteredEpics(projectEpics);
      } else {
        const projectEpics = allEpics.filter(epic => 
          epic.project_id === newIssue.project_id
        );
        setFilteredEpics(projectEpics);
      }
  
      if (projectSprints) {
        setFilteredSprints(projectSprints);
      } else {
        const projectSprints = allSprints.filter(sprint => 
          sprint.project_id === newIssue.project_id
        );
        setFilteredSprints(projectSprints);
      }
    } else {
      setFilteredEpics([]);
      setFilteredSprints([]);
    }
  }, [newIssue.project_id, allEpics, allSprints, projectEpics, projectSprints]);  

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
      setNewIssue((prev: any)  => ({
        ...prev,
        uploads: [...(prev.uploads || []), completeUpload]
      }));
    } catch (err) {
      console.error('Error getting attachment details:', err);
      // Still add the upload even if we couldn't get details
      setUploads(prev => [...prev, upload]);
      // Update the issue data with the new upload
      setNewIssue((prev: any) => ({
        ...prev,
        uploads: [...(prev.uploads || []), upload]
      }));
    }
  };

  // Handle removing an upload
  const handleRemoveUpload = (token: string) => {
    setUploads(prev => prev.filter(u => u.token !== token));
    setNewIssue((prev: any) => ({
      ...prev,
      uploads: prev.uploads?.filter((u: any) => u.token !== token) || []
    }));
  };

  // Handle epic selection or new epic creation
  const handleEpicChange = (value: string) => {
    // Find the epic object to get its ID
    const selectedEpic = filteredEpics.find(epic => epic.name === value);
    const epicId = selectedEpic ? selectedEpic.id : '';

    // Get current sprint value to preserve it
    const sprintField = newIssue.custom_fields?.find((field: any) => 
      field.id == import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID
    );

    // Update custom fields while preserving sprint value
    setNewIssue((prev: any) => ({
      ...prev,
      custom_fields: [
        ...(prev.custom_fields?.filter((field: any) => 
          field.id != import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID && 
          field.id != import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID
        ) || []),
        { id: import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID, name: 'Epic', value: epicId },
        { id: import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID, name: 'Sprint', value: sprintField?.value || '' }
      ]
    }));
  };

  // Handle adding a new epic
  const handleAddNewEpic = async (epicData: any) => {
    try {
      // Ensure the epic is created for the current project
      const newEpic = await createEpic({
        ...epicData,
        project_id: newIssue.project_id
      });
      
      // Add to both epic lists
      setAllEpics(prev => [...prev, newEpic]);
      setFilteredEpics(prev => [...prev, newEpic]);
      
      // Update the global epics state via refreshData
      await refreshData();
      
      handleEpicChange(newEpic.name);
    } catch (err) {
      console.error('Error creating epic:', err);
      alert('Failed to create epic');
    }
  };

  // Handle sprint selection or new sprint creation
  const handleSprintChange = (value: string) => {
    // Find the sprint object to get its ID
    const selectedSprint = filteredSprints.find(sprint => sprint.name === value);
    const sprintId = selectedSprint ? selectedSprint.id : '';

    // Get current epic value to preserve it
    const epicField = newIssue.custom_fields?.find((field: any) => 
      field.id == import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID
    );

    // Update custom fields while preserving epic value
    setNewIssue((prev: any) => ({
      ...prev,
      custom_fields: [
        ...(prev.custom_fields?.filter((field: any) => 
          field.id != import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID && 
          field.id != import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID
        ) || []),
        { id: import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID, name: 'Epic', value: epicField?.value || '' },
        { id: import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID, name: 'Sprint', value: sprintId }
      ]
    }));
  };

  // Handle adding a new sprint
  const handleAddNewSprint = async (sprintData: any) => {
    try {
      // Ensure the sprint is created for the current project
      const newSprint = await createSprint({
        ...sprintData,
        project_id: newIssue.project_id
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
    const epicField = newIssue.custom_fields?.find((field: any) => field.id == import.meta.env.VITE_EPIC_CUSTOM_FIELD_ID);
    const epicId = epicField?.value;
    // Find epic by ID and return its name
    const epic = filteredEpics.find(e => e.id === epicId);
    return epic ? epic.name : '';
  };

  // Get current sprint value
  const getCurrentSprint = () => {
    const sprintField = newIssue.custom_fields?.find((field: any) => field.id == import.meta.env.VITE_SPRINT_CUSTOM_FIELD_ID);
    const sprintId = sprintField?.value;
    // Find sprint by ID and return its name
    const sprint = filteredSprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : '';
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
                  Create New Issue
                </h3>
                
                <div className="space-y-4">
                  {/* Project selection if projects are provided */}
                  {projects && projects.length > 0 && (
                    <div>
                      <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Project *
                      </label>
                      <select
                        id="project_id"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newIssue.project_id}
                        onChange={(e) => setNewIssue({ ...newIssue, project_id: parseInt(e.target.value) })}
                        required
                      >
                        <option value="">Select a project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newIssue.subject}
                      onChange={(e) => setNewIssue({ ...newIssue, subject: e.target.value })}
                      required
                    />
                  </div>

                  {/* Epic Field */}
                  <div>
                    <label htmlFor="epic" className="block text-sm font-medium text-gray-700 mb-1">
                      Epic
                    </label>
                    {newIssue.project_id ? (
                      <EpicSelect
                        epics={filteredEpics}
                        selectedEpic={getCurrentEpic()}
                        onChange={handleEpicChange}
                        onAddNewEpic={handleAddNewEpic}
                      />
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Select a project to choose an epic
                      </div>
                    )}
                  </div>

                  {/* Sprint Field */}
                  <div>
                    <label htmlFor="sprint" className="block text-sm font-medium text-gray-700 mb-1">
                      Sprint
                    </label>
                    {newIssue.project_id ? (
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
                      value={newIssue.description}
                      onChange={(value) => setNewIssue({ ...newIssue, description: value || '' })}
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
                        value={newIssue.status_id}
                        onChange={(e) => setNewIssue({ ...newIssue, status_id: parseInt(e.target.value) })}
                      >
                        <option value={1}>New</option>
                        <option value={2}>In Progress</option>
                        <option value={3}>Resolved</option>
                        <option value={4}>Feedback</option>
                        <option value={5}>Closed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        id="priority"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newIssue.priority_id}
                        onChange={(e) => setNewIssue({ ...newIssue, priority_id: parseInt(e.target.value) })}
                      >
                        <option value={1}>Low</option>
                        <option value={2}>Normal</option>
                        <option value={3}>High</option>
                        <option value={4}>Urgent</option>
                        <option value={5}>Immediate</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    {newIssue.project_id ? (
                      <UserSelect
                        users={users}
                        projectMembers={projectMembers}
                        selectedUserId={newIssue.assigned_to_id}
                        onChange={(userId) => setNewIssue({ ...newIssue, assigned_to_id: userId })}
                        placeholder="Select assignee..."
                      />
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Select a project to choose an assignee
                      </div>
                    )}
                  </div>

                  {/* File Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachments
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
                            content_url: upload.content_url || ''
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
              onClick={handleCreateIssue}
              disabled={!newIssue.subject || !newIssue.project_id || loadingAction}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
            >
              {loadingAction ? 'Creating...' : 'Create Issue'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingIssue(false)}
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
