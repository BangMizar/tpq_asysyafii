import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Data dummy users
  const dummyUsers = [
    {
      id: 1,
      nama: 'Ahmad Fauzi',
      email: 'ahmad@email.com',
      role: 'admin',
      status: 'Aktif',
      tanggalDaftar: '2024-01-15',
      lastLogin: '2024-03-20'
    },
    {
      id: 2,
      nama: 'Siti Rahma',
      email: 'siti@email.com',
      role: 'user',
      status: 'Aktif',
      tanggalDaftar: '2024-01-20',
      lastLogin: '2024-03-19'
    },
    {
      id: 3,
      nama: 'Budi Santoso',
      email: 'budi@email.com',
      role: 'admin',
      status: 'Nonaktif',
      tanggalDaftar: '2024-02-01',
      lastLogin: '2024-02-15'
    },
    {
      id: 4,
      nama: 'Dewi Lestari',
      email: 'dewi@email.com',
      role: 'user',
      status: 'Aktif',
      tanggalDaftar: '2024-02-10',
      lastLogin: '2024-03-18'
    }
  ];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

    // Set data dummy langsung
    setUsers(dummyUsers);
  }, [currentUser, navigate]);

  // Filter users berdasarkan pencarian dan filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handler untuk menghapus user
  const handleDeleteUser = (userId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      setUsers(users.filter(user => user.id !== userId));
      // Di sini biasanya ada API call untuk menghapus user dari database
    }
  };

  // Handler untuk mengubah status user
  const handleToggleStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
        : user
    ));
    // Di sini biasanya ada API call untuk update status di database
  };

  // Handler untuk navigasi ke halaman tambah user
  const handleAddUser = () => {
    navigate('/users/create');
  };

  // Handler untuk navigasi ke halaman edit user
  const handleEditUser = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  // Handler untuk navigasi ke detail user
  const handleViewProfile = (userId) => {
    navigate(`/users/${userId}`);
  };

  // Cek jika user saat ini adalah super admin (tidak bisa dihapus/nonaktifkan)
  const isCurrentUser = (userId) => {
    return currentUser && currentUser.id === userId;
  };

  return (
    <AuthDashboardLayout>
      <div className="p-6">
        {/* Header dengan info user saat ini */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Anda login sebagai: <strong>{currentUser?.nama}</strong> ({currentUser?.role})</p>
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

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau email..."
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
              <option value="admin">Admin</option>
              <option value="user">User</option>
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
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="mt-2">Tidak ada user yang ditemukan</p>
                      <Link 
                        to="/users/create" 
                        className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        Tambah user baru
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {user.role}
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
                        {new Date(user.tanggalDaftar).toLocaleDateString('id-ID')}
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
                            disabled={isCurrentUser(user.id) || !hasPermission('delete_user')}
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
          Menampilkan {filteredUsers.length} dari {users.length} user
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