// components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Menu untuk Super Admin
  const superAdminMenu = [
    {
      title: 'Dashboard',
      path: '/super-admin',
      icon: '📊',
      submenu: []
    },
    {
      title: 'Manajemen User',
      path: '/super-admin/users',
      icon: '👥',
      submenu: [
        { title: 'Data User', path: '/super-admin/users' },
        { title: 'Data Admin', path: '/super-admin/admins' },
        { title: 'Tambah User', path: '/super-admin/users/tambah' }
      ]
    },
    {
      title: 'Konten & Informasi',
      path: '/super-admin/konten',
      icon: '📰',
      submenu: [
        { title: 'Data Pengumuman', path: '/super-admin/pengumuman' },
        { title: 'Data Berita', path: '/super-admin/berita' },
        { title: 'Informasi TPQ', path: '/super-admin/informasi-tpq' }
      ]
    },
    {
      title: 'Data Master',
      path: '/super-admin/data',
      icon: '🗃️',
      submenu: [
        { title: 'Data Santri', path: '/super-admin/santri' },
        { title: 'Data Syahriah', path: '/super-admin/syahriah' },
        { title: 'Data Donasi', path: '/super-admin/donasi' },
        { title: 'Rekap Keuangan', path: '/super-admin/keuangan' }
      ]
    },
    {
      title: 'System',
      path: '/super-admin/system',
      icon: '⚙️',
      submenu: [
        { title: 'System Logs', path: '/super-admin/logs' },
        { title: 'Backup Data', path: '/super-admin/backup' },
        { title: 'Pengaturan', path: '/super-admin/settings' }
      ]
    }
  ];

  // Menu untuk Admin
  const adminMenu = [
    {
      title: 'Dashboard',
      path: '/admin',
      icon: '📊',
      submenu: []
    },
    {
      title: 'Data Wali',
      path: '/admin/user',
      icon: '👦',
      submenu: [
        { title: 'Data Santri', path: '/admin/santri' },
        { title: 'Tambah Santri', path: '/admin/santri/tambah' },
        { title: 'Kelas & Grup', path: '/admin/kelas' }
      ]
    },
    {
      title: 'Data Syahriah',
      path: '/admin/syahriah',
      icon: '💰',
      submenu: [
        { title: 'Data Pembayaran', path: '/admin/syahriah' },
        { title: 'Input Pembayaran', path: '/admin/syahriah/input' },
        { title: 'Tunggakan', path: '/admin/syahriah/tunggakan' }
      ]
    },
    {
      title: 'Data Donasi',
      path: '/admin/donasi',
      icon: '🎁',
      submenu: [
        { title: 'Data Donasi', path: '/admin/donasi' },
        { title: 'Input Donasi', path: '/admin/donasi/input' },
        { title: 'Laporan Donasi', path: '/admin/donasi/laporan' }
      ]
    },
    {
      title: 'Keuangan',
      path: '/admin/keuangan',
      icon: '📊',
      submenu: [
        { title: 'Rekap Keuangan', path: '/admin/keuangan' },
        { title: 'Laporan Bulanan', path: '/admin/keuangan/laporan' },
        { title: 'Arus Kas', path: '/admin/keuangan/arus-kas' }
      ]
    },
    {
      title: 'Laporan',
      path: '/admin/laporan',
      icon: '📈',
      submenu: [
        { title: 'Laporan Bulanan', path: '/admin/laporan/bulanan' },
        { title: 'Laporan Tahunan', path: '/admin/laporan/tahunan' }
      ]
    }
  ];

  const menuItems = isSuperAdmin ? superAdminMenu : adminMenu;

  const MenuItem = ({ item, level = 0 }) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    return (
      <div>
        <Link
          to={hasSubmenu ? '#' : item.path}
          onClick={() => hasSubmenu && setIsSubmenuOpen(!isSubmenuOpen)}
          className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
            isActive(item.path)
              ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          } ${level > 0 ? 'pl-8' : ''}`}
        >
          <span className="text-lg flex-shrink-0">{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {hasSubmenu && (
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isSubmenuOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </>
          )}
        </Link>
        
        {hasSubmenu && isSubmenuOpen && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.submenu.map((subItem, index) => (
              <MenuItem key={index} item={subItem} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TPQ</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">System TPQ</h1>
              <p className="text-xs text-gray-500 capitalize">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">TPQ</span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
              isCollapsed ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.nama_lengkap?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nama_lengkap || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="p-4 border-b border-gray-200 flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.nama_lengkap?.charAt(0) || 'U'}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {menuItems.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {/* Switch Dashboard Button for Super Admin */}
        {isSuperAdmin && !isCollapsed && (
          <Link
            to={location.pathname.includes('/super-admin') ? '/admin' : '/super-admin'}
            className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 mb-2"
          >
            <span className="text-lg">🔄</span>
            <span>
              Switch to {location.pathname.includes('/super-admin') ? 'Admin' : 'Super Admin'}
            </span>
          </Link>
        )}

        {isSuperAdmin && isCollapsed && (
          <Link
            to={location.pathname.includes('/super-admin') ? '/admin' : '/super-admin'}
            className="flex items-center justify-center p-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 mb-2"
            title="Switch Dashboard"
          >
            <span className="text-lg">🔄</span>
          </Link>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <span className="text-lg">🚪</span>
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;