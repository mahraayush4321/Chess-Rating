import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-zinc-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg 
                className="h-8 w-8 text-white"
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
              <span className="ml-2 text-xl font-bold text-white">Chess Game</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-8">
            <Link
              to="/home"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/leaderboard"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              to="/profile"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Profile
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;