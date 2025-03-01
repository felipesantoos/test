import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Upload, Download } from 'lucide-react';

interface BulkCreateIssueModalProps {
  projectId: number;
  handleBulkCreateIssues: (issues: any[]) => Promise<{success: any[], failed: any[]}>;
  setBulkCreatingIssues: (isCreating: boolean) => void;
  loadingAction: boolean;
  trackers: any[];
  statuses: any[];
  priorities: any[];
  projects?: any[]; // Optional projects list for selection
}

export const BulkCreateIssueModal = ({ 
  projectId,
  handleBulkCreateIssues, 
  setBulkCreatingIssues, 
  loadingAction,
  trackers,
  statuses,
  priorities,
  projects
}: BulkCreateIssueModalProps) => {
  const [issuesText, setIssuesText] = useState('');
  const [parsedIssues, setParsedIssues] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [failedIssues, setFailedIssues] = useState<any[]>([]);
  const [showFailedIssues, setShowFailedIssues] = useState(false);
  const [step, setStep] = useState<'input' | 'review' | 'results'>('input');
  const [selectedProjectId, setSelectedProjectId] = useState<number>(projectId);

  // Update selected project when projectId prop changes
  useEffect(() => {
    setSelectedProjectId(projectId);
  }, [projectId]);

  // Parse the issues from text input
  const parseIssues = () => {
    setParseError(null);
    
    try {
      // Try to parse as JSON
      let issues = [];
      
      try {
        issues = JSON.parse(issuesText);
      } catch (e) {
        // If JSON parsing fails, try CSV-like format (one issue per line)
        issues = issuesText.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [subject, description = '', trackerId = '1', statusId = '1', priorityId = '2'] = line.split(',').map(item => item.trim());
            return {
              subject,
              description,
              tracker_id: parseInt(trackerId),
              status_id: parseInt(statusId),
              priority_id: parseInt(priorityId),
              project_id: selectedProjectId
            };
          });
      }
      
      // Validate issues
      if (!Array.isArray(issues)) {
        throw new Error('Input must be an array of issues');
      }
      
      // Ensure each issue has at least a subject and set the selected project ID
      const validatedIssues = issues.map((issue, index) => {
        if (!issue.subject) {
          throw new Error(`Issue at position ${index + 1} is missing a subject`);
        }
        
        // Always use the currently selected project ID
        return {
          ...issue,
          project_id: selectedProjectId,
          tracker_id: issue.tracker_id || 1,
          status_id: issue.status_id || 1,
          priority_id: issue.priority_id || 2
        };
      });
      
      setParsedIssues(validatedIssues);
      setStep('review');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse issues. Please check your input format.');
    }
  };

  // Handle the bulk creation of issues
  const handleSubmit = async () => {
    if (parsedIssues.length === 0) return;
    
    try {
      // Make sure all issues have the correct project ID before submitting
      const issuesWithCorrectProject = parsedIssues.map(issue => ({
        ...issue,
        project_id: selectedProjectId
      }));
      
      const result = await handleBulkCreateIssues(issuesWithCorrectProject);
      
      if (result.failed.length > 0) {
        setFailedIssues(result.failed);
        setShowFailedIssues(true);
      }
      
      setStep('results');
    } catch (err) {
      setParseError('An error occurred during bulk creation');
    }
  };

  // Generate a template for the user to download
  const generateTemplate = () => {
    const template = [
      {
        subject: 'Example Issue 1',
        description: 'This is a description for the first issue',
        tracker_id: 1,
        status_id: 1,
        priority_id: 2,
        project_id: selectedProjectId
      },
      {
        subject: 'Example Issue 2',
        description: 'This is a description for the second issue',
        tracker_id: 1,
        status_id: 1,
        priority_id: 2,
        project_id: selectedProjectId
      }
    ];
    
    const jsonString = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'issues_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export failed issues for retry
  const exportFailedIssues = () => {
    const jsonString = JSON.stringify(failedIssues, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_issues.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Retry with failed issues
  const retryFailedIssues = () => {
    setIssuesText(JSON.stringify(failedIssues, null, 2));
    setFailedIssues([]);
    setShowFailedIssues(false);
    setStep('input');
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
                  Bulk Create Issues
                </h3>
                
                {step === 'input' && (
                  <div className="space-y-4">
                    {/* Project selection dropdown if projects are provided */}
                    {projects && projects.length > 0 && (
                      <div>
                        <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-1">
                          Project
                        </label>
                        <select
                          id="projectSelect"
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          All issues will be created in this project
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="issuesText" className="block text-sm font-medium text-gray-700">
                          Issues (JSON array or CSV format)
                        </label>
                        <button
                          type="button"
                          onClick={generateTemplate}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <Download size={12} className="mr-1" />
                          Download Template
                        </button>
                      </div>
                      <textarea
                        id="issuesText"
                        rows={10}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={issuesText}
                        onChange={(e) => setIssuesText(e.target.value)}
                        placeholder={`Paste JSON array of issues or use CSV format:\nSubject 1, Description 1, 1, 1, 2\nSubject 2, Description 2, 1, 1, 2`}
                      ></textarea>
                      <p className="mt-1 text-xs text-gray-500">
                        CSV format: Subject, Description, TrackerId, StatusId, PriorityId
                      </p>
                    </div>
                    
                    {parseError && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{parseError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Trackers:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {trackers.map(tracker => (
                          <div key={tracker.id} className="flex items-center">
                            <span className="font-medium">{tracker.id}:</span> {tracker.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Statuses:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {statuses.map(status => (
                          <div key={status.id} className="flex items-center">
                            <span className="font-medium">{status.id}:</span> {status.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Priorities:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {priorities.map(priority => (
                          <div key={priority.id} className="flex items-center">
                            <span className="font-medium">{priority.id}:</span> {priority.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {step === 'review' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      You are about to create {parsedIssues.length} issues in project: 
                      <span className="font-medium ml-1">
                        {projects ? 
                          projects.find(p => p.id === selectedProjectId)?.name || selectedProjectId 
                          : selectedProjectId}
                      </span>
                    </p>
                    
                    <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subject
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tracker
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Priority
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parsedIssues.map((issue, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 truncate max-w-[150px]">
                                {issue.subject}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                {trackers.find(t => t.id === issue.tracker_id)?.name || issue.tracker_id}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                {statuses.find(s => s.id === issue.status_id)?.name || issue.status_id}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                {priorities.find(p => p.id === issue.priority_id)?.name || issue.priority_id}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {step === 'results' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Successfully created {parsedIssues.length - failedIssues.length} out of {parsedIssues.length} issues.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {failedIssues.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-red-700">
                            {failedIssues.length} issues failed to create
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowFailedIssues(!showFailedIssues)}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            {showFailedIssues ? 'Hide Details' : 'Show Details'}
                          </button>
                        </div>
                        
                        {showFailedIssues && (
                          <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Error
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {failedIssues.map((issue, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 truncate max-w-[150px]">
                                      {issue.subject}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-red-500">
                                      {issue.error || 'Unknown error'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        <div className="mt-4 flex space-x-4">
                          <button
                            type="button"
                            onClick={exportFailedIssues}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Download size={14} className="mr-1" />
                            Export Failed Issues
                          </button>
                          
                          <button
                            type="button"
                            onClick={retryFailedIssues}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Upload size={14} className="mr-1" />
                            Retry Failed Issues
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {step === 'input' && (
              <>
                <button
                  type="button"
                  onClick={parseIssues}
                  disabled={!issuesText.trim() || loadingAction}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setBulkCreatingIssues(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </>
            )}
            
            {step === 'review' && (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={parsedIssues.length === 0 || loadingAction}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-400"
                >
                  {loadingAction ? 'Creating...' : 'Create Issues'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Back
                </button>
              </>
            )}
            
            {step === 'results' && (
              <button
                type="button"
                onClick={() => setBulkCreatingIssues(false)}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};