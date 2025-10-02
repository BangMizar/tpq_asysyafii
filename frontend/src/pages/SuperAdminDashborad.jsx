// pages/SuperAdminDashboard.js
import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Admin', value: '5', color: 'bg-blue-500' },
    { name: 'Total Wali', value: '150', color: 'bg-green-500' },
    { name: 'Total Santri', value: '200', color: 'bg-purple-500' },
    { name: 'Aktivitas Bulan Ini', value: '1,234', color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout title="Dashboard Super Admin">
      {/* Welcome Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-gray-600">Anda login sebagai Super Administrator</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
            Kelola Admin
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
            Lihat Laporan
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
            Pengaturan Sistem
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terbaru</h4>
        <div className="space-y-3">
          {[
            'Admin baru ditambahkan - Ahmad',
            'Laporan bulanan di-generate',
            'Perubahan pengaturan sistem',
            'Backup database dilakukan'
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{activity}</span>
              <span className="text-gray-400">2 jam yang lalu</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;