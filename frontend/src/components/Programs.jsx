import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch program unggulan dari API
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/program-unggulan`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Data program dari API:', data); // Debug log
      
      setPrograms(data.data || []);

    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Gagal memuat data program unggulan.');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Format status program
  const formatStatus = (status) => {
    const statusMap = {
      'aktif': 'Aktif',
      'nonaktif': 'Nonaktif'
    };
    return statusMap[status] || status;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colorMap = {
      'aktif': 'bg-green-100 text-green-800',
      'nonaktif': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-green-100 text-green-800';
  };

  // Parse fitur dari JSON string ke array
  const parseFitur = (fitur) => {
    if (!fitur) return [];
    
    try {
      // Jika fitur adalah string JSON, parse dulu
      if (typeof fitur === 'string') {
        const parsed = JSON.parse(fitur);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      // Jika sudah array, langsung return
      return Array.isArray(fitur) ? fitur : [];
    } catch (error) {
      console.error('Error parsing fitur:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <section id="program" className="py-20 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              Program Unggulan
            </h2>
            <p className="text-lg text-green-600 max-w-2xl mx-auto">
              Berbagai program pembelajaran yang disesuaikan dengan kebutuhan dan usia anak
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="p-6">
                  <div className="h-6 bg-green-200 rounded w-20 mb-4"></div>
                  <div className="h-8 bg-green-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-green-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-green-200 rounded w-2/3 mb-6"></div>
                  
                  {/* Loading untuk fitur */}
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="flex items-center mb-2">
                      <div className="h-4 bg-green-200 rounded w-4 mr-2"></div>
                      <div className="h-4 bg-green-200 rounded w-32"></div>
                    </div>
                  ))}
                  
                  <div className="h-10 bg-green-200 rounded mt-6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="program" className="py-20 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              Program Unggulan
            </h2>
            <p className="text-lg text-green-600 max-w-2xl mx-auto">
              Berbagai program pembelajaran yang disesuaikan dengan kebutuhan dan usia anak
            </p>
          </div>
          
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Gagal memuat program</h3>
            <p className="text-green-500">{error}</p>
            <button 
              onClick={fetchPrograms}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Filter hanya program yang aktif untuk ditampilkan
  const activePrograms = programs.filter(program => program.status === 'aktif');

  return (
    <section id="program" className="py-20 bg-green-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
            Program Unggulan
          </h2>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Berbagai program pembelajaran yang disesuaikan dengan kebutuhan dan usia anak
          </p>
        </div>

        {activePrograms.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-green-800 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Belum ada program</h3>
            <p className="text-green-500">Tidak ada program unggulan yang aktif saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activePrograms.map((program) => {
              const fiturList = parseFitur(program.fitur);
              
              return (
                <div 
                  key={program.id_program} 
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 hover-lift"
                >
                  <div className="p-6">
                    
                    <h3 className="text-2xl font-bold text-green-800 mb-3">
                      {program.nama_program}
                    </h3>
                    
                    <p className="text-green-600 mb-4">
                      {program.deskripsi}
                    </p>
                    
                    {fiturList.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {fiturList.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-green-700">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="text-center">
                      <Link 
                        to={`/program/${program.slug}`}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 w-full inline-block"
                      >
                        Info Selengkapnya
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Button - hanya tampil jika ada program */}
        {activePrograms.length > 0 && (
          <div className="text-center mt-12">
            <Link 
              to="/program"
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-semibold inline-flex items-center"
            >
              <span>Lihat Semua Program</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default Programs;