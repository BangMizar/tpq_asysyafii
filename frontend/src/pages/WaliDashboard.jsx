// pages/WaliDashboard.js
import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

const WaliDashboard = () => {
  const { user } = useAuth();

  const children = [
    { name: 'Ahmad Fauzi', class: 'TPQ 1', attendance: '95%', lastActivity: 'Hari ini' },
    { name: 'Siti Rahma', class: 'TPQ 2', attendance: '88%', lastActivity: 'Kemarin' },
  ];

  const announcements = [
    { title: 'Libur Hari Guru', date: '25 Nov 2024', important: true },
    { title: 'Pembayaran SPP Bulan Desember', date: '20 Nov 2024', important: false },
    { title: 'Kegiatan Outbound', date: '15 Nov 2024', important: true },
  ];

  return (
    <DashboardLayout title="Dashboard Wali Santri">
      {/* Welcome Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700">
          Selamat datang, {user?.nama_lengkap}!
        </h3>
        <p className="text-gray-600">Anda login sebagai Wali Santri</p>
      </div>

      {/* Children Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {children.map((child, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Informasi Santri</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nama Santri:</span>
                <span className="font-medium">{child.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kelas:</span>
                <span className="font-medium">{child.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kehadiran:</span>
                <span className="font-medium text-green-600">{child.attendance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Aktivitas Terakhir:</span>
                <span className="font-medium">{child.lastActivity}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition duration-300">
                Lihat Detail Santri
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Announcements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Pengumuman Terbaru</h4>
        <div className="space-y-3">
          {announcements.map((announcement, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              announcement.important ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className={`font-medium ${
                    announcement.important ? 'text-orange-800' : 'text-gray-800'
                  }`}>
                    {announcement.title}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">Tanggal: {announcement.date}</p>
                </div>
                {announcement.important && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    Penting
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
          Lihat Jadwal
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
          Cek Pembayaran
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition duration-300">
          Hubungi Admin
        </button>
      </div>
    </DashboardLayout>
  );
};

export default WaliDashboard;