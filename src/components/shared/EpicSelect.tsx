import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';

interface Epic {
  id: string;
  name: string;
  project_id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface EpicSelectProps {
  epics: Epic[];
  selectedEpic: string;
  onChange: (value: string) => void;
  onAddNewEpic?: (epicData: { name: string }) => void;
  className?: string;
  error?: boolean;
}

export const EpicSelect: React.FC<EpicSelectProps> = ({
  epics,
  selectedEpic,
  onChange,
  onAddNewEpic,
  className = "",
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEpics, setFilteredEpics] = useState(epics);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEpicValue, setNewEpicValue] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter epics when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = epics.filter(epic => 
        epic.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEpics(filtered);
    } else {
      setFilteredEpics(epics);
    }
  }, [searchQuery, epics]);

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

  // Handle adding new epic
  const handleAddNewEpic = () => {
    if (newEpicValue.trim() && onAddNewEpic) {
      onAddNewEpic({ name: newEpicValue.trim() });
      setNewEpicValue('');
      setIsAddingNew(false);
      setIsOpen(false);
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
        <span className={selectedEpic ? 'text-gray-900' : 'text-gray-500'}>
          {selectedEpic || 'Select an epic'}
        </span>
        {selectedEpic && (
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
                placeholder="Search epics..."
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
              <div className="p-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newEpicValue}
                    onChange={(e) => setNewEpicValue(e.target.value)}
                    placeholder="Enter new epic name"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewEpic();
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddNewEpic();
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
                    No Epic
                  </button>
                  {filteredEpics.map((epic) => (
                    <button
                      key={epic.id}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        selectedEpic === epic.name 
                          ? 'bg-indigo-50 text-indigo-900' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        onChange(epic.name);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      {epic.name}
                    </button>
                  ))}
                </div>
                {onAddNewEpic && (
                  <div className="border-t border-gray-200 p-2">
                    <button
                      className="w-full flex items-center justify-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingNew(true);
                      }}
                    >
                      <Plus size={16} className="mr-2" />
                      Add New Epic
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
