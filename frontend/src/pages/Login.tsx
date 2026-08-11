import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section with Modern Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-700 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 mb-8">
              <span className="text-3xl">✨</span>
              <span className="font-bold text-lg">AI-Powered Finance</span>
            </div>
          </div>

          <h1 className="text-6xl font-black mb-6 leading-tight">
            智能财务管理
            <br />
            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
              从这里开始
            </span>
          </h1>

          <p className="text-xl text-purple-100 mb-12 leading-relaxed max-w-lg">
            使用先进的 AI 技术分析您的财务数据，获取个性化建议，让理财变得简单而高效
          </p>

          {/* Feature Pills */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">实时数据分析</h3>
                <p className="text-purple-200 text-sm">智能图表与可视化</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20">
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-3 rounded-xl">
                <span className="text-3xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI 智能顾问</h3>
                <p className="text-purple-200 text-sm">24/7 个性化财务建议</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20">
              <div className="bg-gradient-to-br from-pink-400 to-rose-500 p-3 rounded-xl">
                <span className="text-3xl">🔒</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">安全可靠</h3>
                <p className="text-purple-200 text-sm">银行级数据加密</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {/* Decorative elements for mobile */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 opacity-20 rounded-full blur-3xl -mr-48 -mt-48 lg:hidden"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 opacity-20 rounded-full blur-3xl -ml-48 -mb-48 lg:hidden"></div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Mobile Logo */}
          <div className="text-center lg:hidden mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl mb-4">
              <span className="text-5xl">💰</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">AI 财务顾问</h2>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 mb-3">
              欢迎回来
            </h2>
            <p className="text-gray-600 text-lg">
              登录您的账户继续管理财务
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-xl flex items-center space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                  邮箱地址
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-900 text-base transition-all duration-200 hover:border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-900 text-base transition-all duration-200 hover:border-gray-300"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                fullWidth
                size="lg"
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white font-bold px-6 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/register"
                  className="text-purple-600 hover:text-purple-800 transition-colors duration-200 font-semibold text-base hover:underline"
                >
                  还没有账户？立即注册 →
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-gray-500 text-sm">
            🔒 您的数据安全受到保护
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
