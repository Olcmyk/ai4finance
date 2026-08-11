import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

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
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section with Modern Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 mb-8">
              <span className="text-3xl">✨</span>
              <span className="font-bold text-lg">Start Your Journey</span>
            </div>
          </div>

          <h1 className="text-6xl font-black mb-6 leading-tight">
            开启智能理财
            <br />
            <span className="bg-gradient-to-r from-yellow-200 to-green-200 bg-clip-text text-transparent">
              新的篇章
            </span>
          </h1>

          <p className="text-xl text-emerald-100 mb-12 leading-relaxed max-w-lg">
            加入数千位用户，体验 AI 驱动的财务管理平台，让每一分钱都发挥最大价值
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-6 rounded-2xl border border-white/20 text-center">
              <div className="text-4xl font-black mb-2">10K+</div>
              <div className="text-emerald-200 text-sm">活跃用户</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-6 rounded-2xl border border-white/20 text-center">
              <div className="text-4xl font-black mb-2">99%</div>
              <div className="text-emerald-200 text-sm">满意度</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-6 rounded-2xl border border-white/20 text-center">
              <div className="text-4xl font-black mb-2">24/7</div>
              <div className="text-emerald-200 text-sm">AI 支持</div>
            </div>
          </div>

          <div className="mt-12 space-y-3">
            <div className="flex items-center space-x-3 text-emerald-100">
              <div className="bg-white/20 p-2 rounded-lg">
                <span className="text-xl">✓</span>
              </div>
              <span className="font-semibold">完全免费，无隐藏费用</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-100">
              <div className="bg-white/20 p-2 rounded-lg">
                <span className="text-xl">✓</span>
              </div>
              <span className="font-semibold">数据加密，安全可靠</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-100">
              <div className="bg-white/20 p-2 rounded-lg">
                <span className="text-xl">✓</span>
              </div>
              <span className="font-semibold">跨设备同步，随时随地</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {/* Decorative elements for mobile */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 opacity-20 rounded-full blur-3xl -mr-48 -mt-48 lg:hidden"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200 opacity-20 rounded-full blur-3xl -ml-48 -mb-48 lg:hidden"></div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Mobile Logo */}
          <div className="text-center lg:hidden mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-emerald-600 to-green-600 rounded-3xl shadow-2xl mb-4">
              <span className="text-5xl">✨</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">创建新账户</h2>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 mb-3">
              开始使用
            </h2>
            <p className="text-gray-600 text-lg">
              创建您的账户，立即体验智能理财
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-xl flex items-center space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="张三"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 text-gray-900 text-base transition-all duration-200 hover:border-gray-300"
                />
              </div>

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
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 text-gray-900 text-base transition-all duration-200 hover:border-gray-300"
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
                  placeholder="至少8个字符"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 text-gray-900 text-base transition-all duration-200 hover:border-gray-300"
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
                  <span>🔒</span>
                  <span>至少8个字符，包含大小写字母和数字</span>
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                fullWidth
                size="lg"
                className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white font-bold px-6 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    注册中...
                  </span>
                ) : (
                  '立即注册'
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-emerald-600 hover:text-emerald-800 transition-colors duration-200 font-semibold text-base hover:underline"
                >
                  已有账户？立即登录 →
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-gray-500 text-sm">
            注册即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
