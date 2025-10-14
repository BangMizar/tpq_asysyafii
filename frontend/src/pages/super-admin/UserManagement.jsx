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
  const [statusFilter, setStatusFilter] = useState('all');

  // State untuk modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Modal handlers
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openStatusModal = (user) => {
    setSelectedUser(user);
    setShowStatusModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowStatusModal(false);
    setSelectedUser(null);
    setActionLoading(false);
  };

  // Handler untuk menghapus user dengan modal
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      
      if (currentUser?.role !== 'super_admin') {
        throw new Error('Anda tidak memiliki izin untuk menghapus user');
      }

      const response = await fetch(`${API_URL}/api/super-admin/users/${selectedUser.id}`, {
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

      setUsers(users.filter(user => user.id !== selectedUser.id));
      closeModals();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Gagal menghapus user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk mengubah status user dengan modal
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      
      const newStatus = !selectedUser.statusAktif;
      const endpoint = `/api/users/${selectedUser.id}`;

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

      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              status: newStatus ? 'Aktif' : 'Nonaktif',
              statusAktif: newStatus
            }
          : user
      ));
      
      closeModals();
      
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`Gagal mengubah status user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk navigasi
  const handleAddUser = () => {
    navigate('/users/create');
  };

  const handleEditUser = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  const handleViewProfile = (userId) => {
    navigate(`/users/${userId}`);
  };

  // Cek jika user saat ini
  const isCurrentUser = (userId) => {
    return currentUser && currentUser.id_user === userId;
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.no_telp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group users by role
  const usersByRole = {
    wali: filteredUsers.filter(user => user.role === 'wali'),
    admin: filteredUsers.filter(user => user.role === 'admin'),
    super_admin: filteredUsers.filter(user => user.role === 'super_admin')
  };

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

  // Statistik
  const getStats = () => {
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter(user => user.status === 'Aktif').length;
    const inactiveUsers = filteredUsers.filter(user => user.status === 'Nonaktif').length;
    
    return { totalUsers, activeUsers, inactiveUsers };
  };

  const stats = getStats();

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
            <h3 className="text-lg font-semibold text-gray-900">Hapus User</h3>
            <p className="text-sm text-gray-600">Konfirmasi penghapusan user</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">
            Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.nama}</strong>?
          </p>
          <p className="text-red-600 text-xs mt-1">
            Tindakan ini tidak dapat dibatalkan. Semua data user akan dihapus permanen.
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
            onClick={handleDeleteUser}
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

  const StatusModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 ${
            selectedUser?.statusAktif ? 'bg-red-100' : 'bg-green-100'
          } rounded-full flex items-center justify-center mr-4`}>
            <svg className={`w-6 h-6 ${
              selectedUser?.statusAktif ? 'text-red-600' : 'text-green-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedUser?.statusAktif ? 'Nonaktifkan User' : 'Aktifkan User'}
            </h3>
            <p className="text-sm text-gray-600">Konfirmasi perubahan status</p>
          </div>
        </div>
        
        <div className={`${
          selectedUser?.statusAktif ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        } border rounded-lg p-4 mb-4`}>
          <p className={`${
            selectedUser?.statusAktif ? 'text-red-800' : 'text-green-800'
          } text-sm`}>
            Apakah Anda yakin ingin {selectedUser?.statusAktif ? 'menonaktifkan' : 'mengaktifkan'} user{' '}
            <strong>{selectedUser?.nama}</strong>?
          </p>
          <p className={`${
            selectedUser?.statusAktif ? 'text-red-600' : 'text-green-600'
          } text-xs mt-1`}>
            {selectedUser?.statusAktif 
              ? 'User tidak akan bisa login sampai diaktifkan kembali.' 
              : 'User akan bisa login ke sistem kembali.'
            }
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
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`px-4 py-2 ${
              selectedUser?.statusAktif ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-lg disabled:opacity-50 flex items-center gap-2`}
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {selectedUser?.statusAktif ? 'Nonaktifkan' : 'Aktifkan'}
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

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Tabel Terpisah */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tabel Wali - Lebih Luas */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Data Wali Santri
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {usersByRole.wali.length} User
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal Daftar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersByRole.wali.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <p className="mt-2">Tidak ada data wali</p>
                        </td>
                      </tr>
                    ) : (
                      usersByRole.wali.map((user) => (
                        <UserTableRow 
                          key={user.id} 
                          user={user} 
                          onEdit={handleEditUser}
                          onView={handleViewProfile}
                          onDelete={openDeleteModal}
                          onToggleStatus={openStatusModal}
                          isCurrentUser={isCurrentUser(user.id)}
                          hasPermission={hasPermission}
                          currentUser={currentUser}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabel Admin & Super Admin - Sisi Kanan */}
          <div className="space-y-6">
            {/* Tabel Super Admin */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-purple-900">
                    Super Admin
                  </h2>
                  <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                    {usersByRole.super_admin.length} User
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersByRole.super_admin.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                          <p className="text-sm">Tidak ada super admin</p>
                        </td>
                      </tr>
                    ) : (
                      usersByRole.super_admin.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 text-xs font-medium">
                                  {user.nama.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.nama}
                                  {isCurrentUser(user.id) && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">Anda</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditUser(user.id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                                title="Edit User"
                                disabled={!hasPermission('edit_user')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
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

            {/* Tabel Admin */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-blue-900">
                    Admin
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {usersByRole.admin.length} User
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersByRole.admin.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                          <p className="text-sm">Tidak ada admin</p>
                        </td>
                      </tr>
                    ) : (
                      usersByRole.admin.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs font-medium">
                                  {user.nama.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.nama}
                                  {isCurrentUser(user.id) && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">Anda</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditUser(user.id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                                title="Edit User"
                                disabled={!hasPermission('edit_user')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => openStatusModal(user)}
                                className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                                title="Ubah Status"
                                disabled={isCurrentUser(user.id)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
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
        {showStatusModal && <StatusModal />}
      </div>
    </AuthDashboardLayout>
  );
};

// Komponen terpisah untuk table row wali
const UserTableRow = ({ user, onEdit, onView, onDelete, onToggleStatus, isCurrentUser, hasPermission, currentUser }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-medium">
            {user.nama.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="ml-4">
          <button 
            onClick={() => onView(user.id)}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
          >
            {user.nama}
            {isCurrentUser && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Anda</span>
            )}
          </button>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="text-xs text-gray-400">ID: {user.id} • Telp: {user.no_telp}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <button
        onClick={() => !isCurrentUser && onToggleStatus(user)}
        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
          user.status === 'Aktif' 
            ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
        } ${
          isCurrentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
        disabled={isCurrentUser}
        title={isCurrentUser ? "Tidak dapat mengubah status sendiri" : "Klik untuk mengubah status"}
      >
        {user.status}
      </button>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(user.tanggalDaftar).toLocaleDateString('id-ID')}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onEdit(user.id)}
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
          onClick={() => !isCurrentUser && onDelete(user)}
          className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isCurrentUser ? "Tidak dapat menghapus akun sendiri" : "Hapus User"}
          disabled={isCurrentUser || !hasPermission('delete_user') || currentUser?.role !== 'super_admin'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus
        </button>
      </div>
    </td>
  </tr>
);

export default UserManagement;