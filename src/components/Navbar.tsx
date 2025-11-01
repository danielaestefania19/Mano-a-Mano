import React from 'react'
import { Link } from 'react-router-dom'

const Navbar: React.FC = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold text-gray-800">Mano a Mano </h1>
      </div>
      <div className="hidden md:flex space-x-6">
        <Link to="/" className="text-gray-700 hover:text-black transition">Inicio</Link>
        <Link to="/about" className="text-gray-700 hover:text-black transition">Acerca</Link>
        <Link to="/contact" className="text-gray-700 hover:text-black transition">Contacto</Link>
      </div>
      <div className="flex items-center">
        <appkit-button />
      </div>
    </nav>
  )
}

export default Navbar
