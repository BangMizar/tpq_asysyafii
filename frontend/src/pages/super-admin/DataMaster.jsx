import React, { useState } from 'react';

const DataMaster = () => {
  const [activeTab, setActiveTab] = useState('santri');

  const santriData = [
    { id: 1, nama: 'Ahmad Fauzi', kelas: 'TPQ A', usia: 8, wali: 'Budi Santoso', status: 'Aktif' },
    { id: 2, nama: 'Siti Rahma', kelas: 'TPQ B', usia: 9, wali: 'Sari Indah', status: 'Aktif' },
    { id: 3, nama: 'Muhammad Ali', kelas: 'TPQ A', usia: 7, wali: 'Ali Hasan', status: 'Nonaktif' }
  ];

  const syahriahData = [
    { id: 1, bulan: 'Januari 2024', total: 2500000, terbayar: 2300000, tunggakan: 200000 },
    { id: 2, bulan: 'Februari 2024', total: 2500000, terbayar: 2500000, tunggakan: 0 },
    { id: 3, bulan: 'Maret 2024', total: 2500000, terbayar: 1800000, tunggakan: 700000 }
  ];

  const donasiData = [
    { id: 1, donatur: 'PT Sejahtera', jumlah: 5000000, tanggal: '2024-03-01', jenis: 'Tunai' },
    { id: 2, donatur: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-03-05', jenis: 'Transfer' },
    { id: 3, donatur: 'Anonim', jumlah: 500000, tanggal: '2024-03-10', jenis: 'Tunai' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'santri':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {santriData.map((santri) => (
                  <tr key={santri.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{santri.nama}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{santri.kelas}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{santri.usia} tahun</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{santri.wali}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        santri.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {santri.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'syahriah':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terbayar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tunggakan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {syahriahData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.bulan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {item.total.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {item.terbayar.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {item.tunggakan.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'donasi':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donasiData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.donatur}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {item.jumlah.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jenis}</td>
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Data Master</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['santri', 'syahriah', 'donasi', 'keuangan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'santri' && 'Data Santri'}
                {tab === 'syahriah' && 'Data Syahriah'}
                {tab === 'donasi' && 'Data Donasi'}
                {tab === 'keuangan' && 'Rekap Keuangan'}
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

export default DataMaster;