import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const SystemManagement = () => {
  const [activeTab, setActiveTab] = useState('logs');

  const systemLogs = [
    { id: 1, user: 'Super Admin', action: 'Login ke sistem', timestamp: '2024-03-15 08:30:15', ip: '192.168.1.100' },
    { id: 2, user: 'Admin TPQ', action: 'Menambah data santri baru', timestamp: '2024-03-15 09:15:22', ip: '192.168.1.101' },
    { id: 3, user: 'Super Admin', action: 'Backup database', timestamp: '2024-03-14 23:45:10', ip: '192.168.1.100' }
  ];

  const backupHistory = [
    { id: 1, filename: 'backup_20240315.sql', size: '45 MB', timestamp: '2024-03-15 23:45:10', status: 'Success' },
    { id: 2, filename: 'backup_20240314.sql', size: '44 MB', timestamp: '2024-03-14 23:45:10', status: 'Success' },
    { id: 3, filename: 'backup_20240313.sql', size: '43 MB', timestamp: '2024-03-13 23:45:10', status: 'Success' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'logs':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {systemLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'backup':
        return (
          <div>
            <div className="mb-6">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Backup Sekarang
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backupHistory.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{backup.filename}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {backup.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Download</button>
                        <button className="text-red-600 hover:text-red-900">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Aplikasi</label>
                <input
                  type="text"
                  defaultValue="Sistem Management TPQ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Versi</label>
                <input
                  type="text"
                  defaultValue="v2.1.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto Backup</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option>Setiap Hari (23:45)</option>
                <option>Setiap Minggu</option>
                <option>Setiap Bulan</option>
                <option>Nonaktif</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Aktifkan notifikasi email</span>
              </label>
            </div>
            
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Simpan Pengaturan
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AuthDashboardLayout>
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">System Management</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['logs', 'backup', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'logs' && 'System Logs'}
                {tab === 'backup' && 'Backup Data'}
                {tab === 'settings' && 'Pengaturan'}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
    </AuthDashboardLayout>
  );
};

export default SystemManagement;