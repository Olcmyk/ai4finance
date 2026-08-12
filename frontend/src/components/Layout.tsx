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
    <div className="min-h-screen bg-luxury-cream">
      {/* Luxury Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-luxury-border sticky top-0 z-50 shadow-luxury">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <span className="text-2xl font-display font-bold text-luxury-gold tracking-wider">
                    WEALTH ADVISOR
                  </span>
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-luxury-gold to-luxury-lightGold"></div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-12 sm:flex sm:space-x-8">
                <Link
                  to="/app/dashboard"
                  className={`
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium tracking-wide uppercase
                    transition-all duration-300
                    ${isActive('/app/dashboard')
                      ? 'border-luxury-gold text-luxury-gold'
                      : 'border-transparent text-luxury-darkBrown hover:border-luxury-beige hover:text-luxury-gold'
                    }
                  `}
                >
                  概览
                </Link>
                <Link
                  to="/app/transactions"
                  className={`
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium tracking-wide uppercase
                    transition-all duration-300
                    ${isActive('/app/transactions')
                      ? 'border-luxury-gold text-luxury-gold'
                      : 'border-transparent text-luxury-darkBrown hover:border-luxury-beige hover:text-luxury-gold'
                    }
                  `}
                >
                  交易
                </Link>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-luxury-darkBrown tracking-wide">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-luxury-brown hover:text-luxury-gold transition-colors duration-300 tracking-wide uppercase"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Decorative Gold Line at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-luxury-gold to-transparent opacity-30"></div>
    </div>
  );
};

export default Layout;
