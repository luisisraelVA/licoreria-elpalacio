import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";

export const Route = createFileRoute("/historial")({
  component: HistorialPage,
});

function HistorialPage() {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/historial")
      .then(res => res.json())
      .then(data => setMovimientos(data))
      .catch(err => console.error("Error cargando historial", err));
  }, []);

  return (
    <Layout>
      <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
            <History className="size-8" /> Historial de Movimientos
          </h1>
          <p className="text-muted-foreground mt-1">Registro de todas las botellas escaneadas y vendidas</p>
        </header>

        <Card className="border-none shadow-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Operación</th>
                  <th className="px-6 py-4 text-center">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No hay movimientos registrados aún.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m: any) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        {new Date(m.fecha_hora).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">{m.nombre}</td>
                      <td className="px-6 py-4">
                        {m.tipo === 'salida' ? (
                          <Badge variant="destructive" className="gap-1 px-2 py-1">
                            <ArrowUpRight className="size-3" /> Venta
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 px-2 py-1 text-white">
                            <ArrowDownLeft className="size-3" /> Entrada
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-lg">{m.cantidad}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}