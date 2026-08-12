import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #FAF8F3 0%, #F5F1E8 50%, #FFFFFF 100%)'
         }}>

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-5"
           style={{ backgroundColor: '#D4AF37' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-5"
           style={{ backgroundColor: '#C9B591' }} />

      <div className="max-w-xl w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-3 tracking-wide"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#D4AF37'
              }}>
            Welcome Back
          </h1>
          <div className="w-24 h-1 mx-auto mb-6"
               style={{
                 background: 'linear-gradient(to right, transparent, #D4AF37, transparent)'
               }} />
          <p className="text-lg tracking-wide" style={{ color: '#4A3F2E' }}>
            登录您的专属财富管理账户
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg p-10"
             style={{
               border: '1px solid #E8DCC8',
               boxShadow: '0 8px 24px rgba(212, 175, 55, 0.16)'
             }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 rounded-md text-sm"
                   style={{
                     backgroundColor: 'rgba(239, 68, 68, 0.1)',
                     border: '1px solid #ef4444',
                     color: '#ef4444'
                   }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2"
                     style={{ color: '#4A3F2E' }}>
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-md transition-all duration-200 outline-none"
                style={{
                  backgroundColor: '#F5F1E8',
                  border: '1px solid #E8DCC8',
                  color: '#2C2416'
                }}
                onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
                onBlur={(e) => e.target.style.borderColor = '#E8DCC8'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2"
                     style={{ color: '#4A3F2E' }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-md transition-all duration-200 outline-none"
                style={{
                  backgroundColor: '#F5F1E8',
                  border: '1px solid #E8DCC8',
                  color: '#2C2416'
                }}
                onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
                onBlur={(e) => e.target.style.borderColor = '#E8DCC8'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-md font-medium transition-all duration-300 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 175, 55, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
              }}>
              {loading ? '登录中...' : '登录'}
            </button>

            <div className="text-center">
              <span style={{ color: '#8B7355' }}>或</span>
            </div>

            <div className="text-center">
              <Link
                to="/register"
                className="inline-block transition-colors duration-200"
                style={{ color: '#D4AF37' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#B8860B'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#D4AF37'}>
                还没有账户？立即注册
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm" style={{ color: '#8B7355' }}>
          为高净值客户提供专业财富管理服务
        </p>
      </div>
    </div>
  );
};

export default Login;
