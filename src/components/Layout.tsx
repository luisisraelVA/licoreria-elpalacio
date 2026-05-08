import type { ReactNode } from "react";
import { MobileNav, Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
