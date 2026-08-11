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
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 border-b-2 border-purple-300 px-8 py-6 flex justify-between items-center shadow-xl">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center drop-shadow-lg">
            <span className="text-5xl mr-4">🤖</span>
            AI 财务顾问
          </h1>
          <p className="text-base text-purple-100 mt-2 font-semibold">智能分析您的财务状况，提供个性化建议</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator />
          <button
            onClick={handleNewSession}
            className="px-6 py-3 text-base font-bold text-purple-700 bg-white hover:bg-purple-50 rounded-2xl border-2 border-white hover:border-purple-200 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            🔄 新对话
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 bg-gradient-to-br from-gray-50 to-purple-50">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-10 rounded-3xl mb-8 shadow-glow-purple">
              <span className="text-8xl">💬</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">开始与 AI 顾问对话</h3>
            <p className="text-gray-600 mb-10 max-w-md text-lg">提出您的财务问题，我会为您分析解答</p>

            <div className="w-full max-w-3xl">
              <p className="text-base font-bold text-gray-900 mb-6">试试这些问题：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className="group p-6 text-left bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 border-2 border-gray-200 hover:border-purple-400 rounded-3xl transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl"
                  >
                    <span className="text-gray-800 font-bold text-base group-hover:text-purple-700">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-6 py-5 rounded-3xl flex justify-between items-center shadow-xl">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚠️</span>
              <span className="font-semibold">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 font-bold text-2xl hover:scale-110 transition-transform"
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
              className={`max-w-3xl px-6 py-5 rounded-3xl shadow-xl ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                  : 'bg-white text-gray-900 border-2 border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                {message.role === 'assistant' && (
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-2 flex-shrink-0 shadow-lg">
                    <span className="text-3xl">🤖</span>
                  </div>
                )}
                <div className="flex-1">
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words font-semibold text-base">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-3 font-medium ${
                      message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-2 flex-shrink-0">
                    <span className="text-3xl">👤</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator with streaming message */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-3xl px-6 py-5 rounded-3xl shadow-xl bg-white border-2 border-purple-200">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-2 flex-shrink-0 shadow-lg animate-pulse">
                  <span className="text-3xl">🤖</span>
                </div>
                <div className="flex-1">
                  {currentAIMessageRef.current ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{currentAIMessageRef.current}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" />
                      <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div className="bg-white border-t-2 border-gray-200 px-8 py-6 shadow-xl">
        <div className="flex items-end space-x-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"
            className="flex-1 px-6 py-4 border-2 border-purple-300 rounded-3xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 resize-none bg-gradient-to-r from-purple-50 to-pink-50 text-gray-900 placeholder-gray-500 text-base font-medium shadow-lg"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '200px' }}
            disabled={connectionStatus !== 'connected'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || connectionStatus !== 'connected' || isTyping}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-3xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 text-base"
          >
            🚀 发送
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4 font-medium flex items-center space-x-2">
          <span>💡</span>
          <span>AI 回复基于您的交易数据分析，仅供参考</span>
        </p>
      </div>
    </div>
  );
};

export default AIChat;
