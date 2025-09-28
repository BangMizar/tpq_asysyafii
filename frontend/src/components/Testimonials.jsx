import React from 'react'

const Testimonials = () => {
  const testimonials = [
    {
      name: "Ahmad Fauzi",
      role: "Orang Tua Santri",
      message: "Alhamdulillah, anak saya menjadi lebih rajin sholat dan hafal beberapa surat pendek. Metode pengajarannya sesuai sunnah.",
      avatar: "👨",
      child: "Muhammad - 8 tahun"
    },
    {
      name: "Siti Khadijah",
      role: "Orang Tua Santri",
      message: "Guru-gurunya sangat perhatian dan sabar. Aqidah yang diajarkan sangat jelas dan sesuai pemahaman salaf.",
      avatar: "👩",
      child: "Aisyah - 7 tahun"
    },
    {
      name: "Abdullah Rahman",
      role: "Orang Tua Santri",
      message: "Lingkungan belajar yang nyaman dan mendukung. Anak saya sekarang lebih percaya diri membaca Quran dengan tajwid yang benar.",
      avatar: "👨",
      child: "Yusuf - 9 tahun"
    }
  ]

  return (
    <section id="testimoni" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
            Testimoni Orang Tua
          </h2>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Apa kata orang tua tentang TPQ Asy-Syafi'i Campakoah
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-green-50 rounded-xl p-6 hover-lift">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-xl mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">{testimonial.name}</h4>
                  <p className="text-green-600 text-sm">{testimonial.role}</p>
                  <p className="text-green-500 text-xs">{testimonial.child}</p>
                </div>
              </div>
              <p className="text-green-700 italic">"{testimonial.message}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials