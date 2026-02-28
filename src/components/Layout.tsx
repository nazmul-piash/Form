import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Outlet } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import CookieBanner from './CookieBanner';

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center font-bold text-xl text-indigo-600">
                FormApp
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <UserIcon className="h-4 w-4 mr-1" />
                {user?.fullName || user?.email || 'User'} ({user?.role})
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow w-full">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link to="/privacy" className="text-gray-400 hover:text-gray-500 text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-gray-500 text-sm">
              Terms of Service
            </Link>
            <a href="mailto:support@example.com" className="text-gray-400 hover:text-gray-500 text-sm">
              Contact
            </a>
          </div>
          <div className="mt-4 md:mt-0 md:order-1">
            <p className="text-center text-xs text-gray-400">
              &copy; 2024 FormApp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </div>
  );
};

export default Layout;
