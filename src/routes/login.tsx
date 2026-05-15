import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
     const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // 🔥 GUARDAMOS LA SESIÓN EN EL NAVEGADOR
        localStorage.setItem("palacio_sesion", "activa"); 
        
        toast.success("¡Bienvenido a El Palacio!");
        navigate({ to: "/", replace: true });
      } else {
        toast.error(data.error || "Credenciales incorrectas");
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor MySQL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Wine className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">Licorería El Palacio</CardTitle>
          <CardDescription>Ingresa tus credenciales para gestionar el inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electrónico</label>
              <Input 
                type="email" 
                placeholder="admin@elpalacio.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input 
                type="password" 
                placeholder="admin123"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}