/**
 * WebSocket chat API client for AI advisor
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'chunk' | 'complete' | 'error';
  content?: string;
  session_id?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private sessionId: string;
  private onMessageCallback?: (message: WebSocketMessage) => void;
  private onStatusChangeCallback?: (status: ConnectionStatus) => void;
  private intentionallyClosed = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Connect to WebSocket with JWT authentication
   */
  connect(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.setStatus('error');
      return;
    }

    this.intentionallyClosed = false;
    this.setStatus('connecting');

    // Use ws:// for localhost, wss:// for production
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/api/chat/ws?token=${encodeURIComponent(token)}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.setStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      } catch (error) {
        // Silent error - malformed message
      }
    };

    this.ws.onerror = () => {
      this.setStatus('error');
    };

    this.ws.onclose = () => {
      this.setStatus('disconnected');

      // Auto-reconnect if not intentionally closed and within retry limit
      if (!this.intentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        setTimeout(() => {
          this.connect();
        }, delay);
      }
    };
  }

  /**
   * Send a message to the AI advisor
   */
  sendMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const payload = {
      session_id: this.sessionId,
      message: message,
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    this.intentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Register callback for incoming messages
   */
  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Register callback for connection status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }
}
