import React, { useState } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DataDonasi = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('data');

  const donasiData = [
    { id: 1, donatur: 'PT Sejahtera', jumlah: 5000000, tanggal: '2024-03-15', jenis: 'Transfer', status: 'Diterima' },
    { id: 2, donatur: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-03-14', jenis: 'Tunai', status: 'Diterima' },
    { id: 3, donatur: 'Sari Indah', jumlah: 500000, tanggal: '2024-03-10', jenis: 'Transfer', status: 'Pending' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'data':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donasiData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.donatur}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {item.jumlah.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jenis}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'Diterima' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-green-600 hover:text-green-900 mr-3">Konfirmasi</button>
                      <button className="text-red-600 hover:text-red-900">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'laporan':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Laporan Donasi Bulan Ini</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Donasi:</span>
                    <span className="font-semibold text-gray-900">Rp 6.500.000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Jumlah Donatur:</span>
                    <span className="font-semibold text-gray-900">15</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Rata-rata Donasi:</span>
                    <span className="font-semibold text-gray-900">Rp 433.333</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Donasi Tertinggi:</span>
                    <span className="font-semibold text-gray-900">Rp 2.000.000</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Download Laporan</h3>
                <div className="space-y-3">
                  <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                    📄 Laporan Bulanan
                  </button>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    📊 Laporan Tahunan
                  </button>
                  <button className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    📋 Laporan Donatur
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AuthDashboardLayout title="Data Donasi">
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-yellow-100">Kelola data donasi dan transaksi amal</p>
        <div className="flex items-center mt-4 space-x-2 text-sm">
          <span className="bg-yellow-400 bg-opacity-20 px-3 py-1 rounded-full">🎁 Donasi</span>
          <span className="bg-yellow-400 bg-opacity-20 px-3 py-1 rounded-full">👨‍💼 Admin</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Donasi</p>
              <p className="text-2xl font-bold text-gray-900">Rp 25.5Jt</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Donatur Aktif</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">Rp 2.1Jt</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-yellow-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⏰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Aksi Cepat</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">➕</span>
              <div>
                <div className="font-semibold text-lg">Input Donasi</div>
                <div className="text-sm opacity-90">Tambah data donasi</div>
              </div>
            </div>
          </button>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📧</span>
              <div>
                <div className="font-semibold text-lg">Kirim Terima Kasih</div>
                <div className="text-sm opacity-90">Email ke donatur</div>
              </div>
            </div>
          </button>
          
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-semibold text-lg">Laporan Cepat</div>
                <div className="text-sm opacity-90">Generate laporan</div>
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
          <h2 className="text-xl font-bold text-gray-800">Manajemen Donasi</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
            + Input Donasi
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {['data', 'laporan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'data' && 'Data Donasi'}
                {tab === 'laporan' && 'Laporan Donasi'}
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

export default DataDonasi;