// pages/wali/KeuanganTPQ.jsx
import React from 'react';

const KeuanganTPQ = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Keuangan TPQ</h1>
        <p className="text-gray-600">Informasi keuangan dan laporan keuangan TPQ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Kas TPQ</p>
              <p className="text-2xl font-bold text-gray-900">Rp 15.250.000</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pemasukan Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">Rp 3.500.000</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">Rp 2.800.000</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Laporan Keuangan Terbaru</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Fitur Dalam Pengembangan</h3>
            <p className="text-gray-600">Laporan keuangan detail akan segera tersedia</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeuanganTPQ;