import React from 'react'

const Features = () => {
  const features = [
    {
      icon: "👨‍🏫",
      title: "Pengajar Berkompeten",
      description: "Guru-guru yang berpengalaman dan memiliki sanad keilmuan yang jelas sesuai manhaj Ahlus Sunnah"
    },
    {
      icon: "📚",
      title: "Kurikulum Terstruktur",
      description: "Kurikulum yang disusun secara sistematis berdasarkan kitab-kitab ulama salaf"
    },
    {
      icon: "🕌",
      title: "Aqidah yang Shahih",
      description: "Mengajarkan aqidah yang benar sesuai pemahaman salafus shalih"
    },
    {
      icon: "🎯",
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
            <div key={index} className="bg-green-50 rounded-xl p-6 text-center hover:shadow-lg transition duration-300 hover-lift">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-green-800 mb-3">{feature.title}</h3>
              <p className="text-green-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features