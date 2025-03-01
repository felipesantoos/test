import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
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
                  formatter={(value, name) => [value, name === 'open' ? 'Open Issues' : 'Closed Issues']}
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
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download size={16} className="mr-2" />
            Export as CSV
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Download size={16} className="mr-2" />
            Export as PDF
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <ExternalLink size={16} className="mr-2" />
            Share Report
          </button>
        </div>
      </div>
    </div>
  );
};