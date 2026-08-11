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

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-beige-100 to-beige-50">
      <nav className="bg-white/80 backdrop-blur-sm shadow-soft border-b-2 border-beige-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-beige-900 flex items-center">
                  <span className="text-2xl mr-2">💰</span> 财务顾问
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/app/dashboard"
                  className={`${
                    isActive('/app/dashboard')
                      ? 'border-beige-500 text-beige-900'
                      : 'border-transparent text-beige-600 hover:border-beige-300 hover:text-beige-800'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  概览
                </Link>
                <Link
                  to="/app/transactions"
                  className={`${
                    isActive('/app/transactions')
                      ? 'border-beige-500 text-beige-900'
                      : 'border-transparent text-beige-600 hover:border-beige-300 hover:text-beige-800'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  交易
                </Link>
                <Link
                  to="/app/chat"
                  className={`${
                    isActive('/app/chat')
                      ? 'border-beige-500 text-beige-900'
                      : 'border-transparent text-beige-600 hover:border-beige-300 hover:text-beige-800'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  AI顾问
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-beige-700 font-medium">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-beige-700 hover:text-beige-900 hover:bg-beige-100 rounded-xl transition-all duration-200 font-medium"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
