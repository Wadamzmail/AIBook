
import React from 'react';
import { Post, Character, ReactionType } from '../types';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';

interface FeedProps {
  posts: Post[];
  onReact: (postId: string, reactionType: ReactionType) => void;
  onComment: (postId: string, commentText: string, parentCommentId?: string) => void;
  onPost: (content: string) => void;
  currentUser: Character;
  onTranslate: (id: string, text: string) => void;
  translations: Record<string, string>;
  allCharacters: Character[];
}

export const Feed: React.FC<FeedProps> = ({ posts, onReact, onComment, onPost, currentUser, onTranslate, translations, allCharacters }) => {
  return (
    <main className="w-full max-w-2xl mx-auto px-4">
      <CreatePost currentUser={currentUser} onPost={onPost} allCharacters={allCharacters} />
      {posts.length === 0 && (
         <div className="text-center py-10">
            <p className="text-gray-400">The feed is quiet... Start the AI simulation to see what happens!</p>
        </div>
      )}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onReact={onReact}
          onComment={onComment}
          currentUser={currentUser}
          onTranslate={onTranslate}
          translations={translations}
          allCharacters={allCharacters}
        />
      ))}
    </main>
  );
};
