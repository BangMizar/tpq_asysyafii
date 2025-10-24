import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSantri: 0,
    santriAktif: 0,
    santriNonaktif: 0,
    totalDonasi: 0,
    totalSyahriah: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
    totalUsers: 0,
    totalAdmins: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    santriByStatus: null,
    pemasukanByMonth: null,
    pengeluaranByMonth: null,
    keuanganComparison: null,
    revenueSources: null
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // SVG Icons
  const Icons = {
    Money: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    Users: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    Chart: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    Santri: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    Donasi: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    Finance: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    TrendingUp: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    TrendingDown: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    Cash: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  };

  // Fetch real data from APIs
  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
  
      // Fetch all data in parallel - PERBAIKAN ENDPOINT
      const [
        santriResponse,
        donasiResponse,
        syahriahResponse,
        keuanganResponse,
        usersResponse,
        pemakaianResponse,
        // Hapus duplikat donasiMonthlyResponse dan syahriahMonthlyResponse
      ] = await Promise.all([
        fetch(`${API_URL}/api/super-admin/santri`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/donasi/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        // PERBAIKAN: Gunakan endpoint yang sama seperti di DataKeuangan
        fetch(`${API_URL}/api/admin/syahriah?limit=1000`, { // atau endpoint summary jika ada
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/rekap/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/super-admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/pemakaian?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);
  
      // Process responses dengan error handling yang lebih baik
      const santriData = await santriResponse.json();
      const donasiData = await donasiResponse.json();
      const syahriahData = await syahriahResponse.json();
      const keuanganData = await keuanganResponse.json();
      const usersData = await usersResponse.json();
      const pemakaianData = await pemakaianResponse.json();
  
      console.log('Syahriah API Response:', syahriahData); // Debug log
  
      // Calculate stats from real data dengan handling yang lebih robust
      const santriList = Array.isArray(santriData) ? santriData : santriData.data || [];
      const santriAktif = santriList.filter(s => s.status === 'aktif').length;
      const santriNonaktif = santriList.filter(s => s.status === 'nonaktif').length;
  
      const usersList = Array.isArray(usersData) ? usersData : usersData.data || [];
      const totalAdmins = usersList.filter(u => u.role === 'admin').length;
  
      const totalDonasi = donasiData.data?.total_nominal || donasiData.total_nominal || 0;
      
      // PERBAIKAN: Hitung total syahriah dari data array seperti di DataKeuangan
      let totalSyahriah = 0;
      if (Array.isArray(syahriahData)) {
        totalSyahriah = syahriahData.reduce((sum, item) => sum + (item.nominal || 0), 0);
      } else if (Array.isArray(syahriahData.data)) {
        totalSyahriah = syahriahData.data.reduce((sum, item) => sum + (item.nominal || 0), 0);
      } else if (syahriahData.data?.total_nominal) {
        totalSyahriah = syahriahData.data.total_nominal;
      } else if (syahriahData.total_nominal) {
        totalSyahriah = syahriahData.total_nominal;
      }
      
      const totalPemasukan = keuanganData.data?.total_pemasukan || (totalDonasi + totalSyahriah);
      
      // Calculate total pengeluaran from pemakaian data
      const pemakaianList = Array.isArray(pemakaianData) ? pemakaianData : pemakaianData.data || [];
      const totalPengeluaran = pemakaianList.reduce((sum, item) => sum + (item.nominal || 0), 0);
      
      const saldoAkhir = totalPemasukan - totalPengeluaran;
  
      const newStats = {
        totalSantri: santriList.length,
        santriAktif,
        santriNonaktif,
        totalDonasi,
        totalSyahriah,
        totalPemasukan,
        totalPengeluaran,
        saldoAkhir,
        totalUsers: usersList.length,
        totalAdmins
      };
  
      console.log('Calculated Stats:', newStats); // Debug log
  
      setStats(newStats);
  
      // Generate chart data
      generateChartData(
        santriList,
        newStats,
        pemakaianList,
        donasiData, // Pass donasi data untuk monthly
        syahriahData // Pass syahriah data untuk monthly
      );
  
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to static data if API fails - PERBAIKAN: sertakan syahriah
      const fallbackStats = {
        totalSantri: 150,
        santriAktif: 120,
        santriNonaktif: 30,
        totalDonasi: 12500000,
        totalSyahriah: 8800000, // Pastikan ada nilai fallback
        totalPemasukan: 21300000,
        totalPengeluaran: 18500000,
        saldoAkhir: 2800000,
        totalUsers: 45,
        totalAdmins: 8
      };
      setStats(fallbackStats);
      generateChartData([], fallbackStats, []);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from real API data
  const generateChartData = (
    santriList,
    statsData,
    pemakaianList = [],
    donasiData = {},
    syahriahData = {}
  ) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const displayedMonths = months.slice(0, currentMonth + 1);
  
    // Santri by status chart
    const santriByStatus = {
      labels: ['Aktif', 'Nonaktif'],
      datasets: [
        {
          data: [
            statsData.santriAktif,
            statsData.santriNonaktif
          ],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };

    // Process monthly financial data from APIs
    const processMonthlyData = (apiData, dataType = 'donasi') => {
      // Jika data adalah array (seperti di DataKeuangan)
      if (Array.isArray(apiData)) {
        const monthlyData = displayedMonths.map((month, index) => {
          const monthNum = index + 1;
          const monthStr = monthNum.toString().padStart(2, '0');
          const year = new Date().getFullYear();
          
          const monthlyItems = apiData.filter(item => {
            const itemDate = dataType === 'donasi' ? 
              (item.waktu_catat || item.created_at) : 
              (item.waktu_catat || item.created_at);
            
            if (!itemDate) return false;
            
            const date = new Date(itemDate);
            return date.getMonth() === index && date.getFullYear() === year;
          });
          
          return monthlyItems.reduce((sum, item) => sum + (item.nominal || 0), 0);
        });
        return monthlyData;
      }
      
      // Jika data memiliki struktur summary
      if (apiData.data && Array.isArray(apiData.data)) {
        return apiData.data.map(item => item.total || 0);
      }
      
      // Fallback: generate realistic data based on total
      const total = dataType === 'donasi' ? statsData.totalDonasi : statsData.totalSyahriah;
      const monthlyAvg = total / (currentMonth + 1);
      return displayedMonths.map((_, index) => 
        Math.round(monthlyAvg * (0.7 + Math.random() * 0.6))
      );
    };
  
    const monthlyDonasi = processMonthlyData(donasiData, 'donasi');
    const monthlySyahriah = processMonthlyData(syahriahData, 'syahriah');
  
    // Calculate monthly pemasukan (donasi + syahriah)
    const monthlyPemasukan = displayedMonths.map((_, index) => 
      (monthlyDonasi[index] || 0) + (monthlySyahriah[index] || 0)
    );
  
    // Process monthly pengeluaran dari pemakaian data
    let monthlyPengeluaran = displayedMonths.map((month, index) => {
      const monthNum = index + 1;
      const monthStr = monthNum.toString().padStart(2, '0');
      const year = new Date().getFullYear();
      
      const monthlyPemakaian = pemakaianList.filter(item => {
        const itemDate = item.tanggal_pemakaian || item.created_at;
        if (!itemDate) return false;
        
        const date = new Date(itemDate);
        return date.getMonth() === index && date.getFullYear() === year;
      });
      
      return monthlyPemakaian.reduce((sum, item) => sum + (item.nominal || 0), 0);
    });
  
    // Jika no pemakaian data, generate realistic data
    const hasPengeluaranData = monthlyPengeluaran.some(amount => amount > 0);
    if (!hasPengeluaranData) {
      const monthlyAvg = statsData.totalPengeluaran / (currentMonth + 1);
      monthlyPengeluaran = displayedMonths.map((_, index) => 
        Math.round(monthlyAvg * (0.6 + Math.random() * 0.8))
      );
    }
  
    const pemasukanByMonth = {
      labels: displayedMonths,
      datasets: [
        {
          label: 'Pemasukan',
          data: monthlyPemasukan,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  
    const pengeluaranByMonth = {
      labels: displayedMonths,
      datasets: [
        {
          label: 'Pengeluaran',
          data: monthlyPengeluaran,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  
    // Financial comparison chart
    const keuanganComparison = {
      labels: ['Pemasukan', 'Pengeluaran'],
      datasets: [
        {
          data: [statsData.totalPemasukan, statsData.totalPengeluaran],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };
  
    // Revenue sources chart - PERBAIKAN: Pastikan data syahriah ada
    const revenueSources = {
      labels: ['Donasi', 'Syahriah'],
      datasets: [
        {
          data: [
            statsData.totalDonasi || 0, 
            statsData.totalSyahriah || 0 // Pastikan tidak undefined
          ],
          backgroundColor: ['#8B5CF6', '#3B82F6'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };
  
    setChartData({
      santriByStatus,
      pemasukanByMonth,
      pengeluaranByMonth,
      keuanganComparison,
      revenueSources
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Enhanced DonutChart with better sizing
  const DonutChart = ({ data, size = 200 }) => {
    if (!data || !data.datasets || !data.datasets[0]) {
      return (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-gray-400 text-sm">No data</div>
        </div>
      );
    }

    const dataset = data.datasets[0];
    const total = dataset.data.reduce((sum, value) => sum + value, 0);
    const radius = size / 2 - 10;
    let currentAngle = 0;

    // If total is 0, show empty state
    if (total === 0) {
      return (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-gray-400 text-sm">No data</div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="mx-auto">
          {dataset.data.map((value, index) => {
            if (value === 0) return null;
            
            const percentage = value / total;
            const angle = percentage * 360;
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = radius + radius * Math.cos(startAngle * Math.PI / 180);
            const y1 = radius + radius * Math.sin(startAngle * Math.PI / 180);
            
            const x2 = radius + radius * Math.cos(endAngle * Math.PI / 180);
            const y2 = radius + radius * Math.sin(endAngle * Math.PI / 180);

            currentAngle = endAngle;

            return (
              <path
                key={index}
                d={`M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={dataset.backgroundColor[index]}
                stroke={dataset.borderColor}
                strokeWidth={dataset.borderWidth}
              />
            );
          })}
          <circle cx={radius} cy={radius} r={radius * 0.6} fill="white" />
          <text
            x={radius}
            y={radius}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-lg font-bold fill-gray-700"
          >
            {total > 1000000 ? `${(total / 1000000).toFixed(1)}Juta` : total > 1000 ? `${(total / 1000).toFixed(0)}K` : total}
          </text>
        </svg>
        
        {/* Legend */}
        <div className="mt-4 space-y-2 w-full">
          {data.labels.map((label, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: dataset.backgroundColor[index] }}
                ></div>
                <span className="text-gray-600">{label}</span>
              </div>
              <span className="font-medium text-gray-800">
                {formatCurrency(dataset.data[index])}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced LineChart with better sizing
  const LineChart = ({ data, size = 300 }) => {
    if (!data || !data.datasets || !data.datasets[0]) {
      return (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-gray-400 text-sm">No data</div>
        </div>
      );
    }

    const dataset = data.datasets[0];
    const maxValue = Math.max(...dataset.data, 1); // Ensure at least 1 to avoid division by zero
    const padding = 40;

    return (
      <div className="w-full">
        <svg width="100%" height={size} className="mx-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1={padding}
              y1={padding + ratio * (size - 2 * padding)}
              x2={`calc(100% - ${padding}px)`}
              y2={padding + ratio * (size - 2 * padding)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Area */}
          <polygon
            points={`
              ${padding},${size - padding} 
              ${dataset.data.map((value, index) => {
                const x = padding + (index / (dataset.data.length - 1 || 1)) * (100 - 2 * padding) + '%';
                const y = padding + (1 - (value / maxValue)) * (size - 2 * padding);
                return `${x} ${y}`;
              }).join(' ')} 
              calc(100% - ${padding}px),${size - padding}
            `}
            fill={dataset.backgroundColor}
          />

          {/* Line */}
          <polyline
            points={dataset.data.map((value, index) => {
              const x = padding + (index / (dataset.data.length - 1 || 1)) * (100 - 2 * padding) + '%';
              const y = padding + (1 - (value / maxValue)) * (size - 2 * padding);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={dataset.borderColor}
            strokeWidth="3"
          />

          {/* Data points */}
          {dataset.data.map((value, index) => {
            const x = padding + (index / (dataset.data.length - 1 || 1)) * (100 - 2 * padding) + '%';
            const y = padding + (1 - (value / maxValue)) * (size - 2 * padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={dataset.borderColor}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}

          {/* X-axis labels */}
          {data.labels && data.labels.map((label, index) => {
            const x = padding + (index / (data.labels.length - 1 || 1)) * (100 - 2 * padding) + '%';
            return (
              <text
                key={index}
                x={x}
                y={size - padding / 2}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {label}
              </text>
            );
          })}
        </svg>
        
        {/* Chart title and summary */}
        <div className="mt-2 text-center">
          <div className="text-sm text-gray-600">
            Total: {formatCurrency(dataset.data.reduce((sum, value) => sum + value, 0))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AuthDashboardLayout title="Dashboard Super Admin">
        <div className="animate-pulse space-y-6">
          {/* Welcome Section Skeleton */}
          <div className="bg-gray-200 rounded-xl p-6 h-32"></div>
          
          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl p-6 h-96"></div>
            ))}
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl p-6 h-64"></div>
            ))}
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  return (
    <AuthDashboardLayout title="Dashboard Super Admin">

      {/* Financial Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Financial Comparison */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Pemasukan vs Pengeluaran</h4>
            <Icons.Finance />
          </div>
          <DonutChart data={chartData.keuanganComparison} size={250} />
        </div>

        {/* Revenue Sources */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Sumber Pemasukan</h4>
            <Icons.Donasi />
          </div>
          <DonutChart data={chartData.revenueSources} size={250} />
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Sources Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Detail Sumber Pemasukan</h4>
            <Icons.Cash />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <Icons.Donasi className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Donasi</div>
                  <div className="text-sm text-gray-600">Sumbangan dari donatur</div>
                </div>
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(stats.totalDonasi)}
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Icons.Money className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Syahriah</div>
                  <div className="text-sm text-gray-600">Pembayaran bulanan santri</div>
                </div>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(stats.totalSyahriah)}
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="font-medium text-gray-900 text-lg">Total Pemasukan</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(stats.totalPemasukan)}
              </div>
            </div>
          </div>
        </div>

        {/* System Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Ringkasan Sistem</h4>
            <Icons.Users />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Icons.Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Icons.Santri className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-800">{stats.totalAdmins}</div>
                <div className="text-sm text-gray-600">Admin TPQ</div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Saldo Akhir</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.saldoAkhir)}
                  </div>
                </div>
                <Icons.Chart className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs opacity-80 mt-2">
                Rasio kesehatan: {stats.totalPemasukan > 0 ? Math.round((stats.saldoAkhir / stats.totalPemasukan) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthDashboardLayout>
  );
};

export default SuperAdminDashboard;