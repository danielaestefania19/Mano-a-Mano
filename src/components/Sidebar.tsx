import React, { useState } from 'react'
import { CheckSquare, PlusSquare, Zap } from 'lucide-react'
import Logo from '../assets/Logo.png'
import NewTandaModal from './NewTandaModal'

const Sidebar: React.FC = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <aside className="flex flex-col justify-between h-screen w-64 bg-primary text-white p-6 shadow-lg">
        <div>
          <div className="flex items-center justify-between mb-8">
            <img
              src={Logo}
              alt="Logo"
              className="w-6 h-6"
            />
            <span className="text-white text-lg font-medium">›</span>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <Zap size={18} />
            <span className="text-lg font-semibold">Tandas activas...</span>
          </div>

          <nav className="flex flex-col space-y-4">
            <button className="flex items-center space-x-2 hover:text-gray-100 transition">
              <CheckSquare size={20} />
              <span className="text-base">Mis tandas</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 hover:text-gray-100 transition"
            >
              <PlusSquare size={20} />
              <span className="text-base">Nueva tanda</span>
            </button>
          </nav>
        </div>
        <div className="mt-auto">
          <appkit-button />
        </div>
      </aside>
      <NewTandaModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default Sidebar
