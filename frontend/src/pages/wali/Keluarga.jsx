// pages/wali/Keluarga.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Keluarga = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keluargaData, setKeluargaData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  
  // State untuk modal notifikasi
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    type: 'success', // 'success' | 'error'
    title: '',
    message: '',
    onConfirm: null
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fungsi untuk menampilkan modal notifikasi
  const showNotification = (type, title, message, onConfirm = null) => {
    setNotificationData({
      type,
      title,
      message,
      onConfirm
    });
    setShowNotificationModal(true);
  };

  // Fungsi untuk menutup modal notifikasi
  const closeNotification = () => {
    setShowNotificationModal(false);
    if (notificationData.onConfirm) {
      notificationData.onConfirm();
    }
  };

  // Fetch data keluarga
  const fetchKeluargaData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/keluarga/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Data keluarga belum terdaftar.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      setKeluargaData(data.data);

    } catch (err) {
      console.error('Error fetching keluarga data:', err);
      setError(err.message);
      setKeluargaData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeluargaData();
  }, [API_URL]);

  // Handle Edit Keluarga
  const handleEditKeluarga = () => {
    setFormData({
      no_kk: keluargaData?.no_kk || '',
      alamat: keluargaData?.alamat || '',
      rt_rw: keluargaData?.rt_rw || '',
      kelurahan: keluargaData?.kelurahan || '',
      kecamatan: keluargaData?.kecamatan || '',
      kota: keluargaData?.kota || '',
      provinsi: keluargaData?.provinsi || '',
      kode_pos: keluargaData?.kode_pos || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateKeluarga = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/keluarga/${keluargaData.id_keluarga}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setKeluargaData(data.data);
      setShowEditModal(false);
      showNotification('success', 'Berhasil!', 'Data keluarga berhasil diperbarui!');

    } catch (err) {
      console.error('Error updating keluarga:', err);
      showNotification('error', 'Gagal!', `Gagal memperbarui data keluarga: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-green-200 rounded w-64"></div>
        <div className="h-4 bg-green-200 rounded w-96"></div>
      </div>
      {/* Content Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
        <div className="h-64 bg-green-200 rounded"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <SkeletonLoader />
      </div>
    );
  }

  if (error && !keluargaData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Data Keluarga Tidak Ditemukan</h3>
          <p className="text-red-600 mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium shadow-sm"
            >
              Coba Lagi
            </button>
            <button 
              onClick={() => window.location.href = '/wali'}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">Data Keluarga</h1>
        <p className="text-green-600">Kelola informasi keluarga dan santri</p>
      </div>

      {/* Informasi Keluarga */}
      {keluargaData && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">Informasi Kartu Keluarga</h3>
                <button
                  onClick={handleEditKeluarga}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Data Keluarga</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Alamat:</span>
                  <p className="text-green-900">{keluargaData.alamat}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">RT/RW:</span>
                  <p className="text-green-900">{keluargaData.rt_rw || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kelurahan:</span>
                  <p className="text-green-900">{keluargaData.kelurahan || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kecamatan:</span>
                  <p className="text-green-900">{keluargaData.kecamatan || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kota/Kabupaten:</span>
                  <p className="text-green-900">{keluargaData.kota || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Provinsi:</span>
                  <p className="text-green-900">{keluargaData.provinsi || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kode Pos:</span>
                  <p className="text-green-900">{keluargaData.kode_pos || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* Wali Information */}
            <div className="lg:ml-8 lg:border-l lg:border-green-200 lg:pl-8 mt-6 lg:mt-0">
              <div className="text-center lg:text-left">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto lg:mx-0 mb-3">
                  {keluargaData.wali?.nama_lengkap?.charAt(0) || 'W'}
                </div>
                <p className="text-sm text-green-600 font-medium">Kepala Keluarga / Wali</p>
                <p className="font-semibold text-green-900 text-lg">{keluargaData.wali?.nama_lengkap}</p>
                <p className="text-sm text-green-600 mt-1">{keluargaData.wali?.no_telp}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Status Aktif
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Keluarga */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Edit Data Keluarga</h3>
              <form onSubmit={handleUpdateKeluarga} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Alamat</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">RT/RW</label>
                    <input
                      type="text"
                      value={formData.rt_rw}
                      onChange={(e) => setFormData({...formData, rt_rw: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      value={formData.kode_pos}
                      onChange={(e) => setFormData({...formData, kode_pos: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kelurahan</label>
                  <input
                    type="text"
                    value={formData.kelurahan}
                    onChange={(e) => setFormData({...formData, kelurahan: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({...formData, kecamatan: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kota</label>
                  <input
                    type="text"
                    value={formData.kota}
                    onChange={(e) => setFormData({...formData, kota: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.provinsi}
                    onChange={(e) => setFormData({...formData, provinsi: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default Keluarga;