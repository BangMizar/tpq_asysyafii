// pages/wali/Keluarga.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Keluarga = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keluargaData, setKeluargaData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddAnggotaModal, setShowAddAnggotaModal] = useState(false);
  const [showEditAnggotaModal, setShowEditAnggotaModal] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState(null);
  const [formData, setFormData] = useState({});
  const [anggotaForm, setAnggotaForm] = useState({});
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

  // Handle Add Anggota Keluarga
  const handleAddAnggota = () => {
    setAnggotaForm({
      nama_lengkap: '',
      jenis_kelamin: '',
      tanggal_lahir: '',
      tempat_lahir: '',
      nik: '',
      hubungan_keluarga: '',
      kelas: '',
      status_santri: 'aktif'
    });
    setShowAddAnggotaModal(true);
  };

  const handleCreateAnggota = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/anggota-keluarga`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...anggotaForm,
          id_keluarga: keluargaData.id_keluarga
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchKeluargaData();
      setShowAddAnggotaModal(false);
      showNotification('success', 'Berhasil!', 'Anggota keluarga berhasil ditambahkan!');

    } catch (err) {
      console.error('Error creating anggota:', err);
      showNotification('error', 'Gagal!', `Gagal menambahkan anggota keluarga: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Anggota Keluarga
  const handleEditAnggota = (anggota) => {
    setSelectedAnggota(anggota);
    setAnggotaForm({
      nama_lengkap: anggota.nama_lengkap || '',
      jenis_kelamin: anggota.jenis_kelamin || '',
      tanggal_lahir: anggota.tanggal_lahir ? anggota.tanggal_lahir.split('T')[0] : '',
      tempat_lahir: anggota.tempat_lahir || '',
      nik: anggota.nik || '',
      hubungan_keluarga: anggota.hubungan_keluarga || '',
      kelas: anggota.kelas || '',
      status_santri: anggota.status_santri || 'aktif'
    });
    setShowEditAnggotaModal(true);
  };

  const handleUpdateAnggota = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/anggota-keluarga/${selectedAnggota.id_anggota_keluarga}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anggotaForm)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchKeluargaData();
      setShowEditAnggotaModal(false);
      setSelectedAnggota(null);
      showNotification('success', 'Berhasil!', 'Data anggota berhasil diperbarui!');

    } catch (err) {
      console.error('Error updating anggota:', err);
      showNotification('error', 'Gagal!', `Gagal memperbarui data anggota: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Anggota Keluarga
  const handleDeleteAnggota = async (anggota) => {
    showNotification('error', 'Konfirmasi Hapus', 
      `Apakah Anda yakin ingin menghapus ${anggota.nama_lengkap} dari anggota keluarga?`,
      async () => {
        try {
          setActionLoading(true);

          const response = await fetch(`${API_URL}/api/anggota-keluarga/${anggota.id_anggota_keluarga}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          await fetchKeluargaData();
          showNotification('success', 'Berhasil!', 'Anggota keluarga berhasil dihapus!');

        } catch (err) {
          console.error('Error deleting anggota:', err);
          showNotification('error', 'Gagal!', `Gagal menghapus anggota keluarga: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getUsia = (tanggalLahir) => {
    if (!tanggalLahir) return '-';
    const today = new Date();
    const birthDate = new Date(tanggalLahir);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} tahun`;
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
        <p className="text-green-600">Kelola informasi keluarga dan anggota keluarga</p>
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
                  <span className="font-medium text-green-700">No. Kartu Keluarga:</span>
                  <p className="text-green-900 font-mono">{keluargaData.no_kk}</p>
                </div>
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

      {/* Anggota Keluarga Section */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-green-900">Anggota Keluarga</h2>
              <p className="text-sm text-green-600 mt-1">
                {keluargaData?.anggota_keluarga?.length || 0} Orang terdaftar
              </p>
            </div>
            <button
              onClick={handleAddAnggota}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {!keluargaData?.anggota_keluarga || keluargaData.anggota_keluarga.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-3">Belum Ada Anggota Keluarga</h3>
              <p className="text-green-600 max-w-md mx-auto mb-6">
                Tambahkan anggota keluarga (santri) untuk mengelola data mereka.
              </p>
              <button
                onClick={handleAddAnggota}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Tambah Anggota Keluarga
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {keluargaData.anggota_keluarga.map((anggota) => (
                <div key={anggota.id_anggota_keluarga} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {anggota.nama_lengkap?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 text-lg">{anggota.nama_lengkap}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-green-600">
                        <div>
                          <span className="font-medium">Kelas:</span> {anggota.kelas || 'Belum ditentukan'}
                        </div>
                        <div>
                          <span className="font-medium">Jenis Kelamin:</span> {anggota.jenis_kelamin || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Usia:</span> {getUsia(anggota.tanggal_lahir)}
                        </div>
                        {anggota.nik && (
                          <div>
                            <span className="font-medium">NIK:</span> {anggota.nik}
                          </div>
                        )}
                        {anggota.hubungan_keluarga && (
                          <div>
                            <span className="font-medium">Hubungan:</span> {anggota.hubungan_keluarga}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      anggota.status_santri === 'aktif' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {anggota.status_santri === 'aktif' ? 'Aktif' : 'Non Aktif'}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAnggota(anggota)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAnggota(anggota)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Edit Keluarga */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Edit Data Keluarga</h3>
              <form onSubmit={handleUpdateKeluarga} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">No. KK</label>
                  <input
                    type="text"
                    value={formData.no_kk}
                    onChange={(e) => setFormData({...formData, no_kk: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
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

      {/* Modal Tambah Anggota */}
      {showAddAnggotaModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Tambah Anggota Keluarga</h3>
              <form onSubmit={handleCreateAnggota} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={anggotaForm.nama_lengkap}
                    onChange={(e) => setAnggotaForm({...anggotaForm, nama_lengkap: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={anggotaForm.jenis_kelamin}
                      onChange={(e) => setAnggotaForm({...anggotaForm, jenis_kelamin: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Status</label>
                    <select
                      value={anggotaForm.status_santri}
                      onChange={(e) => setAnggotaForm({...anggotaForm, status_santri: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="non_aktif">Non Aktif</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={anggotaForm.tanggal_lahir}
                      onChange={(e) => setAnggotaForm({...anggotaForm, tanggal_lahir: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={anggotaForm.tempat_lahir}
                      onChange={(e) => setAnggotaForm({...anggotaForm, tempat_lahir: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">NIK</label>
                  <input
                    type="text"
                    value={anggotaForm.nik}
                    onChange={(e) => setAnggotaForm({...anggotaForm, nik: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Hubungan Keluarga</label>
                  <input
                    type="text"
                    value={anggotaForm.hubungan_keluarga}
                    onChange={(e) => setAnggotaForm({...anggotaForm, hubungan_keluarga: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: Anak, Istri, dll."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={anggotaForm.kelas}
                    onChange={(e) => setAnggotaForm({...anggotaForm, kelas: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: TPQ A, Madrasah Ibtidaiyah"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Menambahkan...' : 'Tambah Anggota'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAnggotaModal(false)}
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

      {/* Modal Edit Anggota */}
      {showEditAnggotaModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Edit Anggota Keluarga</h3>
              <form onSubmit={handleUpdateAnggota} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={anggotaForm.nama_lengkap}
                    onChange={(e) => setAnggotaForm({...anggotaForm, nama_lengkap: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={anggotaForm.jenis_kelamin}
                      onChange={(e) => setAnggotaForm({...anggotaForm, jenis_kelamin: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Status</label>
                    <select
                      value={anggotaForm.status_santri}
                      onChange={(e) => setAnggotaForm({...anggotaForm, status_santri: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="non_aktif">Non Aktif</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={anggotaForm.tanggal_lahir}
                      onChange={(e) => setAnggotaForm({...anggotaForm, tanggal_lahir: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={anggotaForm.tempat_lahir}
                      onChange={(e) => setAnggotaForm({...anggotaForm, tempat_lahir: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">NIK</label>
                  <input
                    type="text"
                    value={anggotaForm.nik}
                    onChange={(e) => setAnggotaForm({...anggotaForm, nik: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Hubungan Keluarga</label>
                  <input
                    type="text"
                    value={anggotaForm.hubungan_keluarga}
                    onChange={(e) => setAnggotaForm({...anggotaForm, hubungan_keluarga: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: Anak, Istri, dll."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={anggotaForm.kelas}
                    onChange={(e) => setAnggotaForm({...anggotaForm, kelas: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: TPQ A, Madrasah Ibtidaiyah"
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
                    onClick={() => setShowEditAnggotaModal(false)}
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

      {/* Modal Notifikasi */}
      {showNotificationModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  notificationData.type === 'success' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {notificationData.type === 'success' ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  notificationData.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {notificationData.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {notificationData.message}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={closeNotification}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      notificationData.type === 'success'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Keluarga;