import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LuxuryInput, LuxuryButton } from '../components/luxury';

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
    <div className="min-h-screen bg-gradient-to-br from-luxury-cream via-luxury-lightBeige to-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-luxury-gold opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-luxury-beige opacity-5 rounded-full blur-3xl"></div>

      <div className="max-w-xl w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-5xl font-bold text-luxury-gold mb-3 tracking-wide">
            Welcome Back
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-luxury-gold to-transparent mx-auto mb-6"></div>
          <p className="text-luxury-darkBrown text-lg tracking-wide">
            登录您的专属财富管理账户
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-luxury-border rounded-lg shadow-luxury-lg p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-expense-light/20 border border-expense text-expense px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <LuxuryInput
              label="邮箱地址"
              id="email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <LuxuryInput
              label="密码"
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-4">
              <LuxuryButton
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
              >
                {loading ? '登录中...' : '登录'}
              </LuxuryButton>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-luxury-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-luxury-brown">或</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="text-luxury-gold hover:text-luxury-darkGold font-medium transition-colors duration-300"
              >
                还没有账户？立即注册
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-sm text-luxury-brown tracking-wide">
          为高净值客户提供专业财富管理服务
        </p>
      </div>
    </div>
  );
};

export default Login;
