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
    if (!input.trim() || !chatClientRef.current?.isConnected()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const messageToSend = input.trim();
    setInput('');
    setError('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);

    // Try to send message with error handling
    try {
      chatClientRef.current.sendMessage(messageToSend);
      setIsTyping(true);
    } catch (err) {
      // Remove the unsent message
      setMessages((prev) => prev.slice(0, -1));
      setError('发送失败，请重试');
      // Restore input
      setInput(messageToSend);
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
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            重新连接
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-soft-lg border-2 border-beige-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-beige-50 to-beige-100 border-b-2 border-beige-200 px-6 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-beige-900 flex items-center">
            <span className="text-4xl mr-3">🤖</span>
            AI 财务顾问
          </h1>
          <p className="text-sm text-beige-600 mt-1">智能分析您的财务状况，提供个性化建议</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator />
          <button
            onClick={handleNewSession}
            className="px-4 py-2 text-sm font-medium text-beige-700 bg-white hover:bg-beige-50 rounded-xl border-2 border-beige-300 transition-all shadow-soft"
          >
            新对话
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-beige-50">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gradient-to-br from-beige-100 to-beige-200 p-6 rounded-3xl mb-6">
              <span className="text-7xl">💬</span>
            </div>
            <h3 className="text-2xl font-bold text-beige-900 mb-3">开始与 AI 顾问对话</h3>
            <p className="text-beige-600 mb-8 max-w-md">提出您的财务问题，我会为您分析解答</p>

            <div className="w-full max-w-2xl">
              <p className="text-sm font-semibold text-beige-700 mb-4">试试这些问题：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className="p-5 text-left bg-white hover:bg-gradient-to-br hover:from-beige-50 hover:to-beige-100 border-2 border-beige-200 hover:border-beige-400 rounded-2xl transition-all transform hover:scale-105 shadow-soft"
                  >
                    <span className="text-beige-800 font-medium">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-800 px-5 py-4 rounded-2xl flex justify-between items-center shadow-soft">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 font-bold text-xl"
            >
              ×
            </button>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-5 py-4 rounded-2xl shadow-soft ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-beige-500 to-beige-600 text-white'
                  : 'bg-white text-beige-900 border-2 border-beige-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {message.role === 'assistant' && (
                  <span className="text-3xl flex-shrink-0">🤖</span>
                )}
                <div className="flex-1">
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-beige-100' : 'text-beige-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <span className="text-3xl flex-shrink-0">👤</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator with streaming message */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-3xl px-5 py-4 rounded-2xl shadow-soft bg-white border-2 border-beige-200">
              <div className="flex items-start space-x-3">
                <span className="text-3xl flex-shrink-0">🤖</span>
                <div className="flex-1">
                  {currentAIMessageRef.current ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{currentAIMessageRef.current}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-beige-200 px-6 py-5">
        <div className="flex items-end space-x-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"
            className="flex-1 px-4 py-3 border-2 border-beige-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beige-400 focus:border-beige-400 resize-none bg-beige-50 text-beige-900 placeholder-beige-400"
            rows={1}
            style={{ minHeight: '52px', maxHeight: '200px' }}
            disabled={connectionStatus !== 'connected'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || connectionStatus !== 'connected' || isTyping}
            className="px-6 py-3 bg-gradient-to-r from-beige-500 to-beige-600 hover:from-beige-600 hover:to-beige-700 text-white font-medium rounded-2xl shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-beige-500 mt-3">
          💡 AI 回复基于您的交易数据分析，仅供参考
        </p>
      </div>
    </div>
  );
};

export default AIChat;
