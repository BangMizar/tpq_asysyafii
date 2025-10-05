import React, { useState, useEffect } from 'react'

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentWord, setCurrentWord] = useState(0)

  const words = ['Qurani', 'Berakhlak', 'Cerdas', 'Shalih', 'Berprestasi']

  useEffect(() => {
    setIsVisible(true)
    
    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)

    return () => clearInterval(wordInterval)
  }, [])

  // Floating elements data
  const floatingElements = [
    { icon: '📖', top: '20%', left: '10%', delay: 0 },
    { icon: '🕌', top: '60%', left: '5%', delay: 0.5 },
    { icon: '✏️', top: '30%', right: '10%', delay: 1 },
    { icon: '🌟', top: '70%', right: '15%', delay: 1.5 },
    { icon: '🎓', top: '40%', left: '15%', delay: 2 },
    { icon: '📚', top: '80%', right: '5%', delay: 2.5 },
  ]

  return (
    <section id="beranda" className="relative min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden pt-5">
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0">  
        {/* Floating Circles */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-green-200 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/3 w-8 h-8 bg-green-300 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-green-400 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid-pattern animate-grid-flow"></div>
        </div>
      </div>

      {/* Floating Icons */}
      {floatingElements.map((element, index) => (
        <div
          key={index}
          className={`absolute text-2xl md:text-3xl opacity-20 animate-bounce-slow`}
          style={{
            top: element.top,
            left: element.left,
            right: element.right,
            animationDelay: `${element.delay}s`
          }}
        >
          {element.icon}
        </div>
      ))}

      <div className="relative container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh]">
          
          {/* Text Content dengan Animasi */}
          <div className="lg:w-1/2 mb-12 lg:mb-0 space-y-8">
            {/* Badge dengan Animasi */}
            <div className={`inline-flex items-center space-x-2 bg-green-100 border border-green-200 rounded-full px-4 py-2 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-700 font-medium text-sm">Taman Pendidikan Quran Terpercaya</span>
            </div>

            {/* Main Heading dengan Typing Animation */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-green-900 leading-tight">
                <span className={`block transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  TPQ{' '}
                  <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    Asy-Syafi'i
                  </span>
                </span>
                <span className={`block text-2xl md:text-3xl text-green-700 font-semibold mt-2 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  Campakoah
                </span>
              </h1>

              {/* Animated Words */}
              <div className="h-12 flex items-center">
                <span className={`text-lg md:text-xl text-green-600 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  Membentuk generasi{' '}
                  <span className="font-bold text-green-700 inline-block min-w-[150px]">
                    <span className="animate-word-change">
                      {words[currentWord]}
                    </span>
                  </span>
                </span>
              </div>
            </div>

            {/* Description dengan Stagger Animation */}
            <p className={`text-lg text-green-700 leading-relaxed max-w-2xl transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              Pendidikan agama Islam yang menyenangkan untuk anak-anak usia dini, 
              mengajarkan Al-Quran dengan metode yang benar sesuai manhaj Ahlus Sunnah wal Jama'ah.
            </p>

            {/* CTA Buttons - Hubungi dan Alamat */}
            <div className={`flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 transform transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-1 hover:scale-105 hover:shadow-2xl transition-all duration-300 font-semibold shadow-lg overflow-hidden text-center"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>📞 Hubungi Kami</span>
                  <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </a>

              <a 
                href="https://maps.google.com/?q=TPQ+Asy-Syafi'i+Campakoah" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative border-2 border-green-600 text-green-600 px-8 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 font-semibold text-center hover:bg-green-600 hover:text-white overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>📍 Lihat Alamat</span>
                </span>
                <div className="absolute inset-0 bg-green-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
              </a>
            </div>

            {/* Stats dengan Counter Animation */}
            {/* <div className={`grid grid-cols-3 gap-6 pt-8 transform transition-all duration-1000 delay-1300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {[
                { number: '150+', label: 'Santri Aktif', color: 'text-green-600' },
                { number: '10+', label: 'Pengajar', color: 'text-green-600' },
                { number: '5+', label: 'Tahun', color: 'text-green-600' }
              ].map((stat, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-1 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.number}
                  </div>
                  <div className="text-sm text-green-700 font-medium">{stat.label}</div>
                </div>
              ))}
            </div> */}
          </div>

          {/* Hero Illustration dengan Animasi */}
          <div className="lg:w-1/2 flex justify-center items-center">
            <div className="relative">
              
              {/* Main Circle dengan Rotate Animation */}
              <div className={`relative w-80 h-80 md:w-96 md:h-96 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-1500 delay-500 ${isVisible ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-180 opacity-0'}`}>
                
                {/* Inner Circle dengan Pulse Animation */}
                <div className="absolute inset-8 bg-gradient-to-br from-green-300 to-green-400 rounded-full flex items-center justify-center animate-pulse-slow shadow-inner">
                  
                  {/* Content Center */}
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-bounce-gentle">
                      <span className="text-4xl text-green-600">📖</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-green-800 font-bold text-lg animate-text-glow">Belajar Quran</p>
                      <p className="text-green-700 text-sm">Dengan Metode Yang Benar</p>
                    </div>
                  </div>
                </div>

                {/* Floating Elements Around Circle */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg animate-float-rotate">
                  <span className="text-2xl">🕌</span>
                </div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg animate-float-rotate" style={{ animationDelay: '1s' }}>
                  <span className="text-2xl">🌟</span>
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg animate-float-rotate" style={{ animationDelay: '2s' }}>
                  <span className="text-xl">🎯</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg animate-float-rotate" style={{ animationDelay: '1.5s' }}>
                  <span className="text-xl">📚</span>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-10 -right-10 w-20 h-20 bg-yellow-200 rounded-full opacity-60 animate-ping-slow"></div>
              <div className="absolute bottom-10 -left-10 w-16 h-16 bg-blue-200 rounded-full opacity-60 animate-ping-slow" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 transition-all duration-1000 delay-2000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <span className="text-green-600 text-sm font-medium">Scroll untuk menjelajahi</span>
          <div className="w-6 h-10 border-2 border-green-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-green-400 rounded-full mt-2 animate-scroll-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero