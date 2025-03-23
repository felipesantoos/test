import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

interface SprintSelectProps {
  sprints: any[];
  selectedSprint: string;
  onChange: (value: string) => void;
  onAddNewSprint?: (value: { name: string; start_date: string; end_date: string }) => void;
  className?: string;
  error?: boolean;
}

export const SprintSelect: React.FC<SprintSelectProps> = ({
  sprints,
  selectedSprint,
  onChange,
  onAddNewSprint,
  className = "",
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSprints, setFilteredSprints] = useState(sprints);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSprintData, setNewSprintData] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter sprints when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = sprints.filter(sprint => 
        sprint.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSprints(filtered);
    } else {
      setFilteredSprints(sprints);
    }
  }, [searchQuery, sprints]);

  // Position dropdown and calculate heights
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const viewportHeight = window.innerHeight;
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = viewportHeight - dropdownRect.bottom;
      const spaceAbove = dropdownRect.top;
      const maxDropdownHeight = Math.min(320, Math.max(spaceBelow, spaceAbove) - 20);
      const searchHeight = searchRef.current?.offsetHeight || 0;
      const listMaxHeight = maxDropdownHeight - searchHeight;

      if (listRef.current) {
        listRef.current.style.maxHeight = `${listMaxHeight}px`;
      }
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle adding new sprint
  const handleAddNewSprint = () => {
    if (newSprintData.name.trim() && newSprintData.start_date && newSprintData.end_date && onAddNewSprint) {
      onAddNewSprint(newSprintData);
      setNewSprintData({
        name: '',
        start_date: '',
        end_date: ''
      });
      setIsAddingNew(false);
      setIsOpen(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative">
      <div 
        className={`flex items-center justify-between px-3 py-2 border rounded-md cursor-pointer ${
          error 
            ? 'border-red-300 focus-within:ring-red-500 focus-within:border-red-500' 
            : 'border-gray-300 focus-within:ring-indigo-500 focus-within:border-indigo-500'
        } ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedSprint ? 'text-gray-900' : 'text-gray-500'}>
          {selectedSprint || 'Select a sprint'}
        </span>
        {selectedSprint && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white rounded-md shadow-lg border border-gray-200 mt-1"
          style={{ minWidth: '250px' }}
        >
          <div 
            ref={searchRef}
            className="sticky top-0 bg-white p-2 border-b border-gray-200"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search sprints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div 
            ref={listRef}
            className="overflow-y-auto"
          >
            {isAddingNew ? (
              <div className="p-2 space-y-2">
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={newSprintData.name}
                  onChange={(e) => setNewSprintData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Sprint name"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSprintData.start_date}
                      onChange={(e) => setNewSprintData(prev => ({ ...prev, start_date: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newSprintData.end_date}
                      onChange={(e) => setNewSprintData(prev => ({ ...prev, end_date: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddNewSprint();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingNew(false);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => onChange('')}
                  >
                    No Sprint
                  </button>
                  {filteredSprints.map((sprint) => (
                    <button
                      key={sprint.id}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        selectedSprint === sprint.name 
                          ? 'bg-indigo-50 text-indigo-900' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        onChange(sprint.name);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div>
                        <div className="font-medium">{sprint.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {onAddNewSprint && (
                  <div className="border-t border-gray-200 p-2">
                    <button
                      className="w-full flex items-center justify-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingNew(true);
                      }}
                    >
                      <Plus size={16} className="mr-2" />
                      Add New Sprint
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
