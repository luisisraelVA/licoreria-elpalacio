import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar"; 
import { Toaster } from "@/components/ui/sonner";

interface LayoutProps {
  children: ReactNode;
}

// Cambiamos "export default" por solo "export"
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-[#fcfaf8]">
      <Sidebar /> 
      <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-all">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}