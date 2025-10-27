import React, { useState, useEffect } from 'react'

const Features = () => {
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Mapping icon names to SVG components
  const iconMap = {
    'users': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v6m0 0v2m0-2h2m-2 0h-2" />
      </svg>
    ),
    'book-open': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    'shield-check': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'graduation-cap': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-1h1m0 0v-1m0 1h1m-1 0h-1" />
      </svg>
    ),
    'star': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    'award': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'clock': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'check-circle': (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  // Default icon jika icon tidak ditemukan
  const DefaultIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )

  const getIconComponent = (iconName) => {
    return iconMap[iconName] || <DefaultIcon />
  }

  // Fetch data fasilitas dari API
  const fetchFeatures = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_URL}/api/fasilitas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Transform data dari API ke format yang diinginkan
      const transformedFeatures = result.data.map(item => ({
        id: item.id_fasilitas,
        icon: getIconComponent(item.icon),
        title: item.judul,
        description: item.deskripsi,
        urutan_tampil: item.urutan_tampil || 0
      }))

      // Sort by urutan_tampil
      const sortedFeatures = transformedFeatures.sort((a, b) => a.urutan_tampil - b.urutan_tampil)
      
      setFeatures(sortedFeatures)

    } catch (err) {
      console.error('Error fetching features:', err)
      setError('Gagal memuat data fasilitas')
      
      // Fallback data jika API error
      setFeatures([
        {
          id: 1,
          icon: iconMap['users'],
          title: "Pengajar Berkompeten",
          description: "Guru-guru yang berpengalaman dan memiliki sanad keilmuan yang jelas sesuai manhaj Ahlus Sunnah"
        },
        {
          id: 2,
          icon: iconMap['book-open'],
          title: "Kurikulum Terstruktur",
          description: "Kurikulum yang disusun secara sistematis berdasarkan kitab-kitab ulama salaf"
        },
        {
          id: 3,
          icon: iconMap['shield-check'],
          title: "Aqidah yang Shahih",
          description: "Mengajarkan aqidah yang benar sesuai pemahaman salafus shalih"
        },
        {
          id: 4,
          icon: iconMap['graduation-cap'],
          title: "Metode Salafy",
          description: "Pembelajaran dengan metode yang telah teruji dari ulama salaf"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatures()
  }, [])

  if (loading) {
    return (
      <section id="fasilitas" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              Keunggulan TPQ Asy-Syafi'i
            </h2>
            <p className="text-lg text-green-600 max-w-2xl mx-auto">
              Memuat data fasilitas...
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-green-50 rounded-xl p-6 text-center animate-pulse">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-200 rounded-full w-18 h-18"></div>
                </div>
                <div className="h-6 bg-green-200 rounded mb-3 mx-auto w-3/4"></div>
                <div className="h-4 bg-green-200 rounded mb-2"></div>
                <div className="h-4 bg-green-200 rounded w-5/6 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error && features.length === 0) {
    return (
      <section id="fasilitas" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={fetchFeatures}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="fasilitas" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
            Keunggulan TPQ Asy-Syafi'i
          </h2>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Kami berkomitmen memberikan pendidikan Islam yang sesuai Al-Quran dan Sunnah 
            dengan pemahaman salafus shalih
          </p>
        </div>

        {features.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Belum ada fasilitas yang ditambahkan</h3>
            <p className="text-green-600">Belum ada fasilitas yang ditambahkan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div 
                key={feature.id} 
                className="bg-green-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full text-green-600 group-hover:bg-green-200 group-hover:text-green-700 transition-colors duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-3">{feature.title}</h3>
                <p className="text-green-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Features