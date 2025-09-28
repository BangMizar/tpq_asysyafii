import React from 'react'

const Footer = () => {
  return (
    <footer id="kontak" className="bg-green-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">ت</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">TPQ Asy-Syafi'i</h2>
                <p className="text-green-200">Campakoah</p>
              </div>
            </div>
            <p className="text-green-200 mb-4 max-w-md">
              Membentuk generasi Qurani yang berakhlak mulia sesuai manhaj Ahlus Sunnah wal Jama'ah 
              melalui pendidikan agama Islam yang berkualitas dan menyenangkan.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-xs">f</span>
              </div>
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-xs">📱</span>
              </div>
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-xs">📸</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontak Kami</h3>
            <div className="space-y-2 text-green-200">
              <p>📞 +62 812-3456-7890</p>
              <p>📧 info@tpqasyasyafii.sch.id</p>
              <p>📍 Jl. Pendidikan No. 123, Campakoah</p>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Jam Belajar</h3>
            <div className="space-y-2 text-green-200">
              <p>Senin - Kamis: 15.00 - 17.00</p>
              <p>Jum'at: 14.00 - 16.00</p>
              <p>Sabtu: 08.00 - 11.00</p>
              <p>Minggu: Libur</p>
            </div>
          </div>
        </div>

        <div className="border-t border-green-700 mt-8 pt-8 text-center text-green-200">
          <p>&copy; 2024 TPQ Asy-Syafi'i Campakoah. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer