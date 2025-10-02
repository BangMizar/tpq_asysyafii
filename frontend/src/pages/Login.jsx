import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  // Config untuk API
  const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  }

  // Load saved credentials on component mount
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('rememberedIdentifier')
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'
    
    if (savedIdentifier && savedRememberMe) {
      setFormData(prev => ({
        ...prev,
        identifier: savedIdentifier
      }))
      setRememberMe(true)
    }
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked)
    
    // If unchecked, remove saved credentials
    if (!e.target.checked) {
      localStorage.removeItem('rememberedIdentifier')
      localStorage.removeItem('rememberMe')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Mengirim request login...')

      const identifier = formData.identifier.trim()
      
      // Prepare request body based on identifier type
      let requestBody = {
        password: formData.password
      }

      // Check if identifier is email
      if (identifier.includes('@')) {
        requestBody.email = identifier
        requestBody.nama_lengkap = ""
        requestBody.no_telp = ""
      } 
      // Check if identifier is phone number (contains only numbers and +)
      else if (/^[\d+]+$/.test(identifier)) {
        requestBody.email = null
        requestBody.nama_lengkap = ""
        requestBody.no_telp = identifier
      } 
      // Otherwise treat as nama_lengkap
      else {
        requestBody.email = null
        requestBody.nama_lengkap = identifier
        requestBody.no_telp = ""
      }

      const response = await fetch(`${API_CONFIG.baseURL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Terjadi kesalahan server' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Login successful
      console.log('Login berhasil:', data)
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedIdentifier', identifier)
        localStorage.setItem('rememberMe', 'true')
      }
      
      // Save to context
      login(data.user, data.token)
      
      // Redirect based on role
      switch (data.user.role) {
        case 'super_admin':
          navigate('/super-admin')
          break
        case 'admin':
          navigate('/admin')
          break
        case 'wali':
          navigate('/wali')
          break
        default:
          navigate('/dashboard')
      }
      
    } catch (err) {
      console.error('Login error details:', err)
      setError(err.message || 'Terjadi kesalahan saat login. Periksa koneksi Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800">TPQ Asy-Syafi'i</h2>
              <p className="text-sm text-green-600">Campakoah</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-green-800">Masuk ke Akun</h2>
          <p className="mt-2 text-sm text-green-600">
            Atau{' '}
            <Link to="/" className="font-medium text-green-600 hover:text-green-500">
              kembali ke beranda
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-green-700 mb-1">
                Email, Username, atau No. Telepon
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-green-300 placeholder-green-400 text-green-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Masukkan email, nama lengkap, atau no. telepon"
                value={formData.identifier}
                onChange={handleChange}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-green-600">
                Anda bisa login menggunakan email, nama lengkap, atau nomor telepon
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-green-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-green-300 placeholder-green-400 text-green-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600 hover:text-green-800"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300 rounded"
                disabled={loading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-green-700">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-green-600 hover:text-green-500">
                Lupa password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ${
                loading 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </div>
              ) : (
                'Masuk'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-green-600">
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                Daftar di sini
              </Link>
            </p>
          </div>
        </form>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-green-500">
            Untuk akses orang tua/wali santri TPQ Asy-Syafi'i Campakoah
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login