
import React from 'react';
import { API_CALL_LIMIT } from '../constants';

interface HeaderProps {
  isSimulationRunning: boolean;
  toggleSimulation: () => void;
  apiCallCount: number;
  onOpenSettings: () => void;
  children?: React.ReactNode;
  useFreeModel: boolean;
}

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ isSimulationRunning, toggleSimulation, apiCallCount, children, onOpenSettings, useFreeModel }) => {
  const usagePercentage = Math.min((apiCallCount / API_CALL_LIMIT) * 100, 100);

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-800/90 border-b border-gray-700 p-3 z-30 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          <span className="text-blue-400">AI</span>Book
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
         <div className="hidden sm:block w-32 md:w-48">
          <div className="text-xs text-gray-400 mb-1 text-center">API Usage {useFreeModel && <span className="text-blue-400 font-bold">(Free Mode)</span>}</div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">{apiCallCount} / {API_CALL_LIMIT} Calls</div>
        </div>
        
        {children}

        <button onClick={onOpenSettings} className="p-2 rounded-full text-gray-400 hover:text-white transition-colors" aria-label="Open settings">
            <SettingsIcon />
        </button>

        <button
          onClick={toggleSimulation}
          className={`px-3 md:px-4 py-2 rounded-lg font-bold transition-all duration-200 text-sm ${
            isSimulationRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSimulationRunning ? 'Stop Sim' : 'Start Sim'}
        </button>
      </div>
    </header>
  );
};
