
export interface Character {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  interests: string[];
  angerLevel: number;
  isBanned: boolean;
  recentEvents: string[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: Character[];
  createdBy: Character;
}

export enum ReactionType {
  Like = 'like',
  Laugh = 'laugh',
  Sad = 'sad',
  Support = 'support',
  Angry = 'angry',
}

export interface Reaction {
  id: string;
  type: ReactionType;
  author: Character;
}

export interface Comment {
  id:string;
  author: Character;
  content: string;
  replies: Comment[];
}

export interface Post {
  id: string;
  author: Character;
  content: string;
  imageUrl?: string;
  reactions: Reaction[];
  comments: Comment[];
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface Notification {
    id: string;
    type: 'image_request';
    character: Character;
    imagePrompt: string;
    postContent: string;
    status: 'pending' | 'approved' | 'rejected';
}
