
import React, { useState, useRef, useEffect } from 'react';
import { Notification } from '../types';

interface NotificationsDropdownProps {
  notifications: Notification[];
  onAction: (notificationId: string, approved: boolean) => void;
}

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);


export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ notifications, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const pendingCount = notifications.filter(n => n.status === 'pending').length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-400 hover:text-white p-2 rounded-full">
                <BellIcon />
                {pendingCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs" style={{lineHeight: '1rem'}}>{pendingCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="font-bold text-white">Notifications</h3>
                    </div>
                    <ul className="py-2 max-h-96 overflow-y-auto">
                        {notifications.length === 0 && (
                            <li className="px-4 py-2 text-sm text-gray-400">No notifications yet.</li>
                        )}
                        {notifications.map(n => (
                            <li key={n.id} className="px-4 py-3 border-b border-gray-700/50">
                                <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl mt-1 flex-shrink-0">{n.character.avatar}</span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-200">
                                            <strong className="font-semibold text-white">{n.character.name}</strong> wants to post an image for: <em className="text-gray-300">"{n.postContent}"</em>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Prompt: "{n.imagePrompt}"</p>
                                        
                                        {n.status === 'pending' && (
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => onAction(n.id, true)} className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded">Approve</button>
                                                <button onClick={() => onAction(n.id, false)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Reject</button>
                                            </div>
                                        )}
                                         {n.status === 'approved' && (
                                            <p className="text-xs text-green-400 mt-2 font-semibold">Approved</p>
                                        )}
                                        {n.status === 'rejected' && (
                                            <p className="text-xs text-red-400 mt-2 font-semibold">Rejected</p>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
