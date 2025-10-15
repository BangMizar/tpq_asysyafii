import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoCircle from "../assets/logo-circle.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Effect untuk handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  // SVG Icons
  const icons = {
    home: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    book: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    star: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    chat: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    phone: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    heart: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    news: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
      </svg>
    ),
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    academic: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-green-600/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      {/* Background dengan gelombang kompleks - hanya tampil saat tidak scroll */}
      {!isScrolled && (
        <div className="absolute inset-0 bg-gradient-to-br from-white via-green-50 to-white"></div>
      )}
      
      {/* Gelombang atas - hanya tampil saat tidak scroll */}
      {!isScrolled && (
        <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none">
          <svg 
            className="relative block w-full h-20" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              className="fill-green-100 opacity-60"
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              className="fill-green-200 opacity-40"
            ></path>
          </svg>
        </div>
      )}

      <div className="relative container mx-auto px-4 py-4 lg:py-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 lg:space-x-3 group">
            <div className="relative">
              <div className={`w-15 h-15 lg:w-16 lg:h-16 rounded-full transform rotate-6 group-hover:rotate-0 transition-all duration-500 flex items-center justify-center shadow-lg lg:shadow-2xl overflow-hidden ${
                isScrolled 
                  ? 'bg-gradient-to-br from-white to-green-100' 
                  : 'bg-gradient-to-br from-green-800 to-green-950'
              }`}>
                <img 
                  src={logoCircle} 
                  alt="TPQ Asy-Syafi'i Logo" 
                  className="w-full h-full object-cover rounded-full" 
                />
                <div className={`absolute -inset-1 lg:-inset-2 rounded-full transform -rotate-6 -z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-500 ${
                  isScrolled ? 'bg-green-200' : 'bg-green-300'
                }`}></div>
              </div>
            </div>
            <div className="transform -skew-y-2 group-hover:skew-y-0 transition-transform duration-500">
              <h1 className={`text-lg lg:text-3xl font-black bg-clip-text ${
                isScrolled 
                  ? 'text-white' 
                  : 'text-green-900 bg-gradient-to-r from-green-800 to-green-600'
              }`}>
                TPQ Asy-Syafi'i
              </h1>
              <p className={`text-xs lg:text-sm font-semibold mt-1 lg:mt-2 px-2 lg:px-4 py-1 lg:py-2 rounded-full shadow-inner border ${
                isScrolled
                  ? 'text-green-100 bg-green-700/50 border-green-600'
                  : 'text-green-700 bg-gradient-to-r from-green-100 to-green-200 border-green-200'
              }`}>
                Campakoah
              </p>
            </div>
          </Link>

          {/* Desktop Navigation dengan desain melengkung */}
          <nav className={`hidden xl:flex items-center space-x-2 backdrop-blur-sm rounded-3xl px-6 py-3 shadow-2xl border ${
            isScrolled
              ? 'bg-green-700/80 border-green-600'
              : 'bg-white/80 border-green-100'
          }`}>
            {[
              { name: 'Beranda', href: '#beranda' },
              { name: 'Berita', href: '#berita' },
              { name: 'Program', href: '#program' },
              { name: 'Fasilitas', href: '#fasilitas' },
              { name: 'Testimoni', href: '#testimoni' },
              { name: 'Kontak', href: '#kontak' },
              { name: 'Catatan Donasi', href: '/donasi' }
            ].map((item, index) => (
              item.href.startsWith('#') ? (
                <a 
                  key={item.name}
                  href={item.href}
                  className={`relative px-6 py-3 font-semibold rounded-2xl transition-all duration-300 group/nav ${
                    isScrolled
                      ? 'text-green-100 hover:text-white'
                      : 'text-green-800 hover:text-green-600'
                  }`}
                >
                  {item.name}
                  <span className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 rounded-full group-hover/nav:w-3/4 transition-all duration-300 ${
                    isScrolled
                      ? 'bg-gradient-to-r from-green-200 to-white'
                      : 'bg-gradient-to-r from-green-400 to-green-600'
                  }`}></span>
                </a>
              ) : (
                <Link 
                  key={item.name}
                  to={item.href}
                  className={`relative px-6 py-3 font-semibold rounded-2xl transition-all duration-300 group/nav ${
                    isScrolled
                      ? 'text-green-100 hover:text-white'
                      : 'text-green-800 hover:text-green-600'
                  }`}
                >
                  {item.name}
                  <span className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 rounded-full group-hover/nav:w-3/4 transition-all duration-300 ${
                    isScrolled
                      ? 'bg-gradient-to-r from-green-200 to-white'
                      : 'bg-gradient-to-r from-green-400 to-green-600'
                  }`}></span>
                </Link>
              )
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link 
              to="/login" 
              className={`px-7 py-3 font-semibold transition duration-300 border-2 rounded-2xl hover:rounded-3xl shadow-md hover:shadow-lg flex items-center space-x-2 ${
                isScrolled
                  ? 'text-green-100 hover:text-white border-green-400 hover:border-green-300 hover:bg-green-500/30'
                  : 'text-green-700 hover:text-green-900 border-green-300 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              {icons.user}
              <span>Masuk</span>
            </Link>
            <Link 
              to="/register"
              className={`px-8 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-1 hover:scale-105 hover:shadow-2xl transition-all duration-300 font-semibold shadow-lg relative overflow-hidden group flex items-center space-x-2 ${
                isScrolled
                  ? 'bg-gradient-to-r from-white to-green-100 text-green-700'
                  : 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white'
              }`}
            >
              <span className="relative z-10 flex items-center space-x-2">
                {icons.users}
                <span>Registrasi</span>
              </span>
              <div className={`absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
                isScrolled
                  ? 'bg-gradient-to-r from-green-100 to-white'
                  : 'bg-gradient-to-r from-green-600 to-green-800'
              }`}></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`lg:hidden backdrop-blur-sm w-12 h-12 rounded-2xl flex items-center justify-center transition duration-300 shadow-lg border mobile-menu-container ${
              isScrolled
                ? 'text-white bg-green-700/80 border-green-600 hover:bg-green-600'
                : 'text-green-800 bg-white/80 border-green-200 hover:bg-green-100'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
          >
            <div className="flex flex-col space-y-1">
              <div className={`w-5 h-0.5 rounded-full transition-transform duration-300 ${
                isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              } ${isScrolled ? 'bg-white' : 'bg-green-700'}`}></div>
              <div className={`w-5 h-0.5 rounded-full transition-opacity duration-300 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              } ${isScrolled ? 'bg-white' : 'bg-green-700'}`}></div>
              <div className={`w-5 h-0.5 rounded-full transition-transform duration-300 ${
                isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              } ${isScrolled ? 'bg-white' : 'bg-green-700'}`}></div>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden mobile-menu-container ${
          isMenuOpen 
            ? 'fixed inset-0 top-20 bg-white z-40 transform translate-x-0 transition-transform duration-300 ease-in-out' 
            : 'fixed inset-0 top-20 bg-white z-40 transform -translate-x-full transition-transform duration-300 ease-in-out'
        }`}>
          <div className="h-full overflow-y-auto pb-20">
            <div className="flex flex-col p-6 space-y-2">
              {[
                { name: 'Beranda', href: '#beranda', icon: icons.home },
                { name: 'Berita', href: '#berita', icon: icons.news },
                { name: 'Program', href: '#program', icon: icons.book },
                { name: 'Fasilitas', href: '#fasilitas', icon: icons.star },
                { name: 'Testimoni', href: '#testimoni', icon: icons.chat },
                { name: 'Kontak', href: '#kontak', icon: icons.phone },
                { name: 'Catatan Donasi', href: '/donasi', icon: icons.heart }
              ].map((item) => (
                item.href.startsWith('#') ? (
                  <a 
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-4 px-5 py-4 text-green-800 hover:text-green-600 font-semibold rounded-2xl hover:bg-green-50 transition duration-300 border-2 border-transparent hover:border-green-200 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="transform group-hover:scale-110 transition-transform duration-300 text-green-600">
                      {item.icon}
                    </span>
                    <span className="text-lg">{item.name}</span>
                  </a>
                ) : (
                  <Link 
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-4 px-5 py-4 text-green-800 hover:text-green-600 font-semibold rounded-2xl hover:bg-green-50 transition duration-300 border-2 border-transparent hover:border-green-200 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="transform group-hover:scale-110 transition-transform duration-300 text-green-600">
                      {item.icon}
                    </span>
                    <span className="text-lg">{item.name}</span>
                  </Link>
                )
              ))}
              
              <div className="pt-6 border-t border-green-200 space-y-3 mt-4">
                <Link 
                  to="/login" 
                  className="flex items-center justify-center space-x-3 px-5 py-4 text-green-700 hover:text-green-900 font-semibold text-center border-2 border-green-300 rounded-2xl hover:rounded-3xl hover:border-green-400 hover:bg-green-50 transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {icons.user}
                  <span>Masuk ke Akun</span>
                </Link>
                <Link 
                  to="/register"
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {icons.users}
                  <span>Registrasi</span>
                </Link>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="px-6 mt-8">
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3">TPQ Asy-Syafi'i Campakoah</h3>
                <p className="text-sm text-green-600 mb-4">
                  Membentuk generasi Qur'ani yang berakhlak mulia dan berprestasi
                </p>
                <div className="flex space-x-3">
                  <div className="flex-1 text-center bg-white rounded-xl p-3 border border-green-200">
                    <div className="text-green-600 font-bold flex items-center justify-center space-x-1">
                      {icons.users}
                      <span>50+</span>
                    </div>
                    <div className="text-xs text-green-500 mt-1">Santri</div>
                  </div>
                  <div className="flex-1 text-center bg-white rounded-xl p-3 border border-green-200">
                    <div className="text-green-600 font-bold flex items-center justify-center space-x-1">
                      {icons.user}
                      <span>10+</span>
                    </div>
                    <div className="text-xs text-green-500 mt-1">Pengajar</div>
                  </div>
                  <div className="flex-1 text-center bg-white rounded-xl p-3 border border-green-200">
                    <div className="text-green-600 font-bold flex items-center justify-center space-x-1">
                      {icons.academic}
                      <span>5+</span>
                    </div>
                    <div className="text-xs text-green-500 mt-1">Program</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header