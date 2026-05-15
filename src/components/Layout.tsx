import type { ReactNode } from "react";
// Aquí estaba el error: eliminamos "MobileNav"
import { Sidebar } from "./Sidebar"; 
import { Toaster } from "@/components/ui/sonner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Solo usamos el Sidebar original */}
      <Sidebar /> 
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}