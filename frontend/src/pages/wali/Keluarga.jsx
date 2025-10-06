// pages/wali/Keluarga.jsx
import React from 'react';

const Keluarga = () => {
  const anggotaKeluarga = [
    {
      id: 1,
      nama: 'Ahmad Santoso',
      kelas: 'TPQ A - Madrasah Ibtidaiyah',
      status: 'Aktif',
      terdaftar: '2023-08-15'
    },
    {
      id: 2,
      nama: 'Siti Rahma',
      kelas: 'TPQ B - Madrasah Tsanawiyah',
      status: 'Aktif',
      terdaftar: '2023-08-15'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Keluarga</h1>
        <p className="text-gray-600">Kelola data anggota keluarga yang terdaftar di TPQ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👪</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Anggota Keluarga</p>
              <p className="text-2xl font-bold text-gray-900">2 Santri</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Status Aktif</p>
              <p className="text-2xl font-bold text-gray-900">2 Santri</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Kelas Terdaftar</p>
              <p className="text-2xl font-bold text-gray-900">2 Kelas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Anggota Keluarga</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {anggotaKeluarga.map((anggota) => (
              <div key={anggota.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {anggota.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{anggota.nama}</h3>
                    <p className="text-sm text-gray-600">{anggota.kelas}</p>
                    <p className="text-xs text-gray-500">Terdaftar: {new Date(anggota.terdaftar).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {anggota.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Keluarga;