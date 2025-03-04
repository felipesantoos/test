import React from 'react';
import { Download, ExternalLink, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface AnalyticsTabProps {
  issuesOverTimeData: any[];
  issueStatusData: any[];
  priorityData: any[];
  renderCustomizedLabel: (props: any) => JSX.Element;
}

export const AnalyticsTab = ({ 
  issuesOverTimeData, 
  issueStatusData, 
  priorityData,
  renderCustomizedLabel
}: AnalyticsTabProps) => {
  // Function to export data as CSV
  const exportAsCSV = () => {
    // Prepare data for CSV
    const issuesOverTimeCSV = [
      ['Date', 'Open Issues', 'Closed Issues'],
      ...issuesOverTimeData.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.open,
        item.closed
      ])
    ];

    const statusDataCSV = [
      ['Status', 'Count'],
      ...issueStatusData.map(item => [item.name, item.value])
    ];

    const priorityDataCSV = [
      ['Priority', 'Count'],
      ...priorityData.map(item => [item.name, item.count])
    ];

    // Combine all data with sections
    const csvContent = [
      'Issues Over Time',
      ...issuesOverTimeCSV,
      '',
      'Issue Status Distribution',
      ...statusDataCSV,
      '',
      'Issues by Priority',
      ...priorityDataCSV
    ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'project_analytics.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to export data as PDF
  const exportAsPDF = () => {
    // Open print dialog with custom styling
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Create a styled document
    printWindow.document.write(`
      <html>
        <head>
          <title>Project Analytics Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #1f2937;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #4b5563;
              margin-top: 30px;
            }
            .chart-container {
              margin: 20px 0;
              page-break-inside: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Project Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>

          <h2>Issues Over Time</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Open Issues</th>
                <th>Closed Issues</th>
              </tr>
            </thead>
            <tbody>
              ${issuesOverTimeData.map(item => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString()}</td>
                  <td>${item.open}</td>
                  <td>${item.closed}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Issue Status Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${issueStatusData.map(item => {
                const total = issueStatusData.reduce((sum, i) => sum + i.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.value}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h2>Issues by Priority</h2>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              ${priorityData.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="no-print">
            <button onclick="window.print()">Print Report</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Function to share report
  const shareReport = async () => {
    // Create a summary of the analytics
    const summary = {
      title: "Project Analytics Report",
      date: new Date().toLocaleString(),
      metrics: {
        totalIssues: issueStatusData.reduce((sum, item) => sum + item.value, 0),
        openIssues: issuesOverTimeData[issuesOverTimeData.length - 1]?.open || 0,
        closedIssues: issuesOverTimeData[issuesOverTimeData.length - 1]?.closed || 0
      },
      statusDistribution: issueStatusData.map(item => ({
        status: item.name,
        count: item.value
      })),
      priorityDistribution: priorityData
    };

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Project Analytics Report',
          text: `Project Analytics Summary:\n` +
                `Total Issues: ${summary.metrics.totalIssues}\n` +
                `Open Issues: ${summary.metrics.openIssues}\n` +
                `Closed Issues: ${summary.metrics.closedIssues}`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to copy to clipboard
        copyToClipboard(JSON.stringify(summary, null, 2));
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard(JSON.stringify(summary, null, 2));
    }
  };

  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Report data copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy report data to clipboard');
      });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Project Analytics</h2>
      
      {/* Issues Over Time Chart */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-md font-semibold mb-4">Issues Over Time</h3>
        {issuesOverTimeData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={issuesOverTimeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'Open Issues' ? 'Open Issues' : 'Closed Issues']}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="open" stroke="#3B82F6" name="Open Issues" />
                <Line type="monotone" dataKey="closed" stroke="#10B981" name="Closed Issues" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* Status and Priority Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-md font-semibold mb-4">Issue Status Distribution</h3>
          {issueStatusData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <Pie
                    data={issueStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={renderCustomizedLabel}
                  >
                    {issueStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} issues`, props.payload.name]} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-md font-semibold mb-4">Issues by Priority</h3>
          {priorityData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} issues`, 'Count']} />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Issues" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      
      {/* Export Options */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-md font-semibold mb-4">Export Analytics</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportAsCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download size={16} className="mr-2" />
            Export as CSV
          </button>
          <button 
            onClick={exportAsPDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download size={16} className="mr-2" />
            Export as PDF
          </button>
          <button 
            onClick={shareReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Share2 size={16} className="mr-2" />
            Share Report
          </button>
        </div>
      </div>
    </div>
  );
};