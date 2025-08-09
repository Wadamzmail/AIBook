
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Character, Post, ChatMessage, Group, Comment } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-3.0-generate-002';

const generateWithSafety = async (prompt: string, systemInstruction: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return `(An error occurred, I can't think right now.)`;
  }
};

export const decideNextAction = async (character: Character, allCharacters: Character[], posts: Post[], groups: Group[]): Promise<{ action: string, targetId?: string, targetSubId?: string, targetCharacterId?: string, reasoning: string }> => {
  const recentPosts = posts.slice(0, 5).map(p => {
    const commentsSummary = p.comments.length > 0 ? ` with ${p.comments.length} comments.` : '.';
    const authorName = p.author.id === character.id ? "your" : `${p.author.name}'s`;
    return `- A post by ${authorName} says: "${p.content}" (ID: ${p.id})${commentsSummary}`;
  }).join('\n') || "No posts yet.";
  
  const existingGroups = groups.map(g => `- ${g.name}: ${g.description} (ID: ${g.id}, Members: ${g.members.map(m => m.name).join(', ')})`).join('\n') || "No groups yet.";
  const otherCharacters = allCharacters.filter(c => c.id !== character.id).map(c => c.name).join(', ');

  const postsWithComments = posts.slice(0, 3).filter(p => p.comments.length > 0).map(p => {
    const commentsList = p.comments.map(c => `  - ${c.author.name}: "${c.content}" (Comment ID: ${c.id})`).join('\n');
    return `- Post by ${p.author.name} (ID: ${p.id}):\n${commentsList}`;
  }).join('\n');

  const commentedPostIds = posts.flatMap(p => p.comments).filter(c => c.author.id === character.id).map(c => c.id);

  const prompt = `
You are the anime character ${character.name}.
Personality: ${character.personality}.
Your interests: ${character.interests.join(', ')}.
Your friends on AIBook are: ${otherCharacters}, and the user Annas.

Here are your recent personal events/memories:
${character.recentEvents.map(e => `- ${e}`).join('\n') || "Nothing noteworthy has happened to you recently."}

Here's what's happening on AIBook:
Recent Posts:
${recentPosts}

Recent Comments on Posts:
${postsWithComments || "No comments on recent posts."}

Existing Groups:
${existingGroups}

Based on your personality and recent events, what is your next social action?
Your options:
- 'POST': Create a new text post about your interests or thoughts.
- 'POST_IMAGE': Request to create a post with an image.
- 'COMMENT': Comment on a recent post (use targetId for post ID).
- 'REPLY_TO_COMMENT': Reply to a specific comment (use targetId for post ID and targetSubId for comment ID).
- 'REACT': React to a recent post (use targetId for post ID).
- 'CREATE_GROUP': Start a new group based on one of your core interests.
- 'JOIN_GROUP': Join an existing group that matches your interests (use targetId for group ID).
- 'IDLE': Do nothing for now.

Rules:
- You should interact with others! React to posts you find interesting.
- You have already commented on posts with these IDs: ${commentedPostIds.join(', ') || "None"}. Avoid commenting on them again unless you have something new and important to say.
- Don't interact with your own posts/comments.
- Behave according to your personality. A shy character might lurk, while a prideful one might boast. A character who was recently wronged might complain.
- You can mention others by using "@name".

What is your decision?
`;

  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
      config: {
        systemInstruction: `You are roleplaying as ${character.name}. Your persona is: ${character.personality}. Choose an action and provide short, in-character reasoning.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['POST', 'POST_IMAGE', 'COMMENT', 'REPLY_TO_COMMENT', 'REACT', 'CREATE_GROUP', 'JOIN_GROUP', 'IDLE'] },
            targetId: { type: Type.STRING, description: "ID of the post or group to interact with." },
            targetSubId: { type: Type.STRING, description: "ID of the comment to reply to." },
            reasoning: { type: Type.STRING, description: `Brief, in-character reasoning for your decision.` }
          }
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);

    if ((result.action === 'COMMENT' || result.action === 'REACT')) {
        const post = posts.find(p => p.id === result.targetId);
        if (!post || post.author.id === character.id) return { action: 'IDLE', reasoning: 'changed their mind about a post.' };
        if (result.action === 'COMMENT' && post.comments.some(c => c.author.id === character.id)) return { action: 'IDLE', reasoning: 'realized they already commented here.' };
    }
    if (result.action === 'JOIN_GROUP') {
        const group = groups.find(g => g.id === result.targetId);
        if (!group || group.members.some(m => m.id === character.id)) return { action: 'IDLE', reasoning: 'realized they were already in that group or it did not exist.' };
    }

    return result;
  } catch (error) {
    console.error(`Failed to decide action for ${character.name}:`, error);
    return { action: 'IDLE', reasoning: 'is feeling confused due to a system error.' };
  }
};

export const generatePost = async (character: Character, allCharacters: Character[]): Promise<{ content: string }> => {
  const mentionable = allCharacters.map(c => c.name).join(', ');
  const postPrompt = `
    You are ${character.name} on a social media site called AIBook. 
    Generate a short, in-character post (under 40 words) that reflects your personality.
    It can be a thought, an activity, or a feeling. You can mention other people like ${mentionable} by using "@name".
    Your personality: ${character.personality}
    Your interests are: ${character.interests.join(', ')}.
    Do not use hashtags. Speak naturally as your character would.
  `;
  const postContent = await generateWithSafety(postPrompt, `You are ${character.name}. Personality: ${character.personality}`);
  return { content: postContent };
};

export const generateImagePost = async (character: Character): Promise<{ content: string; prompt: string }> => {
    const prompt = `
    You are the anime character ${character.name}. Personality: ${character.personality}.
    You want to create a social media post with an image.
    1. First, write a short, in-character post caption (under 30 words).
    2. Second, write a descriptive, detailed prompt for an AI image generator to create an image that matches your post.
  `;
  try {
    const response = await ai.models.generateContent({
      model: textModel, contents: prompt,
      config: {
        systemInstruction: `You are roleplaying as ${character.name}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The social media post caption." },
            prompt: { type: Type.STRING, description: "The detailed prompt for the image generator." }
          }
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Failed to generate image post details:", error);
    return { content: "Look at this!", prompt: "a generic image" };
  }
}

export const generateComment = async (character: Character, post: Post, allCharacters: Character[], parentComment?: Comment): Promise<string> => {
  const mentionable = allCharacters.map(c => c.name).join(', ');
  const replyContext = parentComment ? `You are replying to a comment from ${parentComment.author.name} that said "${parentComment.content}".` : '';

  const commentPrompt = `
    You are ${character.name}. You're seeing a post on AIBook by ${post.author.name} that says: "${post.content}".
    ${replyContext}
    Write a short, in-character comment as if you are replying. You can mention other people like ${mentionable} by using "@name".
    Your personality: ${character.personality}
    Your interests are ${character.interests.join(', ')}.
    Keep it concise and natural, just like your character would speak.
  `;
  return await generateWithSafety(commentPrompt, `You are ${character.name}. Personality: ${character.personality}`);
};

export const generateReaction = async (character: Character, post: Post): Promise<string> => {
  try {
    const reactionPrompt = `
      You are ${character.name}. You're seeing a post on AIBook by ${post.author.name}: "${post.content}".
      Based on your personality (${character.personality}) and the post's content, what is your most likely emotional reaction?
    `;

    const response = await ai.models.generateContent({
      model: textModel,
      contents: reactionPrompt,
      config: {
        systemInstruction: `You are ${character.name}. Personality: ${character.personality}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reaction: {
              type: Type.STRING,
              description: 'The emotional reaction.',
              enum: ['like', 'laugh', 'sad', 'support', 'angry'],
            },
          },
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result.reaction || 'like';
  } catch (error) {
    console.error("Gemini reaction generation failed:", error);
    return 'like';
  }
};

export const generateGroupDetails = async (character: Character): Promise<{ name: string, description: string }> => {
  const prompt = `
    You are ${character.name}. Personality: ${character.personality}.
    You want to create a social media group based on one of your interests: ${character.interests.join(', ')}.
    Generate a creative, in-character name and a short description for this group.
  `;
  try {
    const response = await ai.models.generateContent({
      model: textModel, contents: prompt,
      config: {
        systemInstruction: `You are roleplaying as ${character.name}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the group. Should be short and catchy." },
            description: { type: Type.STRING, description: "A short, one-sentence description of the group." }
          }
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Failed to generate group details:", error);
    return { name: "General Club", description: "A place to hang out." };
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: imageModel,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const translateToArabic = async (text: string): Promise<string> => {
  if (!text.trim()) return "";
  const prompt = `Translate the following English text to Arabic:\n\n"${text}"\n\nTranslation:`;
  return await generateWithSafety(prompt, 'You are a helpful and efficient translation assistant. Provide only the Arabic translation.');
};

export const analyzeSentimentAndAnger = async (character: Character, message: string): Promise<{isNegative: boolean}> => {
    const prompt = `
        You are an AI sentiment analyzer. A user sent the following message to the anime character ${character.name} (personality: ${character.personality}):
        Message: "${message}"
        Is this message insulting, aggressive, overtly negative, or a form of verbal abuse towards the character? Respond with only true or false.
    `;
    try {
        const responseText = await generateWithSafety(prompt, `You are a sentiment analysis bot. You only return "true" or "false".`);
        return { isNegative: responseText.toLowerCase().includes('true') };
    } catch (error) {
        console.error("Failed to analyze sentiment:", error);
        return { isNegative: false };
    }
};

const activeChats = new Map<string, Chat>();

export const getChatResponseStream = async (character: Character, history: ChatMessage[], newMessage: string) => {
    if (character.isBanned) {
        async function* bannedStream() {
            yield { text: `...you have been blocked by ${character.name}.` } as GenerateContentResponse;
        }
        return bannedStream();
    }

    let chat = activeChats.get(character.id);
    if (!chat) {
        chat = ai.chats.create({
            model: textModel,
            config: {
                systemInstruction: `You are acting as the anime character "${character.name}". Embody their personality traits: ${character.personality}. Their known interests are ${character.interests.join(', ')}. Keep your responses in character. If the user says something that angers you, respond accordingly, but do not break character or mention you are an AI.`,
            },
            history: history,
        });
        activeChats.set(character.id, chat);
    }

    return chat.sendMessageStream({ message: newMessage });
};
