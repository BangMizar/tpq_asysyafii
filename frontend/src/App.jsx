// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Registrasi';
import Homepage from './pages/Homepage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import WaliDashboard from './pages/WaliDashboard';

const AppContent = () => {
  const { user } = useAuth();

  const getDashboardByRole = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'super_admin':
        return '/super-admin';
      case 'admin':
        return '/admin';
      case 'wali':
        return '/wali';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Super Admin Routes */}
      <Route 
        path="/super-admin" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Wali Routes */}
      <Route 
        path="/wali" 
        element={
          <ProtectedRoute allowedRoles={['wali', 'admin', 'super_admin']}>
            <WaliDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect based on role */}
      <Route 
        path="/" 
        element={<Navigate to={getDashboardByRole()} replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;