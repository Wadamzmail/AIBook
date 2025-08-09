
import React, { useState, useMemo } from 'react';
import { Post, Character, ReactionType, Comment as CommentType } from '../types';
import { REACTION_ICONS } from '../constants';

const TranslateButton: React.FC<{ onTranslate: () => void }> = ({ onTranslate }) => (
    <button onClick={onTranslate} className="text-xs text-blue-400 hover:underline hover:text-blue-300 transition-colors">
        Translate to Arabic
    </button>
);

interface PostCardProps {
  post: Post;
  onReact: (postId: string, reactionType: ReactionType) => void;
  onComment: (postId: string, commentText: string, parentCommentId?: string) => void;
  currentUser: Character;
  onTranslate: (id: string, text: string) => void;
  translations: Record<string, string>;
  allCharacters: Character[];
}

const ReactionButton: React.FC<{
  type: ReactionType;
  count: number;
  onClick: () => void;
  hasReacted: boolean;
}> = ({ type, count, onClick, hasReacted }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
      hasReacted
        ? 'bg-blue-500/20 text-blue-400'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
    }`}
  >
    <div className="text-xl w-6 h-6 flex items-center justify-center">{REACTION_ICONS[type]}</div>
    <span>{count}</span>
  </button>
);

const renderWithMentions = (text: string, characters: Character[]) => {
    if (!text) return text;
    const regex = /@(\w+)/g;
    const parts = text.split(regex);
    const characterNames = new Set(characters.map(c => c.name));

    return parts.map((part, index) => {
        if (index % 2 === 1 && characterNames.has(part)) {
            return <strong key={index} className="text-blue-400 font-semibold">@{part}</strong>;
        }
        return part;
    });
};

const CommentForm: React.FC<{
    currentUser: Character;
    onSubmit: (text: string) => void;
    placeholder?: string;
    onCancel?: () => void;
}> = ({ currentUser, onSubmit, placeholder = "Write a comment...", onCancel }) => {
    const [text, setText] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text.trim());
            setText('');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
            <span className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-2xl flex-shrink-0" aria-label={currentUser.name}>{currentUser.avatar}</span>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-700 border border-gray-600 rounded-full py-2 px-4 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
            />
            {onCancel && <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-white">Cancel</button>}
        </form>
    );
};


const Comment: React.FC<{
    comment: CommentType;
    onReply: (commentId: string, text: string) => void;
    onTranslate: (id: string, text: string) => void;
    translations: Record<string, string>;
    currentUser: Character;
    allCharacters: Character[];
}> = ({ comment, onReply, onTranslate, translations, currentUser, allCharacters }) => {
    const [isReplying, setIsReplying] = useState(false);
    const commentTranslation = translations[comment.id];
    
    const handleReplySubmit = (text: string) => {
        onReply(comment.id, text);
        setIsReplying(false);
    };

    return (
        <div className="flex items-start gap-2">
            <span className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-2xl mt-1 flex-shrink-0" aria-label={comment.author.name}>{comment.author.avatar}</span>
            <div className="flex-1">
                <div className="bg-gray-700 rounded-lg p-2">
                    <p className="font-semibold text-sm text-blue-300">{comment.author.name}</p>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{renderWithMentions(comment.content, allCharacters)}</p>
                    {commentTranslation && <p className="text-blue-200 bg-black/20 p-1.5 mt-1 rounded-md whitespace-pre-wrap text-sm text-right" dir="rtl">{commentTranslation}</p>}
                    {!commentTranslation && <div className="mt-1"><TranslateButton onTranslate={() => onTranslate(comment.id, comment.content)} /></div>}
                </div>
                <div className="pl-2 mt-1">
                    <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-semibold text-gray-400 hover:text-white">
                        {isReplying ? 'Cancel' : 'Reply'}
                    </button>
                    {isReplying && (
                        <CommentForm 
                            currentUser={currentUser} 
                            onSubmit={handleReplySubmit}
                            placeholder={`Replying to ${comment.author.name}...`}
                            onCancel={() => setIsReplying(false)}
                        />
                    )}
                    <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-700">
                        {comment.replies.map(reply => (
                           <Comment 
                                key={reply.id} 
                                comment={reply} 
                                onReply={onReply} 
                                onTranslate={onTranslate} 
                                translations={translations} 
                                currentUser={currentUser}
                                allCharacters={allCharacters}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PostCard: React.FC<PostCardProps> = ({ post, onReact, onComment, currentUser, onTranslate, translations, allCharacters }) => {
  const [showAllComments, setShowAllComments] = useState(false);
  const totalCommentsAndReplies = useMemo(() => {
    let count = 0;
    const countComments = (comments: CommentType[]) => {
        comments.forEach(c => {
            count++;
            countComments(c.replies);
        });
    };
    countComments(post.comments);
    return count;
  }, [post.comments]);
  
  const handleCommentSubmit = (text: string) => onComment(post.id, text);
  const handleReplySubmit = (parentCommentId: string, text: string) => onComment(post.id, text, parentCommentId);
  
  const reactionCounts = Object.values(ReactionType).reduce((acc, type) => {
    acc[type] = post.reactions.filter((r) => r.type === type).length;
    return acc;
  }, {} as Record<ReactionType, number>);

  const userReaction = post.reactions.find(r => r.author.id === currentUser.id);
  const postTranslation = translations[post.id];

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center mb-4">
        <span className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-3xl mr-4" aria-label={post.author.name}>{post.author.avatar}</span>
        <div>
          <p className="font-bold text-white">{post.author.name}</p>
          <p className="text-xs text-gray-400">{post.timestamp}</p>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <p className="text-gray-200 whitespace-pre-wrap">{renderWithMentions(post.content, allCharacters)}</p>
        {post.imageUrl && <img src={post.imageUrl} alt="AI generated content" className="rounded-lg max-h-96 w-auto mx-auto" />}
        {postTranslation && <p className="text-blue-200 bg-black/20 p-2 rounded-md whitespace-pre-wrap text-right" dir="rtl">{postTranslation}</p>}
        {!postTranslation && <TranslateButton onTranslate={() => onTranslate(post.id, post.content)} />}
      </div>
      
      <div className="flex items-center justify-around border-y border-gray-700 py-1">
        {Object.values(ReactionType).map((type) => (
          <ReactionButton
            key={type}
            type={type}
            count={reactionCounts[type]}
            onClick={() => onReact(post.id, type)}
            hasReacted={userReaction?.type === type}
          />
        ))}
      </div>
      <div className="mt-4">
        <div className="space-y-3">
            {(showAllComments ? post.comments : post.comments.slice(0, 2)).map((comment) => (
                <Comment 
                    key={comment.id}
                    comment={comment}
                    onReply={handleReplySubmit}
                    onTranslate={onTranslate}
                    translations={translations}
                    currentUser={currentUser}
                    allCharacters={allCharacters}
                />
            ))}
        </div>

        {totalCommentsAndReplies > 2 && !showAllComments && (
            <button onClick={() => setShowAllComments(true)} className="text-sm text-blue-400 hover:underline mt-3">
                View all {totalCommentsAndReplies} comments
            </button>
        )}
        
        <CommentForm currentUser={currentUser} onSubmit={handleCommentSubmit} />
      </div>
    </div>
  );
};
