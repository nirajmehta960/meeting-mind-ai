import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export type AIModel = 'gemini' | 'claude';

interface ModelOption {
  id: AIModel;
  name: string;
  fullName: string;
  icon: string;
  color: string;
}

const modelOptions: ModelOption[] = [
  {
    id: 'claude',
    name: 'Claude 4.0 Sonnet',
    fullName: 'Claude 4.0 Sonnet',
    icon: '/claude-color.svg',
    color: '#FF7A00'
  },
  {
    id: 'gemini',
    name: 'Gemini 2.5 Pro',
    fullName: 'Gemini 2.5 Pro',
    icon: '/gemini-color.svg',
    color: '#4285F4'
  }
];

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = modelOptions.find(option => option.id === selectedModel);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelSelect = (modelId: AIModel) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 rounded-lg 
          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          min-w-[180px]
        `}
      >
        {selectedOption && (
          <>
            <img 
              src={selectedOption.icon} 
              alt={selectedOption.name}
              className="w-5 h-5 flex-shrink-0"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {selectedOption.name}
            </span>
          </>
        )}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 ml-auto transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {modelOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleModelSelect(option.id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2.5 text-left
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
                ${option.id === selectedModel ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                ${option.id === modelOptions[0].id ? 'rounded-t-lg' : ''}
                ${option.id === modelOptions[modelOptions.length - 1].id ? 'rounded-b-lg' : ''}
              `}
            >
              <img 
                src={option.icon} 
                alt={option.name}
                className="w-5 h-5 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.name}
                </div>
              </div>
              {option.id === selectedModel && (
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 