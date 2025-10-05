import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../components/layout/AuthDashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pembayaranTertunda: 0
  });

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Example API calls - adjust based on your backend
        const responses = await Promise.all([
          fetch('/api/pembayaran/tertunda')
        ]);

        const data = await Promise.all(responses.map(res => res.json()));
        
        setStats({
          pembayaranTertunda: data[3].total || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      name: 'Pembayaran Tertunda', 
      value: stats.pembayaranTertunda, 
      color: 'bg-orange-500',
      icon: '⏰',
      link: '/admin/pembayaran'
    },
  ];

  const quickActions = [
    {
      name: 'Data Syahriah',
      description: 'Kelola pembayaran syahriah santri',
      icon: '💰',
      color: 'bg-purple-600 hover:bg-purple-700',
      link: '/admin/syahriah'
    },
    {
      name: 'Data Donasi',
      description: 'Kelola donasi dan transaksi',
      icon: '🎁',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      link: '/admin/donasi'
    },
    {
      name: 'Rekap Keuangan',
      description: 'Laporan keuangan lengkap',
      icon: '📊',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      link: '/admin/keuangan'
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
    <AuthDashboardLayout title="Dashboard Admin">
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-green-100">Anda login sebagai Administrator TPQ</p>
        <div className="flex items-center mt-4 space-x-2 text-sm">
          <span className="bg-green-400 bg-opacity-20 px-3 py-1 rounded-full">📊 Dashboard</span>
          <span className="bg-green-400 bg-opacity-20 px-3 py-1 rounded-full">👨‍💼 Admin</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
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

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Aksi Cepat</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className={`${action.color} text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <div className="font-semibold text-lg">{action.name}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Santri Baru</h4>
            <Link 
              to="/admin/santri"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Ahmad Fauzi</td>
                  <td className="px-4 py-3 text-sm text-gray-600">TPQ 1</td>
                  <td className="px-4 py-3 text-sm text-gray-600">15 Nov 2024</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Aktif</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Siti Rahma</td>
                  <td className="px-4 py-3 text-sm text-gray-600">TPQ 2</td>
                  <td className="px-4 py-3 text-sm text-gray-600">14 Nov 2024</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Aktif</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Pembayaran Terbaru</h4>
            <Link 
              to="/admin/syahriah"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Ahmad Fauzi</div>
                <div className="text-sm text-gray-600">Syahriah November</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">Rp 150.000</div>
                <div className="text-xs text-gray-500">15 Nov 2024</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Siti Rahma</div>
                <div className="text-sm text-gray-600">Donasi Pembangunan</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">Rp 500.000</div>
                <div className="text-xs text-gray-500">14 Nov 2024</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthDashboardLayout>
  );
};

export default AdminDashboard;