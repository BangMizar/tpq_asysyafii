import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SemuaTagihanWali = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tagihanSyahriah, setTagihanSyahriah] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterTahun, setFilterTahun] = useState('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch data santri dan tagihan
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch data santri milik wali
        const santriResponse = await fetch(`${API_URL}/api/wali/santri`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        let santriData = [];
        if (santriResponse.ok) {
          const result = await santriResponse.json();
          santriData = result.data || [];
        }
        setSantriList(santriData);

        // Fetch data syahriah untuk wali
        const syahriahResponse = await fetch(`${API_URL}/api/syahriah?limit=100`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!syahriahResponse.ok) {
          throw new Error('Tidak bisa mengakses data syahriah');
        }

        const syahriahResult = await syahriahResponse.json();
        const allSyahriah = syahriahResult.data || [];

        // Urutkan: belum lunas di atas, lalu lunas, dan urut berdasarkan bulan terbaru
        const sortedTagihan = allSyahriah.sort((a, b) => {
          if (a.status === 'belum' && b.status === 'lunas') return -1;
          if (a.status === 'lunas' && b.status === 'belum') return 1;
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

    fetchData();
  }, [API_URL]);

  // Get unique years from tagihan data
  const getAvailableYears = () => {
    const years = tagihanSyahriah.map(tagihan => {
      try {
        return new Date(tagihan.bulan).getFullYear();
      } catch {
        return null;
      }
    }).filter(year => year !== null);
    
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
    return uniqueYears;
  };

  // Filter tagihan berdasarkan status, tahun, dan santri
  const filteredTagihan = tagihanSyahriah.filter(tagihan => {
    // Filter by status
    const statusMatch = filterStatus === 'semua' || tagihan.status === filterStatus;
    
    // Filter by year
    let yearMatch = true;
    if (filterTahun !== 'semua') {
      try {
        const tagihanYear = new Date(tagihan.bulan).getFullYear();
        yearMatch = tagihanYear.toString() === filterTahun;
      } catch {
        yearMatch = false;
      }
    }

    // Filter by santri
    const santriMatch = selectedSantri === 'semua' || tagihan.id_santri === selectedSantri;
    
    return statusMatch && yearMatch && santriMatch;
  });

  // Kelompokkan tagihan berdasarkan santri
  const tagihanBySantri = filteredTagihan.reduce((acc, item) => {
    const key = item.id_santri;
    if (!acc[key]) {
      acc[key] = {
        santri: santriList.find(s => s.id_santri === key) || { 
          nama_lengkap: item.santri?.nama_lengkap || 'Santri',
          id_santri: item.id_santri
        },
        tagihan: []
      };
    }
    acc[key].tagihan.push(item);
    return acc;
  }, {});

  // Pagination logic
  const totalPages = Math.ceil(Object.keys(tagihanBySantri).length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSantriGroups = Object.values(tagihanBySantri).slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterTahun, selectedSantri]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

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
      belum: { color: 'bg-red-100 text-red-800 border border-red-200', text: 'Belum dibayar' }
    };
    
    const config = statusConfig[status] || statusConfig.belum;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTotalNominal = (status) => {
    return filteredTagihan
      .filter(tagihan => status === 'semua' || tagihan.status === status)
      .reduce((total, tagihan) => total + (tagihan.nominal || 0), 0);
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        {/* Previous button */}
        <button
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* First page */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => paginate(1)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              currentPage === number
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {number}
          </button>
        ))}

        {/* Last page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
            <button
              onClick={() => paginate(totalPages)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next button */}
        <button
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="h-8 bg-green-200 rounded w-64 mb-4 lg:mb-0"></div>
        <div className="h-6 bg-green-200 rounded w-48"></div>
      </div>

      {/* Santri Selection Skeleton */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
        <div className="h-6 bg-green-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-green-200 rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-green-200 rounded-xl"></div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-green-200 rounded-lg w-24"></div>
            ))}
          </div>
          <div className="h-10 bg-green-200 rounded-lg w-32"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="h-6 bg-green-200 rounded w-48"></div>
        </div>
        <div className="p-6 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-green-200 rounded w-32"></div>
                  <div className="h-4 bg-green-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-3 ml-4">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
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
              to="/wali"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableYears = getAvailableYears();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Semua Tagihan Syahriah</h1>
        </div>
        <Link 
          to="/wali"
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 mt-4 lg:mt-0 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Santri Selection Section */}
      {santriList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-green-900">
              Pilih Santri
            </h2>
            <span className="text-sm text-green-600">
              {santriList.length} santri terdaftar
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card Semua Santri */}
            <div
              onClick={() => setSelectedSantri('semua')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedSantri === 'semua'
                  ? 'bg-green-500 border-green-600 transform scale-105 shadow-lg'
                  : 'bg-green-100 border-green-200 hover:bg-green-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedSantri === 'semua'
                    ? 'bg-green-400 text-white'
                    : 'bg-green-200 text-green-600'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${
                    selectedSantri === 'semua' ? 'text-white' : 'text-green-900'
                  }`}>
                    Semua Santri
                  </h3>
                  <p className={`text-sm ${
                    selectedSantri === 'semua' ? 'text-green-100' : 'text-green-600'
                  }`}>
                    {tagihanSyahriah.length} total syahriah
                  </p>
                </div>
              </div>
            </div>

            {/* Card per Santri */}
            {santriList.map((santri) => {
              const santriTagihan = tagihanBySantri[santri.id_santri]?.tagihan || [];
              const hasUnpaid = santriTagihan.some(t => t.status === 'belum');
              
              return (
                <div
                  key={santri.id_santri}
                  onClick={() => setSelectedSantri(santri.id_santri)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedSantri === santri.id_santri
                      ? 'bg-green-500 border-green-600 transform scale-105 shadow-lg'
                      : 'bg-green-100 border-green-200 hover:bg-green-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedSantri === santri.id_santri
                        ? 'bg-green-400 text-white'
                        : 'bg-green-200 text-green-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${
                        selectedSantri === santri.id_santri ? 'text-white' : 'text-green-900'
                      }`}>
                        {santri.nama_lengkap}
                      </h3>
                      <p className={`text-sm ${
                        selectedSantri === santri.id_santri ? 'text-green-100' : 'text-green-600'
                      }`}>
                        {santriTagihan.length} syahriah
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hasUnpaid
                        ? selectedSantri === santri.id_santri
                          ? 'bg-red-400 text-white'
                          : 'bg-red-100 text-red-800'
                        : selectedSantri === santri.id_santri
                          ? 'bg-green-400 text-white'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {hasUnpaid ? 'Ada tagihan' : 'Semua lunas'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Tagihan */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Total Syahriah</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{filteredTagihan.length}</p>
          </div>
        </div>

        {/* Lunas */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Lunas</p>
            <p className="text-2xl font-bold text-green-800 mt-1">
              {filteredTagihan.filter(t => t.status === 'lunas').length}
            </p>
          </div>
        </div>

        {/* Belum Lunas */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="text-center">
            <p className="text-sm text-red-600 font-medium">Belum Dibayar</p>
            <p className="text-2xl font-bold text-red-800 mt-1">
              {filteredTagihan.filter(t => t.status === 'belum').length}
            </p>
          </div>
        </div>

        {/* Total Nominal */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Total Nominal</p>
            {filterStatus === 'semua' ? (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-600">Lunas:</span>
                  <span className="text-sm font-semibold text-green-800">
                    {formatCurrency(getTotalNominal('lunas'))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-600">Belum:</span>
                  <span className="text-sm font-semibold text-red-800">
                    {formatCurrency(getTotalNominal('belum'))}
                  </span>
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

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('semua')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'semua' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Semua Status
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
              Lunas
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Tahun:</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="semua">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tagihan List */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-900">
              Daftar Syahriah ({Object.keys(tagihanBySantri).length} Santri)
              {Object.keys(tagihanBySantri).length > itemsPerPage && (
                <span className="text-sm font-normal text-green-600 ml-2">
                  (Halaman {currentPage} dari {totalPages})
                </span>
              )}
            </h2>
            <div className="text-sm text-green-600">
              Total: {filteredTagihan.length} tagihan
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {currentSantriGroups.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Tidak Ada Tagihan</h3>
              <p className="text-green-600">
                {filterStatus === 'semua' && filterTahun === 'semua' && selectedSantri === 'semua'
                  ? 'Belum ada tagihan syahriah' 
                  : `Tidak ada tagihan dengan filter yang dipilih`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {currentSantriGroups.map((group, index) => (
                <div key={group.santri.id_santri || index} className="space-y-4">
                  {/* Header Santri */}
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {group.santri.nama_lengkap}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {group.tagihan.length} bulan syahriah
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Status</div>
                      <div className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${group.tagihan.some(s => s.status === 'belum') 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-green-100 text-green-800 border border-green-200'
                        }
                      `}>
                        {group.tagihan.some(s => s.status === 'belum') ? 'Ada yang belum dibayar' : 'Semua lunas'}
                      </div>
                    </div>
                  </div>

                  {/* Daftar Tagihan per Santri */}
                  <div className="space-y-3 ml-4">
                    {group.tagihan.map((tagihan) => (
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
                                <div className="text-sm text-red-600 mt-1">
                                  Jatuh tempo: {formatDate(tagihan.waktu_catat)}
                                </div>
                              )}
                              {tagihan.status === 'lunas' && (
                                <div className="text-sm text-green-600 mt-1">
                                  Dibayar: {formatDate(tagihan.waktu_catat)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className={`font-bold text-lg ${
                            tagihan.status === 'belum' ? 'text-red-800' : 'text-green-800'
                          }`}>
                            {formatCurrency(tagihan.nominal)}
                          </div>
                          <div>
                            {getStatusBadge(tagihan.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <Pagination />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SemuaTagihanWali;