import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, username);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            创建账户
          </h1>
          <p className="text-gray-600">
            开启您的智能财务管理之旅
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-xl shadow-card p-8 border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="您的姓名"
                required
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少8个字符"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 outline-none bg-gray-50 border border-gray-200 text-gray-900 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                密码必须至少8个字符
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {loading ? '注册中...' : '创建账户'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">或</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                已有账户？立即登录
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-500">
          智能财务管理，让记账更轻松
        </p>
      </div>
    </div>
  );
};

export default Register;
