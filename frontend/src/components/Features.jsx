import React from 'react'

const Features = () => {
  const features = [
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v6m0 0v2m0-2h2m-2 0h-2" />
        </svg>
      ),
      title: "Pengajar Berkompeten",
      description: "Guru-guru yang berpengalaman dan memiliki sanad keilmuan yang jelas sesuai manhaj Ahlus Sunnah"
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Kurikulum Terstruktur",
      description: "Kurikulum yang disusun secara sistematis berdasarkan kitab-kitab ulama salaf"
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Aqidah yang Shahih",
      description: "Mengajarkan aqidah yang benar sesuai pemahaman salafus shalih"
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-1h1m0 0v-1m0 1h1m-1 0h-1" />
        </svg>
      ),
      title: "Metode Salafy",
      description: "Pembelajaran dengan metode yang telah teruji dari ulama salaf"
    }
  ]

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
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
      </div>
    </section>
  )
}

export default Features