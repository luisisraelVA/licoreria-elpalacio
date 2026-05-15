import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, QrCode, History, Wine, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/escaner", icon: QrCode, label: "Terminal de Escaneo" },
  { to: "/historial", icon: History, label: "Historial" }
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleCerrarSesion = () => {
    localStorage.removeItem("palacio_sesion"); // Borramos la llave
    navigate({ to: "/login", replace: true }); // Lo mandamos al login
  };

  return (
    <div className="w-64 min-h-screen bg-[#241312] text-white hidden md:flex flex-col justify-between">
      {/* SECCIÓN ARRIBA: Logo y Menú */}
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#D9A05B] p-2 rounded-lg shadow-lg">
            <Wine className="size-6 text-[#241312]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white tracking-tight">El Palacio</h2>
            <p className="text-xs text-white/60">Licorería · Inventario</p>
          </div>
        </div>

        <nav className="px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.to}
              to={item.to} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all [&.active]:bg-white/10 [&.active]:text-[#D9A05B] font-medium"
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* SECCIÓN ABAJO: Botón de Cerrar Sesión */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleCerrarSesion}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold"
        >
          <LogOut className="size-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

// 2. EL MENÚ PARA CELULARES (Mobile) - ¡El que faltaba!
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden flex flex-col w-full relative z-50">
      {/* Barra superior en celular */}
      <div className="flex items-center justify-between bg-[#241312] p-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-[#D9A05B] p-1.5 rounded-md">
            <Wine className="size-5 text-[#241312]" />
          </div>
          <span className="font-display font-bold text-lg">El Palacio</span>
        </div>
        
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Menú desplegable */}
      {isOpen && (
        <nav className="absolute top-full left-0 right-0 bg-[#241312] border-t border-white/10 p-4 flex flex-col gap-2 shadow-2xl animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <Link 
              key={item.to}
              to={item.to} 
              onClick={() => setIsOpen(false)} // Cierra el menú al hacer clic
              className="flex items-center gap-3 px-4 py-4 rounded-xl text-white/80 hover:bg-white/5 transition-colors [&.active]:bg-white/10 [&.active]:text-[#D9A05B]"
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}