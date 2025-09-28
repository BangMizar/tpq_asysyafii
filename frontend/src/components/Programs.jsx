import React from 'react'

const Programs = () => {
  const programs = [
    {
      title: "Tahfizh Quran",
      description: "Program menghafal Quran untuk anak-anak dengan metode yang benar dan terstruktur",
      features: ["Target 1-5 Juz", "Metode Mutqin", "Usia 5-15 Tahun", "Sertifikat Hafalan"],
      level: "Dasar & Lanjutan"
    },
    {
      title: "Tahsin & Tajwid",
      description: "Memperbaiki bacaan Quran dengan kaidah tajwid yang benar sesuai riwayat",
      features: ["Koreksi Bacaan", "Praktik Langsung", "Evaluasi Berkala", "Sanad Qira'ah"],
      level: "Semua Level"
    },
    {
      title: "Aqidah & Akhlak",
      description: "Pembentukan aqidah dan akhlak mulia berdasarkan Al-Quran dan Sunnah",
      features: ["Aqidah Shahihah", "Kisah Nabi", "Praktik Ibadah", "Adab Islami"],
      level: "Wajib"
    }
  ]

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
          {programs.map((program, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 hover-lift">
              <div className="p-6">
                <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                  {program.level}
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-3">{program.title}</h3>
                <p className="text-green-600 mb-4">{program.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-green-700">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 w-full">
                    Info Selengkapnya
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Programs