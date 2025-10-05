import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
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
          {/* Logo dengan desain unik */}
          <Link to="/" className="flex items-center space-x-2 lg:space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl lg:rounded-3xl transform rotate-6 group-hover:rotate-0 transition-all duration-500 flex items-center justify-center shadow-lg lg:shadow-2xl">
                <span className="text-white font-bold text-xl lg:text-2xl">ت</span>
                <div className="absolute -inset-1 lg:-inset-2 bg-green-300 rounded-2xl lg:rounded-3xl transform -rotate-6 -z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              </div>
            </div>
            <div className="transform -skew-y-2 group-hover:skew-y-0 transition-transform duration-500">
              <h1 className="text-lg lg:text-3xl font-black text-green-900 bg-gradient-to-r from-green-800 to-green-600 bg-clip-text">
                TPQ Asy-Syafi'i
              </h1>
              <p className="text-xs lg:text-sm text-green-700 font-semibold mt-1 lg:mt-2 bg-gradient-to-r from-green-100 to-green-200 px-2 lg:px-4 py-1 lg:py-2 rounded-full shadow-inner border border-green-200">
                Campakoah
              </p>
            </div>
          </Link>

          {/* Desktop Navigation dengan desain melengkung */}
          <nav className="hidden xl:flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-3xl px-6 py-3 shadow-2xl border border-green-100">
            {[
              { name: 'Beranda', href: '#beranda' },
              { name: 'Program', href: '#program' },
              { name: 'Fasilitas', href: '#fasilitas' },
              { name: 'Testimoni', href: '#testimoni' },
              { name: 'Kontak', href: '#kontak' },
              { name: 'Catatan Donasi', href: '/donasi' } // Menu baru
            ].map((item, index) => (
              item.href.startsWith('#') ? (
                <a 
                  key={item.name}
                  href={item.href}
                  className="relative px-6 py-3 text-green-800 hover:text-green-600 font-semibold rounded-2xl transition-all duration-300 group/nav"
                >
                  {item.name}
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full group-hover/nav:w-3/4 transition-all duration-300"></span>
                </a>
              ) : (
                <Link 
                  key={item.name}
                  to={item.href}
                  className="relative px-6 py-3 text-green-800 hover:text-green-600 font-semibold rounded-2xl transition-all duration-300 group/nav"
                >
                  {item.name}
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-400 to-green-600 rounded-full group-hover/nav:w-3/4 transition-all duration-300"></span>
                </Link>
              )
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* <Link 
              to="/donasi" 
              className="px-6 py-3 text-amber-700 hover:text-amber-900 font-semibold transition duration-300 border-2 border-amber-300 rounded-2xl hover:rounded-3xl hover:border-amber-400 hover:bg-amber-50 shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>💝</span>
              <span>Donasi</span>
            </Link> */}
            <Link 
              to="/login" 
              className="px-7 py-3 text-green-700 hover:text-green-900 font-semibold transition duration-300 border-2 border-green-300 rounded-2xl hover:rounded-3xl hover:border-green-400 hover:bg-green-50 shadow-md hover:shadow-lg"
            >
              Masuk
            </Link>
            <Link 
              to="/register"
              className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white px-8 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-1 hover:scale-105 hover:shadow-2xl transition-all duration-300 font-semibold shadow-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Registrasi</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-green-800 bg-white/80 backdrop-blur-sm w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-green-100 transition duration-300 shadow-lg border border-green-200 mobile-menu-container"
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
          >
            <div className="flex flex-col space-y-1">
              <div className={`w-5 h-0.5 bg-green-700 rounded-full transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
              <div className={`w-5 h-0.5 bg-green-700 rounded-full transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></div>
              <div className={`w-5 h-0.5 bg-green-700 rounded-full transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
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
                { name: 'Beranda', href: '#beranda', icon: '🏠' },
                { name: 'Program', href: '#program', icon: '📚' },
                { name: 'Fasilitas', href: '#fasilitas', icon: '⭐' },
                { name: 'Testimoni', href: '#testimoni', icon: '💬' },
                { name: 'Kontak', href: '#kontak', icon: '📞' },
                { name: 'Catatan Donasi', href: '/donasi', icon: '💝' } // Menu baru
              ].map((item) => (
                item.href.startsWith('#') ? (
                  <a 
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-4 px-5 py-4 text-green-800 hover:text-green-600 font-semibold rounded-2xl hover:bg-green-50 transition duration-300 border-2 border-transparent hover:border-green-200 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                    <span className="text-lg">{item.name}</span>
                  </a>
                ) : (
                  <Link 
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-4 px-5 py-4 text-green-800 hover:text-green-600 font-semibold rounded-2xl hover:bg-green-50 transition duration-300 border-2 border-transparent hover:border-green-200 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                    <span className="text-lg">{item.name}</span>
                  </Link>
                )
              ))}
              
              <div className="pt-6 border-t border-green-200 space-y-3 mt-4">
                {/* <Link 
                  to="/donasi" 
                  className="flex items-center justify-center space-x-3 px-5 py-4 text-amber-700 hover:text-amber-900 font-semibold text-center border-2 border-amber-300 rounded-2xl hover:rounded-3xl hover:border-amber-400 hover:bg-amber-50 transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>💝</span>
                  <span>Lihat Donasi</span>
                </Link> */}
                <Link 
                  to="/login" 
                  className="flex items-center justify-center space-x-3 px-5 py-4 text-green-700 hover:text-green-900 font-semibold text-center border-2 border-green-300 rounded-2xl hover:rounded-3xl hover:border-green-400 hover:bg-green-50 transition duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Masuk ke Akun</span>
                </Link>
                <Link 
                  to="/register"
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
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
                    <div className="text-green-600 font-bold">50+</div>
                    <div className="text-xs text-green-500">Santri</div>
                  </div>
                  <div className="flex-1 text-center bg-white rounded-xl p-3 border border-green-200">
                    <div className="text-green-600 font-bold">10+</div>
                    <div className="text-xs text-green-500">Pengajar</div>
                  </div>
                  <div className="flex-1 text-center bg-white rounded-xl p-3 border border-green-200">
                    <div className="text-green-600 font-bold">5+</div>
                    <div className="text-xs text-green-500">Program</div>
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