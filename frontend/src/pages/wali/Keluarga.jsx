// pages/wali/Keluarga.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Keluarga = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keluargaData, setKeluargaData] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch data keluarga
  useEffect(() => {
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
            throw new Error('Data keluarga belum terdaftar. Silakan hubungi admin untuk mendaftarkan data keluarga.');
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

    fetchKeluargaData();
  }, [API_URL]);

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

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-green-200 rounded w-64"></div>
        <div className="h-4 bg-green-200 rounded w-96"></div>
      </div>

      {/* Informasi Keluarga Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
        <div className="flex items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="h-6 bg-green-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-green-200 rounded w-20"></div>
                  <div className="h-4 bg-green-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="ml-6 space-y-2">
            <div className="w-16 h-16 bg-green-200 rounded-full"></div>
            <div className="h-4 bg-green-200 rounded w-24"></div>
            <div className="h-4 bg-green-200 rounded w-20"></div>
          </div>
        </div>
      </div>

      {/* Anggota Keluarga Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="h-6 bg-green-200 rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-green-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-3 bg-green-200 rounded w-64 mx-auto"></div>
          </div>
        </div>
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
        <p className="text-green-600">Informasi data keluarga dan kartu keluarga</p>
      </div>

      {/* Informasi Keluarga */}
      {keluargaData && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Informasi Kartu Keluarga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-green-700">No. Kartu Keluarga:</span>
                  <p className="text-green-900 font-mono text-lg">{keluargaData.no_kk}</p>
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
            <h2 className="text-lg font-semibold text-green-900">Anggota Keluarga</h2>
            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {keluargaData?.anggota_keluarga?.length || 0} Orang
            </span>
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
                Data anggota keluarga (santri) akan ditampilkan di sini setelah didaftarkan oleh admin TPQ.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-green-700">
                  <strong>Informasi:</strong> Untuk mendaftarkan anggota keluarga (santri), silakan hubungi admin TPQ Asy-Syafi'i Campakoah.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {keluargaData.anggota_keluarga.map((anggota) => (
                <div key={anggota.id_anggota_keluarga} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {anggota.nama_lengkap?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 text-lg">{anggota.nama_lengkap}</h3>
                      <p className="text-sm text-green-600">
                        {anggota.kelas || 'Belum ada kelas'} • {anggota.jenis_kelamin || '-'}
                      </p>
                      {anggota.tanggal_lahir && (
                        <p className="text-xs text-green-500">
                          {new Date().getFullYear() - new Date(anggota.tanggal_lahir).getFullYear()} tahun
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      {anggota.status_santri === 'aktif' ? 'Aktif' : 'Non Aktif'}
                    </span>
                    {anggota.created_at && (
                      <p className="text-xs text-green-600 mt-1">
                        Terdaftar: {formatDate(anggota.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informasi Tambahan */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Informasi Data Keluarga</h4>
              <p className="text-blue-700 text-xs">
                Data keluarga ini digunakan untuk keperluan administrasi TPQ. Pastikan informasi yang tercantum sudah benar.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-orange-900 text-sm mb-1">Perubahan Data</h4>
              <p className="text-orange-700 text-xs">
                Jika ada perubahan data keluarga atau penambahan anggota, silakan hubungi admin TPQ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Keluarga;