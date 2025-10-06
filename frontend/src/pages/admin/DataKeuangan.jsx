import React, { useState } from 'react';

const DataKeuangan = () => {
  const [activeTab, setActiveTab] = useState('rekap');

  const rekapData = [
    { bulan: 'Januari 2024', pemasukan: 7500000, pengeluaran: 5200000, saldo: 2300000 },
    { bulan: 'Februari 2024', pemasukan: 8200000, pengeluaran: 6100000, saldo: 2100000 },
    { bulan: 'Maret 2024', pemasukan: 6800000, pengeluaran: 4500000, saldo: 2300000 }
  ];

  const arusKasData = [
    { tanggal: '2024-03-15', keterangan: 'Pembayaran SPP', jenis: 'Pemasukan', jumlah: 2500000 },
    { tanggal: '2024-03-14', keterangan: 'Donasi PT Sejahtera', jenis: 'Pemasukan', jumlah: 5000000 },
    { tanggal: '2024-03-13', keterangan: 'Gaji Pengajar', jenis: 'Pengeluaran', jumlah: 3500000 },
    { tanggal: '2024-03-12', keterangan: 'Pembelian Buku', jenis: 'Pengeluaran', jumlah: 800000 }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'rekap':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemasukan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengeluaran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rekapData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.bulan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">Rp {item.pemasukan.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">Rp {item.pengeluaran.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">Rp {item.saldo.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'arus-kas':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {arusKasData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggal}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.keterangan}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.jenis === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.jenis}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.jenis === 'Pemasukan' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Rp {item.jumlah.toLocaleString()}
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Data Keuangan</h1>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-800">Total Pemasukan</h3>
          <p className="text-3xl font-bold text-green-600">Rp 22.500.000</p>
          <p className="text-sm text-gray-600 mt-1">Tahun 2024</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-800">Total Pengeluaran</h3>
          <p className="text-3xl font-bold text-red-600">Rp 15.800.000</p>
          <p className="text-sm text-gray-600 mt-1">Tahun 2024</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800">Saldo Akhir</h3>
          <p className="text-3xl font-bold text-blue-600">Rp 6.700.000</p>
          <p className="text-sm text-gray-600 mt-1">Sampai Maret 2024</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['rekap', 'arus-kas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'rekap' && 'Rekap Keuangan'}
                {tab === 'arus-kas' && 'Arus Kas'}
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

export default DataKeuangan;