
import React, { useState } from 'react';
import { Character } from '../types';

interface CreatePostProps {
    currentUser: Character;
    onPost: (content: string) => void;
    allCharacters: Character[];
}

export const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPost }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onPost(content.trim());
            setContent('');
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Create a Post</h2>
            <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-3xl flex-shrink-0" aria-label={currentUser.name}>
                    {currentUser.avatar}
                </span>
                <form onSubmit={handleSubmit} className="w-full">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`What's on your mind, ${currentUser.name}? You can @mention others!`}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={!content.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            Post
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
