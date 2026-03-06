export interface Message {
  id: string;
  sender: number; // 0 = user, 1 = ai, 2 = agent, etc.
  message: string; // renamed from 'content'
  created_at: string; // timestamp as string (milliseconds since epoch)
  attachment_keys?: string[];
}

// Helper function to convert created_at string to Date
export function parseMessageTimestamp(created_at: string): Date {
  const timestamp = parseInt(created_at, 10);
  return new Date(timestamp);
}

// Helper function to get message type from sender
export function getMessageType(sender: number): 'user' | 'ai' | 'agent' {
  if (sender === 0) return 'user';
  if (sender === 1) return 'ai';
  if (sender === 2) return 'agent';
  return 'ai'; // default to ai for unknown senders
}
