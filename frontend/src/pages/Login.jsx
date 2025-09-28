import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle login logic here
    console.log('Login data:', formData)
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
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-green-700 mb-1">
                Email atau Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-green-300 placeholder-green-400 text-green-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Masukkan email atau username"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-green-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-green-300 placeholder-green-400 text-green-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300 rounded"
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300"
            >
              Masuk
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-green-600">
              Belum punya akun?{' '}
              <a href="#" className="font-medium text-green-600 hover:text-green-500">
                Daftar di sini
              </a>
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