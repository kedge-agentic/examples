import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolEvents?: ToolEvent[];
  createdAt: string;
}

export interface ToolEvent {
  toolName: string;
  input: unknown;
  result: unknown;
}

@Injectable()
export class SessionsService {
  constructor(private configService: ConfigService) {}

  async getMessages(
    sessionId: string,
    includeToolEvents = false,
  ): Promise<Message[]> {
    const ccaasUrl = this.configService.getCcaasUrl();
    const url = new URL(
      '/api/v1/sessions/' + sessionId + '/messages',
      ccaasUrl,
    );

    if (includeToolEvents) {
      url.searchParams.set('includeToolEvents', 'true');
    }

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error('Failed to fetch messages:', response.status);
        return [];
      }

      const data = await response.json();
      return data.messages || data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }
}
