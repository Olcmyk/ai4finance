/**
 * HTTP Streaming chat API client for AI advisor (Vercel-compatible)
 * Uses Server-Sent Events instead of WebSocket
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StreamMessage {
  type: 'session' | 'chunk' | 'complete' | 'error';
  content?: string;
  session_id?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class ChatHTTPClient {
  private controller: AbortController | null = null;
  private sessionId: string;
  private onMessageCallback?: (message: StreamMessage) => void;
  private onStatusChangeCallback?: (status: ConnectionStatus) => void;
  private apiUrl: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  /**
   * Send a message and stream the response
   */
  async sendMessage(message: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.setStatus('error');
      throw new Error('未登录');
    }

    // Cancel any ongoing request
    if (this.controller) {
      this.controller.abort();
    }

    this.controller = new AbortController();
    this.setStatus('connecting');

    try {
      const response = await fetch(`${this.apiUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message,
          session_id: this.sessionId,
        }),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.setStatus('connected');

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            try {
              const message: StreamMessage = JSON.parse(data);

              // Update session ID if received
              if (message.type === 'session' && message.session_id) {
                this.sessionId = message.session_id;
              }

              // Call message callback
              if (this.onMessageCallback) {
                this.onMessageCallback(message);
              }

              // Handle completion or error
              if (message.type === 'complete' || message.type === 'error') {
                this.setStatus('disconnected');
              }
            } catch (e) {
              console.error('Failed to parse SSE message:', e);
            }
          }
        }
      }

      this.setStatus('disconnected');

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        this.setStatus('disconnected');
      } else {
        console.error('Chat stream error:', error);
        this.setStatus('error');

        // Send error to callback
        if (this.onMessageCallback) {
          this.onMessageCallback({
            type: 'error',
            content: error.message || '连接失败',
          });
        }
      }
    } finally {
      this.controller = null;
    }
  }

  /**
   * Cancel ongoing request
   */
  cancel(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Register callback for incoming messages
   */
  onMessage(callback: (message: StreamMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Register callback for connection status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }
}
