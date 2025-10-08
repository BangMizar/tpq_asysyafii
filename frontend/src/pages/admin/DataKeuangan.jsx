import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DataKeuangan = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rekap');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rekapData, setRekapData] = useState([]);
  const [pemakaianData, setPemakaianData] = useState([]);
  const [donasiData, setDonasiData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('semua');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  // State untuk modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  
  // State untuk modal CRUD pemakaian
  const [showPemakaianModal, setShowPemakaianModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedPemakaian, setSelectedPemakaian] = useState(null);
  const [formData, setFormData] = useState({
    judul_pemakaian: '',
    deskripsi: '',
    nominal: '',
    tipe_pemakaian: 'operasional',
    sumber_dana: 'syahriah',
    tanggal_pemakaian: new Date().toISOString().split('T')[0],
    keterangan: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua data
  useEffect(() => {
    fetchAllData();
  }, [API_URL]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Load data secara parallel untuk admin
      const [rekapResponse, pemakaianResponse, donasiResponse, rekapAllResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/rekap?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/admin/pemakaian?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/admin/donasi?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/admin/rekap?limit=1000`, {
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
      if (!rekapAllResponse.ok) throw new Error('Gagal memuat semua data rekap');

      const rekapResult = await rekapResponse.json();
      const pemakaianResult = await pemakaianResponse.json();
      const donasiResult = await donasiResponse.json();
      const rekapAllResult = await rekapAllResponse.json();

      setRekapData(rekapResult.data || []);
      setPemakaianData(pemakaianResult.data || []);
      setDonasiData(donasiResult.data || []);

      // Extract unique periods
      const periods = [...new Set(rekapAllResult.data.map(item => item.periode))].sort().reverse();
      setAvailablePeriods(periods);

      // Calculate summary data untuk admin
      calculateSummary(rekapAllResult.data, pemakaianResult.data, donasiResult.data);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Gagal memuat data: ${err.message}`);
      showAlert('Error', `Gagal memuat data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary data untuk admin
  const calculateSummary = (rekapData, pemakaianData, donasiData) => {
    // Total pemasukan (from total rekap)
    const totalPemasukan = rekapData
      .filter(item => item.tipe_saldo === 'total')
      .reduce((sum, item) => sum + item.pemasukan_total, 0);

    // Total pengeluaran (from total rekap + pemakaian)
    const totalPengeluaranRekap = rekapData
      .filter(item => item.tipe_saldo === 'total')
      .reduce((sum, item) => sum + item.pengeluaran_total, 0);

    const totalPengeluaranPemakaian = pemakaianData
      .reduce((sum, item) => sum + item.nominal, 0);

    const totalPengeluaran = totalPengeluaranRekap + totalPengeluaranPemakaian;

    // Saldo akhir (latest total saldo)
    const latestTotalRekap = rekapData
      .filter(item => item.tipe_saldo === 'total')
      .sort((a, b) => new Date(b.terakhir_update) - new Date(a.terakhir_update))[0];

    const saldoAkhir = latestTotalRekap ? latestTotalRekap.saldo_akhir : 0;

    // Total donasi bulan ini
    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalDonasiBulanIni = donasiData
      .filter(item => new Date(item.waktu_catat).toISOString().slice(0, 7) === currentMonth)
      .reduce((sum, item) => sum + item.nominal, 0);

    setSummaryData({
      totalPemasukan,
      totalPengeluaran,
      saldoAkhir,
      totalDonasiBulanIni
    });
  };

  // ========== CRUD FUNCTIONS FOR PEMAKAIAN ==========

  // Create new pemakaian
  const handleCreatePemakaian = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/pemakaian`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          judul_pemakaian: formData.judul_pemakaian,
          deskripsi: formData.deskripsi,
          nominal: parseFloat(formData.nominal),
          tipe_pemakaian: formData.tipe_pemakaian,
          sumber_dana: formData.sumber_dana,
          tanggal_pemakaian: formData.tanggal_pemakaian,
          keterangan: formData.keterangan || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat data pemakaian');
      }

      const result = await response.json();
      showAlert('Berhasil', 'Data pemakaian berhasil dibuat!', 'success');
      setShowPemakaianModal(false);
      resetForm();
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error creating pemakaian:', err);
      showAlert('Gagal', `Gagal membuat data pemakaian: ${err.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Update pemakaian
  const handleUpdatePemakaian = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/pemakaian/${selectedPemakaian.id_pemakaian}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          judul_pemakaian: formData.judul_pemakaian,
          deskripsi: formData.deskripsi,
          nominal: parseFloat(formData.nominal),
          tipe_pemakaian: formData.tipe_pemakaian,
          sumber_dana: formData.sumber_dana,
          tanggal_pemakaian: formData.tanggal_pemakaian,
          keterangan: formData.keterangan || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengupdate data pemakaian');
      }

      const result = await response.json();
      showAlert('Berhasil', 'Data pemakaian berhasil diupdate!', 'success');
      setShowPemakaianModal(false);
      resetForm();
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error updating pemakaian:', err);
      showAlert('Gagal', `Gagal mengupdate data pemakaian: ${err.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete pemakaian
  const handleDeletePemakaian = async (pemakaianId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pemakaian ini?')) {
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/pemakaian/${pemakaianId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus data pemakaian');
      }

      showAlert('Berhasil', 'Data pemakaian berhasil dihapus!', 'success');
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error deleting pemakaian:', err);
      showAlert('Gagal', `Gagal menghapus data pemakaian: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for create
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedPemakaian(null);
    resetForm();
    setShowPemakaianModal(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (pemakaian) => {
    setModalMode('edit');
    setSelectedPemakaian(pemakaian);
    setFormData({
      judul_pemakaian: pemakaian.judul_pemakaian,
      deskripsi: pemakaian.deskripsi,
      nominal: pemakaian.nominal.toString(),
      tipe_pemakaian: pemakaian.tipe_pemakaian,
      sumber_dana: pemakaian.sumber_dana,
      tanggal_pemakaian: pemakaian.tanggal_pemakaian 
        ? new Date(pemakaian.tanggal_pemakaian).toISOString().split('T')[0]
        : new Date(pemakaian.created_at).toISOString().split('T')[0],
      keterangan: pemakaian.keterangan || ''
    });
    setShowPemakaianModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      judul_pemakaian: '',
      deskripsi: '',
      nominal: '',
      tipe_pemakaian: 'operasional',
      sumber_dana: 'syahriah',
      tanggal_pemakaian: new Date().toISOString().split('T')[0],
      keterangan: ''
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Handle generate rekap otomatis
  const handleGenerateRekap = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/rekap/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Gagal generate rekap otomatis');
      }

      const result = await response.json();
      showAlert('Berhasil', 'Rekap berhasil digenerate otomatis!', 'success');
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error generating rekap:', err);
      showAlert('Gagal', 'Gagal generate rekap: ' + err.message, 'error');
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

  // Get filtered rekap data
  const getFilteredRekap = () => {
    if (selectedPeriod === 'semua') {
      return rekapData.filter(item => item.tipe_saldo === 'total');
    }
    return rekapData.filter(item => item.tipe_saldo === 'total' && item.periode === selectedPeriod);
  };

  // Get filtered pemakaian data
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

  // Get filtered donasi data
  const getFilteredDonasi = () => {
    if (selectedPeriod === 'semua') {
      return donasiData;
    }
    return donasiData.filter(item => {
      const itemPeriod = new Date(item.waktu_catat).toISOString().slice(0, 7);
      return itemPeriod === selectedPeriod;
    });
  };

  // Get current period text
  const getCurrentPeriodText = () => {
    if (selectedPeriod === 'semua') {
      return 'Semua Periode';
    }
    return formatPeriod(selectedPeriod);
  };

  // Ikon SVG
  const icons = {
    money: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    chart: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    plus: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    refresh: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    edit: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    delete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    filter: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
      </svg>
    )
  };

  // Loading component
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      {/* Statistics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // Error component
  const ErrorMessage = () => (
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
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading && rekapData.length === 0 && pemakaianData.length === 0 && donasiData.length === 0) {
      return <LoadingSkeleton />;
    }

    if (error && rekapData.length === 0 && pemakaianData.length === 0 && donasiData.length === 0) {
      return <ErrorMessage />;
    }

    const filteredRekap = getFilteredRekap();
    const filteredPemakaian = getFilteredPemakaian();
    const filteredDonasi = getFilteredDonasi();

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
                <p className="text-green-600 mb-4">Data rekap keuangan akan muncul setelah ada transaksi</p>
                <button
                  onClick={handleGenerateRekap}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Rekap Otomatis'}
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemasukan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengeluaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Update Terakhir</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRekap.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPeriod(item.periode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(item.pemasukan_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(item.pengeluaran_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatCurrency(item.saldo_akhir)}
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
                <p className="text-green-600 mb-4">Data pengeluaran akan muncul setelah ada pemakaian saldo</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  {icons.plus}
                  <span className="ml-2">Tambah Pengeluaran</span>
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sumber Dana</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diajukan Oleh</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPemakaian.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit"
                          >
                            {icons.edit}
                          </button>
                          <button
                            onClick={() => handleDeletePemakaian(item.id_pemakaian)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Hapus"
                          >
                            {icons.delete}
                          </button>
                        </div>
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
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Pemasukan</h3>
                <p className="text-green-600">Data pemasukan akan muncul setelah ada donasi atau pembayaran syahriah</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Telp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDonasi.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
      
      default:
        return null;
    }
  };

  return (
    <AuthDashboardLayout title="Data Keuangan - Admin">
      {/* Statistics untuk Admin */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Pemasukan</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(summaryData?.totalPemasukan || 0)}
              </p>
              <p className="text-xs text-green-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.chart}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(summaryData?.totalPengeluaran || 0)}
              </p>
              <p className="text-xs text-red-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Saldo Akhir</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(summaryData?.saldoAkhir || 0)}
              </p>
              <p className="text-xs text-blue-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Donasi Bulan Ini</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(summaryData?.totalDonasiBulanIni || 0)}
              </p>
              <p className="text-xs text-purple-500 mt-1">{formatPeriod(new Date().toISOString().slice(0, 7))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content untuk Admin */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 lg:mb-0">Manajemen Keuangan</h2>
          
          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
            {/* Period Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Periode:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="semua">Semua Periode</option>
                {availablePeriods.map(period => (
                  <option key={period} value={period}>
                    {formatPeriod(period)}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons untuk Admin */}
            <div className="flex space-x-3">
              <button
                onClick={handleOpenCreateModal}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center"
              >
                {icons.plus}
                <span className="ml-2">Pengeluaran</span>
              </button>
              <Link 
                to="/admin/donasi"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center"
              >
                {icons.plus}
                <span className="ml-2">Donasi</span>
              </Link>
              <button
                onClick={handleGenerateRekap}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50"
              >
                {icons.refresh}
                <span className="ml-2">Generate Rekap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs untuk Admin */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {['rekap', 'pengeluaran', 'pemasukan'].map((tab) => (
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
              </button>
            ))}
          </nav>
        </div>
        
        {/* Table Content */}
        <div>
          {renderContent()}
        </div>
      </div>

      {/* Modal untuk Create/Edit Pemakaian */}
      {showPemakaianModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {modalMode === 'create' ? 'Tambah Pengeluaran Baru' : 'Edit Pengeluaran'}
            </h3>
            
            <form onSubmit={modalMode === 'create' ? handleCreatePemakaian : handleUpdatePemakaian}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Judul Pemakaian */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Pengeluaran *
                  </label>
                  <input
                    type="text"
                    name="judul_pemakaian"
                    value={formData.judul_pemakaian}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan judul pengeluaran"
                  />
                </div>

                {/* Deskripsi */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi *
                  </label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan deskripsi pengeluaran"
                  />
                </div>

                {/* Nominal */}
                <input
                type="number"
                name="nominal"
                value={formData.nominal}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0"
              />
                {/* Tanggal Pemakaian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Pengeluaran *
                  </label>
                  <input
                    type="date"
                    name="tanggal_pemakaian"
                    value={formData.tanggal_pemakaian}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Tipe Pemakaian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Pengeluaran *
                  </label>
                  <select
                    name="tipe_pemakaian"
                    value={formData.tipe_pemakaian}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="operasional">Operasional</option>
                    <option value="investasi">Investasi</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Sumber Dana */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sumber Dana *
                  </label>
                  <select
                    name="sumber_dana"
                    value={formData.sumber_dana}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="syahriah">Syahriah</option>
                    <option value="donasi">Donasi</option>
                    <option value="campuran">Campuran</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan Tambahan
                  </label>
                  <textarea
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan keterangan tambahan (opsional)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPemakaianModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {formLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    modalMode === 'create' ? 'Tambah Pengeluaran' : 'Update Pengeluaran'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertMessage.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {alertMessage.type === 'success' ? (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {alertMessage.title}
            </h3>
            <p className={`text-center mb-6 ${
              alertMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {alertMessage.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAlertModal(false)}
                className={`px-6 py-2 rounded-lg text-white ${
                  alertMessage.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } transition-colors`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthDashboardLayout>
  );
};

export default DataKeuangan;