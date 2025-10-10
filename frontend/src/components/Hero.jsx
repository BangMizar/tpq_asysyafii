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

  // SVG Icons untuk floating elements
  const BookIcon = () => (
    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
    </svg>
  )

  const MosqueIcon = () => (
    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 7c0-1.1-2-3-2-3s-2 1.9-2 3c0 .74.4 1.38 1 1.72V13h-2v-2c0-.95-.66-1.74-1.55-1.94.34-.58.55-1.25.55-1.97 0-1.31-.65-2.53-1.74-3.25L12 1 7.74 3.84C6.65 4.56 6 5.78 6 7.09c0 .72.21 1.39.55 1.96C5.66 9.27 5 10.07 5 11v2H3V8.72c.6-.34 1-.98 1-1.72 0-1.1-2-3-2-3S0 5.9 0 7c0 .74.4 1.38 1 1.72V21h10v-4c0-.55.45-1 1-1s1 .45 1 1v4h10V8.72c.6-.34 1-.98 1-1.72zM8.85 5.5L12 3.4l3.15 2.1c.53.36.85.95.85 1.59C16 8.14 15.14 9 14.09 9H9.91C8.86 9 8 8.14 8 7.09c0-.64.32-1.23.85-1.59zM21 19h-6v-2c0-1.65-1.35-3-3-3s-3 1.35-3 3v2H3v-4h4v-4h10v4h4v4z"/>
    </svg>
  )

  const PencilIcon = () => (
    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  )

  const StarIcon = () => (
    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  )

  const GraduateIcon = () => (
    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
    </svg>
  )

  const BooksIcon = () => (
    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
    </svg>
  )

  // Floating elements data dengan SVG components
  const floatingElements = [
    { icon: <BookIcon />, top: '20%', left: '10%', delay: 0 },
    { icon: <MosqueIcon />, top: '60%', left: '5%', delay: 0.5 },
    { icon: <PencilIcon />, top: '30%', right: '10%', delay: 1 },
    { icon: <StarIcon />, top: '70%', right: '15%', delay: 1.5 },
    { icon: <GraduateIcon />, top: '40%', left: '15%', delay: 2 },
    { icon: <BooksIcon />, top: '80%', right: '5%', delay: 2.5 },
  ]

  return (
    <section id="beranda" className="relative min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden flex items-center justify-center">
      
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
          className={`absolute text-green-600 opacity-20 animate-bounce-slow`}
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

      <div className="relative container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-4xl mx-auto">
          
          {/* Badge dengan Animasi */}
          <div className={`inline-flex items-center space-x-2 bg-green-100 border border-green-200 rounded-full px-4 py-2 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-700 font-medium text-sm">Taman Pendidikan Quran Terpercaya</span>
          </div>

          {/* Main Heading dengan Typing Animation */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-green-900 leading-tight">
              <span className={`block transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                TPQ{' '}
                <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Asy-Syafi'i
                </span>
              </span>
              <span className={`block text-2xl md:text-3xl text-green-700 font-semibold mt-4 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                Campakoah
              </span>
            </h1>

            {/* Animated Words */}
            <div className="h-16 flex items-center justify-center">
              <span className={`text-xl md:text-2xl text-green-600 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                Membentuk generasi{' '}
                <span className="font-bold text-green-700 inline-block min-w-[200px]">
                  <span className="animate-word-change">
                    {words[currentWord]}
                  </span>
                </span>
              </span>
            </div>
          </div>

          {/* Description dengan Stagger Animation */}
          <p className={`text-lg md:text-xl text-green-700 leading-relaxed max-w-3xl transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
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
                <PhoneIcon />
                <span>Hubungi Kami</span>
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
                <LocationIcon />
                <span>Lihat Alamat</span>
              </span>
              <div className="absolute inset-0 bg-green-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        {/* <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 transition-all duration-1000 delay-2000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <span className="text-green-600 text-sm font-medium">Scroll untuk menjelajahi</span>
          <div className="w-6 h-10 border-2 border-green-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-green-400 rounded-full mt-2 animate-scroll-bounce"></div>
          </div>
        </div> */}
      </div>
    </section>
  )
}

// Tambahan SVG icons untuk button
const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/>
  </svg>
)

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)

export default Hero