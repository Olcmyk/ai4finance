import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from '../components/ui';

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
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-beige-100 to-beige-200 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-block p-4 bg-beige-500 rounded-3xl shadow-soft-lg mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-beige-900 mb-2">
            创建新账户
          </h2>
          <p className="text-beige-600 text-lg">
            开始使用 AI 个人财务顾问
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <Input
              label="用户名"
              type="text"
              required
              fullWidth
              placeholder="张三"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              label="邮箱"
              type="email"
              required
              fullWidth
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <Input
                label="密码"
                type="password"
                required
                fullWidth
                placeholder="至少8个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
              <p className="mt-2 text-sm text-beige-600">
                密码必须至少8个字符，包含大小写字母和数字
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              size="lg"
            >
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-beige-700 hover:text-beige-900 transition-colors duration-200 font-medium"
              >
                已有账户？立即登录
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
