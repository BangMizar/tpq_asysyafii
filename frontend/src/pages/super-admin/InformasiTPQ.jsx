import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const InformasiTPQ = () => {
  const [informasi, setInformasi] = useState({
    namaTpq: 'TPQ Al-Hikmah',
    alamat: 'Jl. Pendidikan No. 123, Jakarta Selatan',
    telepon: '(021) 1234567',
    email: 'info@tpqalhikmah.sch.id',
    visi: 'Menjadi lembaga pendidikan Al-Quran yang unggul dan berkualitas',
    misi: 'Membentuk generasi Qurani yang berakhlak mulia dan berprestasi'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Simpan data ke backend
    setIsEditing(false);
    alert('Informasi TPQ berhasil diperbarui!');
  };

  return (
    <AuthDashboardLayout>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Informasi TPQ</h1>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {isEditing ? 'Simpan Perubahan' : 'Edit Informasi'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama TPQ</label>
            {isEditing ? (
              <input
                type="text"
                value={informasi.namaTpq}
                onChange={(e) => setInformasi({...informasi, namaTpq: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{informasi.namaTpq}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            {isEditing ? (
              <textarea
                value={informasi.alamat}
                onChange={(e) => setInformasi({...informasi, alamat: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
              />
            ) : (
              <p className="text-gray-900">{informasi.alamat}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
            {isEditing ? (
              <input
                type="text"
                value={informasi.telepon}
                onChange={(e) => setInformasi({...informasi, telepon: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{informasi.telepon}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={informasi.email}
                onChange={(e) => setInformasi({...informasi, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{informasi.email}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Visi</label>
          {isEditing ? (
            <textarea
              value={informasi.visi}
              onChange={(e) => setInformasi({...informasi, visi: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
            />
          ) : (
            <p className="text-gray-900">{informasi.visi}</p>
          )}
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Misi</label>
          {isEditing ? (
            <textarea
              value={informasi.misi}
              onChange={(e) => setInformasi({...informasi, misi: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="4"
            />
          ) : (
            <p className="text-gray-900 whitespace-pre-line">{informasi.misi}</p>
          )}
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-green-600">150</div>
          <div className="text-gray-600">Total Santri</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-blue-600">8</div>
          <div className="text-gray-600">Pengajar</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-purple-600">6</div>
          <div className="text-gray-600">Kelas</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-yellow-600">5</div>
          <div className="text-gray-600">Tahun Berdiri</div>
        </div>
      </div>
    </div>
    </AuthDashboardLayout>
  );
};

export default InformasiTPQ;