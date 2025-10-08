import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DataSyahriah = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pembayaran');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pembayaranData, setPembayaranData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua data syahriah
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch data syahriah
        const syahriahResponse = await fetch(`${API_URL}/api/syahriah`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!syahriahResponse.ok) {
          throw new Error(`HTTP error! status: ${syahriahResponse.status}`);
        }

        const syahriahContentType = syahriahResponse.headers.get("content-type");
        if (!syahriahContentType || !syahriahContentType.includes("application/json")) {
          throw new Error('Server returned non-JSON response');
        }

        const syahriahData = await syahriahResponse.json();
        
        // Urutkan data: belum lunas di atas, lalu lunas, dan urut berdasarkan bulan terbaru
        const sortedData = (syahriahData.data || []).sort((a, b) => {
          // Prioritas status belum lunas
          if (a.status === 'belum' && b.status === 'lunas') return -1;
          if (a.status === 'lunas' && b.status === 'belum') return 1;
          
          // Urutkan berdasarkan bulan (terbaru di atas)
          return new Date(b.bulan) - new Date(a.bulan);
        });
        
        setPembayaranData(sortedData);

        // Fetch summary data
        const summaryResponse = await fetch(`${API_URL}/api/syahriah/summary`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (summaryResponse.ok) {
          const summaryContentType = summaryResponse.headers.get("content-type");
          if (summaryContentType && summaryContentType.includes("application/json")) {
            const summaryResult = await summaryResponse.json();
            setSummaryData(summaryResult.data);
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Gagal memuat data: ${err.message}`);
        setPembayaranData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [API_URL]);

  // Filter data untuk tab tunggakan
  const tunggakanData = pembayaranData.filter(item => item.status === 'belum');

  // Handle pembayaran
  const handleBayarSyahriah = async (idSyahriah) => {
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

      // Refresh data setelah pembayaran berhasil
      const fetchData = async () => {
        const syahriahResponse = await fetch(`${API_URL}/api/syahriah`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (syahriahResponse.ok) {
          const syahriahData = await syahriahResponse.json();
          const sortedData = (syahriahData.data || []).sort((a, b) => {
            if (a.status === 'belum' && b.status === 'lunas') return -1;
            if (a.status === 'lunas' && b.status === 'belum') return 1;
            return new Date(b.bulan) - new Date(a.bulan);
          });
          setPembayaranData(sortedData);
        }
      };

      await fetchData();
      
      alert('Pembayaran berhasil dilakukan');
    } catch (err) {
      console.error('Error paying syahriah:', err);
      setError('Gagal melakukan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
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

  // Format bulan (YYYY-MM to Month Year)
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

  // Ikon SVG
  const icons = {
    money: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    clock: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    plus: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    chart: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    email: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    home: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
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

    switch (activeTab) {
      case 'pembayaran':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri/Wali</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Bayar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pembayaranData.map((item) => (
                  <tr key={item.id_syahriah} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.wali?.nama_lengkap || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatBulan(item.bulan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.nominal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.status === 'lunas' ? formatDate(item.waktu_catat) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.status === 'belum' ? (
                        <button 
                          onClick={() => handleBayarSyahriah(item.id_syahriah)}
                          className="text-green-600 hover:text-green-900"
                          disabled={loading}
                        >
                          {loading ? 'Memproses...' : 'Input Pembayaran'}
                        </button>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-900">Detail</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {pembayaranData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data pembayaran
              </div>
            )}
          </div>
        );
      
      case 'tunggakan':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri/Wali</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Tunggakan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tunggakanData.map((item) => (
                  <tr key={item.id_syahriah} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.wali?.nama_lengkap || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatBulan(item.bulan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.nominal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleBayarSyahriah(item.id_syahriah)}
                        className="text-green-600 hover:text-green-900 mr-3"
                        disabled={loading}
                      >
                        {loading ? 'Memproses...' : 'Bayar'}
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">Reminder</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {tunggakanData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data tunggakan
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AuthDashboardLayout title="Data Syahriah">
      {/* Welcome Section */}
      <div className="mb-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-purple-100">Kelola data syahriah dan pembayaran santri</p>
        <div className="flex items-center mt-4 space-x-2 text-sm">
          <span className="bg-purple-400 bg-opacity-20 px-3 py-1 rounded-full">💰 Syahriah</span>
          <span className="bg-purple-400 bg-opacity-20 px-3 py-1 rounded-full">👨‍💼 Admin</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pembayaran</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData ? formatCurrency(summaryData.total_nominal) : 'Rp 0'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.check}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Santri Lunas</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData ? summaryData.lunas : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.clock}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Santri Menunggak</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData ? summaryData.belum_lunas : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-sm">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Aksi Cepat</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => {/* Implement create payment modal */}}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-white">{icons.plus}</span>
              <div>
                <div className="font-semibold text-lg">Input Pembayaran</div>
                <div className="text-sm opacity-90">Bayar syahriah santri</div>
              </div>
            </div>
          </button>
          
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-white">{icons.chart}</span>
              <div>
                <div className="font-semibold text-lg">Laporan Bulanan</div>
                <div className="text-sm opacity-90">Generate laporan</div>
              </div>
            </div>
          </button>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-white">{icons.email}</span>
              <div>
                <div className="font-semibold text-lg">Kirim Reminder</div>
                <div className="text-sm opacity-90">Pengingat pembayaran</div>
              </div>
            </div>
          </button>
          
          <Link 
            to="/admin/dashboard"
            className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-white">{icons.home}</span>
              <div>
                <div className="font-semibold text-lg">Kembali</div>
                <div className="text-sm opacity-90">Ke dashboard</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Data Pembayaran Syahriah</h2>
          <button 
            onClick={() => {/* Implement create payment modal */}}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Input Pembayaran
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {['pembayaran', 'tunggakan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'pembayaran' && 'Data Pembayaran'}
                {tab === 'tunggakan' && 'Tunggakan'}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Table Content */}
        <div>
          {renderContent()}
        </div>
      </div>
    </AuthDashboardLayout>
  );
};

export default DataSyahriah;