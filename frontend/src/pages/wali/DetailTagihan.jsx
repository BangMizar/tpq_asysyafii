import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SemuaTagihanWali = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tagihanSyahriah, setTagihanSyahriah] = useState([]);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [showAll, setShowAll] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua data tagihan
  useEffect(() => {
    const fetchAllTagihan = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(`${API_URL}/api/syahriah/my`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        
        // Urutkan: belum lunas di atas, lalu lunas, dan urut berdasarkan bulan terbaru
        const sortedTagihan = (data.data || []).sort((a, b) => {
          // Prioritas status belum lunas
          if (a.status === 'belum' && b.status === 'lunas') return -1;
          if (a.status === 'lunas' && b.status === 'belum') return 1;
          
          // Urutkan berdasarkan bulan (terbaru di atas)
          return new Date(b.bulan) - new Date(a.bulan);
        });
        
        setTagihanSyahriah(sortedTagihan);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Gagal memuat data: ${err.message}`);
        setTagihanSyahriah([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTagihan();
  }, [API_URL]);

  // Filter tagihan berdasarkan status
  const filteredTagihan = tagihanSyahriah.filter(tagihan => {
    if (filterStatus === 'semua') return true;
    return tagihan.status === filterStatus;
  });

  // Limit daftar tagihan menjadi 6 item kecuali jika showAll true
  const displayedTagihan = showAll ? filteredTagihan : filteredTagihan.slice(0, 6);

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
      lunas: { color: 'bg-green-100 text-green-800 border border-green-200', text: 'Dibayar' },
      belum: { color: 'bg-red-100 text-red-800 border border-red-200', text: 'Belum Dibayar' }
    };
    
    const config = statusConfig[status] || statusConfig.belum;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTotalNominal = (status) => {
    return filteredTagihan
      .filter(tagihan => status === 'semua' || tagihan.status === status)
      .reduce((total, tagihan) => total + tagihan.nominal, 0);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-green-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-green-200 rounded-xl"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-green-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Semua Tagihan Syahriah</h1>
          <p className="text-green-600 mt-1">Riwayat lengkap tagihan syahriah</p>
        </div>
        <Link 
          to="/wali"
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 mt-4 lg:mt-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {/* Total Tagihan - Mobile: kolom 1, Desktop: kolom 1 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Total Syahriah</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{filteredTagihan.length}</p>
          </div>
        </div>

        {/* Lunas - Mobile: kolom 2, Desktop: kolom 2 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Dibayar</p>
            <p className="text-2xl font-bold text-green-800 mt-1">
              {filteredTagihan.filter(t => t.status === 'lunas').length}
            </p>
          </div>
        </div>

        {/* Belum Lunas - Mobile: kolom 3, Desktop: kolom 3 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="text-center">
            <p className="text-sm text-red-600 font-medium">Belum Dibayar</p>
            <p className="text-2xl font-bold text-red-800 mt-1">
              {filteredTagihan.filter(t => t.status === 'belum').length}
            </p>
          </div>
        </div>

        {/* Total Nominal - Mobile: baris baru full width, Desktop: kolom 4 */}
        <div className="col-span-3 md:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Total Nominal</p>
            {filterStatus === 'semua' ? (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-600">Dibayar:</span>
                  <span className="text-sm font-semibold text-green-800">
                    {formatCurrency(getTotalNominal('lunas'))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-600">Belum Dibayar:</span>
                  <span className="text-sm font-semibold text-red-800">
                    {formatCurrency(getTotalNominal('belum'))}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-1 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Total:</span>
                    <span className="text-sm font-bold text-green-800">
                      {formatCurrency(getTotalNominal('semua'))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className={`text-lg font-bold mt-1 ${
                filterStatus === 'lunas' ? 'text-green-800' : 'text-red-800'
              }`}>
                {formatCurrency(getTotalNominal(filterStatus))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('semua')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'semua' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('belum')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'belum' 
                ? 'bg-red-600 text-white' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Belum Dibayar
          </button>
          <button
            onClick={() => setFilterStatus('lunas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'lunas' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Dibayar
          </button>
        </div>
      </div>

      {/* Tagihan List */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <h2 className="text-lg font-semibold text-green-900">
            Daftar Syahriah ({filteredTagihan.length})
            {filteredTagihan.length > 6 && !showAll && (
              <span className="text-sm font-normal text-green-600 ml-2">
                (Menampilkan 6 dari {filteredTagihan.length})
              </span>
            )}
          </h2>
        </div>
        
        <div className="p-6">
          {displayedTagihan.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Tidak Ada Tagihan</h3>
              <p className="text-green-600">
                {filterStatus === 'semua' 
                  ? 'Belum ada tagihan syahriah' 
                  : `Tidak ada tagihan dengan status ${filterStatus === 'lunas' ? 'lunas' : 'belum lunas'}`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedTagihan.map((tagihan) => (
                <div 
                  key={tagihan.id_syahriah}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    tagihan.status === 'belum' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        tagihan.status === 'belum' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {tagihan.status === 'belum' ? (
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-lg">
                          {formatBulan(tagihan.bulan)}
                        </div>
                        <div className={`text-sm ${
                          tagihan.status === 'belum' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {tagihan.status === 'belum' 
                            ? `Jatuh tempo: ${formatDate(tagihan.waktu_catat)}`
                            : `Dibayar: ${formatDate(tagihan.waktu_catat)}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold text-xl ${
                      tagihan.status === 'belum' ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {formatCurrency(tagihan.nominal)}
                    </div>
                    <div className="mt-2">
                      {getStatusBadge(tagihan.status)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Tombol Lihat Semua/Lebih Sedikit */}
              {filteredTagihan.length > 6 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium"
                  >
                    {showAll ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${filteredTagihan.length})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SemuaTagihanWali;