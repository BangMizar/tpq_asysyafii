import React, { useState } from 'react';

const DataSyahriah = () => {
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Syahriah</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          Input Pembayaran
        </button>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-800">Total Pembayaran Bulan Ini</h3>
          <p className="text-3xl font-bold text-green-600">Rp 1.250.000</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800">Santri Lunas</h3>
          <p className="text-3xl font-bold text-blue-600">45</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-800">Santri Menunggak</h3>
          <p className="text-3xl font-bold text-red-600">8</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
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
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DataSyahriah;