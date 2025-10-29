import React, { useState, useEffect } from 'react'

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/api/testimoni?limit=6`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response')
      }

      const data = await response.json()
      
      // Filter hanya testimoni dengan status 'show' dan memiliki wali data
      const filteredTestimonials = data.data?.filter(
        testimoni => testimoni.status === 'show' && testimoni.wali
      ) || []
      
      setTestimonials(filteredTestimonials)

    } catch (err) {
      console.error('Error fetching testimonials:', err)
      setError('Gagal memuat testimoni')
      setTestimonials([])
    } finally {
      setLoading(false)
    }
  }

  // Generate avatar berdasarkan nama
  const getAvatar = (nama) => {
    if (!nama) return '👨'
    return nama.charAt(0).toUpperCase()
  }

  // Render rating stars
  const renderStars = (rating) => {
    return (
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return ''
    }
  }

  // Carousel functions
  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev === Math.ceil(testimonials.length / 3) - 1 ? 0 : prev + 1
    )
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? Math.ceil(testimonials.length / 3) - 1 : prev - 1
    )
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  // Auto slide
  useEffect(() => {
    if (testimonials.length > 3) {
      const interval = setInterval(() => {
        nextSlide()
      }, 5000) // Ganti slide setiap 5 detik

      return () => clearInterval(interval)
    }
  }, [testimonials.length, currentSlide])

  // Get testimonials for current slide
  const getCurrentTestimonials = () => {
    const startIndex = currentSlide * 3
    return testimonials.slice(startIndex, startIndex + 3)
  }

  const totalSlides = Math.ceil(testimonials.length / 3)

  if (loading) {
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
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-green-50 rounded-xl p-6 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-200 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-green-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-green-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-green-200 rounded"></div>
                  <div className="h-3 bg-green-200 rounded w-5/6"></div>
                  <div className="h-3 bg-green-200 rounded w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

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

        {error ? (
          <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">Belum Ada Komentar</h3>
          <p className="text-green-600 mb-4">
            Belum ada testimoni dari orang tua. Jadilah yang pertama untuk berbagi pengalaman!
          </p>
        </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Belum Ada Komentar</h3>
            <p className="text-green-600 mb-4">
              Belum ada testimoni dari orang tua. Jadilah yang pertama untuk berbagi pengalaman!
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                      {testimonials
                        .slice(slideIndex * 3, slideIndex * 3 + 3)
                        .map((testimoni) => (
                          <div 
                            key={testimoni.id_testimoni} 
                            className="bg-green-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-green-200"
                          >
                            {/* Rating */}
                            {renderStars(testimoni.rating)}

                            {/* Komentar */}
                            <p className="text-green-700 italic mb-4 leading-relaxed line-clamp-4">
                              "{testimoni.komentar}"
                            </p>

                            {/* Info Wali */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                  {getAvatar(testimoni.wali?.nama_lengkap)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-green-800 text-sm">
                                    {testimoni.wali?.nama_lengkap || 'Orang Tua Santri'}
                                  </h4>
                                  <p className="text-green-600 text-xs">Orang Tua Santri</p>
                                </div>
                              </div>
                              
                              {/* Tanggal */}
                              {testimoni.dibuat_pada && (
                                <div className="text-right">
                                  <p className="text-green-500 text-xs">
                                    {formatDate(testimoni.dibuat_pada)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - hanya tampil jika lebih dari 3 testimoni */}
            {testimonials.length > 3 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white hover:bg-green-50 text-green-600 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                  aria-label="Testimoni sebelumnya"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white hover:bg-green-50 text-green-600 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                  aria-label="Testimoni berikutnya"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Dots Indicator - hanya tampil jika lebih dari 3 testimoni */}
            {testimonials.length > 3 && totalSlides > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-green-600 scale-125' 
                        : 'bg-green-300 hover:bg-green-400'
                    }`}
                    aria-label={`Pergi ke slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Mobile Navigation Dots */}
            {testimonials.length > 3 && totalSlides > 1 && (
              <div className="flex justify-center mt-6 space-x-3 md:hidden">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-8 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-green-600' 
                        : 'bg-green-300 hover:bg-green-400'
                    }`}
                    aria-label={`Pergi ke slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default Testimonials