
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Character, Post, ReactionType, Comment, Group, Notification } from './types';
import { INITIAL_CHARACTERS, API_CALL_LIMIT } from './constants';
import * as geminiService from './services/geminiService';
import * as mockService from './services/mockService';

import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { Feed } from './components/Feed';
import { LogPanel } from './components/LogPanel';
import { BottomNav } from './components/BottomNav';
import { Modal } from './components/Modal';
import { ChatWindow } from './components/ChatWindow';
import { NotificationsDropdown } from './components/NotificationsDropdown';
import { SettingsModal } from './components/SettingsModal';

// Helper function to recursively add a reply to a nested comment structure
const addReplyToComment = (comments: Comment[], parentId: string, reply: Comment): { comments: Comment[], parentAuthor: Character | null } => {
    let parentAuthor: Character | null = null;
    const updatedComments = comments.map(comment => {
        if (comment.id === parentId) {
            parentAuthor = comment.author;
            return { ...comment, replies: [...comment.replies, reply] };
        }
        if (comment.replies.length > 0) {
            const result = addReplyToComment(comment.replies, parentId, reply);
            if(result.parentAuthor) parentAuthor = result.parentAuthor;
            return { ...comment, replies: result.comments };
        }
        return comment;
    });
    return { comments: updatedComments, parentAuthor };
};

const App: React.FC = () => {
    const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
    const [groups, setGroups] = useState<Group[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>(["Welcome to AIBook! Press 'Start Sim' to begin."]);
    const [apiCallCount, setApiCallCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [activeChatCharacter, setActiveChatCharacter] = useState<Character | null>(null);
    const [isMobileCharsOpen, setIsMobileCharsOpen] = useState(false);
    const [isMobileLogsOpen, setIsMobileLogsOpen] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});
    
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [useFreeModel, setUseFreeModel] = useState(false);

    const userCharacter: Character = { id: 'user_annas', name: 'Annas', avatar: '👤', personality: 'The user', interests: [], angerLevel: 0, isBanned: false, recentEvents: [] };

    const simulationTimerRef = useRef<number | null>(null);
    const postsRef = useRef(posts);
    const charactersRef = useRef(characters);
    const groupsRef = useRef(groups);
    useEffect(() => {
        postsRef.current = posts;
        charactersRef.current = characters;
        groupsRef.current = groups;
    }, [posts, characters, groups]);

    const service = useFreeModel ? mockService : geminiService;

    const addLog = useCallback((message: string) => {
        setLogs(prev => [...prev.slice(-100), message]);
    }, []);

    const addEventToCharacter = useCallback((characterId: string, event: string) => {
        setCharacters(prev => prev.map(c => {
            if (c.id === characterId) {
                return { ...c, recentEvents: [...c.recentEvents.slice(-5), event] };
            }
            return c;
        }));
    }, []);

    const incrementApiCount = useCallback((count = 1) => {
        setApiCallCount(prev => {
            const newCount = prev + count;
            if (newCount >= API_CALL_LIMIT && !useFreeModel) {
                addLog("API call limit reached. Switching to Free AI Model to continue simulation.");
                setUseFreeModel(true);
            }
            return newCount;
        });
    }, [useFreeModel, addLog]);

    const incrementApiCountIfReal = useCallback((count = 1) => {
        if (!useFreeModel) {
            incrementApiCount(count);
        }
    }, [useFreeModel, incrementApiCount]);
    
    const runSimulation = useCallback(async () => {
        if (!useFreeModel && apiCallCount >= API_CALL_LIMIT) return;

        for (let i = 0; i < 1; i++) {
             if (!useFreeModel && apiCallCount + (i * 2) >= API_CALL_LIMIT) break;

            const availableCharacters = charactersRef.current.filter(c => c.id !== 'user_annas');
            if (availableCharacters.length === 0) continue;
            const character = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
            
            incrementApiCountIfReal();
            addLog(`${character.name} is thinking...`);

            try {
                const decision = await service.decideNextAction(character, charactersRef.current, postsRef.current, groupsRef.current);
                addLog(`${character.name} ${decision.reasoning}`);

                switch (decision.action) {
                    case 'POST': {
                        incrementApiCountIfReal();
                        const { content } = await service.generatePost(character, charactersRef.current);
                        const newPost: Post = { id: Date.now().toString(), author: character, content, reactions: [], comments: [], timestamp: new Date().toLocaleString() };
                        setPosts(prev => [newPost, ...prev]);
                        addLog(`${character.name} created a new post.`);
                        break;
                    }
                     case 'POST_IMAGE': {
                        incrementApiCountIfReal();
                        const { prompt: imagePrompt, content: postContent } = await service.generateImagePost(character);
                        const newNotification: Notification = {
                            id: Date.now().toString(),
                            type: 'image_request',
                            character,
                            imagePrompt: imagePrompt,
                            postContent,
                            status: 'pending'
                        };
                        setNotifications(prev => [newNotification, ...prev]);
                        addLog(`${character.name} wants to post an image: "${postContent}". Check notifications to approve.`);
                        break;
                    }
                    case 'COMMENT': {
                        const postToCommentOn = postsRef.current.find(p => p.id === decision.targetId);
                        if (postToCommentOn) {
                            incrementApiCountIfReal();
                            const commentContent = await service.generateComment(character, postToCommentOn, charactersRef.current);
                            const newComment: Comment = { id: Date.now().toString(), author: character, content: commentContent, replies: [] };
                            setPosts(prev => prev.map(p => p.id === postToCommentOn.id ? { ...p, comments: [...p.comments, newComment] } : p));
                            addLog(`${character.name} commented on ${postToCommentOn.author.name}'s post.`);
                            if (postToCommentOn.author.id !== character.id) {
                                addEventToCharacter(postToCommentOn.author.id, `${character.name} commented on your post.`);
                            }
                        }
                        break;
                    }
                    case 'REPLY_TO_COMMENT': {
                        const { targetId: postId, targetSubId: commentId } = decision;
                        const post = postsRef.current.find(p => p.id === postId);
                        if(post && commentId) {
                            incrementApiCountIfReal();
                            let parentComment: Comment | undefined;
                            const findComment = (comments: Comment[]): Comment | undefined => {
                                for(const c of comments) {
                                    if (c.id === commentId) return c;
                                    const found = findComment(c.replies);
                                    if(found) return found;
                                }
                                return undefined;
                            }
                            parentComment = findComment(post.comments);

                            if(parentComment) {
                                const replyContent = await service.generateComment(character, post, charactersRef.current, parentComment);
                                const newReply: Comment = { id: Date.now().toString(), author: character, content: replyContent, replies: [] };
                                
                                const { comments: updatedComments, parentAuthor } = addReplyToComment(post.comments, commentId, newReply);
                                setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
                                addLog(`${character.name} replied to ${parentComment.author.name}'s comment.`);
                                if (parentAuthor && parentAuthor.id !== character.id) {
                                    addEventToCharacter(parentAuthor.id, `${character.name} replied to your comment.`);
                                }
                            }
                        }
                        break;
                    }
                    case 'REACT': {
                        const postToReactTo = postsRef.current.find(p => p.id === decision.targetId);
                        if (postToReactTo) {
                            incrementApiCountIfReal();
                            const reactionType = await service.generateReaction(character, postToReactTo) as ReactionType;
                            const newReaction = { id: Date.now().toString(), author: character, type: reactionType };
                            
                            setPosts(prev => prev.map(p => p.id === postToReactTo.id ? { ...p, reactions: [...p.reactions.filter(r => r.author.id !== character.id), newReaction] } : p));
                            addLog(`${character.name} reacted to ${postToReactTo.author.name}'s post with: ${reactionType}.`);
                             if (postToReactTo.author.id !== character.id) {
                                addEventToCharacter(postToReactTo.author.id, `${character.name} reacted "${reactionType}" to your post.`);
                            }
                        }
                        break;
                    }
                    case 'CREATE_GROUP': {
                        incrementApiCountIfReal();
                        const groupDetails = await service.generateGroupDetails(character);
                        const newGroup: Group = {
                            id: Date.now().toString(),
                            name: groupDetails.name,
                            description: groupDetails.description,
                            createdBy: character,
                            members: [character]
                        };
                        setGroups(prev => [...prev, newGroup]);
                        addLog(`${character.name} created a new group: "${groupDetails.name}".`);
                        break;
                    }
                    case 'JOIN_GROUP': {
                        const group = groupsRef.current.find(g => g.id === decision.targetId);
                        if (group && !group.members.some(m => m.id === character.id)) {
                           setGroups(prev => prev.map(g => g.id === group.id ? { ...g, members: [...g.members, character] } : g));
                           addLog(`${character.name} joined the group "${group.name}".`);
                        }
                        break;
                    }
                }
            } catch (error) {
                console.error("Simulation step failed:", error);
                addLog(`An error occurred with ${character.name}'s action.`);
            }
        }
    }, [apiCallCount, incrementApiCountIfReal, addEventToCharacter, service, useFreeModel, addLog]);

    useEffect(() => {
        const canRun = useFreeModel ? true : apiCallCount < API_CALL_LIMIT;
        if (isSimulationRunning && characters.length > 0 && canRun) {
            simulationTimerRef.current = window.setInterval(runSimulation, 8000); 
        } else {
            if (simulationTimerRef.current) {
                clearInterval(simulationTimerRef.current);
                simulationTimerRef.current = null;
                if(isSimulationRunning && !canRun) addLog("AI simulation paused as API limit is reached and free model is not active.");
                else if (isSimulationRunning) addLog("AI simulation paused.");
            }
        }
        return () => {
            if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
        };
    }, [isSimulationRunning, runSimulation, characters, apiCallCount, useFreeModel]);
    
    const handleToggleSimulation = () => setIsSimulationRunning(prev => !prev);

    const handleUserReaction = (postId: string, reactionType: ReactionType) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const existingReaction = p.reactions.find(r => r.author.id === userCharacter.id);
                if (existingReaction) {
                    return existingReaction.type === reactionType
                        ? { ...p, reactions: p.reactions.filter(r => r.author.id !== userCharacter.id) }
                        : { ...p, reactions: p.reactions.map(r => r.author.id === userCharacter.id ? { ...r, type: reactionType } : r) };
                } else {
                    return { ...p, reactions: [...p.reactions, { id: Date.now().toString(), author: userCharacter, type: reactionType }] };
                }
            }
            return p;
        }));
    };

    const handleUserComment = (postId: string, commentText: string, parentCommentId?: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        const newComment: Comment = { id: Date.now().toString(), author: userCharacter, content: commentText, replies: [] };

        if (parentCommentId) {
            const { comments: updatedComments, parentAuthor } = addReplyToComment(post.comments, parentCommentId, newComment);
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
            if (parentAuthor) {
                addLog(`You replied to ${parentAuthor.name}'s comment.`);
                addEventToCharacter(parentAuthor.id, `The user replied to your comment.`);
            }
        } else {
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
            addLog(`You commented on ${post.author.name}'s post.`);
            addEventToCharacter(post.author.id, `The user commented on your post.`);
        }
    };
    
    const handleUserPost = (content: string) => {
        const newPost: Post = {
            id: Date.now().toString(),
            author: userCharacter,
            content: content,
            reactions: [],
            comments: [],
            timestamp: new Date().toLocaleString(),
        };
        setPosts(prev => [newPost, ...prev]);
        addLog("You created a new post.");
    };

    const handleTranslate = useCallback(async (id: string, text: string) => {
        if (translations[id] || !text) return;
        incrementApiCountIfReal();
        addLog(`Translating text...`);
        try {
            const translatedText = await service.translateToArabic(text);
            setTranslations(prev => ({ ...prev, [id]: translatedText || "(Translation not available)" }));
        } catch (error) {
            console.error("Translation failed", error);
            addLog("Translation failed.");
        }
    }, [incrementApiCountIfReal, translations, service, addLog]);
    
    const handleUserProvocation = useCallback(async (characterId: string, message: string) => {
        const char = charactersRef.current.find(c => c.id === characterId);
        if (!char || char.isBanned) return;

        incrementApiCountIfReal();
        const { isNegative } = await service.analyzeSentimentAndAnger(char, message);

        if (isNegative) {
            addEventToCharacter(characterId, `The user said something hurtful to me: "${message}"`);
            setCharacters(prev => prev.map(c => {
                if (c.id === characterId) {
                    const newAngerLevel = c.angerLevel + 1;
                    const isNowBanned = newAngerLevel >= 3;
                    addLog(`${c.name}'s anger towards you has increased to ${newAngerLevel}.`);
                    if (isNowBanned) {
                        addLog(`[CRITICAL] ${c.name} has had enough and blocked you!`);
                    }
                    return { ...c, angerLevel: newAngerLevel, isBanned: isNowBanned };
                }
                return c;
            }));
        }
    }, [incrementApiCountIfReal, addEventToCharacter, service, addLog]);

    const handleImageRequest = async (notificationId: string, approved: boolean) => {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification || notification.status !== 'pending') return;

        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, status: approved ? 'approved' : 'rejected' } : n));

        if (approved) {
            addLog(`Approving ${notification.character.name}'s image post...`);
            incrementApiCountIfReal();
            try {
                const imageUrl = await service.generateImage(notification.imagePrompt);
                const newPost: Post = {
                    id: Date.now().toString(),
                    author: notification.character,
                    content: notification.postContent,
                    imageUrl: imageUrl,
                    reactions: [],
                    comments: [],
                    timestamp: new Date().toLocaleString(),
                };
                setPosts(prev => [newPost, ...prev]);
                addLog(`${notification.character.name}'s image post was created.`);
            } catch (error) {
                console.error("Image generation failed:", error);
                addLog(`Image generation failed for ${notification.character.name}.`);
                addEventToCharacter(notification.character.id, "My image post failed to generate after being approved.");
            }
        } else {
            addLog(`You rejected ${notification.character.name}'s image post.`);
            addEventToCharacter(notification.character.id, "The user rejected my image post request.");
        }
    };

     const handleJoinGroup = (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (group && !group.members.some(m => m.id === userCharacter.id)) {
            setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: [...g.members, userCharacter] } : g));
            addLog(`You joined the group "${group.name}".`);
        }
    };
    
    const handleMobileNav = (view: 'characters' | 'logs') => {
        if (view === 'characters') setIsMobileCharsOpen(true);
        if (view === 'logs') setIsMobileLogsOpen(true);
    }
    
    const handleSelectChar = (char: Character) => {
        setActiveChatCharacter(char);
        setIsMobileCharsOpen(false);
    }

    const handleToggleFreeModel = () => {
        const isApiLimitReached = apiCallCount >= API_CALL_LIMIT;
        if(isApiLimitReached) {
            addLog("Cannot switch back to Real AI model, API limit reached.");
            return;
        }

        const turningOn = !useFreeModel;
        setUseFreeModel(turningOn);
        if (turningOn) {
            addLog("Switched to Free AI Model. No API calls will be made.");
        } else {
            addLog("Switched back to Gemini AI Model. API calls will resume.");
        }
    };

    const currentlyActiveChatCharacter = characters.find(c => c.id === activeChatCharacter?.id) || activeChatCharacter;
    
    return (
        <div className="min-h-screen bg-gray-900 font-sans">
            <Header
                isSimulationRunning={isSimulationRunning}
                toggleSimulation={handleToggleSimulation}
                apiCallCount={apiCallCount}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                useFreeModel={useFreeModel}
            >
                <NotificationsDropdown
                    notifications={notifications}
                    onAction={handleImageRequest}
                 />
            </Header>
            
            <div className="pt-20 lg:flex">
                <div className="hidden lg:block">
                     <LeftSidebar 
                        characters={characters.filter(c => c.id !== 'user_annas')} 
                        groups={groups}
                        onCharacterSelect={handleSelectChar}
                        onJoinGroup={handleJoinGroup}
                        currentUser={userCharacter}
                        activeChatCharacterId={activeChatCharacter?.id}
                    />
                </div>
                
                <main className="lg:ml-64 w-full pb-20 lg:pb-4">
                    <Feed
                        posts={posts}
                        onReact={handleUserReaction}
                        onComment={handleUserComment}
                        onPost={handleUserPost}
                        currentUser={userCharacter}
                        onTranslate={handleTranslate}
                        translations={translations}
                        allCharacters={characters}
                    />
                </main>
            </div>

            <LogPanel logs={logs} />
            <div className="lg:hidden"><BottomNav onNavClick={handleMobileNav} /></div>

            {currentlyActiveChatCharacter && (
                <ChatWindow 
                    character={currentlyActiveChatCharacter}
                    onClose={() => setActiveChatCharacter(null)}
                    incrementApiCount={incrementApiCount}
                    onProvoke={handleUserProvocation}
                    onTranslate={handleTranslate}
                    translations={translations}
                    useFreeModel={useFreeModel}
                />
            )}

            <Modal isOpen={isMobileCharsOpen} onClose={() => setIsMobileCharsOpen(false)} title="Characters">
                <div className="max-h-[70vh] overflow-y-auto -m-4">
                     <LeftSidebar 
                        characters={characters.filter(c => c.id !== 'user_annas')}
                        groups={groups}
                        onCharacterSelect={handleSelectChar}
                        onJoinGroup={handleJoinGroup}
                        currentUser={userCharacter}
                        activeChatCharacterId={activeChatCharacter?.id}
                    />
                </div>
            </Modal>
            <Modal isOpen={isMobileLogsOpen} onClose={() => setIsMobileLogsOpen(false)} title="AI Action Log">
                <div className="max-h-[60vh] overflow-y-auto bg-gray-900 rounded-lg p-3">
                    <ul className="space-y-2 text-sm">
                    {logs.map((log, index) => (
                        <li key={index} className="text-gray-400">
                        <span className="text-cyan-400 mr-1.5">{`[${new Date().toLocaleTimeString()}]`}</span>
                        {log}
                        </li>
                    ))}
                    </ul>
                </div>
            </Modal>
             <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                useFreeModel={useFreeModel}
                onToggleFreeModel={handleToggleFreeModel}
                apiCallCount={apiCallCount}
            />
        </div>
    );
};

export default App;
