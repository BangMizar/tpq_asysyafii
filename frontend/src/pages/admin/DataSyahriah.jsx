import React, { useState } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DataSyahriah = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pembayaran');

  const pembayaranData = [
    { id: 1, santri: 'Ahmad Fauzi', bulan: 'Maret 2024', jumlah: 50000, tanggal: '2024-03-15', status: 'Lunas' },
    { id: 2, santri: 'Siti Rahma', bulan: 'Maret 2024', jumlah: 50000, tanggal: '2024-03-14', status: 'Lunas' },
    { id: 3, santri: 'Muhammad Ali', bulan: 'Maret 2024', jumlah: 0, tanggal: '-', status: 'Belum Bayar' }
  ];

  const tunggakanData = [
    { id: 1, santri: 'Muhammad Ali', bulan: 'Januari 2024', jumlah: 50000 },
    { id: 2, santri: 'Muhammad Ali', bulan: 'Februari 2024', jumlah: 50000 },
    { id: 3, santri: 'Budi Santoso', bulan: 'Maret 2024', jumlah: 50000 }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pembayaran':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Bayar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pembayaranData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.santri}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.bulan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.jumlah > 0 ? `Rp ${item.jumlah.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggal}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'Lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.status === 'Belum Bayar' ? (
                        <button className="text-green-600 hover:text-green-900">Input Pembayaran</button>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-900">Detail</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'tunggakan':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Tunggakan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tunggakanData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.santri}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.bulan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {item.jumlah.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-green-600 hover:text-green-900 mr-3">Bayar</button>
                      <button className="text-blue-600 hover:text-blue-900">Reminder</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AuthDashboardLayout title="Data Syahriah">
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-purple-100">Kelola data syahriah dan pembayaran santri</p>
        <div className="flex items-center mt-4 space-x-2 text-sm">
          <span className="bg-purple-400 bg-opacity-20 px-3 py-1 rounded-full">💰 Syahriah</span>
          <span className="bg-purple-400 bg-opacity-20 px-3 py-1 rounded-full">👨‍💼 Admin</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pembayaran Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">Rp 1.250.000</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Santri Lunas</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Santri Menunggak</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Aksi Cepat</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">➕</span>
              <div>
                <div className="font-semibold text-lg">Input Pembayaran</div>
                <div className="text-sm opacity-90">Bayar syahriah santri</div>
              </div>
            </div>
          </button>
          
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-semibold text-lg">Laporan Bulanan</div>
                <div className="text-sm opacity-90">Generate laporan</div>
              </div>
            </div>
          </button>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📧</span>
              <div>
                <div className="font-semibold text-lg">Kirim Reminder</div>
                <div className="text-sm opacity-90">Pengingat pembayaran</div>
              </div>
            </div>
          </button>
          
          <Link 
            to="/admin/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏠</span>
              <div>
                <div className="font-semibold text-lg">Kembali</div>
                <div className="text-sm opacity-90">Ke dashboard</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Data Pembayaran Syahriah</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Input Pembayaran
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {['pembayaran', 'tunggakan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'pembayaran' && 'Data Pembayaran'}
                {tab === 'tunggakan' && 'Tunggakan'}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Table Content */}
        <div>
          {renderContent()}
        </div>
      </div>
    </AuthDashboardLayout>
  );
};

export default DataSyahriah;