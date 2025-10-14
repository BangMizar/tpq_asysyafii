import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const BeritaManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kategoriFilter, setKategoriFilter] = useState('all');

  // State untuk modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedBerita, setSelectedBerita] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Function hasPermission lokal
  const hasPermission = () => {
    if (!currentUser) return false;
    return currentUser.role === 'super_admin';
  };

  // Fetch berita dari API
  const fetchBerita = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = '/api/super-admin/berita/all';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      // Transform data dari API ke format yang diinginkan
      const transformedBerita = data.data.map(item => ({
        id: item.id_berita,
        judul: item.judul,
        slug: item.slug,
        penulis: item.penulis?.nama_lengkap || 'Admin',
        tanggal: item.tanggal_publikasi ? new Date(item.tanggal_publikasi).toISOString().split('T')[0] : '-',
        status: item.status,
        kategori: item.kategori,
        konten: item.konten,
        gambar_cover: item.gambar_cover,
        dibuat_pada: item.dibuat_pada,
        diperbarui_pada: item.diperbarui_pada,
        views: 0 // Tambahkan jika ada field views di API
      }));
      
      setBerita(transformedBerita);

    } catch (err) {
      console.error('Error fetching berita:', err);
      setError(`Gagal memuat data berita: ${err.message}`);
      setBerita([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user has permission to access this page
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!hasPermission()) {
      navigate('/unauthorized');
      return;
    }

    fetchBerita();
  }, [currentUser, navigate]);

  // Modal handlers
  const openDeleteModal = (berita) => {
    setSelectedBerita(berita);
    setShowDeleteModal(true);
  };

  const openPublishModal = (berita) => {
    setSelectedBerita(berita);
    setShowPublishModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowPublishModal(false);
    setSelectedBerita(null);
    setActionLoading(false);
  };

  // Handler untuk menghapus berita
  const handleDeleteBerita = async () => {
    if (!selectedBerita) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/berita/${selectedBerita.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      setBerita(berita.filter(item => item.id !== selectedBerita.id));
      closeModals();
      
    } catch (error) {
      console.error('Error deleting berita:', error);
      alert(`Gagal menghapus berita: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk publish berita
  const handlePublishBerita = async () => {
    if (!selectedBerita) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/berita/${selectedBerita.id}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      // Update status berita di state
      setBerita(berita.map(item => 
        item.id === selectedBerita.id 
          ? { 
              ...item, 
              status: 'published',
              tanggal: new Date().toISOString().split('T')[0]
            }
          : item
      ));
      
      closeModals();
      
    } catch (error) {
      console.error('Error publishing berita:', error);
      alert(`Gagal mempublish berita: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk navigasi
  const handleAddBerita = () => {
    navigate('/berita/create');
  };

  const handleEditBerita = (beritaId) => {
    navigate(`/berita/edit/${beritaId}`);
  };

  const handlePreviewBerita = (beritaSlug) => {
    window.open(`${window.location.origin}/berita/${beritaSlug}`, '_blank');
  };

  // Filter berita
  const filteredBerita = berita.filter(item => {
    const matchesSearch = item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.konten.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesKategori = kategoriFilter === 'all' || item.kategori === kategoriFilter;
    
    return matchesSearch && matchesStatus && matchesKategori;
  });

  // Statistik
  const getStats = () => {
    const totalBerita = berita.length;
    const publishedBerita = berita.filter(item => item.status === 'published').length;
    const draftBerita = berita.filter(item => item.status === 'draft').length;
    const arsipBerita = berita.filter(item => item.status === 'arsip').length;
    
    return { totalBerita, publishedBerita, draftBerita, arsipBerita };
  };

  const stats = getStats();

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format status
  const formatStatus = (status) => {
    const statusMap = {
      'published': 'Published',
      'draft': 'Draft',
      'arsip': 'Arsip'
    };
    return statusMap[status] || status;
  };

  // Format kategori
  const formatKategori = (kategori) => {
    const kategoriMap = {
      'umum': 'Umum',
      'pengumuman': 'Pengumuman',
      'acara': 'Acara'
    };
    return kategoriMap[kategori] || kategori;
  };

  // Modal Components
  const DeleteModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hapus Berita</h3>
            <p className="text-sm text-gray-600">Konfirmasi penghapusan berita</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">
            Apakah Anda yakin ingin menghapus berita <strong>"{selectedBerita?.judul}"</strong>?
          </p>
          <p className="text-red-600 text-xs mt-1">
            Tindakan ini tidak dapat dibatalkan. Berita akan dihapus permanen dari sistem.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={closeModals}
            disabled={actionLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDeleteBerita}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menghapus...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const PublishModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Publish Berita</h3>
            <p className="text-sm text-gray-600">Konfirmasi publish berita</p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 text-sm">
            Apakah Anda yakin ingin mempublish berita <strong>"{selectedBerita?.judul}"</strong>?
          </p>
          <p className="text-green-600 text-xs mt-1">
            Berita akan ditampilkan ke publik dan dapat dilihat oleh semua pengunjung website.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={closeModals}
            disabled={actionLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handlePublishBerita}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Publish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AuthDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  if (error) {
    return (
      <AuthDashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={fetchBerita}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  return (
    <AuthDashboardLayout>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Berita</h1>
            <p className="text-gray-600 mt-1">Kelola berita dan artikel TPQ</p>
          </div>
          <button 
            onClick={handleAddBerita}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Berita
          </button>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Berita</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalBerita}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Published</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.publishedBerita}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-800">Draft</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.draftBerita}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
            <h3 className="text-lg font-semibold text-gray-800">Arsip</h3>
            <p className="text-3xl font-bold text-gray-600">{stats.arsipBerita}</p>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan judul atau konten..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="arsip">Arsip</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              <option value="umum">Umum</option>
              <option value="pengumuman">Pengumuman</option>
              <option value="acara">Acara</option>
            </select>
          </div>
        </div>

        {/* Tabel Berita */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Judul Berita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penulis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBerita.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
                      </svg>
                      <p className="mt-2">Tidak ada data berita</p>
                      {searchTerm || statusFilter !== 'all' || kategoriFilter !== 'all' ? (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setKategoriFilter('all');
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Reset filter
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  filteredBerita.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {item.judul}
                        </div>
                        {item.gambar_cover && (
                          <div className="text-xs text-gray-500 mt-1">
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Ada gambar
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.penulis}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {formatKategori(item.kategori)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(item.tanggal)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.views}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditBerita(item.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                            title="Edit Berita"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => handlePreviewBerita(item.slug)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                            title="Preview Berita"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </button>
                          {item.status === 'draft' && (
                            <button 
                              onClick={() => openPublishModal(item)}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1 transition-colors"
                              title="Publish Berita"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              Publish
                            </button>
                          )}
                          <button 
                            onClick={() => openDeleteModal(item)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                            title="Hapus Berita"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link ke halaman lain */}
        <div className="mt-6 flex gap-4">
          <Link 
            to="/dashboard" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Modals */}
        {showDeleteModal && <DeleteModal />}
        {showPublishModal && <PublishModal />}
      </div>
    </AuthDashboardLayout>
  );
};

export default BeritaManagement;