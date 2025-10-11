// pages/wali/KeuanganTPQ.jsx - DENGAN SVG ICONS TANPA BACKGROUND
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
  const [activeTab, setActiveTab] = useState('rekap'); // Tab baru untuk navigasi

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

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // LOGIKA PENGHITUNGAN YANG SAMA DENGAN ADMIN - DIPERBAIKI
  const calculateSummary = () => {
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

  // Recalculate summary ketika periode berubah atau data berubah
  useEffect(() => {
    if (rekapData.length > 0 && pemakaianData.length > 0 && donasiData.length > 0 && syahriahData.length > 0) {
      calculateSummary();
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

  // Format currency untuk summary card dengan singkatan - DIPERBAIKI: hanya miliar ke atas
  const formatCurrencyShort = (amount) => {
    if (!amount) return 'Rp 0';
    
    const num = Number(amount);
    
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(1)}M`;
    } else {
      // Untuk di bawah miliar, tetap tampilkan format normal tanpa penyingkatan
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(num);
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

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // FUNGSI BARU: Get saldo berdasarkan type dan periode yang dipilih
  const getSaldoByType = (type) => {
    if (selectedPeriod === 'semua') {
      // Untuk semua periode, ambil saldo terakhir dari setiap type
      const filteredByType = rekapData.filter(item => item.tipe_saldo === type);
      if (filteredByType.length === 0) return 0;
      
      const latest = filteredByType.reduce((latestItem, currentItem) => {
        if (!latestItem || currentItem.periode > latestItem.periode) {
          return currentItem;
        }
        return latestItem;
      }, null);
      
      return latest?.saldo_akhir || 0;
    } else {
      // Untuk periode tertentu, ambil saldo dari periode tersebut
      const filtered = rekapData.find(item => 
        item.tipe_saldo === type && item.periode === selectedPeriod
      );
      return filtered?.saldo_akhir || 0;
    }
  };

  const getCurrentPeriodText = () => {
    if (selectedPeriod === 'semua') {
      return 'Semua Periode';
    }
    return formatPeriod(selectedPeriod);
  };

  // Get filtered data berdasarkan periode
  const getFilteredRekap = () => {
    if (selectedPeriod === 'semua') {
      return rekapData.filter(item => item.tipe_saldo === 'total');
    }
    return rekapData.filter(item => item.tipe_saldo === 'total' && item.periode === selectedPeriod);
  };

  const getFilteredPemakaian = () => {
    if (selectedPeriod === 'semua') {
      return pemakaianData;
    }
    return pemakaianData.filter(item => {
      const itemPeriod = item.tanggal_pemakaian 
        ? new Date(item.tanggal_pemakaian).toISOString().slice(0, 7)
        : new Date(item.created_at).toISOString().slice(0, 7);
      return itemPeriod === selectedPeriod;
    });
  };

  const getFilteredDonasi = () => {
    if (selectedPeriod === 'semua') {
      return donasiData;
    }
    return donasiData.filter(item => {
      const itemPeriod = new Date(item.waktu_catat).toISOString().slice(0, 7);
      return itemPeriod === selectedPeriod;
    });
  };

  const getFilteredSyahriah = () => {
    if (selectedPeriod === 'semua') {
      return syahriahData;
    }
    return syahriahData.filter(item => {
      return item.bulan === selectedPeriod;
    });
  };

  // Render content berdasarkan active tab
  const renderContent = () => {
    const filteredRekap = getFilteredRekap();
    const filteredPemakaian = getFilteredPemakaian();
    const filteredDonasi = getFilteredDonasi();
    const filteredSyahriah = getFilteredSyahriah();

    switch (activeTab) {
      case 'rekap':
        return (
          <div className="overflow-x-auto">
            {filteredRekap.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Data Rekap</h3>
                <p className="text-green-600">Data rekap keuangan akan muncul setelah ada transaksi</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Pemasukan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Pengeluaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Saldo Akhir</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Update Terakhir</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {filteredRekap.map((item, index) => (
                    <tr key={index} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPeriod(item.periode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(item.pemasukan_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(item.pengeluaran_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <span className={item.saldo_akhir >= 0 ? 'text-green-800' : 'text-red-800'}>
                          {formatCurrency(item.saldo_akhir)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.terakhir_update)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      
      case 'pengeluaran':
        return (
          <div className="overflow-x-auto">
            {filteredPemakaian.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Pengeluaran</h3>
                <p className="text-green-600">Data pengeluaran akan muncul setelah ada pemakaian saldo</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Keterangan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Tipe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Sumber Dana</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Diajukan Oleh</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {filteredPemakaian.map((item, index) => (
                    <tr key={index} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.tanggal_pemakaian ? formatDate(item.tanggal_pemakaian) : formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{item.judul_pemakaian}</div>
                          <div className="text-gray-500 text-xs mt-1">{item.deskripsi}</div>
                          {item.keterangan && (
                            <div className="text-gray-400 text-xs mt-1">Catatan: {item.keterangan}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                          item.tipe_pemakaian === 'operasional' ? 'bg-blue-100 text-blue-800' :
                          item.tipe_pemakaian === 'investasi' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.tipe_pemakaian}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {item.sumber_dana}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {formatCurrency(item.nominal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.pengaju?.nama || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case 'pemasukan':
        return (
          <div className="overflow-x-auto">
            {filteredDonasi.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Pemasukan Donasi</h3>
                <p className="text-green-600">Data pemasukan donasi akan muncul setelah ada donasi</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Donatur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">No. Telp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {filteredDonasi.map((item, index) => (
                    <tr key={index} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.waktu_catat)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.nama_donatur}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.no_telp || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(item.nominal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.admin?.nama || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case 'syahriah':
        return (
          <div className="overflow-x-auto">
            {filteredSyahriah.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Pemasukan Syahriah</h3>
                <p className="text-green-600">Data pemasukan syahriah akan muncul setelah ada pembayaran syahriah</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Tanggal Bayar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Wali</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">No. Telp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Bulan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 uppercase">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {filteredSyahriah.map((item, index) => (
                    <tr key={index} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.waktu_catat)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.wali?.nama_lengkap || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.wali?.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.wali?.no_telp || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPeriod(item.bulan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(item.nominal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'lunas' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.admin?.nama_lengkap || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-green-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-green-200 rounded w-96 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
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

      {/* Summary Cards - DENGAN SVG ICONS TANPA BACKGROUND */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Total Syahriah */}
        <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-orange-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5z" />
              </svg>
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

        {/* Total Donasi */}
        <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
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

        {/* Total Pemasukan */}
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
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
            <div className="text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
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
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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
      </div>

      {/* Breakdown Saldo per Type - DENGAN SVG ICONS TANPA BACKGROUND */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Saldo Syahriah</p>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrency(getSaldoByType('syahriah'))}
              </p>
              <p className="text-xs text-purple-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
            <div className="text-purple-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5z" />
              </svg>
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
              <p className="text-xs text-orange-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
            <div className="text-orange-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
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
              <p className="text-xs text-green-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
            <div className="text-green-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Laporan Keuangan - TABEL LENGKAP DENGAN TABS */}
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

        {/* Tabs Navigation */}
        <div className="border-b border-green-200">
          <nav className="flex -mb-px">
            {['rekap', 'pengeluaran', 'pemasukan', 'syahriah'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'rekap' && 'Rekap Keuangan'}
                {tab === 'pengeluaran' && 'Pengeluaran'}
                {tab === 'pemasukan' && 'Pemasukan (Donasi)'}
                {tab === 'syahriah' && 'Pemasukan (Syahriah)'}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Informasi */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Informasi:</strong> Semua data summary dan saldo sekarang mengikuti filter periode yang dipilih. 
              Data dihitung berdasarkan transaksi aktual dalam periode tersebut.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeuanganTPQ;