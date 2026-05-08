import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ScanLine, Wine, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/escaner", label: "Terminal de Escaneo", icon: ScanLine },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
            <Wine className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg leading-tight">El Palacio</p>
            <p className="text-xs text-sidebar-foreground/60">Licorería · Inventario</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      
      {/* Botón de Cerrar Sesión (Escritorio) */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border grid grid-cols-3">
      {links.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 py-3 text-xs ${
              active ? "text-sidebar-primary" : "text-sidebar-foreground/70"
            }`}
          >
            <Icon className="size-5" />
            <span className="truncate w-full text-center px-1">{label}</span>
          </Link>
        );
      })}
      
      {/* Botón de Cerrar Sesión (Móvil) */}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-sidebar-foreground/70 hover:text-destructive"
      >
        <LogOut className="size-5" />
        Salir
      </button>
    </nav>
  );
}