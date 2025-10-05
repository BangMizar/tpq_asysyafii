import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const DonasiPage = () => {
  const [donasi, setDonasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalDonasi, setTotalDonasi] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Fetch data donasi dari API public
  useEffect(() => {
    const fetchDonasiData = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Build URL dengan filter
        let url = `${API_URL}/api/donasi-public?page=${currentPage}&limit=10`
        if (startDate) {
          url += `&start_date=${startDate}`
        }
        if (endDate) {
          url += `&end_date=${endDate}`
        }
        
        // Fetch data donasi public dengan pagination
        const donasiResponse = await fetch(url)
        
        if (!donasiResponse.ok) {
          throw new Error(`HTTP error! status: ${donasiResponse.status}`)
        }

        const contentType = donasiResponse.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await donasiResponse.text()
          throw new Error('Server returned non-JSON response')
        }

        const donasiData = await donasiResponse.json()
        
        // Fetch summary donasi public dengan filter yang sama
        let summaryUrl = `${API_URL}/api/donasi-public/summary`
        if (startDate) {
          summaryUrl += `?start_date=${startDate}`
          if (endDate) {
            summaryUrl += `&end_date=${endDate}`
          }
        } else if (endDate) {
          summaryUrl += `?end_date=${endDate}`
        }

        const summaryResponse = await fetch(summaryUrl)
        
        if (!summaryResponse.ok) {
          throw new Error(`HTTP error! status: ${summaryResponse.status}`)
        }

        const summaryContentType = summaryResponse.headers.get("content-type")
        if (!summaryContentType || !summaryContentType.includes("application/json")) {
          throw new Error('Server returned non-JSON response for summary')
        }

        const summaryData = await summaryResponse.json()

        // Set data dari response
        setDonasi(donasiData.data || [])
        setTotalPages(donasiData.meta?.total_page || 1)
        
        // Set data dari summary
        if (summaryData.data) {
          setTotalDonasi(summaryData.data.total_nominal || 0)
        } else {
          setTotalDonasi(summaryData.total_nominal || 0)
        }
      } catch (err) {
        setError(`Gagal memuat data: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchDonasiData()
  }, [currentPage, startDate, endDate, API_URL])

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date untuk tabel
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (e) {
      return 'Invalid Date'
    }
  }

  // Format waktu untuk tabel
  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (e) {
      return 'Invalid Time'
    }
  }

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset filter
  const handleResetFilter = () => {
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Skeleton loader
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>

          {/* Filter Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-all duration-300 bg-gray-100 hover:bg-green-50 px-4 py-2 rounded-xl font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali ke Beranda</span>
              </Link>
              <div className="hidden lg:block w-px h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Catatan Donasi</h1>
                <p className="text-gray-600">Transparansi penuh setiap kebaikan yang diberikan</p>
              </div>
            </div>
            
            {/* Total Donasi Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg min-w-[280px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Donasi Terkumpul</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDonasi)}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {error ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 font-medium shadow-sm"
                >
                  Coba Lagi
                </button>
                <Link 
                  to="/"
                  className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium shadow-sm"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Filter Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filter Data Donasi</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  <span>Filter berdasarkan periode</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Tanggal Mulai</span>
                    </span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Tanggal Selesai</span>
                    </span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleResetFilter}
                    className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 font-medium shadow-sm flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 font-medium shadow-sm flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    <span>Terapkan</span>
                  </button>
                </div>
              </div>
              
              {(startDate || endDate) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Filter aktif: {startDate && `Dari ${formatDate(startDate)}`} {endDate && `Sampai ${formatDate(endDate)}`}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Donasi Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Daftar Donasi</h2>
                    <p className="text-gray-600 text-sm mt-1">Riwayat lengkap semua donasi yang diterima</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
                      {donasi.length} Data {totalPages > 1 && `• Halaman ${currentPage}`}
                    </div>
                  </div>
                </div>
              </div>

              {donasi.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Tidak Ada Data Donasi</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {startDate || endDate 
                      ? 'Tidak ada data donasi dalam periode yang dipilih. Coba ubah filter tanggal atau reset filter untuk melihat semua data.'
                      : 'Belum ada data donasi yang tercatat. Donasi pertama akan muncul di sini.'
                    }
                  </p>
                  {(startDate || endDate) && (
                    <button
                      onClick={handleResetFilter}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-300 font-medium shadow-sm inline-flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Tampilkan Semua Data</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Enhanced Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Donatur</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kontak</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Nominal</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal & Waktu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {donasi.map((item, index) => (
                          <tr 
                            key={item.id_donasi || index}
                            className="hover:bg-gray-50 transition-all duration-200 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                {(currentPage - 1) * 10 + index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {item.nama_donatur ? item.nama_donatur.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {item.nama_donatur || 'Anonim'}
                                  </div>
                                  {(!item.nama_donatur || item.nama_donatur === 'Anonim') && (
                                    <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                                      Anonim
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">
                                {item.no_telp ? (
                                  <span className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>{item.no_telp}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatCurrency(item.nominal)}
                                </div>
                                {item.nominal >= 1000000 && (
                                  <div className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full inline-block mt-1">
                                    💫 Donasi Besar
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{formatDate(item.waktu_catat)}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-500">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-xs">{formatTime(item.waktu_catat)} WIB</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-6 border-t border-gray-100 bg-gray-50">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Menampilkan halaman {currentPage} dari {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Sebelumnya</span>
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {[...Array(totalPages)].map((_, index) => {
                              const page = index + 1
                              // Show first page, last page, current page and pages around current page
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                                      currentPage === page
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                )
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-2 text-gray-400">...</span>
                              }
                              return null
                            })}
                          </div>
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm flex items-center space-x-2"
                          >
                            <span>Selanjutnya</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DonasiPage