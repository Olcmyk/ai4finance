import React, { useState, useEffect, useRef } from 'react';
import { ChatWebSocketClient } from '../api/chat';
import type { ChatMessage, ConnectionStatus } from '../api/chat';
import { v4 as uuidv4 } from 'uuid';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [currentAIMessage, setCurrentAIMessage] = useState('');
  const [sessionId] = useState(() => {
    // Try to restore session from sessionStorage, or create new
    const stored = sessionStorage.getItem('chat_session_id');
    return stored || uuidv4();
  });

  const chatClientRef = useRef<ChatWebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Example questions
  const exampleQuestions = [
    '我这个月的支出情况如何？',
    '帮我分析一下我的消费习惯',
    '给我一些理财建议',
    '我在哪些类别花费最多？',
  ];

  // Initialize WebSocket connection
  useEffect(() => {
    // Save session ID
    sessionStorage.setItem('chat_session_id', sessionId);

    const client = new ChatWebSocketClient(sessionId);
    chatClientRef.current = client;

    // Set up message handler
    client.onMessage((message) => {
      if (message.type === 'chunk' && message.content) {
        setCurrentAIMessage((prev) => prev + message.content);
        setIsTyping(true);
      } else if (message.type === 'complete') {
        // Finalize AI message
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: currentAIMessage,
            timestamp: new Date(),
          },
        ]);
        setCurrentAIMessage('');
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
        setCurrentAIMessage('');
        setIsTyping(false);
      }
    });

    // Set up status change handler
    client.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Connect
    client.connect();

    // Cleanup on unmount
    return () => {
      client.disconnect();
    };
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAIMessage]);

  const handleSend = () => {
    if (!input.trim() || !chatClientRef.current?.isConnected()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatClientRef.current.sendMessage(input.trim());
    setInput('');
    setIsTyping(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-t-lg px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <span className="text-3xl mr-2">🤖</span>
            AI 财务顾问
          </h1>
          <p className="text-sm text-gray-500 mt-1">智能分析您的财务状况，提供个性化建议</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator />
          <button
            onClick={handleNewSession}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            新对话
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white">
        {messages.length === 0 && !currentAIMessage && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">开始与 AI 顾问对话</h3>
            <p className="text-gray-500 mb-6">提出您的财务问题，我会为您分析解答</p>

            <div className="w-full max-w-2xl">
              <p className="text-sm font-medium text-gray-700 mb-3">试试这些问题：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className="p-4 text-left bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 rounded-lg transition-all transform hover:scale-105 shadow-sm"
                  >
                    <span className="text-blue-700">{question}</span>
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
              className={`max-w-3xl px-4 py-3 rounded-lg shadow-sm ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <span className="text-2xl flex-shrink-0">🤖</span>
                )}
                <div className="flex-1">
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <span className="text-2xl flex-shrink-0">👤</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator with streaming message */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-3xl px-4 py-3 rounded-lg shadow-sm bg-gray-100 text-gray-900">
              <div className="flex items-start space-x-2">
                <span className="text-2xl flex-shrink-0">🤖</span>
                <div className="flex-1">
                  <p className="whitespace-pre-wrap break-words">
                    {currentAIMessage || (
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white shadow-lg rounded-b-lg px-6 py-4 border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '200px' }}
            disabled={connectionStatus !== 'connected'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || connectionStatus !== 'connected' || isTyping}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI 回复基于您的交易数据分析，仅供参考
        </p>
      </div>
    </div>
  );
};

export default AIChat;
