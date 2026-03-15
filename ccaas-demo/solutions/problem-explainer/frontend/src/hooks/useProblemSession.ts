import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Message, OutputUpdate, SyncField } from '../types';

interface UseProblemSessionOptions {
  tenantId?: string;
  ccaasUrl?: string;
  enabledSkills?: string[];
}

interface UseProblemSessionReturn {
  messages: Message[];
  isConnected: boolean;
  isThinking: boolean;
  error: string | null;
  sendMessage: (content: string, attachments?: { type: string; path: string }[]) => Promise<void>;
  sessionId: string;
  pendingUpdates: Map<SyncField, OutputUpdate>;
}

export function useProblemSession(options: UseProblemSessionOptions = {}): UseProblemSessionReturn {
  const { tenantId = 'problem-explainer', ccaasUrl = '', enabledSkills = ['problem-explainer'] } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Map<SyncField, OutputUpdate>>(new Map());

  const socketRef = useRef<Socket | null>(null);
  const clientIdRef = useRef<string>(uuidv4());
  const sessionIdRef = useRef<string>(uuidv4());
  const streamingContentRef = useRef<string>('');

  // Connect to CCAAS WebSocket
  useEffect(() => {
    const socketUrl = ccaasUrl || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);

      // Join session
      socket.emit('session:join', {
        sessionId: sessionIdRef.current,
        tenantId,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('client_id', (data: { clientId: string }) => {
      clientIdRef.current = data.clientId;
      console.log('Received client ID:', data.clientId);
    });

    socket.on('error', (err: Error) => {
      console.error('Socket error:', err);
      setError(err.message);
    });

    // Handle streaming text
    socket.on('text_delta', (data: { delta: string }) => {
      streamingContentRef.current += data.delta;
      // Update the last message with streaming content
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: streamingContentRef.current },
          ];
        } else {
          // Create new assistant message
          return [
            ...prev,
            {
              id: uuidv4(),
              role: 'assistant',
              content: streamingContentRef.current,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      });
    });

    // Handle output updates
    socket.on('output_update', (data: OutputUpdate) => {
      console.log('Received output_update:', data);
      setPendingUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.field, { ...data, synced: false });
        return newMap;
      });

      // Also add to the last message's outputUpdates
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          const updates = lastMsg.outputUpdates || [];
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              outputUpdates: [...updates, { ...data, synced: false }],
            },
          ];
        }
        return prev;
      });
    });

    // Handle agent status
    socket.on('agent_status', (data: { status: string }) => {
      if (data.status === 'thinking') {
        setIsThinking(true);
      } else if (data.status === 'complete') {
        setIsThinking(false);
        streamingContentRef.current = '';
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ccaasUrl, tenantId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, attachments?: { type: string; path: string }[]) => {
      if (!sessionIdRef.current || !clientIdRef.current) {
        setError('Not connected');
        return;
      }

      // Add user message
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Reset streaming content
      streamingContentRef.current = '';
      setIsThinking(true);

      try {
        const ccaasApiUrl = ccaasUrl || '';
        const response = await fetch(ccaasApiUrl + '/api/v1/sessions/' + sessionIdRef.current + '/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
          },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            message: content,
            attachments,
            mcpServers: {
              'problem-explainer-tools': {
                command: 'node',
                args: ['mcp-server/dist/index.js'],
                cwd: process.env.NODE_ENV === 'development' ? '../' : undefined,
              },
            },
            skillPath: 'skills/problem-explainer/SKILL.md',
            enabledSkills,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to send message');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsThinking(false);
      }
    },
    [tenantId, ccaasUrl, enabledSkills]
  );

  return {
    messages,
    isConnected,
    isThinking,
    error,
    sendMessage,
    sessionId: sessionIdRef.current,
    pendingUpdates,
  };
}
