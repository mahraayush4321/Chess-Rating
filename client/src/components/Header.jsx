import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/'); 
    setMobileMenuOpen(false); 
  };

  const navigationItems = [
    { name: 'Home', path: '/home' },
    { name: 'Play with AI', path: '/play-ai' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <header className="bg-zinc-900/95 backdrop-blur-sm shadow-lg w-full fixed top-0 left-0 right-0 z-50 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center group">
              <div className="p-1 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 group-hover:rotate-12 transition-transform">
                <svg 
                  className="h-7 w-7 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" />
                  <path d="M12 22V12" />
                  <path d="M20 7L12 12L4 7" />
                </svg>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                ChessGenius
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Only show if user is logged in */}
          {user && (
            <>
              <nav className="hidden md:flex space-x-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="px-4 py-2 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all hover:bg-zinc-800/50"
                  >
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all hover:bg-zinc-800/50"
                >
                  Logout
                </button>
              </nav>

              {/* Mobile menu button */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-white focus:outline-none"
                >
                  <svg
                    className={`h-6 w-6 ${mobileMenuOpen ? 'hidden' : 'block'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`h-6 w-6 ${mobileMenuOpen ? 'block' : 'hidden'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu - Only show if user is logged in */}
      {user && (
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-zinc-900/95 border-t border-zinc-800">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;