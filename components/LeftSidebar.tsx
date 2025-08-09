
import React from 'react';
import { Character, Group } from '../types';

interface LeftSidebarProps {
  characters: Character[];
  groups: Group[];
  onCharacterSelect: (character: Character) => void;
  onJoinGroup: (groupId: string) => void;
  currentUser: Character;
  activeChatCharacterId?: string | null;
}

const GroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
);

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ characters, groups, onCharacterSelect, onJoinGroup, currentUser, activeChatCharacterId }) => {
  return (
    <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-800 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-300 mb-4">Characters</h2>
      <ul className="space-y-2">
        {characters.map((char) => (
          <li key={char.id}>
            <button
              onClick={() => onCharacterSelect(char)}
              disabled={char.isBanned}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors duration-200 ${
                activeChatCharacterId === char.id
                  ? 'bg-blue-600/50'
                  : 'hover:bg-gray-700'
              } ${char.isBanned ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-2xl" aria-label={char.name}>{char.avatar}</span>
              <div className="flex-1">
                <span className="font-medium text-white">{char.name}</span>
                {char.isBanned && <span className="block text-xs text-red-400">Blocked</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold text-gray-300 mt-6 mb-4">Groups</h2>
      {groups.length > 0 ? (
        <ul className="space-y-3">
          {groups.map((group) => {
            const isMember = group.members.some(m => m.id === currentUser.id);
            return (
                <li key={group.id} className="p-3 rounded-lg bg-gray-700/50">
                    <div className="flex items-center gap-2">
                        <GroupIcon />
                        <p className="font-bold text-white flex-1 truncate">{group.name}</p>
                         {!isMember && (
                            <button onClick={() => onJoinGroup(group.id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">
                                Join
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 italic my-1">"{group.description}"</p>
                    <p className="text-xs text-gray-500 mt-2">Members: {group.members.length} | By: {group.createdBy.name}</p>
                </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No groups have been formed yet.</p>
      )}
    </aside>
  );
};
