// pages/wali/KeuanganTPQ.jsx - PERBAIKAN LOGIKA REKAP
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const KeuanganTPQ = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rekapData, setRekapData] = useState([]);
  const [pemakaianData, setPemakaianData] = useState([]);
  const [donasiData, setDonasiData] = useState([]);
  const [syahriahData, setSyahriahData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('semua');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch all data seperti di admin
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Load data secara parallel
      const [rekapResponse, pemakaianResponse, donasiResponse, syahriahResponse] = await Promise.all([
        fetch(`${API_URL}/api/rekap?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/pemakaian?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/donasi?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/syahriah?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Check responses
      if (!rekapResponse.ok) throw new Error('Gagal memuat data rekap');
      if (!pemakaianResponse.ok) throw new Error('Gagal memuat data pemakaian');
      if (!donasiResponse.ok) throw new Error('Gagal memuat data donasi');
      if (!syahriahResponse.ok) throw new Error('Gagal memuat data syahriah');

      const rekapResult = await rekapResponse.json();
      const pemakaianResult = await pemakaianResponse.json();
      const donasiResult = await donasiResponse.json();
      const syahriahResult = await syahriahResponse.json();

      setRekapData(rekapResult.data || []);
      setPemakaianData(pemakaianResult.data || []);
      setDonasiData(donasiResult.data || []);
      setSyahriahData(syahriahResult.data || []);

      // Extract unique periods dari data rekap
      const periods = [...new Set(rekapResult.data.map(item => item.periode))].sort().reverse();
      setAvailablePeriods(periods);

      // Calculate summary data dengan logika yang sama seperti admin
      calculateSummary(rekapResult.data, pemakaianResult.data, donasiResult.data, syahriahResult.data);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // LOGIKA PENGHITUNGAN YANG SAMA DENGAN ADMIN
  const calculateSummary = (rekapData, pemakaianData, donasiData, syahriahData) => {
    // Filter data berdasarkan periode yang dipilih
    const currentPeriod = selectedPeriod === 'semua' ? null : selectedPeriod;
    
    // Filter donasi data berdasarkan periode
    const filteredDonasi = currentPeriod
      ? donasiData.filter(item => {
          const itemPeriod = new Date(item.waktu_catat).toISOString().slice(0, 7);
          return itemPeriod === currentPeriod;
        })
      : donasiData;

    // Filter syahriah data berdasarkan periode (menggunakan bulan dari field bulan)
    const filteredSyahriah = currentPeriod
      ? syahriahData.filter(item => {
          return item.bulan === currentPeriod;
        })
      : syahriahData;

    // Filter pemakaian data berdasarkan periode - semua sumber dana dihitung
    const filteredPemakaian = currentPeriod
      ? pemakaianData.filter(item => {
          const itemPeriod = item.tanggal_pemakaian 
            ? new Date(item.tanggal_pemakaian).toISOString().slice(0, 7)
            : new Date(item.created_at).toISOString().slice(0, 7);
          return itemPeriod === currentPeriod;
        })
      : pemakaianData;

    // Total Donasi: Sum dari semua donasi dalam periode yang dipilih
    const totalDonasi = filteredDonasi.reduce((sum, item) => sum + (item.nominal || 0), 0);

    // Total Syahriah: Sum dari semua syahriah dalam periode yang dipilih
    const totalSyahriah = filteredSyahriah.reduce((sum, item) => sum + (item.nominal || 0), 0);

    // Total Pemasukan: Total Donasi + Total Syahriah
    const totalPemasukan = totalDonasi + totalSyahriah;

    // Total Pengeluaran: Sum dari semua pemakaian yang difilter - semua sumber dana dihitung
    const totalPengeluaran = filteredPemakaian.reduce((sum, item) => sum + (item.nominal || 0), 0);

    // Saldo Akhir: Total Pemasukan - Total Pengeluaran
    const saldoAkhir = totalPemasukan - totalPengeluaran;

    setSummaryData({
      totalPemasukan,
      totalPengeluaran,
      saldoAkhir,
      totalDonasi,
      totalSyahriah
    });
  };

  // Recalculate summary ketika periode berubah
  useEffect(() => {
    if (rekapData.length > 0 && pemakaianData.length > 0 && donasiData.length > 0 && syahriahData.length > 0) {
      calculateSummary(rekapData, pemakaianData, donasiData, syahriahData);
    }
  }, [selectedPeriod, rekapData, pemakaianData, donasiData, syahriahData]);

  // Load data
  useEffect(() => {
    fetchAllData();
  }, [API_URL]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format currency untuk summary card dengan singkatan
  const formatCurrencyShort = (amount) => {
    if (!amount) return 'Rp 0';
    
    const num = Number(amount);
    
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(1)}M`;
    } else if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(1)}jt`;
    } else if (num >= 1000) {
      return `Rp ${(num / 1000).toFixed(1)}rb`;
    } else {
      return `Rp ${num}`;
    }
  };

  // Format period (YYYY-MM to Month Year)
  const formatPeriod = (period) => {
    try {
      const [year, month] = period.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return period;
    }
  };

  // ✅ PERBAIKAN: Get rekap items berdasarkan filter periode
  const getFilteredRekap = () => {
    if (selectedPeriod === 'semua') {
      return rekapData.filter(item => item.tipe_saldo === 'total');
    }
    return rekapData.filter(item => item.tipe_saldo === 'total' && item.periode === selectedPeriod);
  };

  // ✅ PERBAIKAN: Get saldo by type dengan filter periode
  const getSaldoByType = (type) => {
    const filtered = selectedPeriod === 'semua' 
      ? rekapData.filter(item => item.tipe_saldo === type)
      : rekapData.filter(item => item.tipe_saldo === type && item.periode === selectedPeriod);
    
    if (filtered.length === 0) return 0;
    
    // Untuk periode tertentu, ambil saldo dari periode tersebut
    if (selectedPeriod !== 'semua') {
      return filtered[0]?.saldo_akhir || 0;
    }
    
    // Untuk semua periode, ambil saldo terakhir dari setiap type
    const latestByType = filtered.reduce((latest, item) => {
      if (!latest || item.periode > latest.periode) {
        return item;
      }
      return latest;
    }, null);
    
    return latestByType?.saldo_akhir || 0;
  };

  // ✅ PERBAIKAN: Get current period display text
  const getCurrentPeriodText = () => {
    if (selectedPeriod === 'semua') {
      return 'Semua Periode';
    }
    return formatPeriod(selectedPeriod);
  };

  // Get rekap items to display in list
  const getDisplayRekap = () => {
    const filtered = getFilteredRekap();
    return filtered.sort((a, b) => b.periode.localeCompare(a.periode));
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-green-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-green-200 rounded w-96 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-200 rounded-xl"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-green-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-green-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-green-200 rounded w-48"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-green-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={fetchAllData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const displayRekap = getDisplayRekap();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">Keuangan TPQ</h1>
          <p className="text-green-700">Informasi keuangan dan laporan keuangan TPQ</p>
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

      {/* Summary Cards - MENGGUNAKAN LOGIKA YANG SAMA DENGAN ADMIN */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Total Pemasukan */}
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Pemasukan</p>
              <p className="text-xl font-bold text-green-900">
                {formatCurrencyShort(summaryData?.totalPemasukan || 0)}
              </p>
              <p className="text-xs text-green-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
        
        {/* Total Pengeluaran */}
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Total Pengeluaran</p>
              <p className="text-xl font-bold text-red-900">
                {formatCurrencyShort(summaryData?.totalPengeluaran || 0)}
              </p>
              <p className="text-xs text-red-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
        
        {/* Saldo Akhir */}
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Saldo Akhir</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrencyShort(summaryData?.saldoAkhir || 0)}
              </p>
              <p className="text-xs text-blue-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        {/* Total Donasi */}
        <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">❤️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Total Donasi</p>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrencyShort(summaryData?.totalDonasi || 0)}
              </p>
              <p className="text-xs text-purple-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        {/* Total Syahriah */}
        <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-orange-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Total Syahriah</p>
              <p className="text-xl font-bold text-orange-900">
                {formatCurrencyShort(summaryData?.totalSyahriah || 0)}
              </p>
              <p className="text-xs text-orange-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Saldo per Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Saldo Syahriah</p>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrency(getSaldoByType('syahriah'))}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Saldo Donasi</p>
              <p className="text-xl font-bold text-orange-900">
                {formatCurrency(getSaldoByType('donasi'))}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">❤️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Saldo Total</p>
              <p className="text-xl font-bold text-green-900">
                {formatCurrency(getSaldoByType('total'))}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Laporan Keuangan */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-green-900">
              Laporan Keuangan {selectedPeriod !== 'semua' ? `- ${formatPeriod(selectedPeriod)}` : ''}
            </h2>
            <div className="flex items-center space-x-2 mt-2 lg:mt-0">
              <label className="text-sm font-medium text-green-700">Filter Periode:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="semua">Semua Periode</option>
                {availablePeriods.map(period => (
                  <option key={period} value={period}>
                    {formatPeriod(period)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {displayRekap.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Data Keuangan</h3>
              <p className="text-green-600">Laporan keuangan akan muncul di sini setelah ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayRekap.map((rekap) => (
                <div 
                  key={`${rekap.tipe_saldo}-${rekap.periode}-${rekap.id_saldo}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📈</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Rekap Keuangan Total
                      </div>
                      <div className="text-sm text-green-600">
                        Periode: {formatPeriod(rekap.periode)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Update: {new Date(rekap.terakhir_update).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between space-x-4">
                        <span className="text-sm text-gray-600">Pemasukan:</span>
                        <span className="font-semibold text-green-800">
                          {formatCurrency(rekap.pemasukan_total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between space-x-4">
                        <span className="text-sm text-gray-600">Pengeluaran:</span>
                        <span className="font-semibold text-red-800">
                          {formatCurrency(rekap.pengeluaran_total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between space-x-4 border-t border-green-200 pt-1">
                        <span className="text-sm font-medium text-gray-700">Saldo Akhir:</span>
                        <span className={`font-bold text-lg ${
                          rekap.saldo_akhir >= 0 ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {formatCurrency(rekap.saldo_akhir)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informasi */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Informasi:</strong> Data keuangan menggunakan logika penghitungan yang sama dengan halaman admin. 
              Total pemasukan = Donasi + Syahriah, Total pengeluaran = semua jenis pemakaian dana. 
              Filter periode akan mempengaruhi semua data yang ditampilkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeuanganTPQ;