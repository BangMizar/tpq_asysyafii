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

  // State untuk modal - SEPERTI DI DATADONASI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedBerita, setSelectedBerita] = useState(null);
  
  // State untuk form - SEPERTI DI DATADONASI (sederhana, tidak pakai object kompleks)
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'umum',
    konten: '',
    status: 'draft'
  });
  const [gambarCover, setGambarCover] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
        gambar_cover: item.gambar_cover ? `/image/berita/${item.gambar_cover}` : null,
        dibuat_pada: item.dibuat_pada,
        diperbarui_pada: item.diperbarui_pada,
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

  // Show alert modal - SEPERTI DI DATADONASI
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Reset form - SEPERTI DI DATADONASI
  const resetForm = () => {
    setFormData({
      judul: '',
      kategori: 'umum',
      konten: '',
      status: 'draft'
    });
    setGambarCover(null);
    setImagePreview(null);
  };

  // Modal handlers - SEPERTI DI DATADONASI
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (berita) => {
    setSelectedBerita(berita);
    setFormData({
      judul: berita.judul,
      kategori: berita.kategori,
      konten: berita.konten,
      status: berita.status
    });
    setGambarCover(null);
    setImagePreview(berita.gambar_cover ? `${API_URL}${berita.gambar_cover}` : null);
    setShowEditModal(true);
  };

  const openDeleteModal = (berita) => {
    setSelectedBerita(berita);
    setShowDeleteModal(true);
  };

  const openPublishModal = (berita) => {
    setSelectedBerita(berita);
    setShowPublishModal(true);
  };

  const openImageModal = (berita) => {
    setSelectedBerita(berita);
    setShowImageModal(true);
  };

  // Handler untuk create berita - SEPERTI DI DATADONASI
  const handleCreateBerita = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('judul', formData.judul);
      formDataToSend.append('kategori', formData.kategori);
      formDataToSend.append('konten', formData.konten);
      formDataToSend.append('status', formData.status);
      if (gambarCover) {
        formDataToSend.append('gambar_cover', gambarCover);
      }

      const response = await fetch(`${API_URL}/api/super-admin/berita`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      await fetchBerita();
      setShowCreateModal(false);
      resetForm();
      showAlert('Berhasil', 'Berita berhasil dibuat', 'success');
    } catch (error) {
      console.error('Error creating berita:', error);
      showAlert('Gagal', error.message || 'Gagal membuat berita', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk update berita - SEPERTI DI DATADONASI
  const handleUpdateBerita = async (e) => {
    e.preventDefault();
    if (!selectedBerita) return;

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('judul', formData.judul);
      formDataToSend.append('kategori', formData.kategori);
      formDataToSend.append('konten', formData.konten);
      formDataToSend.append('status', formData.status);
      if (gambarCover) {
        formDataToSend.append('gambar_cover', gambarCover);
      }

      const response = await fetch(`${API_URL}/api/super-admin/berita/${selectedBerita.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      await fetchBerita();
      setShowEditModal(false);
      resetForm();
      setSelectedBerita(null);
      showAlert('Berhasil', 'Berita berhasil diupdate', 'success');
    } catch (error) {
      console.error('Error updating berita:', error);
      showAlert('Gagal', error.message || 'Gagal mengupdate berita', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk menghapus berita - SEPERTI DI DATADONASI
  const handleDeleteBerita = async () => {
    if (!selectedBerita) return;

    try {
      setLoading(true);

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
      setShowDeleteModal(false);
      setSelectedBerita(null);
      showAlert('Berhasil', 'Berita berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting berita:', error);
      showAlert('Gagal', error.message || 'Gagal menghapus berita', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk publish berita - SEPERTI DI DATADONASI
  const handlePublishBerita = async () => {
    if (!selectedBerita) return;

    try {
      setLoading(true);

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
      
      setShowPublishModal(false);
      setSelectedBerita(null);
      showAlert('Berhasil', 'Berita berhasil dipublish', 'success');
    } catch (error) {
      console.error('Error publishing berita:', error);
      showAlert('Gagal', error.message || 'Gagal mempublish berita', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk preview berita
  const handlePreviewBerita = (beritaSlug) => {
    window.open(`${window.location.origin}/berita/${beritaSlug}`, '_blank');
  };

  // Handler untuk gambar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('Error', 'Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.', 'error');
        return;
      }
  
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Error', 'Ukuran file terlalu besar. Maksimal 5MB.', 'error');
        return;
      }
  
      setGambarCover(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
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

  // Icons - SEPERTI DI DATADONASI
  const icons = {
    plus: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
    preview: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    publish: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    image: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  };

  if (loading && berita.length === 0) {
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

  if (error && berita.length === 0) {
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
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            {icons.plus}
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
                          <div className="flex items-center gap-2 mt-1">
                            {item.gambar_cover && (
                              <button 
                                onClick={() => openImageModal(item)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {icons.image}
                                Lihat Gambar
                              </button>
                            )}
                          </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                            title="Edit Berita"
                          >
                            {icons.edit}
                            Edit
                          </button>
                          <button 
                            onClick={() => handlePreviewBerita(item.slug)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                            title="Preview Berita"
                          >
                            {icons.preview}
                            Preview
                          </button>
                          {item.status === 'draft' && (
                            <button 
                              onClick={() => openPublishModal(item)}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1 transition-colors"
                              title="Publish Berita"
                            >
                              {icons.publish}
                              Publish
                            </button>
                          )}
                          <button 
                            onClick={() => openDeleteModal(item)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                            title="Hapus Berita"
                          >
                            {icons.delete}
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

        {/* CREATE MODAL - SEPERTI DI DATADONASI */}
        {showCreateModal && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Berita Baru</h3>
              <form onSubmit={handleCreateBerita}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Berita
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.judul}
                        onChange={(e) => setFormData({...formData, judul: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Masukkan judul berita"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={formData.kategori}
                        onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="umum">Umum</option>
                        <option value="pengumuman">Pengumuman</option>
                        <option value="acara">Acara</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gambar Cover
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 mt-2">Upload Gambar</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          Upload gambar cover untuk berita. Format yang didukung: JPG, PNG, GIF.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konten Berita
                    </label>
                    <textarea
                      required
                      value={formData.konten}
                      onChange={(e) => setFormData({...formData, konten: e.target.value})}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Tulis konten berita di sini..."
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
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="arsip">Arsip</option>
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

        {/* EDIT MODAL - SEPERTI DI DATADONASI */}
        {showEditModal && selectedBerita && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Berita</h3>
              <form onSubmit={handleUpdateBerita}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Berita
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.judul}
                        onChange={(e) => setFormData({...formData, judul: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Masukkan judul berita"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={formData.kategori}
                        onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="umum">Umum</option>
                        <option value="pengumuman">Pengumuman</option>
                        <option value="acara">Acara</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gambar Cover
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 mt-2">Upload Gambar</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {selectedBerita.gambar_cover ? 'Gambar saat ini akan diganti dengan yang baru.' : 'Upload gambar cover untuk berita.'}
                        </p>
                        {selectedBerita.gambar_cover && !imagePreview?.startsWith('blob:') && (
                          <button
                            type="button"
                            onClick={() => openImageModal(selectedBerita)}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            {icons.preview}
                            Lihat Gambar Saat Ini
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konten Berita
                    </label>
                    <textarea
                      required
                      value={formData.konten}
                      onChange={(e) => setFormData({...formData, konten: e.target.value})}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Tulis konten berita di sini..."
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
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="arsip">Arsip</option>
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

        {/* DELETE MODAL - SEPERTI DI DATADONASI */}
        {showDeleteModal && selectedBerita && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Berita</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus berita <strong>"{selectedBerita.judul}"</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteBerita}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PUBLISH MODAL - SEPERTI DI DATADONASI */}
        {showPublishModal && selectedBerita && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Publish Berita</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin mempublish berita <strong>"{selectedBerita.judul}"</strong>?
                Berita akan ditampilkan ke publik.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handlePublishBerita}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE MODAL - SEPERTI DI DATADONASI */}
        {showImageModal && selectedBerita && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Gambar Cover Berita</h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedBerita.gambar_cover ? (
                <div>
                  <img 
                    src={`${API_URL}${selectedBerita.gambar_cover}`}
                    alt={selectedBerita.judul}
                    className="w-full h-auto max-h-96 object-contain rounded-lg mb-2"
                    onError={(e) => {
                      console.error('Gagal memuat gambar:', `${API_URL}/image/berita/${selectedBerita.gambar_cover}`);
                      e.target.src = 'https://via.placeholder.com/400x200?text=Gambar+Tidak+Tersedia';
                    }}
                  />
                  <p className="text-xs text-gray-500 text-center break-all">
                    Path: {`${API_URL}${selectedBerita.gambar_cover}`}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Tidak ada gambar cover untuk berita ini</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ALERT MODAL - SEPERTI DI DATADONASI */}
        {showAlertModal && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                alertMessage.type === 'success' ? 'bg-green-100' : 
                alertMessage.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {alertMessage.type === 'success' ? (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : alertMessage.type === 'error' ? (
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className={`text-xl font-bold text-center mb-2 ${
                alertMessage.type === 'success' ? 'text-green-800' : 
                alertMessage.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {alertMessage.title}
              </h3>
              <p className={`text-center mb-6 ${
                alertMessage.type === 'success' ? 'text-green-600' : 
                alertMessage.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {alertMessage.message}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className={`px-6 py-2 rounded-lg text-white ${
                    alertMessage.type === 'success' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : alertMessage.type === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthDashboardLayout>
  );
};

export default BeritaManagement;