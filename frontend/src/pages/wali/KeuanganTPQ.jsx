// pages/wali/KeuanganTPQ.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const KeuanganTPQ = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rekapData, setRekapData] = useState([]);
  const [latestRekap, setLatestRekap] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('semua');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch all rekap data
  const fetchAllRekap = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/rekap?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRekapData(data.data || []);
      
      // Extract unique periods
      const periods = [...new Set(data.data.map(item => item.periode))].sort().reverse();
      setAvailablePeriods(periods);
      
    } catch (err) {
      console.error('Error fetching rekap data:', err);
      setError(`Gagal memuat data keuangan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load data
  useEffect(() => {
    fetchAllRekap();
  }, [API_URL]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
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

  const getFilteredRekap = () => {
    if (selectedPeriod === 'semua') {
      return rekapData;
    }
    return rekapData.filter(item => item.periode === selectedPeriod);
  };

  const getLatestFilteredRekap = () => {
    const filtered = getFilteredRekap();
    const latestByType = {};
    
    filtered.forEach(item => {
      if (!latestByType[item.tipe_saldo] || item.periode > latestByType[item.tipe_saldo].periode) {
        latestByType[item.tipe_saldo] = item;
      }
    });
    
    return Object.values(latestByType);
  };

  const getSaldoByType = (type) => {
    const latest = getLatestFilteredRekap().find(item => item.tipe_saldo === type);
    return latest ? latest.saldo_akhir : 0;
  };

  // ✅ PERBAIKAN: Get total saldo from filtered data (sum of latest saldo for each type)
  const getTotalSaldo = () => {
    return getLatestFilteredRekap().reduce((total, item) => total + item.saldo_akhir, 0);
  };

  // ✅ PERBAIKAN: Get pemasukan for selected period
  const getPemasukanPeriod = () => {
    const filtered = getFilteredRekap();
    const totalRekap = filtered.find(item => 
      item.tipe_saldo === 'total' && 
      (selectedPeriod === 'semua' || item.periode === selectedPeriod)
    );
    
    if (selectedPeriod === 'semua') {
      // Sum all pemasukan from total rekap
      return filtered
        .filter(item => item.tipe_saldo === 'total')
        .reduce((sum, item) => sum + item.pemasukan_total, 0);
    }
    
    return totalRekap ? totalRekap.pemasukan_total : 0;
  };

  // ✅ PERBAIKAN: Get pengeluaran for selected period
  const getPengeluaranPeriod = () => {
    const filtered = getFilteredRekap();
    
    if (selectedPeriod === 'semua') {
      // Sum all pengeluaran from total rekap
      return filtered
        .filter(item => item.tipe_saldo === 'total')
        .reduce((sum, item) => sum + item.pengeluaran_total, 0);
    }
    
    const totalRekap = filtered.find(item => 
      item.tipe_saldo === 'total' && item.periode === selectedPeriod
    );
    return totalRekap ? totalRekap.pengeluaran_total : 0;
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
    
    if (selectedPeriod === 'semua') {
      // Show latest entry for each period-type combination
      const latestEntries = {};
      filtered.forEach(item => {
        const key = `${item.periode}-${item.tipe_saldo}`;
        if (!latestEntries[key] || item.terakhir_update > latestEntries[key].terakhir_update) {
          latestEntries[key] = item;
        }
      });
      return Object.values(latestEntries).sort((a, b) => b.periode.localeCompare(a.periode));
    }
    
    return filtered.sort((a, b) => a.tipe_saldo.localeCompare(b.tipe_saldo));
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
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const displayRekap = getDisplayRekap();
  const latestFilteredRekap = getLatestFilteredRekap();

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

      {/* Breakdown Saldo - NOW FILTERED */}
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
              <p className="text-sm text-green-600 font-medium">Total Pemasukan</p>
              <p className="text-xl font-bold text-green-900">
                
                {formatCurrency(getPemasukanPeriod())}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - NOW FILTERED */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Pengeluaran */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-red-600 font-medium">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(getPengeluaranPeriod())}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {getCurrentPeriodText()}
              </p>
            </div>
          </div>
        </div>

                {/* Pemasukan */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-blue-600 font-medium">Total Saldo Saat ini</p>
              <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(getSaldoByType('total'))}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {getCurrentPeriodText()}
              </p>
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
              <h3 className="text-lg font-semibold text-green-800 mb-2">Data Keuangan Tersedia</h3>
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
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      rekap.tipe_saldo === 'syahriah' ? 'bg-purple-100' :
                      rekap.tipe_saldo === 'donasi' ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      {rekap.tipe_saldo === 'syahriah' ? '🎓' :
                       rekap.tipe_saldo === 'donasi' ? '❤️' : '📈'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">
                        {rekap.tipe_saldo === 'syahriah' ? 'Syahriah' :
                         rekap.tipe_saldo === 'donasi' ? 'Donasi' : 'Total Keuangan'}
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
              <strong>Informasi:</strong> Data keuangan diperbarui secara otomatis setiap ada transaksi syahriah atau donasi. 
              Saldo syahriah hanya mencakup pembayaran yang sudah lunas. Filter periode akan mempengaruhi semua data yang ditampilkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeuanganTPQ;