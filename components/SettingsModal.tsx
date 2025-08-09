
import React from 'react';
import { Modal } from './Modal';
import { API_CALL_LIMIT } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  useFreeModel: boolean;
  onToggleFreeModel: () => void;
  apiCallCount: number;
}

const ToggleSwitch: React.FC<{ isEnabled: boolean, onToggle: () => void, label: string, description: string, disabled?: boolean }> = ({ isEnabled, onToggle, label, description, disabled = false }) => (
    <div className="flex items-center justify-between py-4">
        <div>
            <p className={`font-semibold ${disabled ? 'text-gray-500' : 'text-white'}`}>{label}</p>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={onToggle}
            disabled={disabled}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${isEnabled ? 'bg-blue-600' : 'bg-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span
                aria-hidden="true"
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, useFreeModel, onToggleFreeModel, apiCallCount }) => {
  const isApiLimitReached = apiCallCount >= API_CALL_LIMIT;
    
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-2">
        <p className="text-gray-300">Adjust application settings here.</p>
        <div className="border-t border-gray-700 mt-4">
            <ToggleSwitch
                isEnabled={useFreeModel}
                onToggle={onToggleFreeModel}
                label="Use Free AI Model"
                description="Uses a mock AI for unlimited, free interactions. Responses are simple and not from a real AI."
                disabled={isApiLimitReached}
            />
        </div>
        
        {isApiLimitReached ? (
             <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-200">
                    API call limit reached. The app has automatically switched to the Free AI Model to continue running.
                </p>
            </div>
        ) : useFreeModel && (
            <div className="p-3 bg-blue-900/50 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-200">Free AI Model is active. API calls will not be counted.</p>
            </div>
        )}
      </div>
    </Modal>
  );
};
