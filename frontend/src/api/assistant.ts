import { api } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const assistantApi = {
  chat: (messages: ChatMessage[]) =>
    api
      .post<{ reply: string }>('/assistant/chat', { messages })
      .then((r) => r.data),
};
