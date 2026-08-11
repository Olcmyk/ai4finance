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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 opacity-20 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 opacity-20 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="inline-block p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-glow-purple mb-6 transform hover:scale-110 transition-transform duration-300">
            <span className="text-6xl">💰</span>
          </div>
          <h2 className="text-5xl font-black text-gray-900 mb-3">
            AI 财务顾问
          </h2>
          <p className="text-gray-600 text-xl font-semibold">
            登录您的账户，开始智能理财
          </p>
        </div>

        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl border-2 border-white p-10">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl flex items-center space-x-3 shadow-lg">
                <span className="text-2xl">⚠️</span>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-base font-bold text-gray-900 mb-3">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-6 py-4 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 text-lg"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-bold text-gray-900 mb-3">
                密码
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-6 py-4 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 text-lg"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-5 text-xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {loading ? '登录中...' : '🚀 登录'}
            </Button>

            <div className="text-center pt-4">
              <Link
                to="/register"
                className="text-purple-700 hover:text-purple-900 transition-colors duration-200 font-bold text-lg hover:underline"
              >
                还没有账户？立即注册 →
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm font-medium">
          💡 使用 AI 技术智能管理您的财务
        </p>
      </div>
    </div>
  );
};

export default Login;
