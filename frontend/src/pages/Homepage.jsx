import React from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Programs from '../components/Programs'
import BeritaList from '../components/Berita'
import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'

const Homepage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Programs />
      <BeritaList/>
      <Testimonials />
      <Footer />
    </div>
  )
}

export default Homepage