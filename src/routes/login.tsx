import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Wine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // Si el usuario ya inició sesión antes, lo enviamos directo al dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/" });
    });
  }, [navigate]);

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    toast.loading("Verificando credenciales...", { id: "login" });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Acceso denegado", { 
        id: "login", 
        description: "Correo o contraseña incorrectos." 
      });
      setCargando(false);
    } else {
      toast.success("¡Bienvenido a El Palacio!", { id: "login" });
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto bg-primary/10 size-16 rounded-full flex items-center justify-center mb-4">
            <Wine className="size-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Licorería El Palacio</h1>
          <p className="text-muted-foreground mt-2">Sistema de Control de Inventario</p>
        </div>

        <Card className="border-border/60 shadow-[var(--shadow-elegant)]">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lock className="size-5 text-muted-foreground" />
              Acceso Restringido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={iniciarSesion} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo electrónico</label>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={cargando}>
                {cargando ? "Entrando..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}