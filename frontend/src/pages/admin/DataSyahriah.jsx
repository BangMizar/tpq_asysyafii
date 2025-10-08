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
  const [summaryData, setSummaryData] = useState({
    total_nominal: 0,
    lunas: 0,
    belum_lunas: 0
  });
  const [filteredSummaryData, setFilteredSummaryData] = useState({
    total_nominal: 0,
    lunas: 0,
    belum_lunas: 0
  });
  const [waliData, setWaliData] = useState([]);
  
  // State untuk modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedSyahriah, setSelectedSyahriah] = useState(null);
  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  // State untuk filter
  const [filterNama, setFilterNama] = useState('');
  const [filterBulanTahun, setFilterBulanTahun] = useState(getCurrentMonth());
  
  // State untuk form
  const [formData, setFormData] = useState({
    id_wali: '',
    bulan: getCurrentMonth(),
    nominal: 110000,
    status: 'belum'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua data
  useEffect(() => {
    fetchAllData();
    fetchWaliData();
  }, [API_URL]);

  // Calculate summary when data or filters change
  useEffect(() => {
    calculateFilteredSummary();
  }, [pembayaranData, filterNama, filterBulanTahun]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch data syahriah
      const syahriahResponse = await fetch(`${API_URL}/api/admin/syahriah`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!syahriahResponse.ok) {
        throw new Error(`HTTP error! status: ${syahriahResponse.status}`);
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
      calculateSummary(sortedData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Gagal memuat data: ${err.message}`);
      setPembayaranData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary data from pembayaranData
  const calculateSummary = (data) => {
    if (!data || data.length === 0) {
      setSummaryData({
        total_nominal: 0,
        lunas: 0,
        belum_lunas: 0
      });
      return;
    }

    const totalNominal = data
      .filter(item => item.status === 'lunas')
      .reduce((sum, item) => sum + (parseFloat(item.nominal) || 0), 0);

    const lunasCount = data.filter(item => item.status === 'lunas').length;
    const belumLunasCount = data.filter(item => item.status === 'belum').length;

    setSummaryData({
      total_nominal: totalNominal,
      lunas: lunasCount,
      belum_lunas: belumLunasCount
    });
  };

  // Calculate filtered summary based on current filters
  const calculateFilteredSummary = () => {
    const filteredData = pembayaranData.filter(item => {
      const matchesNama = filterNama === '' || 
        (item.wali?.nama_lengkap && item.wali.nama_lengkap.toLowerCase().includes(filterNama.toLowerCase()));
      
      const matchesBulanTahun = filterBulanTahun === '' || item.bulan.includes(filterBulanTahun);
      
      return matchesNama && matchesBulanTahun;
    });

    if (!filteredData || filteredData.length === 0) {
      setFilteredSummaryData({
        total_nominal: 0,
        lunas: 0,
        belum_lunas: 0
      });
      return;
    }

    const totalNominal = filteredData
      .filter(item => item.status === 'lunas')
      .reduce((sum, item) => sum + (parseFloat(item.nominal) || 0), 0);

    const lunasCount = filteredData.filter(item => item.status === 'lunas').length;
    const belumLunasCount = filteredData.filter(item => item.status === 'belum').length;

    setFilteredSummaryData({
      total_nominal: totalNominal,
      lunas: lunasCount,
      belum_lunas: belumLunasCount
    });
  };

  // Fetch data wali
  const fetchWaliData = async () => {
    try {
      console.log('🔍 Fetching wali data from:', `${API_URL}/api/admin/wali`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Token tidak ditemukan');
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/wali`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Wali data received:', data);
      
      if (Array.isArray(data)) {
        setWaliData(data);
        console.log(`Loaded ${data.length} wali records`);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setWaliData([]);
      }

    } catch (err) {
      console.error('Error fetching wali data:', err);
      setError('Gagal memuat data wali: ' + err.message);
      setWaliData([]);
    }
  };

  // Filter data berdasarkan nama wali dan bulan
  const filteredData = pembayaranData.filter(item => {
    const matchesNama = filterNama === '' || 
      (item.wali?.nama_lengkap && item.wali.nama_lengkap.toLowerCase().includes(filterNama.toLowerCase()));
    
    const matchesBulanTahun = filterBulanTahun === '' || item.bulan.includes(filterBulanTahun);
    
    return matchesNama && matchesBulanTahun;
  });

  // Filter data untuk tab tunggakan
  const tunggakanData = filteredData.filter(item => item.status === 'belum');

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Handle pembayaran
  const handleBayarSyahriah = async (idSyahriah) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah/${idSyahriah}/bayar`, {
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

      await fetchAllData();
      showAlert('Berhasil', 'Pembayaran berhasil dilakukan', 'success');
    } catch (err) {
      console.error('Error paying syahriah:', err);
      showAlert('Gagal', 'Gagal melakukan pembayaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle create syahriah
  const handleCreateSyahriah = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      await fetchAllData();
      setShowCreateModal(false);
      resetForm();
      showAlert('Berhasil', 'Data syahriah berhasil dibuat', 'success');
    } catch (err) {
      console.error('Error creating syahriah:', err);
      showAlert('Gagal', err.message || 'Gagal membuat data syahriah', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle update syahriah
  const handleUpdateSyahriah = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah/${selectedSyahriah.id_syahriah}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nominal: parseFloat(formData.nominal),
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      await fetchAllData();
      setShowEditModal(false);
      resetForm();
      setSelectedSyahriah(null);
      showAlert('Berhasil', 'Data syahriah berhasil diupdate', 'success');
    } catch (err) {
      console.error('Error updating syahriah:', err);
      showAlert('Gagal', err.message || 'Gagal mengupdate data syahriah', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete syahriah
  const handleDeleteSyahriah = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah/${selectedSyahriah.id_syahriah}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      await fetchAllData();
      setShowDeleteModal(false);
      setSelectedSyahriah(null);
      showAlert('Berhasil', 'Data syahriah berhasil dihapus', 'success');
    } catch (err) {
      console.error('Error deleting syahriah:', err);
      showAlert('Gagal', err.message || 'Gagal menghapus data syahriah', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id_wali: '',
      bulan: getCurrentMonth(),
      nominal: 110000,
      status: 'belum'
    });
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (syahriah) => {
    setSelectedSyahriah(syahriah);
    setFormData({
      id_wali: syahriah.id_wali,
      bulan: syahriah.bulan,
      nominal: syahriah.nominal,
      status: syahriah.status
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (syahriah) => {
    setSelectedSyahriah(syahriah);
    setShowDeleteModal(true);
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

  // Get unique bulan-tahun from data for filter
  const getUniqueBulanTahun = () => {
    const bulanTahunList = pembayaranData.map(item => item.bulan);
    const uniqueBulanTahun = [...new Set(bulanTahunList)].sort((a, b) => {
      // Sort descending (newest first)
      return new Date(b) - new Date(a);
    });
    
    return uniqueBulanTahun;
  };

  // Check if filters are active
  const isFilterActive = () => {
    return filterNama !== '' || filterBulanTahun !== '';
  };

  // Get current summary data (filtered or total)
  const getCurrentSummaryData = () => {
    return isFilterActive() ? filteredSummaryData : summaryData;
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

  const renderContent = () => {
    if (loading && pembayaranData.length === 0) {
      return (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      );
    }

    if (error && pembayaranData.length === 0) {
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
            onClick={fetchAllData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    const dataToShow = activeTab === 'tunggakan' ? tunggakanData : filteredData;
    const currentSummaryData = getCurrentSummaryData();

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
            {dataToShow.map((item) => (
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {item.status === 'belum' ? (
                    <button 
                      onClick={() => handleBayarSyahriah(item.id_syahriah)}
                      className="text-green-600 hover:text-green-900"
                      disabled={loading}
                    >
                      Bayar
                    </button>
                  ) : ("")}
                  <button 
                    onClick={() => openEditModal(item)}
                    className="text-yellow-600 hover:text-yellow-900 ml-2"
                  >
                    {icons.edit}
                  </button>
                  <button 
                    onClick={() => openDeleteModal(item)}
                    className="text-red-600 hover:text-red-900 ml-2"
                  >
                    {icons.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {dataToShow.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Tidak ada data {activeTab === 'tunggakan' ? 'tunggakan' : 'pembayaran'}
          </div>
        )}
      </div>
    );
  };

  // Get current summary data for display
  const currentSummaryData = getCurrentSummaryData();

  return (
    <AuthDashboardLayout title="Data Syahriah">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Pembayaran {isFilterActive() && <span className="text-green-600 text-xs">(1 Bulan)</span>}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSummaryData ? formatCurrency(currentSummaryData.total_nominal) : 'Rp 0'}
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
              <p className="text-sm font-medium text-gray-600">
                Santri Lunas {isFilterActive() && <span className="text-blue-600 text-xs">(1 Bulan)</span>}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSummaryData ? currentSummaryData.lunas : 0}
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
              <p className="text-sm font-medium text-gray-600">
                Santri Menunggak {isFilterActive() && <span className="text-red-600 text-xs">(1 Bulan)</span>}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSummaryData ? currentSummaryData.belum_lunas : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Data Pembayaran Syahriah</h2>
          <button 
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            {icons.plus}
            <span className="ml-2">Input Pembayaran</span>
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Nama Wali
            </label>
            <input
              type="text"
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              placeholder="Masukkan nama wali..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Bulan/Tahun
            </label>
            <input
              type="month"
              value={filterBulanTahun}
              onChange={(e) => setFilterBulanTahun(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterNama('');
                setFilterBulanTahun('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              {icons.filter}
              <span className="ml-2">Reset Filter</span>
            </button>
          </div>
          <div className="flex items-end">
            {isFilterActive() && (
              <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center">
                  Menampilkan data yang difilter
                </p>
              </div>
            )}
          </div>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Data Syahriah</h3>
            <form onSubmit={handleCreateSyahriah}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wali
                  </label>
                  <select
                    required
                    value={formData.id_wali}
                    onChange={(e) => setFormData({...formData, id_wali: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih Wali</option>
                    {waliData && waliData.length > 0 ? (
                      waliData.map((wali) => (
                        <option 
                          key={wali.id_user} 
                          value={wali.id_user} // PERBAIKAN: Gunakan id_user sebagai value
                        >
                          {wali.nama_lengkap} {wali.email ? `- ${wali.email}` : wali.no_telp ? `- ${wali.no_telp}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {loading ? 'Memuat data wali...' : 'Tidak ada data wali tersedia'}
                      </option>
                    )}
                  </select>
                  {!loading && waliData.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">
                      Tidak ada data wali. Pastikan backend berjalan dan ada user dengan role "wali".
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bulan
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.bulan}
                    onChange={(e) => setFormData({...formData, bulan: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.nominal}
                    onChange={(e) => setFormData({...formData, nominal: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nominal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="belum">Belum Bayar</option>
                    <option value="lunas">Lunas</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || waliData.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSyahriah && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Data Syahriah</h3>
            <form onSubmit={handleUpdateSyahriah}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wali
                  </label>
                  <input
                    type="text"
                    value={selectedSyahriah.wali?.nama_lengkap || 'N/A'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bulan
                  </label>
                  <input
                    type="text"
                    value={formatBulan(selectedSyahriah.bulan)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.nominal}
                    onChange={(e) => setFormData({...formData, nominal: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="belum">Belum Bayar</option>
                    <option value="lunas">Lunas</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSyahriah && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Data Syahriah</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus data syahriah untuk{' '}
              <strong>{selectedSyahriah.wali?.nama_lengkap || 'N/A'}</strong> bulan{' '}
              <strong>{formatBulan(selectedSyahriah.bulan)}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSyahriah}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
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

export default DataSyahriah;