import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // Tab untuk grouping

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Function hasPermission lokal
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      return true;
    }
    
    const permissions = {
      admin: ['manage_users', 'edit_user', 'create_user', 'delete_user'],
      user: []
    };

    return permissions[currentUser.role]?.includes(permission) || false;
  };

  // Fetch users dari API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Gunakan endpoint /api/admin/users untuk admin dan super_admin
      const endpoint = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' 
        ? '/api/admin/users' 
        : '/api/users';
      
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
      
      // Transform data dari API ke format yang diharapkan komponen
      const transformedUsers = data.map(user => ({
        id: user.id_user,
        nama: user.nama_lengkap,
        email: user.email || '-',
        role: user.role,
        status: user.status_aktif ? 'Aktif' : 'Nonaktif',
        tanggalDaftar: user.dibuat_pada,
        lastLogin: user.last_login || '-',
        statusAktif: user.status_aktif,
        no_telp: user.no_telp || '-'
      }));
      
      setUsers(transformedUsers);

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Gagal memuat data pengguna: ${err.message}`);
      setUsers([]);
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

    if (!hasPermission('manage_users')) {
      navigate('/unauthorized');
      return;
    }

    fetchUsers();
  }, [currentUser, navigate]);

  // Handler untuk menghapus user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        // Hanya super_admin yang bisa menghapus user
        if (currentUser?.role !== 'super_admin') {
          alert('Anda tidak memiliki izin untuk menghapus user');
          return;
        }

        const response = await fetch(`${API_URL}/api/super-admin/users/${userId}`, {
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

        // Update state lokal setelah berhasil dihapus
        setUsers(users.filter(user => user.id !== userId));
        
        alert('User berhasil dihapus');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Gagal menghapus user: ${error.message}`);
      }
    }
  };

  // Handler untuk mengubah status user - DIPERBAIKI
  const handleToggleStatus = async (userId) => {
    try {
      const userToUpdate = users.find(user => user.id === userId);
      if (!userToUpdate) return;

      const newStatus = !userToUpdate.statusAktif;
      
      // PERBAIKAN: Gunakan endpoint yang benar berdasarkan routing Go
      // Untuk update user, gunakan endpoint protected biasa (bukan admin/super-admin)
      const endpoint = `/api/users/${userId}`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status_aktif: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      // Update state lokal
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              status: newStatus ? 'Aktif' : 'Nonaktif',
              statusAktif: newStatus
            }
          : user
      ));
      
      alert(`Status user berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`Gagal mengubah status user: ${error.message}`);
    }
  };

  // Handler untuk navigasi ke halaman tambah user
  const handleAddUser = () => {
    navigate('/users/create');
  };

  // Handler untuk navigasi ke halaman edit user - DIPERBAIKI
  const handleEditUser = (userId) => {
    // Pastikan navigasi ke route yang benar
    navigate(`/users/edit/${userId}`);
  };

  // Handler untuk navigasi ke detail user
  const handleViewProfile = (userId) => {
    navigate(`/users/${userId}`);
  };

  // Cek jika user saat ini adalah super admin (tidak bisa dihapus/nonaktifkan)
  const isCurrentUser = (userId) => {
    return currentUser && currentUser.id_user === userId;
  };

  // Filter users berdasarkan pencarian dan filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.no_telp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Group users by role untuk tab
  const usersByRole = {
    all: filteredUsers,
    super_admin: filteredUsers.filter(user => user.role === 'super_admin'),
    admin: filteredUsers.filter(user => user.role === 'admin'),
    wali: filteredUsers.filter(user => user.role === 'wali')
  };

  // Users untuk ditampilkan berdasarkan tab aktif
  const displayedUsers = usersByRole[activeTab] || usersByRole.all;

  // Format tanggal untuk display
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

  // Statistik untuk summary cards
  const getStats = () => {
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter(user => user.status === 'Aktif').length;
    const inactiveUsers = filteredUsers.filter(user => user.status === 'Nonaktif').length;
    
    return { totalUsers, activeUsers, inactiveUsers };
  };

  const stats = getStats();

  if (loading) {
    return (
      <AuthDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
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
              onClick={fetchUsers}
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
        {/* Header dengan info user saat ini */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Anda login sebagai: <strong>{currentUser?.nama_lengkap}</strong> ({currentUser?.role})</p>
            </div>
            <Link 
              to="/profile" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Lihat Profil Saya
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
            <p className="text-gray-600 mt-1">Kelola data pengguna sistem</p>
          </div>
          <button 
            onClick={handleAddUser}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            disabled={!hasPermission('create_user')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah User
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-green-200">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">Aktif</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{stats.activeUsers}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-red-200">
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium">Nonaktif</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{stats.inactiveUsers}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-purple-200">
            <div className="text-center">
              <p className="text-sm text-purple-600 font-medium">Super Admin</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {usersByRole.super_admin.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, atau telepon..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Role</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="wali">Wali</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation untuk Grouping Role */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'all', label: 'Semua User', count: usersByRole.all.length },
                { key: 'super_admin', label: 'Super Admin', count: usersByRole.super_admin.length },
                { key: 'admin', label: 'Admin', count: usersByRole.admin.length },
                { key: 'wali', label: 'Wali', count: usersByRole.wali.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 text-xs rounded-full ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Daftar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telepon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="mt-2">Tidak ada user yang ditemukan</p>
                      {hasPermission('create_user') && (
                        <button 
                          onClick={handleAddUser}
                          className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          Tambah user baru
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.nama.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <button 
                              onClick={() => handleViewProfile(user.id)}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {user.nama}
                              {isCurrentUser(user.id) && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Anda</span>
                              )}
                            </button>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'super_admin' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : user.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin' : 
                           user.role === 'admin' ? 'Admin' : 
                           user.role === 'wali' ? 'Wali' : user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => !isCurrentUser(user.id) && handleToggleStatus(user.id)}
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            user.status === 'Aktif' 
                              ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                          } ${
                            isCurrentUser(user.id) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          }`}
                          disabled={isCurrentUser(user.id)}
                          title={isCurrentUser(user.id) ? "Tidak dapat mengubah status sendiri" : "Klik untuk mengubah status"}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.tanggalDaftar)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.no_telp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleEditUser(user.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit User"
                            disabled={!hasPermission('edit_user')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => !isCurrentUser(user.id) && handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isCurrentUser(user.id) ? "Tidak dapat menghapus akun sendiri" : "Hapus User"}
                            disabled={isCurrentUser(user.id) || !hasPermission('delete_user') || currentUser?.role !== 'super_admin'}
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

        {/* Info Jumlah Data */}
        <div className="mt-4 text-sm text-gray-600">
          Menampilkan {displayedUsers.length} dari {filteredUsers.length} user 
          {activeTab !== 'all' && ` (Filter: ${activeTab.replace('_', ' ')})`}
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
      </div>
    </AuthDashboardLayout>
  );
};

export default UserManagement;