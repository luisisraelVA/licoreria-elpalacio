import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, QrCode, History, Wine, LogOut } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/escaner", icon: QrCode, label: "Terminal de Escaneo" },
  { to: "/historial", icon: History, label: "Historial" }
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("palacio_sesion"); 
    navigate({ to: "/login", replace: true }); 
  };

  return (
    <aside className="w-64 min-h-screen bg-[#241312] text-white hidden md:flex flex-col justify-between border-r border-white/5">
      <div>
        {/* LOGO */}
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#D9A05B] p-2 rounded-lg shadow-lg">
            <Wine className="size-6 text-[#241312]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white tracking-tight">El Palacio</h2>
            <p className="text-xs text-white/60">Licorería · Inventario</p>
          </div>
        </div>

        {/* NAVEGACIÓN */}
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

      {/* BOTÓN SALIR */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}