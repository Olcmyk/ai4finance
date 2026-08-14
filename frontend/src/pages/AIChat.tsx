import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ChatWebSocketClient } from '../api/chat';
import type { ChatMessage, ConnectionStatus } from '../api/chat';
import { v4 as uuidv4 } from 'uuid';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string>('');
  const [sessionId] = useState(() => {
    // Try to restore session from sessionStorage, or create new
    const stored = sessionStorage.getItem('chat_session_id');
    return stored || uuidv4();
  });

  const chatClientRef = useRef<ChatWebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentAIMessageRef = useRef<string>(''); // Use ref to avoid stale closure
  const navigate = useNavigate();

  // Example questions
  const exampleQuestions = [
    '我这个月的支出情况如何？',
    '帮我分析一下我的消费习惯',
    '给我一些理财建议',
    '我在哪些类别花费最多？',
  ];

  // Initialize WebSocket connection
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Save session ID
    sessionStorage.setItem('chat_session_id', sessionId);

    const client = new ChatWebSocketClient(sessionId);
    chatClientRef.current = client;

    // Set up message handler
    client.onMessage((message) => {
      if (message.type === 'chunk' && message.content) {
        currentAIMessageRef.current += message.content;
        setIsTyping(true);
        // Force re-render to show streaming text
        setMessages((prev) => [...prev]);
      } else if (message.type === 'complete') {
        // Finalize AI message using ref value
        const finalMessage = currentAIMessageRef.current;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: finalMessage,
            timestamp: new Date(),
          },
        ]);
        currentAIMessageRef.current = '';
        setIsTyping(false);
      } else if (message.type === 'error') {
        // Show error message
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `错误: ${message.content || '未知错误'}`,
            timestamp: new Date(),
          },
        ]);
        currentAIMessageRef.current = '';
        setIsTyping(false);
      }
    });

    // Set up status change handler
    client.onStatusChange((status) => {
      setConnectionStatus(status);

      // Check for authentication errors
      if (status === 'error') {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
        }
      }
    });

    // Connect
    client.connect();

    // Cleanup on unmount
    return () => {
      // Cancel callbacks before disconnect to avoid state updates after unmount
      client.onMessage(() => {});
      client.onStatusChange(() => {});
      client.disconnect();
    };
  }, [sessionId, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatClientRef.current || connectionStatus !== 'connected') {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const messageToSend = input.trim();
    setInput('');

    // Add user message to display
    setMessages((prev) => [...prev, userMessage]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Send message via WebSocket
    try {
      chatClientRef.current.sendMessage(messageToSend);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，发送消息失败。请稍后再试。',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  const handleNewSession = () => {
    const newSessionId = uuidv4();
    sessionStorage.setItem('chat_session_id', newSessionId);
    window.location.reload();
  };

  const handleReconnect = () => {
    chatClientRef.current?.connect();
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Connection status indicator
  const StatusIndicator = () => {
    const statusConfig = {
      connected: { color: 'bg-green-500', text: '已连接' },
      connecting: { color: 'bg-yellow-500', text: '连接中...' },
      disconnected: { color: 'bg-gray-500', text: '已断开' },
      error: { color: 'bg-red-500', text: '连接错误' },
    };

    const config = statusConfig[connectionStatus];

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
        <span className="text-xs text-gray-500">{config.text}</span>
        {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
          <button
            onClick={handleReconnect}
            className="text-xs text-luxury-gold hover:text-luxury-darkGold underline"
          >
            重新连接
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-luxury border-2 border-luxury-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-luxury-cream via-luxury-lightGold/20 to-luxury-cream border-b-2 border-luxury-border px-8 py-6 flex justify-between items-center shadow-luxury">
        <div>
          <h1 className="text-3xl font-display font-bold text-luxury-gold flex items-center tracking-wide">
            <span className="text-4xl mr-4">💬</span>
            AI 财务顾问
          </h1>
          <p className="text-sm text-luxury-brown mt-2 tracking-wide">智能分析您的财务状况，提供个性化建议</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator />
          <button
            onClick={handleNewSession}
            className="px-6 py-3 text-sm font-medium text-luxury-darkBrown bg-white hover:bg-luxury-cream rounded-xl border-2 border-luxury-border hover:border-luxury-gold transition-all shadow-luxury tracking-wide uppercase"
          >
            新对话
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-luxury-cream">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gradient-to-br from-luxury-lightGold/30 to-luxury-beige/30 p-8 rounded-3xl mb-6 shadow-luxury">
              <span className="text-7xl">💬</span>
            </div>
            <h3 className="text-2xl font-display font-bold text-luxury-gold mb-3 tracking-wide">开始与 AI 顾问对话</h3>
            <p className="text-luxury-brown mb-8 max-w-md tracking-wide">提出您的财务问题，我会为您分析解答</p>

            <div className="w-full max-w-3xl">
              <p className="text-sm font-semibold text-luxury-darkBrown mb-4 tracking-wide uppercase">试试这些问题：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className="p-5 text-left bg-white hover:bg-gradient-to-br hover:from-luxury-cream hover:to-luxury-lightGold/20 border-2 border-luxury-border hover:border-luxury-gold rounded-2xl transition-all transform hover:scale-105 shadow-luxury"
                  >
                    <span className="text-luxury-darkBrown font-medium tracking-wide">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-6 py-4 rounded-2xl shadow-luxury ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-luxury-gold to-luxury-darkGold text-white'
                  : 'bg-white text-luxury-darkBrown border-2 border-luxury-border'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none text-luxury-darkBrown">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap tracking-wide">{message.content}</p>
              )}
              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-luxury-cream' : 'text-luxury-brown'
                }`}
              >
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] px-6 py-4 rounded-2xl shadow-luxury bg-white text-luxury-darkBrown border-2 border-luxury-border">
              <div className="prose prose-sm max-w-none text-luxury-darkBrown">
                <ReactMarkdown>{currentAIMessageRef.current}</ReactMarkdown>
              </div>
              <div className="flex items-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-2 border-luxury-border bg-white px-8 py-6">
        <div className="flex space-x-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题... (Shift+Enter 换行)"
            className="flex-1 px-6 py-4 border-2 border-luxury-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent text-luxury-darkBrown placeholder-luxury-brown/50 bg-luxury-cream tracking-wide"
            rows={1}
            disabled={connectionStatus !== 'connected'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || connectionStatus !== 'connected' || isTyping}
            className="px-8 py-4 bg-gradient-to-r from-luxury-gold to-luxury-darkGold hover:from-luxury-darkGold hover:to-luxury-gold text-white font-medium rounded-2xl shadow-luxury disabled:opacity-50 disabled:cursor-not-allowed transition-all tracking-wide uppercase"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
