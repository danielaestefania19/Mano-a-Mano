import React from "react";
import { CheckSquare } from "lucide-react";
import { NavLink } from "react-router-dom";
import Logo from "../assets/Logo.png";

const Sidebar: React.FC = () => {
  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-primary text-white p-6 shadow-lg">
      <div>
        <div className="flex items-center justify-between mb-8">
          <img src={Logo} alt="Logo" className="w-12 h-12" />
          <span className="text-lg font-semibold mr-8">Mano a mano</span>
        </div>

        <nav className="flex flex-col space-y-4">
          <NavLink
            to="/circles"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-2 py-2 rounded-lg transition-all ${
                isActive
                  ? "bg-white text-primary font-semibold shadow-sm"
                  : "hover:text-gray-200"
              }`
            }
          >
            <CheckSquare size={20} />
            <span className="text-base">Mis tandas</span>
          </NavLink>
        </nav>
      </div>
      
    </aside>
  );
};

export default Sidebar;
