import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { LocationOption } from '../../../../types/signup.types';

interface LocationDropdownProps {
  label: string;
  value: string;
  onChange: (option: LocationOption) => void;
  options: LocationOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  error?: string;
  searchPlaceholder?: string;
}

export function LocationDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Search...",
  disabled = false,
  required = false,
  loading = false,
  error,
  searchPlaceholder = "Type to search...",
}: LocationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (option: LocationOption) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  const displayValue = value || '';

  return (
    <div className="mb-4">
      <label className="block mb-2 text-base font-medium text-[#16305B]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={disabled ? "Please select previous option first" : placeholder}
            className={`
              w-full border rounded-md px-4 py-3 pr-10
              focus:ring-2 focus:ring-[#16305B] outline-none 
              text-[#16305B] bg-white placeholder-gray-400 
              transition
              ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'cursor-pointer'}
            `}
            value={isOpen ? searchTerm : displayValue}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={handleInputFocus}
            disabled={disabled}
            autoComplete="off"
            readOnly={!isOpen}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#16305B]" />
            ) : (
              <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'opacity-50' : ''}`} 
              />
            )}
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-hidden">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#16305B] mx-auto mb-2" />
                Loading options...
              </div>
            ) : filteredOptions.length > 0 ? (
              <div className="overflow-y-auto max-h-60">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2 hover:bg-blue-50 cursor-pointer text-[#16305B] border-b border-gray-100 last:border-b-0 ${
                      value === option.label ? 'bg-[#e6ecf5] font-semibold' : ''
                    }`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-center text-gray-500">
                {searchTerm ? `No results found for "${searchTerm}"` : 'No options available'}
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}