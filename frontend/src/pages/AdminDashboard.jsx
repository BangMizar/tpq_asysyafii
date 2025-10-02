// pages/AdminDashboard.js
import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Santri Aktif', value: '150', color: 'bg-green-500' },
    { name: 'Wali Terdaftar', value: '120', color: 'bg-blue-500' },
    { name: 'Kehadiran Hari Ini', value: '85%', color: 'bg-purple-500' },
    { name: 'Pembayaran Tertunda', value: '12', color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout title="Dashboard Admin">
      {/* Welcome Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-gray-600">Anda login sebagai Administrator</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">📈</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
            Kelola Santri
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
            Input Kehadiran
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
            Lihat Pembayaran
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
            Laporan Bulanan
          </button>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Santri Baru</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Daftar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">Ahmad Fauzi</td>
                <td className="px-4 py-3 text-sm text-gray-600">TPQ 1</td>
                <td className="px-4 py-3 text-sm text-gray-600">15 Nov 2024</td>
                <td className="px-4 py-3">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Aktif</span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">Siti Rahma</td>
                <td className="px-4 py-3 text-sm text-gray-600">TPQ 2</td>
                <td className="px-4 py-3 text-sm text-gray-600">14 Nov 2024</td>
                <td className="px-4 py-3">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Aktif</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;