// components/layout/TopBar.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const TopBar = ({ title }) => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Selamat datang, <span className="font-medium">{user?.nama_lengkap}</span>
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">

          
        </div>
      </div>
    </header>
  );
};

export default TopBar;