import React from 'react';

const FeedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6M7 8h6" />
    </svg>
);

const CharactersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 003 21m12-7.646V12a4 4 0 00-4-4H7.646" />
    </svg>
);

const LogsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

interface BottomNavProps {
    onNavClick: (view: 'characters' | 'logs') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onNavClick }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around items-center h-16 z-20">
            <button className="flex flex-col items-center justify-center text-blue-400 w-full h-full">
                <FeedIcon />
                <span className="text-xs mt-1">Feed</span>
            </button>
            <button onClick={() => onNavClick('characters')} className="flex flex-col items-center justify-center text-gray-400 hover:text-white w-full h-full">
                <CharactersIcon />
                <span className="text-xs mt-1">Characters</span>
            </button>
            <button onClick={() => onNavClick('logs')} className="flex flex-col items-center justify-center text-gray-400 hover:text-white w-full h-full">
                <LogsIcon />
                <span className="text-xs mt-1">Logs</span>
            </button>
        </nav>
    );
};
