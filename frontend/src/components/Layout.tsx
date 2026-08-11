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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <nav className="bg-white/90 backdrop-blur-md shadow-xl border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-2 mr-3 shadow-lg">
                  <span className="text-3xl">💰</span>
                </div>
                <span className="text-2xl font-black text-gray-900">
                  财务顾问
                </span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  to="/app/dashboard"
                  className={`${
                    isActive('/app/dashboard')
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-gray-900'
                  } inline-flex items-center px-6 py-2 rounded-2xl text-base font-bold transition-all duration-300 transform hover:scale-105`}
                >
                  📊 概览
                </Link>
                <Link
                  to="/app/transactions"
                  className={`${
                    isActive('/app/transactions')
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 hover:text-gray-900'
                  } inline-flex items-center px-6 py-2 rounded-2xl text-base font-bold transition-all duration-300 transform hover:scale-105`}
                >
                  💳 交易
                </Link>
                <Link
                  to="/app/chat"
                  className={`${
                    isActive('/app/chat')
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-green-100 hover:text-gray-900'
                  } inline-flex items-center px-6 py-2 rounded-2xl text-base font-bold transition-all duration-300 transform hover:scale-105`}
                >
                  🤖 AI顾问
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-2 rounded-2xl border-2 border-purple-200">
                <span className="text-2xl">👤</span>
                <span className="text-base font-bold text-gray-900">
                  {user?.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-3 text-base font-bold text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-500 bg-red-50 border-2 border-red-200 hover:border-transparent rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
