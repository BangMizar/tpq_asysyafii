import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProgramDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch detail program
  const fetchProgramDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch langsung by slug dari API
      const response = await fetch(`${API_URL}/api/program-unggulan/${slug}`);
      
      if (response.ok) {
        const data = await response.json();
        setProgram(data.data);
      } else if (response.status === 404) {
        throw new Error('Program tidak ditemukan');
      } else {
        throw new Error('Gagal memuat data program');
      }

    } catch (err) {
      console.error('Error fetching program detail:', err);
      setError(err.message);
      setProgram(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProgramDetail();
    }
  }, [slug]);

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto animate-pulse space-y-8">
              {/* Breadcrumb Skeleton */}
              <div className="h-4 bg-gray-200 rounded w-64"></div>
              
              {/* Header Skeleton */}
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
              
              {/* Content Skeleton */}
              <div className="space-y-6">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>

              {/* Features Skeleton */}
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="h-4 bg-gray-200 rounded w-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
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

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-red-800 mb-2">Program Tidak Ditemukan</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 font-medium"
              >
                Kembali
              </button>
              <Link 
                to="/#program"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium"
              >
                Ke Daftar Program
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const fiturList = parseFitur(program.fitur);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Breadcrumb */}
      <section className="pt-8 pb-8 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-300">
            <Link to="/" className="hover:text-green-600 transition-colors">Beranda</Link>
            <span>/</span>
            <Link to="/#program" className="hover:text-green-600 transition-colors">Program Unggulan</Link>
            <span>/</span>
            <span className="text-white truncate max-w-xs md:max-w-md">{program.nama_program}</span>
          </nav>
        </div>
      </section>

      {/* Program Detail Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(program.status)}`}>
                    {formatStatus(program.status)}
                  </span>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Terakhir update: {formatDate(program.diperbarui_pada)}</span>
                  </div>
                  {program.diupdate_oleh && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Oleh: {program.diupdate_oleh.nama_lengkap || 'Admin TPQ'}</span>
                    </div>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight">
                  {program.nama_program}
                </h1>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Deskripsi Program */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Deskripsi Program</h2>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    {program.deskripsi?.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Fitur Program */}
                {fiturList.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Fitur Program</h2>
                    <div className="bg-green-50 rounded-lg p-6">
                      <ul className="space-y-3">
                        {fiturList.map((fitur, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-700">{fitur}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Informasi Tambahan */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Program</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">Status: </span>
                      <span className={`font-medium ${program.status === 'aktif' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatStatus(program.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">Dibuat: </span>
                      <span className="font-medium text-gray-700">{formatDate(program.dibuat_pada)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-gray-600">Terakhir update: </span>
                      <span className="font-medium text-gray-700">{formatDate(program.diperbarui_pada)}</span>
                    </div>
                    {program.diupdate_oleh && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-600">Diupdate oleh: </span>
                        <span className="font-medium text-gray-700">{program.diupdate_oleh.nama_lengkap}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali</span>
              </button>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/program"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Lihat Semua Program</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProgramDetail;