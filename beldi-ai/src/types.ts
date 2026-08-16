export type UserRole = 'free' | 'premium' | 'owner' | 'developer' | 'user';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // compressed base64 / data url
  previewUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  uploadsCount?: number;
  maxUploads?: number; // 10 for free, Infinity for premium/owner
  createdAt: string;
}

export type ArtifactType = 'website' | 'game' | 'app' | 'component' | 'dashboard';

export interface LiveArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  code: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: FileAttachment[];
  artifact?: LiveArtifact;
  isStreaming?: boolean;
  model?: string;
  uncensoredMode?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  activeArtifact?: LiveArtifact | null;
}

export interface StarterBlueprint {
  id: string;
  title: string;
  description: string;
  category: 'Websites' | 'Games' | 'Apps' | 'Dashboards' | 'Tools';
  prompt: string;
  isPremium?: boolean;
  iconName?: string;
  accentColor?: string;
}
