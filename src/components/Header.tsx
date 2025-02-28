import React, { useState } from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';
import { useApi } from '../context/ApiContext';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { refreshData, isLoading } = useApi();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="w-96">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search issues, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={refreshData}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh Data</span>
          </button>
          
          <div className="relative">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};