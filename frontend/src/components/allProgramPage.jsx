import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProgramPage = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('aktif'); // Default hanya aktif

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua program
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch semua program unggulan
      const response = await fetch(`${API_URL}/api/program-unggulan`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Semua data program:', data); // Debug log
      
      setPrograms(data.data || []);

    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Gagal memuat data program. Silakan refresh halaman.');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Filter program berdasarkan search dan status
  const filteredPrograms = programs.filter(item => {
    const matchesSearch = item.nama_program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format status
  const formatStatus = (status) => {
    const statusMap = {
      'aktif': 'Aktif',
      'nonaktif': 'Nonaktif'
    };
    return statusMap[status] || status;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colorMap = {
      'aktif': 'bg-green-100 text-green-800 border border-green-200',
      'nonaktif': 'bg-red-100 text-red-800 border border-red-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Parse fitur untuk display
  const parseFitur = (fitur) => {
    if (!fitur) return [];
    
    try {
      if (typeof fitur === 'string') {
        const parsed = JSON.parse(fitur);
        return Array.isArray(parsed) ? parsed : [];
      }
      return Array.isArray(fitur) ? fitur : [];
    } catch (error) {
      // Jika parsing gagal, coba split by newline atau koma
      if (typeof fitur === 'string') {
        if (fitur.includes('\n')) {
          return fitur.split('\n').filter(item => item.trim() !== '');
        }
        if (fitur.includes(',')) {
          return fitur.split(',').filter(item => item.trim() !== '');
        }
        return [fitur];
      }
      return [];
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('aktif');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-8">
              {/* Hero Skeleton */}
              <div className="text-center space-y-4">
                <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
              </div>
              
              {/* Filter Skeleton */}
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="h-12 bg-gray-200 rounded col-span-2"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>

              {/* Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="space-y-2">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="flex items-center space-x-2">
                            <div className="h-4 bg-gray-200 rounded w-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                        ))}
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      
      {/* Hero Section */}
      <section className="pt-8 pb-8 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Program Unggulan TPQ</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
            Berbagai program pembelajaran berkualitas yang disesuaikan dengan kebutuhan dan usia anak di TPQ Asy-Syafi'i Campakoah
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="pt-8 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari program..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
              >
                Cari
              </button>
              {(searchTerm || statusFilter !== 'aktif') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Program List Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button 
                onClick={fetchPrograms}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada program</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'aktif' 
                  ? 'Tidak ada program yang sesuai dengan filter pencarian.' 
                  : 'Belum ada program unggulan yang tersedia.'}
              </p>
              {(searchTerm || statusFilter !== 'aktif') && (
                <button 
                  onClick={resetFilters}
                  className="mt-4 text-green-600 hover:text-green-800 font-medium"
                >
                  Tampilkan program aktif
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Info jumlah program */}
              <div className="mb-6 text-center">
                <p className="text-green-600 font-semibold">
                  Menampilkan {filteredPrograms.length} program
                  {searchTerm && ` untuk pencarian "${searchTerm}"`}
                  {statusFilter !== 'all' && statusFilter !== 'aktif' && ` dalam status ${formatStatus(statusFilter)}`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPrograms.map((item) => {
                  const fiturList = parseFitur(item.fitur);
                  
                  return (
                    <article 
                      key={item.id_program} 
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 hover-lift"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                            {formatStatus(item.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(item.diperbarui_pada)}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-green-800 mb-3 hover:text-green-600 transition-colors">
                          <Link to={`/program/${item.slug}`}>
                            {item.nama_program}
                          </Link>
                        </h3>
                        
                        <p className="text-green-600 mb-4 line-clamp-3">
                          {item.deskripsi}
                        </p>
                        
                        {/* Fitur Program */}
                        {fiturList.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Fitur Utama:</h4>
                            <ul className="space-y-1">
                              {fiturList.slice(0, 3).map((fitur, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-600">
                                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="line-clamp-1">{fitur}</span>
                                </li>
                              ))}
                              {fiturList.length > 3 && (
                                <li className="text-xs text-blue-600 ml-6">
                                  +{fiturList.length - 3} fitur lainnya
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Informasi Tambahan */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Update: {formatDate(item.diperbarui_pada)}</span>
                          </div>
                          {item.diupdate_oleh && (
                            <span>By: {item.diupdate_oleh.nama_lengkap}</span>
                          )}
                        </div>

                        <div className="text-center">
                          <Link 
                            to={`/program/${item.slug}`}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 w-full inline-block"
                          >
                            Info Selengkapnya
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Back to Home */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 text-center">
          <Link 
            to="/"
            className="text-green-600 hover:text-green-800 font-semibold inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProgramPage;