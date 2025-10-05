import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalSantri: 0,
    totalDonasi: 0
  });

  // Fetch system stats from API
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const responses = await Promise.all([
          fetch('/api/users/total'),
          fetch('/api/admins/total'),
          fetch('/api/santri/total'),
          fetch('/api/donasi/total')
        ]);

        const data = await Promise.all(responses.map(res => res.json()));
        
        setSystemStats({
          totalUsers: data[0].total || 0,
          totalAdmins: data[1].total || 0,
          totalSantri: data[2].total || 0,
          totalDonasi: data[3].total || 0
        });
      } catch (error) {
        console.error('Error fetching system stats:', error);
      }
    };

    fetchSystemStats();
  }, []);

  const systemStatCards = [
    { 
      name: 'Total Pengguna', 
      value: systemStats.totalUsers, 
      color: 'bg-blue-500',
      icon: '👥',
      link: '/super-admin/users'
    },
    { 
      name: 'Admin TPQ', 
      value: systemStats.totalAdmins, 
      color: 'bg-green-500',
      icon: '👨‍💼',
      link: '/super-admin/admins'
    },
    { 
      name: 'Total Santri', 
      value: systemStats.totalSantri, 
      color: 'bg-purple-500',
      icon: '👦',
      link: '/super-admin/santri'
    },
    { 
      name: 'Total Donasi', 
      value: `Rp ${systemStats.totalDonasi.toLocaleString('id-ID')}`,
      color: 'bg-yellow-500',
      icon: '💰',
      link: '/super-admin/donasi'
    },
  ];

  const superAdminFeatures = [
    {
      name: 'Manajemen User',
      description: 'Kelola semua pengguna sistem',
      icon: '👥',
      color: 'bg-blue-600 hover:bg-blue-700',
      link: '/super-admin/users'
    },
    {
      name: 'Data Pengumuman',
      description: 'Buat dan kelola pengumuman',
      icon: '📢',
      color: 'bg-green-600 hover:bg-green-700',
      link: '/super-admin/pengumuman'
    },
    {
      name: 'Data Berita',
      description: 'Kelola konten berita TPQ',
      icon: '📰',
      color: 'bg-purple-600 hover:bg-purple-700',
      link: '/super-admin/berita'
    },
    {
      name: 'Informasi TPQ',
      description: 'Kelola profil dan informasi TPQ',
      icon: '🏫',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      link: '/super-admin/informasi-tpq'
    },
    {
      name: 'Data Santri',
      description: 'Akses data santri semua TPQ',
      icon: '👦',
      color: 'bg-orange-600 hover:bg-orange-700',
      link: '/super-admin/santri'
    },
    {
      name: 'Data Syahriah',
      description: 'Monitor pembayaran syahriah',
      icon: '💳',
      color: 'bg-teal-600 hover:bg-teal-700',
      link: '/super-admin/syahriah'
    },
    {
      name: 'Data Donasi',
      description: 'Kelola donasi sistem',
      icon: '🎁',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      link: '/super-admin/donasi'
    },
    {
      name: 'Rekap Keuangan',
      description: 'Laporan keuangan lengkap',
      icon: '📊',
      color: 'bg-red-600 hover:bg-red-700',
      link: '/super-admin/keuangan'
    },
    {
      name: 'System Logs',
      description: 'Monitor aktivitas sistem',
      icon: '📋',
      color: 'bg-gray-600 hover:bg-gray-700',
      link: '/super-admin/logs'
    }
  ];

  const adminFeatures = [
    {
      name: 'Kelola Santri',
      description: 'Tambah, edit, dan kelola data santri',
      icon: '👦',
      color: 'bg-green-600 hover:bg-green-700',
      link: '/admin/santri'
    },
    {
      name: 'Input Kehadiran',
      description: 'Catat kehadiran santri harian',
      icon: '📝',
      color: 'bg-blue-600 hover:bg-blue-700',
      link: '/admin/kehadiran'
    },
    {
      name: 'Lihat Pembayaran',
      description: 'Monitor pembayaran syahriah',
      icon: '💰',
      color: 'bg-purple-600 hover:bg-purple-700',
      link: '/admin/pembayaran'
    },
    {
      name: 'Laporan Bulanan',
      description: 'Generate laporan periodik',
      icon: '📈',
      color: 'bg-orange-600 hover:bg-orange-700',
      link: '/admin/laporan'
    }
  ];

  return (
    <DashboardLayout title="Dashboard Super Admin">
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-blue-100">Anda login sebagai Super Administrator System</p>
        <div className="flex items-center mt-4 space-x-2 text-sm">
          <span className="bg-blue-400 bg-opacity-20 px-3 py-1 rounded-full">⚡ Super Admin</span>
          <span className="bg-blue-400 bg-opacity-20 px-3 py-1 rounded-full">🔧 System Control</span>
          <span className="bg-blue-400 bg-opacity-20 px-3 py-1 rounded-full">📊 Master Data</span>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {systemStatCards.map((stat, index) => (
          <Link 
            key={index} 
            to={stat.link}
            className="block transform hover:scale-105 transition-transform duration-300"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <span className="text-white text-xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Super Admin Features */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Fitur Super Admin</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {superAdminFeatures.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className={`${feature.color} text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <div className="font-semibold text-lg">{feature.name}</div>
                  <div className="text-sm opacity-90">{feature.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Admin Features (Available for Super Admin too) */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-gray-800">Fitur Admin TPQ</h4>
          <span className="text-sm text-gray-500">Juga tersedia untuk Super Admin</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminFeatures.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className={`${feature.color} text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <div className="font-semibold text-lg">{feature.name}</div>
                  <div className="text-sm opacity-90">{feature.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent System Activities */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Aktivitas Sistem Terbaru</h4>
            <Link 
              to="/super-admin/logs"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">User baru terdaftar</div>
                <div className="text-xs text-gray-500">Admin TPQ Al-Hikmah • 2 menit lalu</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Pengumuman diperbarui</div>
                <div className="text-xs text-gray-500">Super Admin • 15 menit lalu</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Donasi masuk</div>
                <div className="text-xs text-gray-500">Rp 500.000 • 1 jam lalu</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick System Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Informasi Sistem</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-medium text-gray-900">System Status</div>
                  <div className="text-sm text-gray-600">Semua sistem berjalan normal</div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="font-medium text-gray-900">Security Level</div>
                  <div className="text-sm text-gray-600">Tinggi - Aman</div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💾</span>
                <div>
                  <div className="font-medium text-gray-900">Database</div>
                  <div className="text-sm text-gray-600">2.5 GB digunakan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;