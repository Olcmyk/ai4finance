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
      connected: { color: 'bg-success-500', text: '已连接' },
      connecting: { color: 'bg-yellow-500', text: '连接中...' },
      disconnected: { color: 'bg-gray-500', text: '已断开' },
      error: { color: 'bg-red-500', text: '连接错误' },
    };

    const config = statusConfig[connectionStatus];

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
        <span className="text-xs text-gray-600">{config.text}</span>
        {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
          <button
            onClick={handleReconnect}
            className="text-xs text-primary-600 hover:text-primary-700 underline"
          >
            重新连接
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-gray-200 px-6 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-cyan-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            AI 财务顾问
          </h1>
          <p className="text-sm text-gray-600 mt-1 ml-13">智能分析您的财务状况，提供个性化建议</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator />
          <button
            onClick={handleNewSession}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-all shadow-sm"
          >
            新对话
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-10 h-10 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">开始与 AI 顾问对话</h3>
            <p className="text-gray-600 mb-8 max-w-md">提出您的财务问题，我会为您分析解答</p>

            <div className="w-full max-w-3xl">
              <p className="text-sm font-semibold text-gray-700 mb-3">试试这些问题：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className="p-4 text-left bg-white hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-lg transition-all"
                  >
                    <span className="text-gray-700 font-medium">{question}</span>
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
              className={`max-w-[75%] px-5 py-3 rounded-lg shadow-sm ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none text-gray-900">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
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
            <div className="max-w-[75%] px-5 py-3 rounded-lg shadow-sm bg-white text-gray-900 border border-gray-200">
              <div className="prose prose-sm max-w-none text-gray-900">
                <ReactMarkdown>{currentAIMessageRef.current}</ReactMarkdown>
              </div>
              <div className="flex items-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex space-x-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题... (Shift+Enter 换行)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white"
            rows={1}
            disabled={connectionStatus !== 'connected'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || connectionStatus !== 'connected' || isTyping}
            className="px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
