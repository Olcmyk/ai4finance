# 米黄色系 UI 优雅重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将财务顾问应用的前端界面重新设计为简洁优美的米黄色系 UI，提升视觉美感和用户体验

**Architecture:** 更新 Tailwind CSS 配置定义米黄色调色板，创建可复用的 UI 组件库，逐页面替换现有组件为新设计的美观组件

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Recharts 3

## Global Constraints

- 保持所有现有功能不变，只改变视觉呈现
- 使用 Tailwind CSS 4 的新语法和特性
- 所有颜色使用米黄色系为主色调（#F5E6D3, #E8D4B8, #D4C4A8 等）
- 保持响应式设计，适配移动端和桌面端
- 所有交互动画使用 Tailwind 的 transition 类
- 确保文字对比度符合 WCAG AA 标准

---

## 文件结构

### 需要修改的文件
- `frontend/tailwind.config.js` - 添加米黄色系调色板
- `frontend/src/index.css` - 更新全局样式和 CSS 变量
- `frontend/src/components/ui/Button.tsx` - 新建统一按钮组件
- `frontend/src/components/ui/Card.tsx` - 新建卡片组件
- `frontend/src/components/ui/Input.tsx` - 新建表单输入组件
- `frontend/src/components/Layout.tsx` - 重新设计导航栏
- `frontend/src/pages/Login.tsx` - 重新设计登录页
- `frontend/src/pages/Register.tsx` - 重新设计注册页
- `frontend/src/pages/Dashboard.tsx` - 重新设计仪表板
- `frontend/src/pages/AIChat.tsx` - 重新设计 AI 聊天页
- `frontend/src/pages/TransactionList.tsx` - 重新设计交易列表
- `frontend/src/pages/NewTransaction.tsx` - 重新设计新建交易页

---

### Task 1: 配置米黄色调色板和全局样式

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: 全局可用的米黄色系 Tailwind 类（beige-50 到 beige-900）

- [ ] **Step 1: 更新 Tailwind 配置文件**

修改 `frontend/tailwind.config.js`，添加米黄色调色板：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FAF8F3',
          100: '#F5F0E8',
          200: '#EBE3D5',
          300: '#E0D4C0',
          400: '#D4C4A8',
          500: '#C9B591',
          600: '#B39A6F',
          700: '#8F7A56',
          800: '#6B5C42',
          900: '#4A3F2E',
        },
        warm: {
          50: '#FFF9F0',
          100: '#FFF3E0',
          200: '#FFE7C4',
          300: '#FFD89E',
          400: '#FFC978',
          500: '#FFB952',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: 更新全局 CSS 样式**

修改 `frontend/src/index.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #C9B591;
  --color-primary-dark: #B39A6F;
  --color-bg-base: #FAF8F3;
  --color-bg-elevated: #FFFFFF;
  --color-text-primary: #4A3F2E;
  --color-text-secondary: #6B5C42;
  --color-border: #EBE3D5;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #F5F0E8;
}

::-webkit-scrollbar-thumb {
  background: #D4C4A8;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #C9B591;
}
```

- [ ] **Step 3: 测试配置**

```bash
cd frontend
npm run dev
```

预期：开发服务器启动成功，Tailwind 配置生效

- [ ] **Step 4: 提交更改**

```bash
git add frontend/tailwind.config.js frontend/src/index.css
git commit -m "feat: add beige color palette and global styles"
```

---

### Task 2: 创建可复用 UI 组件库

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/Input.tsx`

**Interfaces:**
- Produces: Button, Card, Input 组件供其他页面使用

- [ ] **Step 1: 创建 Button 组件**

创建 `frontend/src/components/ui/Button.tsx`：

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-beige-500 to-beige-600 hover:from-beige-600 hover:to-beige-700 text-white shadow-soft focus:ring-beige-500',
    secondary: 'bg-white border-2 border-beige-300 text-beige-800 hover:border-beige-400 hover:bg-beige-50 shadow-soft focus:ring-beige-400',
    ghost: 'bg-transparent text-beige-700 hover:bg-beige-100 focus:ring-beige-400',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-soft focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
```

- [ ] **Step 2: 创建 Card 组件**

创建 `frontend/src/components/ui/Card.tsx`：

```tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
}) => {
  const baseStyles = 'bg-white rounded-2xl shadow-soft border border-beige-200';
  const hoverStyles = hover ? 'transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1' : '';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};
```

- [ ] **Step 3: 创建 Input 组件**

创建 `frontend/src/components/ui/Input.tsx`：

```tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-beige-800 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5 
          bg-white border-2 rounded-xl
          text-beige-900 placeholder-beige-400
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-beige-400 focus:border-beige-400
          disabled:bg-beige-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'border-beige-200'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-beige-600">{helperText}</p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-beige-800 mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full px-4 py-2.5 
          bg-white border-2 rounded-xl
          text-beige-900 placeholder-beige-400
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-beige-400 focus:border-beige-400
          disabled:bg-beige-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : 'border-beige-200'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-beige-600">{helperText}</p>
      )}
    </div>
  );
};
```

- [ ] **Step 4: 测试组件**

```bash
cd frontend
npm run dev
```

预期：组件文件创建成功，无 TypeScript 错误

- [ ] **Step 5: 提交更改**

```bash
git add frontend/src/components/ui/
git commit -m "feat: create reusable UI component library (Button, Card, Input)"
```

---

### Task 3: 重新设计导航栏

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

**Interfaces:**
- Consumes: Button 和 Card 组件
- Produces: 美观的米黄色系导航栏

- [ ] **Step 1: 更新 Layout 组件**

替换 `frontend/src/components/Layout.tsx` 的内容：

```tsx
import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/app/dashboard', label: '概览', icon: '📊' },
    { path: '/app/transactions', label: '交易', icon: '💰' },
    { path: '/app/chat', label: 'AI顾问', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-beige-50">
      <nav className="bg-white border-b-2 border-beige-200 shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-8">
              <Link to="/app/dashboard" className="flex items-center space-x-3 group">
                <div className="bg-gradient-to-br from-beige-400 to-beige-600 p-2 rounded-xl shadow-soft group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-beige-700 to-beige-900 bg-clip-text text-transparent">
                  财务顾问
                </span>
              </Link>
              
              <div className="hidden md:flex space-x-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                      ${isActive(link.path)
                        ? 'bg-gradient-to-r from-beige-500 to-beige-600 text-white shadow-soft'
                        : 'text-beige-700 hover:bg-beige-100'
                      }
                    `}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-beige-50 rounded-xl border border-beige-200">
                <span className="text-xl">👤</span>
                <span className="text-sm font-medium text-beige-800 hidden sm:block">
                  {user?.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-beige-700 hover:text-beige-900 hover:bg-beige-100 rounded-xl transition-all duration-200"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
```

- [ ] **Step 2: 测试导航栏**

```bash
cd frontend
npm run dev
```

预期：导航栏显示米黄色系样式，链接切换时有平滑动画

- [ ] **Step 3: 提交更改**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: redesign navigation bar with beige theme"
```

---

### Task 4: 重新设计登录和注册页面

**Files:**
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/Register.tsx`

**Interfaces:**
- Consumes: Button, Input 组件

- [ ] **Step 1: 更新 Login 页面**

替换 `frontend/src/pages/Login.tsx` 的内容：

```tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-warm-50 to-beige-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-beige-400 to-beige-600 p-4 rounded-2xl shadow-soft-lg mb-4">
            <span className="text-5xl">💰</span>
          </div>
          <h2 className="text-4xl font-bold text-beige-900 mb-2">
            AI 个人财务顾问
          </h2>
          <p className="text-beige-600">
            智能管理您的财务，让理财更轻松
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-soft-lg p-8 border-2 border-beige-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <Input
              label="邮箱地址"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="密码"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="text-center pt-4 border-t border-beige-200">
              <Link 
                to="/register" 
                className="text-sm font-medium text-beige-600 hover:text-beige-800 transition-colors"
              >
                还没有账户？<span className="text-beige-700 font-semibold">立即注册</span>
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-beige-500 mt-6">
          © 2026 AI 财务顾问 · 让理财更智能
        </p>
      </div>
    </div>
  );
};

export default Login;
```

- [ ] **Step 2: 更新 Register 页面**

替换 `frontend/src/pages/Register.tsx` 的内容（与 Login 类似的设计）：

```tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-warm-50 to-beige-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-br from-beige-400 to-beige-600 p-4 rounded-2xl shadow-soft-lg mb-4">
            <span className="text-5xl">💰</span>
          </div>
          <h2 className="text-4xl font-bold text-beige-900 mb-2">
            创建新账户
          </h2>
          <p className="text-beige-600">
            开启您的智能理财之旅
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-soft-lg p-8 border-2 border-beige-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <Input
              label="用户名"
              type="text"
              required
              placeholder="您的昵称"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              label="邮箱地址"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="密码"
              type="password"
              required
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="确认密码"
              type="password"
              required
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-center pt-4 border-t border-beige-200">
              <Link 
                to="/login" 
                className="text-sm font-medium text-beige-600 hover:text-beige-800 transition-colors"
              >
                已有账户？<span className="text-beige-700 font-semibold">立即登录</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
```

- [ ] **Step 3: 测试登录和注册页面**

```bash
cd frontend
npm run dev
```

预期：登录和注册页面显示美观的米黄色系设计

- [ ] **Step 4: 提交更改**

```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
git commit -m "feat: redesign login and register pages with beige theme"
```

---

### Task 5: 重新设计 Dashboard 页面

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: Card, Button 组件

- [ ] **Step 1: 更新 Dashboard 页面的顶部和摘要卡片**

修改 `frontend/src/pages/Dashboard.tsx`，更新头部和摘要卡片部分：

```tsx
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// 在 return 语句中替换头部区域：
<div className="space-y-8 pb-8">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-4xl font-bold text-beige-900 mb-2">财务概览</h1>
      <p className="text-beige-600 flex items-center">
        <span className="text-xl mr-2">📅</span>
        {summary?.month || ''} 月度报告
      </p>
    </div>
    <Link to="/app/transactions/new">
      <Button size="lg">
        <span className="text-xl mr-2">+</span> 新建交易
      </Button>
    </Link>
  </div>

  {/* Summary Cards */}
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
    <Card hover padding="lg" className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-emerald-700 text-sm font-medium mb-2">本月收入</p>
          <p className="text-4xl font-bold text-emerald-900">
            ¥{summary?.total_income.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-emerald-200 rounded-2xl p-4">
          <span className="text-4xl">💰</span>
        </div>
      </div>
    </Card>

    <Card hover padding="lg" className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-rose-700 text-sm font-medium mb-2">本月支出</p>
          <p className="text-4xl font-bold text-rose-900">
            ¥{summary?.total_expense.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-rose-200 rounded-2xl p-4">
          <span className="text-4xl">💸</span>
        </div>
      </div>
    </Card>

    <Card hover padding="lg" className="bg-gradient-to-br from-beige-100 to-beige-200 border-beige-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-beige-700 text-sm font-medium mb-2">结余</p>
          <p className="text-4xl font-bold text-beige-900">
            ¥{summary?.balance.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-beige-300 rounded-2xl p-4">
          <span className="text-4xl">📊</span>
        </div>
      </div>
    </Card>
  </div>
```

- [ ] **Step 2: 更新 AI 洞察区域**

更新 AI Insights 部分：

```tsx
  {/* AI Insights Section */}
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-beige-400 to-beige-600 rounded-2xl p-3">
          <span className="text-3xl">🤖</span>
        </div>
        <h2 className="text-3xl font-bold text-beige-900">AI 财务洞察</h2>
      </div>
      {!insightsLoading && (
        <Button variant="secondary" size="sm" onClick={loadData}>
          🔄 刷新
        </Button>
      )}
    </div>

    {insightsLoading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="lg" className="animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-beige-200 rounded-2xl"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-beige-200 rounded w-3/4"></div>
                <div className="h-4 bg-beige-200 rounded"></div>
                <div className="h-4 bg-beige-200 rounded w-5/6"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    ) : insights.length === 0 ? (
      <Card padding="lg" className="text-center py-12 bg-gradient-to-br from-beige-50 to-warm-50">
        <span className="text-6xl mb-4 block">📊</span>
        <p className="text-beige-800 text-lg font-semibold">暂无财务洞察</p>
        <p className="text-sm text-beige-600 mt-2">添加更多交易记录后，AI 将为您提供个性化建议</p>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight, index) => {
          const styles = getSeverityStyles(insight.severity);
          return (
            <Card key={index} hover padding="lg" className={styles.bg}>
              <div className="flex items-start space-x-4">
                <div className={`${styles.iconBg} rounded-2xl p-4 flex-shrink-0`}>
                  <span className="text-4xl">{insight.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-bold ${styles.textColor} mb-2`}>
                    {insight.title}
                  </h3>
                  <p className="text-beige-700 text-sm leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    )}
  </div>
```

- [ ] **Step 3: 更新图表区域**

更新图表部分为米黄色系：

```tsx
  {/* Charts Section */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card padding="lg">
      <h3 className="text-2xl font-bold text-beige-900 mb-6 flex items-center">
        <span className="mr-3 text-3xl">🥧</span> 支出分布
      </h3>
      {categories.length === 0 ? (
        <div className="text-center py-16 text-beige-500">
          <span className="text-6xl block mb-4">📊</span>
          <p className="text-lg">暂无数据</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>

    <Card padding="lg">
      <h3 className="text-2xl font-bold text-beige-900 mb-6 flex items-center">
        <span className="mr-3 text-3xl">📊</span> 支出排行 (Top 5)
      </h3>
      {categories.length === 0 ? (
        <div className="text-center py-16 text-beige-500">
          <span className="text-6xl block mb-4">📈</span>
          <p className="text-lg">暂无数据</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D5" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B5C42' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B5C42' }} />
            <Tooltip
              formatter={(value: number) => `¥${value.toFixed(2)}`}
              contentStyle={{ 
                borderRadius: '12px', 
                border: '2px solid #EBE3D5',
                backgroundColor: '#FFFFFF'
              }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  </div>
```

- [ ] **Step 4: 测试 Dashboard**

```bash
cd frontend
npm run dev
```

预期：Dashboard 显示完整的米黄色系设计

- [ ] **Step 5: 提交更改**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: redesign dashboard with beige theme and modern cards"
```

---

### Task 6: 重新设计 AI Chat 页面

**Files:**
- Modify: `frontend/src/pages/AIChat.tsx`

**Interfaces:**
- Consumes: Button, Card 组件

- [ ] **Step 1: 更新 AI Chat 页面样式**

修改 `frontend/src/pages/AIChat.tsx`，更新主要容器和头部：

```tsx
// 在文件顶部添加导入
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// 更新 return 部分的主容器：
return (
  <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-soft-lg border-2 border-beige-200 overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-beige-50 to-warm-50 border-b-2 border-beige-200 px-6 py-5 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-beige-900 flex items-center">
          <span className="text-4xl mr-3">🤖</span>
          AI 财务顾问
        </h1>
        <p className="text-sm text-beige-600 mt-1">智能分析您的财务状况，提供个性化建议</p>
      </div>
      <div className="flex items-center space-x-4">
        <StatusIndicator />
        <Button variant="secondary" size="sm" onClick={handleNewSession}>
          新对话
        </Button>
      </div>
    </div>

    {/* Messages Area */}
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-beige-50">
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="bg-gradient-to-br from-beige-100 to-warm-100 p-6 rounded-3xl mb-6">
            <span className="text-7xl">💬</span>
          </div>
          <h3 className="text-2xl font-bold text-beige-900 mb-3">开始与 AI 顾问对话</h3>
          <p className="text-beige-600 mb-8 max-w-md">提出您的财务问题，我会为您分析解答</p>

          <div className="w-full max-w-2xl">
            <p className="text-sm font-semibold text-beige-700 mb-4">试试这些问题：</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(question)}
                  className="p-5 text-left bg-white hover:bg-gradient-to-br hover:from-beige-50 hover:to-warm-50 border-2 border-beige-200 hover:border-beige-400 rounded-2xl transition-all transform hover:scale-105 shadow-soft"
                >
                  <span className="text-beige-800 font-medium">{question}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-800 px-5 py-4 rounded-2xl flex justify-between items-center shadow-soft">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800 font-bold text-xl"
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
            className={`max-w-3xl px-5 py-4 rounded-2xl shadow-soft ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-beige-500 to-beige-600 text-white'
                : 'bg-white text-beige-900 border-2 border-beige-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              {message.role === 'assistant' && (
                <span className="text-3xl flex-shrink-0">🤖</span>
              )}
              <div className="flex-1">
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-beige-100' : 'text-beige-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <span className="text-3xl flex-shrink-0">👤</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="max-w-3xl px-5 py-4 rounded-2xl shadow-soft bg-white border-2 border-beige-200">
            <div className="flex items-start space-x-3">
              <span className="text-3xl flex-shrink-0">🤖</span>
              <div className="flex-1">
                {currentAIMessageRef.current ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{currentAIMessageRef.current}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-beige-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
    <div className="bg-white border-t-2 border-beige-200 px-6 py-5">
      <div className="flex items-end space-x-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="输入您的问题... (Enter 发送, Shift+Enter 换行)"
          className="flex-1 px-4 py-3 border-2 border-beige-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beige-400 focus:border-beige-400 resize-none bg-beige-50 text-beige-900 placeholder-beige-400"
          rows={1}
          style={{ minHeight: '52px', maxHeight: '200px' }}
          disabled={connectionStatus !== 'connected'}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || connectionStatus !== 'connected' || isTyping}
          size="lg"
        >
          发送
        </Button>
      </div>
      <p className="text-xs text-beige-500 mt-3">
        💡 AI 回复基于您的交易数据分析，仅供参考
      </p>
    </div>
  </div>
);
```

- [ ] **Step 2: 测试 AI Chat 页面**

```bash
cd frontend
npm run dev
```

预期：AI Chat 页面显示米黄色系设计，消息气泡美观

- [ ] **Step 3: 提交更改**

```bash
git add frontend/src/pages/AIChat.tsx
git commit -m "feat: redesign AI chat page with beige theme"
```

---

### Task 7: 重新设计交易列表和新建交易页面

**Files:**
- Modify: `frontend/src/pages/TransactionList.tsx`
- Modify: `frontend/src/pages/NewTransaction.tsx`

**Interfaces:**
- Consumes: Button, Card, Input, Textarea 组件

- [ ] **Step 1: 更新 TransactionList 页面**

替换 `frontend/src/pages/TransactionList.tsx` 的主要内容：

```tsx
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// 更新 return 部分：
return (
  <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
      <div>
        <h1 className="text-4xl font-bold text-beige-900 mb-2">交易记录</h1>
        <p className="text-beige-600">查看和管理您的所有交易</p>
      </div>
      <Link to="/app/transactions/new">
        <Button size="lg">
          <span className="text-xl mr-2">+</span> 新建交易
        </Button>
      </Link>
    </div>

    {transactions.length === 0 ? (
      <Card padding="lg" className="text-center py-16 bg-gradient-to-br from-beige-50 to-warm-50">
        <span className="text-7xl mb-6 block">📝</span>
        <p className="text-beige-800 text-xl font-semibold mb-3">暂无交易记录</p>
        <p className="text-beige-600 mb-6">开始记录您的第一笔交易吧</p>
        <Link to="/app/transactions/new">
          <Button>添加第一笔交易</Button>
        </Link>
      </Card>
    ) : (
      <div className="space-y-6">
        {Object.entries(groupedTransactions).map(([date, items]) => (
          <Card key={date} padding="none">
            <div className="bg-gradient-to-r from-beige-100 to-warm-100 px-6 py-3 border-b-2 border-beige-200">
              <h3 className="text-base font-bold text-beige-800 flex items-center">
                <span className="mr-2">📅</span>
                {date}
              </h3>
            </div>
            <ul className="divide-y divide-beige-200">
              {items.map((transaction) => (
                <li 
                  key={transaction.id} 
                  className="px-6 py-5 hover:bg-beige-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-base font-bold text-beige-900 flex items-center">
                          <span className="mr-2">💼</span>
                          {transaction.category}
                        </p>
                        <p className="text-lg font-bold">
                          {formatAmount(transaction.amount)}
                        </p>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-beige-600 ml-6">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-6 flex-shrink-0">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    )}

    {total > 20 && (
      <div className="mt-8 flex justify-center items-center space-x-4">
        <Button
          variant="secondary"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          上一页
        </Button>
        <span className="px-4 py-2 text-sm font-medium text-beige-700 bg-white rounded-xl border-2 border-beige-200">
          第 {page} 页 / 共 {Math.ceil(total / 20)} 页
        </span>
        <Button
          variant="secondary"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= Math.ceil(total / 20)}
        >
          下一页
        </Button>
      </div>
    )}
  </div>
);
```

- [ ] **Step 2: 更新 NewTransaction 页面**

替换 `frontend/src/pages/NewTransaction.tsx` 的主要内容：

```tsx
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';

// 更新 return 部分：
return (
  <div className="max-w-3xl mx-auto">
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-beige-900 mb-2">新建交易</h1>
      <p className="text-beige-600">使用 AI 智能输入或手动填写交易信息</p>
    </div>

    <Card padding="lg">
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-800 px-5 py-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* Input Mode Toggle */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-beige-800 mb-3">
          输入方式
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="nlp"
              checked={inputMode === 'nlp'}
              onChange={() => handleModeChange('nlp')}
              className="w-5 h-5 text-beige-600 focus:ring-beige-500 border-beige-300"
            />
            <span className="ml-3 text-base font-medium text-beige-800">
              🤖 AI 智能输入
            </span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="manual"
              checked={inputMode === 'manual'}
              onChange={() => handleModeChange('manual')}
              className="w-5 h-5 text-beige-600 focus:ring-beige-500 border-beige-300"
            />
            <span className="ml-3 text-base font-medium text-beige-800">
              ✍️ 手动输入
            </span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* NLP Input Section */}
        {inputMode === 'nlp' && (
          <div className="space-y-6">
            <Textarea
              label="描述你的交易"
              rows={4}
              placeholder="例如：今天午餐花了50块，或者收到工资5000元"
              value={nlpText}
              onChange={(e) => setNlpText(e.target.value)}
            />

            <div>
              <label className="block text-sm font-semibold text-beige-800 mb-3">
                快速示例
              </label>
              <div className="flex flex-wrap gap-3">
                {['今天午餐花了50块', '昨天买咖啡花了35元', '收到工资5000元'].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="px-4 py-2 text-sm font-medium bg-beige-100 hover:bg-beige-200 text-beige-800 rounded-xl transition-all border-2 border-beige-200 hover:border-beige-300"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="button"
                onClick={handleParse}
                disabled={parsing || !nlpText.trim()}
                size="lg"
              >
                {parsing ? '🔄 AI 解析中...' : '✨ AI 解析'}
              </Button>
            </div>
          </div>
        )}

        {/* Manual Input Section */}
        {inputMode === 'manual' && (
          <div className="space-y-6">
            {parsed && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-5 py-4 rounded-2xl">
                ✅ AI 已为你填充表单，你可以继续编辑后保存
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-beige-800 mb-3">
                交易类型
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'expense', label: '💸 支出' },
                  { value: 'income', label: '💰 收入' }
                ].map((type) => (
                  <label key={type.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="transactionType"
                      value={type.value}
                      checked={transactionType === type.value}
                      onChange={(e) => setTransactionType(e.target.value as 'expense' | 'income')}
                      className="w-5 h-5 text-beige-600 focus:ring-beige-500 border-beige-300"
                    />
                    <span className="ml-3 text-base font-medium text-beige-800">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="金额（元）"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-beige-800 mb-2">
                类别
              </label>
              <select
                id="category"
                required
                className="w-full px-4 py-2.5 bg-white border-2 border-beige-200 rounded-xl text-beige-900 focus:outline-none focus:ring-2 focus:ring-beige-400 focus:border-beige-400"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="日期"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />

            <Textarea
              label="备注（可选）"
              rows={3}
              placeholder="添加备注..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/transactions')}
          >
            取消
          </Button>
          {inputMode === 'manual' && (
            <Button type="submit" disabled={loading} size="lg">
              {loading ? '保存中...' : '💾 保存'}
            </Button>
          )}
        </div>
      </form>
    </Card>
  </div>
);
```

- [ ] **Step 3: 测试交易页面**

```bash
cd frontend
npm run dev
```

预期：交易列表和新建交易页面显示米黄色系设计

- [ ] **Step 4: 提交更改**

```bash
git add frontend/src/pages/TransactionList.tsx frontend/src/pages/NewTransaction.tsx
git commit -m "feat: redesign transaction pages with beige theme"
```

---

### Task 8: 最终测试和优化

**Files:**
- Test all pages

**Interfaces:**
- Validates: 所有页面的视觉一致性和功能完整性

- [ ] **Step 1: 完整功能测试**

测试所有页面和功能：

```bash
cd frontend
npm run dev
```

测试清单：
- ✅ 登录页面：表单样式、错误提示、跳转
- ✅ 注册页面：表单样式、验证、跳转
- ✅ Dashboard：卡片显示、图表渲染、AI 洞察
- ✅ 导航栏：链接切换、活动状态、退出登录
- ✅ AI Chat：消息发送、流式显示、样式
- ✅ 交易列表：列表显示、分页、删除
- ✅ 新建交易：NLP 输入、手动输入、表单提交

- [ ] **Step 2: 响应式测试**

测试不同屏幕尺寸：

```bash
# 在浏览器中测试以下尺寸：
# - 移动端：375px
# - 平板：768px
# - 桌面：1280px
```

预期：所有页面在各尺寸下显示正常

- [ ] **Step 3: 浏览器兼容性测试**

测试主流浏览器：
- Chrome/Edge
- Firefox
- Safari

- [ ] **Step 4: 性能检查**

```bash
npm run build
```

预期：构建成功，无错误和警告

- [ ] **Step 5: 最终提交**

```bash
git add .
git commit -m "feat: complete beige UI redesign with elegant components

- Add beige color palette to Tailwind config
- Create reusable Button, Card, Input components
- Redesign all pages with consistent beige theme
- Improve visual hierarchy and spacing
- Add smooth transitions and hover effects
- Ensure responsive design across all screen sizes"
```

---

## 实施完成检查清单

完成所有任务后，验证以下内容：

- [ ] 所有页面使用统一的米黄色系配色
- [ ] 按钮、卡片、输入框等组件样式一致
- [ ] 所有交互都有平滑的过渡动画
- [ ] 响应式设计在移动端和桌面端都正常
- [ ] 文字对比度符合可读性标准
- [ ] 所有原有功能保持正常工作
- [ ] 没有 TypeScript 或 ESLint 错误
- [ ] 构建成功且性能良好

---

## 执行方式选择

计划已完成并保存到 `docs/superpowers/plans/2026-08-12-beige-ui-redesign.md`。

**两种执行方式：**

**1. Subagent-Driven（推荐）** - 我为每个任务派发一个新的子代理，任务间进行审查，快速迭代

**2. Inline Execution** - 在当前会话中使用 executing-plans 执行任务，批量执行并设置检查点

**选择哪种方式？**
