import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardWali = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tagihanSyahriah, setTagihanSyahriah] = useState([]);
  const [summarySyahriah, setSummarySyahriah] = useState({
    total_nominal: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch data syahriah
  useEffect(() => {
    const fetchSyahriahData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch data summary dan tagihan secara bersamaan
        const [summaryResponse, tagihanResponse] = await Promise.all([
          fetch(`${API_URL}/api/syahriah/summary`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/api/syahriah/my?limit=5`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        // Handle summary response
        if (!summaryResponse.ok) {
          throw new Error(`HTTP error! status: ${summaryResponse.status}`);
        }

        const summaryContentType = summaryResponse.headers.get("content-type");
        if (!summaryContentType || !summaryContentType.includes("application/json")) {
          throw new Error('Server returned non-JSON response for summary');
        }

        const summaryData = await summaryResponse.json();
        
        // Handle tagihan response
        if (!tagihanResponse.ok) {
          throw new Error(`HTTP error! status: ${tagihanResponse.status}`);
        }

        const tagihanContentType = tagihanResponse.headers.get("content-type");
        if (!tagihanContentType || !tagihanContentType.includes("application/json")) {
          throw new Error('Server returned non-JSON response for tagihan');
        }

        const tagihanData = await tagihanResponse.json();

        // Set data dari response
        setSummarySyahriah(summaryData.data || {
          total: 0,
          lunas: 0,
          belum_lunas: 0,
          total_nominal: 0
        });
        
        // Urutkan: belum lunas di atas, lalu lunas
        const sortedTagihan = (tagihanData.data || []).sort((a, b) => {
          if (a.status === 'belum' && b.status === 'lunas') return -1;
          if (a.status === 'lunas' && b.status === 'belum') return 1;
          return 0;
        });
        
        setTagihanSyahriah(sortedTagihan.slice(0, 3)); // Limit 3 data

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Gagal memuat data: ${err.message}`);
        // Fallback data jika API error
        setSummarySyahriah({
          total: 0,
          lunas: 0,
          belum_lunas: 0,
          total_nominal: 0
        });
        setTagihanSyahriah([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSyahriahData();
  }, [API_URL]);

  const handleBayar = async (idSyahriah) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/syahriah/${idSyahriah}/bayar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'lunas' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      
      // Refresh data setelah pembayaran berhasil
      const [summaryResponse, tagihanResponse] = await Promise.all([
        fetch(`${API_URL}/api/syahriah/summary`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/syahriah/my?limit=5`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!summaryResponse.ok || !tagihanResponse.ok) {
        throw new Error('Gagal refresh data setelah pembayaran');
      }

      const summaryData = await summaryResponse.json();
      const tagihanData = await tagihanResponse.json();

      // Urutkan kembali data setelah pembayaran
      const sortedTagihan = (tagihanData.data || []).sort((a, b) => {
        if (a.status === 'belum' && b.status === 'lunas') return -1;
        if (a.status === 'lunas' && b.status === 'belum') return 1;
        return 0;
      });

      setSummarySyahriah(summaryData.data);
      setTagihanSyahriah(sortedTagihan.slice(0, 3));
      
      alert('Pembayaran berhasil!');
    } catch (err) {
      console.error('Error melakukan pembayaran:', err);
      alert('Gagal melakukan pembayaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const formatBulan = (bulanString) => {
    try {
      const [year, month] = bulanString.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return bulanString;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      lunas: { color: 'bg-green-100 text-green-800 border border-green-200', text: 'Lunas' },
      belum: { color: 'bg-red-100 text-red-800 border border-red-200', text: 'Belum Lunas' },
      aktif: { color: 'bg-blue-100 text-blue-800', text: 'Aktif' },
      non_aktif: { color: 'bg-gray-100 text-gray-800', text: 'Non Aktif' }
    };
    
    const config = statusConfig[status] || statusConfig.non_aktif;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      {/* Welcome Section Skeleton */}
      <div className="mb-8 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div className="space-y-3">
            <div className="h-8 bg-green-400 rounded w-64"></div>
            <div className="h-4 bg-green-400 rounded w-96"></div>
          </div>
          <div className="flex space-x-2 mt-4 lg:mt-0">
            <div className="h-6 bg-green-400 rounded w-24"></div>
            <div className="h-6 bg-green-400 rounded w-16"></div>
          </div>
        </div>
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-200 rounded-xl"></div>
              <div className="ml-4 space-y-2">
                <div className="h-4 bg-green-200 rounded w-24"></div>
                <div className="h-6 bg-green-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tagihan Section Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="h-6 bg-green-200 rounded w-48"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-green-200 rounded w-32"></div>
                  <div className="h-3 bg-green-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-green-200 rounded w-24"></div>
                <div className="h-8 bg-green-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium shadow-sm"
            >
              Coba Lagi
            </button>
            <Link 
              to="/"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Selamat datang, {user?.nama_lengkap}!
            </h1>
            <p className="text-green-100 text-lg">
              Portal informasi dan pembayaran syahriah TPQ
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-2">
            <span className="bg-green-500 bg-opacity-20 px-3 py-1 rounded-full text-sm">
              👨‍👩‍👧‍👦 Wali Santri
            </span>
          </div>
        </div>
      </div>

      {/* Tagihan Syahriah Section */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-900">Tagihan Syahriah Terbaru</h2>
            <Link 
              to="/wali/detail"
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Lihat Semua</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {tagihanSyahriah.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Tidak Ada Tagihan</h3>
              <p className="text-green-600">Semua tagihan sudah lunas atau belum ada tagihan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tagihanSyahriah.map((tagihan) => (
                <div 
                  key={tagihan.id_syahriah}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    tagihan.status === 'belum' 
                      ? 'bg-red-50 border-red-200 shadow-sm' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tagihan.status === 'belum' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {tagihan.status === 'belum' ? (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatBulan(tagihan.bulan)}
                        </div>
                        {tagihan.status === 'belum' && (
                          <div className="text-sm text-red-600">
                            Jatuh tempo: {formatDate(tagihan.waktu_catat)}
                          </div>
                        )}
                        {tagihan.status === 'lunas' && (
                          <div className="text-sm text-green-600">
                            Dibayar: {formatDate(tagihan.waktu_catat)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      tagihan.status === 'belum' ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {formatCurrency(tagihan.nominal)}
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(tagihan.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardWali;