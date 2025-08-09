
import { Character, Post, ChatMessage, Group, Comment } from '../types';
import type { GenerateContentResponse } from "@google/genai";

const randomDelay = () => new Promise(res => setTimeout(res, Math.random() * 400 + 100));

export const decideNextAction = async (character: Character, allCharacters: Character[], posts: Post[], groups: Group[]): Promise<{ action: string, targetId?: string, targetSubId?: string, targetCharacterId?: string, reasoning: string }> => {
    await randomDelay();
    const actions = ['POST', 'COMMENT', 'REACT', 'IDLE', 'IDLE', 'IDLE'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    let targetId;
    
    if ((action === 'COMMENT' || action === 'REACT') && posts.length > 0) {
        const potentialPosts = posts.filter(p => p.author.id !== character.id);
        if (potentialPosts.length > 0) {
            targetId = potentialPosts[Math.floor(Math.random() * potentialPosts.length)].id;
        } else {
             return { action: 'IDLE', reasoning: `(mock) wanted to interact but there were no posts by others.` };
        }
    }
     if (action === 'JOIN_GROUP' && groups.length > 0) {
        const potentialGroups = groups.filter(g => !g.members.some(m => m.id === character.id));
         if (potentialGroups.length > 0) {
            targetId = potentialGroups[Math.floor(Math.random() * potentialGroups.length)].id;
        }
    }

    return {
        action: targetId ? action : (action === 'COMMENT' || action === 'REACT' || action === 'JOIN_GROUP') ? 'IDLE' : action,
        targetId,
        reasoning: `(mock) decided to ${action.toLowerCase()} because it felt like it.`
    };
};

export const generatePost = async (character: Character, allCharacters: Character[]): Promise<{ content: string }> => {
    await randomDelay();
    return { content: `(Mock Post) I, ${character.name}, am thinking about ${character.interests[0] || 'stuff'}.` };
};

export const generateImagePost = async (character: Character): Promise<{ content: string; prompt: string }> => {
    await randomDelay();
    return {
        content: `(Mock Image Post) Check out this cool picture of ${character.interests[0] || 'something'}.`,
        prompt: `a cool picture of ${character.interests[0] || 'something'}`
    };
};

export const generateComment = async (character: Character, post: Post, allCharacters: Character[], parentComment?: Comment): Promise<string> => {
    await randomDelay();
    if(parentComment) {
        return `(Mock Reply) You're right, ${parentComment.author.name}!`;
    }
    return `(Mock Comment) That's a very interesting post, ${post.author.name}.`;
};

export const generateReaction = async (character: Character, post: Post): Promise<string> => {
    await randomDelay();
    const reactions = ['like', 'laugh', 'support'];
    return reactions[Math.floor(Math.random() * reactions.length)];
};

export const generateGroupDetails = async (character: Character): Promise<{ name: string, description: string }> => {
    await randomDelay();
    return {
        name: `(Mock) ${character.interests[0] || 'General'} Club`,
        description: `A mock group for people who like ${character.interests[0] || 'stuff'}.`
    };
};

export const generateImage = async (prompt: string): Promise<string> => {
    await randomDelay();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" style="background-color:#374151;">
      <rect width="100%" height="100%" fill="#4b5563"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="white" dominant-baseline="middle" text-anchor="middle">[Mock Image for: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}]</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const translateToArabic = async (text: string): Promise<string> => {
    if (!text.trim()) return "";
    await randomDelay();
    return `(ترجمة وهمية) ${text}`;
};

export const analyzeSentimentAndAnger = async (character: Character, message: string): Promise<{isNegative: boolean}> => {
    await randomDelay();
    const negativeWords = ['stupid', 'hate', 'bad', 'dumb', 'idiot'];
    const isNegative = negativeWords.some(word => message.toLowerCase().includes(word));
    return { isNegative };
};

export const getChatResponseStream = async function* (character: Character, history: ChatMessage[], newMessage: string): AsyncGenerator<GenerateContentResponse> {
    await randomDelay();
    const response = `(Mock) Hello, I am ${character.name}. You said: "${newMessage}". I find that interesting.`;
    for (const word of response.split(' ')) {
        const chunk = { text: word + ' ' } as GenerateContentResponse;
        yield chunk;
        await new Promise(res => setTimeout(res, 40));
    }
};
