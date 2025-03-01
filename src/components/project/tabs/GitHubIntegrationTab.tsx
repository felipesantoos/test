import React, { useState } from 'react';
import { GitBranch, GitPullRequest, GitCommit, Link, Plus, AlertCircle, ExternalLink } from 'lucide-react';
import GitHubButton from 'react-github-btn';

interface GitHubIntegrationTabProps {
  projectId: number;
  issues: any[];
}

export const GitHubIntegrationTab: React.FC<GitHubIntegrationTabProps> = ({ projectId, issues }) => {
  const [repository, setRepository] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [linkedIssues, setLinkedIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [githubIssueUrl, setGithubIssueUrl] = useState<string>('');
  const [pullRequestUrl, setPullRequestUrl] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  
  // Mock data for GitHub integration
  const mockPullRequests = [
    { id: 1, title: 'Fix login page styling', number: 42, url: 'https://github.com/example/repo/pull/42', status: 'open', author: 'johndoe', created_at: '2023-05-15T10:30:00Z' },
    { id: 2, title: 'Add user profile page', number: 43, url: 'https://github.com/example/repo/pull/43', status: 'merged', author: 'janedoe', created_at: '2023-05-16T14:20:00Z' },
    { id: 3, title: 'Fix pagination bug', number: 44, url: 'https://github.com/example/repo/pull/44', status: 'closed', author: 'bobsmith', created_at: '2023-05-17T09:15:00Z' }
  ];
  
  const mockGitHubIssues = [
    { id: 101, title: 'Navigation menu not responsive on mobile', number: 101, url: 'https://github.com/example/repo/issues/101', status: 'open', author: 'janedoe', created_at: '2023-05-10T08:45:00Z' },
    { id: 102, title: 'Add dark mode support', number: 102, url: 'https://github.com/example/repo/issues/102', status: 'closed', author: 'johndoe', created_at: '2023-05-12T11:30:00Z' }
  ];

  // Connect to GitHub repository
  const connectToGitHub = () => {
    if (!repository) {
      alert('Please enter a repository name');
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      
      // Mock linked issues
      setLinkedIssues([
        { 
          redmineIssue: issues[0], 
          githubIssue: mockGitHubIssues[0],
          pullRequests: [mockPullRequests[0]]
        },
        { 
          redmineIssue: issues[1], 
          githubIssue: mockGitHubIssues[1],
          pullRequests: [mockPullRequests[1], mockPullRequests[2]]
        }
      ]);
    }, 1500);
  };

  // Link a Redmine issue to a GitHub issue or PR
  const linkIssue = () => {
    if (!selectedIssue || (!githubIssueUrl && !pullRequestUrl)) {
      alert('Please select an issue and enter a GitHub issue or pull request URL');
      return;
    }
    
    setIsLinking(true);
    
    // Simulate API call
    setTimeout(() => {
      // Find the selected Redmine issue
      const redmineIssue = issues.find(issue => issue.id.toString() === selectedIssue);
      
      // Create a new linked issue
      const newLinkedIssue = {
        redmineIssue,
        githubIssue: githubIssueUrl ? {
          id: Math.floor(Math.random() * 1000),
          title: 'Custom GitHub Issue',
          number: Math.floor(Math.random() * 100),
          url: githubIssueUrl,
          status: 'open',
          author: 'user',
          created_at: new Date().toISOString()
        } : null,
        pullRequests: pullRequestUrl ? [{
          id: Math.floor(Math.random() * 1000),
          title: 'Custom Pull Request',
          number: Math.floor(Math.random() * 100),
          url: pullRequestUrl,
          status: 'open',
          author: 'user',
          created_at: new Date().toISOString()
        }] : []
      };
      
      setLinkedIssues([...linkedIssues, newLinkedIssue]);
      setSelectedIssue('');
      setGithubIssueUrl('');
      setPullRequestUrl('');
      setIsLinking(false);
    }, 1000);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'merged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-800">GitHub Integration</h2>
        <div className="flex items-center space-x-2">
          <GitHubButton 
            href="https://github.com/sponsors/example" 
            data-color-scheme="no-preference: light; light: light; dark: dark;" 
            data-icon="octicon-heart" 
            data-size="large" 
            aria-label="Sponsor @example on GitHub"
          >
            Sponsor
          </GitHubButton>
          <GitHubButton 
            href="https://github.com/example/repo" 
            data-color-scheme="no-preference: light; light: light; dark: dark;" 
            data-icon="octicon-star" 
            data-size="large" 
            data-show-count="true" 
            aria-label="Star example/repo on GitHub"
          >
            Star
          </GitHubButton>
        </div>
      </div>

      {/* Repository Connection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold mb-4">Connect to GitHub Repository</h3>
        
        {isConnected ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <GitBranch className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Connected to GitHub repository: <span className="font-semibold">{repository}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-grow">
              <label htmlFor="repository" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Repository (format: username/repository)
              </label>
              <input
                type="text"
                id="repository"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., octocat/Hello-World"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={connectToGitHub}
                disabled={isConnecting || !repository}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {isConnecting ? 'Connecting...' : 'Connect Repository'}
              </button>
            </div>
          </div>
        )}
        
        {isConnected && (
          <div className="space-y-4">
            <h3 className="text-md font-semibold mb-2">Link Redmine Issue to GitHub</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="redmineIssue" className="block text-sm font-medium text-gray-700 mb-1">
                  Redmine Issue
                </label>
                <select
                  id="redmineIssue"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={selectedIssue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                >
                  <option value="">Select an issue</option>
                  {issues.map(issue => (
                    <option key={issue.id} value={issue.id}>
                      #{issue.id}: {issue.subject}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="githubIssue" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Issue URL (optional)
                </label>
                <input
                  type="text"
                  id="githubIssue"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., https://github.com/user/repo/issues/123"
                  value={githubIssueUrl}
                  onChange={(e) => setGithubIssueUrl(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="pullRequest" className="block text-sm font-medium text-gray-700 mb-1">
                  Pull Request URL (optional)
                </label>
                <input
                  type="text"
                  id="pullRequest"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., https://github.com/user/repo/pull/123"
                  value={pullRequestUrl}
                  onChange={(e) => setPullRequestUrl(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={linkIssue}
                  disabled={isLinking || !selectedIssue || (!githubIssueUrl && !pullRequestUrl)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  <Link size={16} className="mr-2" />
                  {isLinking ? 'Linking...' : 'Link Issue'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Linked Issues */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold">Linked Issues</h3>
          </div>
          
          {linkedIssues.length === 0 ? (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center">
                <GitBranch size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No linked issues</h3>
                <p className="text-gray-500 mb-4">Link a Redmine issue to a GitHub issue or pull request to see it here.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Redmine Issue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GitHub Issue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pull Requests
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {linkedIssues.map((linked, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              #{linked.redmineIssue.id}: {linked.redmineIssue.subject}
                            </div>
                            <div className="text-sm text-gray-500">
                              Status: {linked.redmineIssue.status.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {linked.githubIssue ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <AlertCircle size={16} className="text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                <a 
                                  href={linked.githubIssue.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                >
                                  #{linked.githubIssue.number}: {linked.githubIssue.title}
                                  <ExternalLink size={12} className="ml-1" />
                                </a>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(linked.githubIssue.status)}`}>
                                  {linked.githubIssue.status}
                                </span>
                                <span className="ml-2">
                                  by {linked.githubIssue.author} on {formatDate(linked.githubIssue.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No linked GitHub issue</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {linked.pullRequests && linked.pullRequests.length > 0 ? (
                          <div className="space-y-2">
                            {linked.pullRequests.map(pr => (
                              <div key={pr.id} className="flex items-center">
                                <div className="flex-shrink-0">
                                  <GitPullRequest size={16} className="text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    <a 
                                      href={pr.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                    >
                                      #{pr.number}: {pr.title}
                                      <ExternalLink size={12} className="ml-1" />
                                    </a>
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(pr.status)}`}>
                                      {pr.status}
                                    </span>
                                    <span className="ml-2">
                                      by {pr.author} on {formatDate(pr.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No linked pull requests</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};