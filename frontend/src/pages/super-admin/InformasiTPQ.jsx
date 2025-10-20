import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';

const InformasiTPQ = () => {
  const { user } = useAuth();
  const [informasi, setInformasi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch data informasi TPQ
  const fetchInformasiTPQ = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/informasi-tpq`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data) {
        setInformasi(result.data);
        setFormData({
          nama_tpq: result.data.nama_tpq || '',
          tempat: result.data.tempat || '',
          visi: result.data.visi || '',
          misi: result.data.misi || '',
          deskripsi: result.data.deskripsi || '',
          no_telp: result.data.no_telp || '',
          email: result.data.email || '',
          alamat: result.data.alamat || '',
          link_alamat: result.data.link_alamat || '',
          hari_jam_belajar: result.data.hari_jam_belajar || ''
        });
        
        if (result.data.logo) {
          setLogoPreview(`${API_URL}/image/tpq/${result.data.logo}`);
        }
      }

    } catch (err) {
      console.error('Error fetching informasi TPQ:', err);
      setError(`Gagal memuat data informasi TPQ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle logo file change
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save informasi TPQ
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append logo file if exists
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      // Determine endpoint based on whether it's create or update
      const method = informasi ? 'PUT' : 'POST';
      const endpoint = informasi 
        ? `${API_URL}/api/super-admin/informasi-tpq/${informasi.id_tpq}`
        : `${API_URL}/api/super-admin/informasi-tpq`;

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setInformasi(result.data);
      setIsEditing(false);
      
      // Refresh preview if new logo was uploaded
      if (logoFile && result.data.logo) {
        setLogoPreview(`${API_URL}/image/tpq/${result.data.logo}`);
        setLogoFile(null);
      }

      alert('Informasi TPQ berhasil disimpan!');

    } catch (err) {
      console.error('Error saving informasi TPQ:', err);
      setError(`Gagal menyimpan informasi TPQ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete informasi TPQ
  const handleDelete = async () => {
    if (!informasi || !window.confirm('Apakah Anda yakin ingin menghapus informasi TPQ?')) {
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`${API_URL}/api/super-admin/informasi-tpq/${informasi.id_tpq}`, {
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

      setInformasi(null);
      setFormData({});
      setLogoPreview('');
      setIsEditing(false);
      
      alert('Informasi TPQ berhasil dihapus!');

    } catch (err) {
      console.error('Error deleting informasi TPQ:', err);
      setError(`Gagal menghapus informasi TPQ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original values
    if (informasi) {
      setFormData({
        nama_tpq: informasi.nama_tpq || '',
        tempat: informasi.tempat || '',
        visi: informasi.visi || '',
        misi: informasi.misi || '',
        deskripsi: informasi.deskripsi || '',
        no_telp: informasi.no_telp || '',
        email: informasi.email || '',
        alamat: informasi.alamat || '',
        link_alamat: informasi.link_alamat || '',
        hari_jam_belajar: informasi.hari_jam_belajar || ''
      });
      
      if (informasi.logo) {
        setLogoPreview(`${API_URL}/image/tpq/${informasi.logo}`);
      }
    }
    setLogoFile(null);
  };

  useEffect(() => {
    fetchInformasiTPQ();
  }, []);

  if (loading) {
    return (
      <AuthDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  return (
    <AuthDashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Informasi TPQ</h1>
            <p className="text-gray-600 mt-1">Kelola informasi dan profil TPQ</p>
          </div>
          
          {user?.role === 'super_admin' && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </>
              ) : (
                <>
                  {informasi && (
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {informasi ? 'Edit Informasi' : 'Tambah Informasi'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!informasi && !isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Informasi TPQ</h3>
            <p className="text-gray-600 mb-4">Silakan tambahkan informasi TPQ untuk menampilkannya di website.</p>
            {user?.role === 'super_admin' && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Tambah Informasi TPQ
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Logo Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo TPQ</label>
              <div className="flex items-center gap-6">
                {(logoPreview || informasi?.logo) && (
                  <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img 
                      src={logoPreview} 
                      alt="Logo TPQ" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {isEditing && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, GIF, WebP, SVG. Maksimal 2MB.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama TPQ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama TPQ *</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nama_tpq"
                    value={formData.nama_tpq || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nama TPQ"
                    required
                  />
                ) : (
                  <p className="text-gray-900 text-lg font-semibold">{informasi?.nama_tpq}</p>
                )}
              </div>

              {/* Tempat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tempat</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="tempat"
                    value={formData.tempat || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan tempat/lokasi TPQ"
                  />
                ) : (
                  <p className="text-gray-900">{informasi?.tempat || '-'}</p>
                )}
              </div>

              {/* Telepon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="no_telp"
                    value={formData.no_telp || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nomor telepon"
                  />
                ) : (
                  <p className="text-gray-900">{informasi?.no_telp || '-'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan email"
                  />
                ) : (
                  <p className="text-gray-900">{informasi?.email || '-'}</p>
                )}
              </div>

              {/* Link Alamat */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Alamat (Google Maps)</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="link_alamat"
                    value={formData.link_alamat || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://maps.google.com/..."
                  />
                ) : (
                  <p className="text-gray-900">
                    {informasi?.link_alamat ? (
                      <a 
                        href={informasi.link_alamat} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {informasi.link_alamat}
                      </a>
                    ) : '-'}
                  </p>
                )}
              </div>

              {/* Alamat */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap</label>
                {isEditing ? (
                  <textarea
                    name="alamat"
                    value={formData.alamat || ''}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan alamat lengkap TPQ"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">{informasi?.alamat || '-'}</p>
                )}
              </div>

              {/* Hari & Jam Belajar */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hari & Jam Belajar</label>
                {isEditing ? (
                  <textarea
                    name="hari_jam_belajar"
                    value={formData.hari_jam_belajar || ''}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: Senin - Kamis: 15:00-17:00, Jumat: 14:00-16:00"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">{informasi?.hari_jam_belajar || '-'}</p>
                )}
              </div>
            </div>

            {/* Visi */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Visi</label>
              {isEditing ? (
                <textarea
                  name="visi"
                  value={formData.visi || ''}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan visi TPQ"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-line">{informasi?.visi || '-'}</p>
              )}
            </div>

            {/* Misi */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Misi</label>
              {isEditing ? (
                <textarea
                  name="misi"
                  value={formData.misi || ''}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan misi TPQ"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-line">{informasi?.misi || '-'}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
              {isEditing ? (
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi || ''}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan deskripsi lengkap tentang TPQ"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-line">{informasi?.deskripsi || '-'}</p>
              )}
            </div>

            {/* Last Updated Info */}
            {informasi && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Terakhir diperbarui: {new Date(informasi.diperbarui_pada).toLocaleDateString('id-ID')} 
                  {informasi.diupdate_oleh && ` oleh ${informasi.diupdate_oleh.nama_lengkap}`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthDashboardLayout>
  );
};

export default InformasiTPQ;