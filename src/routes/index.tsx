import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useInventory, eliminarProducto } from "@/lib/inventory-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Boxes, TrendingUp, QrCode, Search, RefreshCw, ScanLine, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { NuevoProductoModal } from "@/components/NuevoProductoModal";
import type { Producto } from "@/lib/types";

const STOCK_BAJO_UMBRAL = 5;

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  // Nuevo estado para saber qué producto estamos editando
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  
  const { productos, movimientos, loading, refresh } = useInventory();
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate({ to: "/login", replace: true });
    });
  }, [navigate]);

  const totalProductos = useMemo(() => productos.reduce((a, p) => a + p.stock, 0), [productos]);
  const stockBajo = useMemo(() => productos.filter((p) => p.stock <= STOCK_BAJO_UMBRAL), [productos]);
  const movimientosHoy = useMemo(() => {
    const hoy = new Date().toDateString();
    return movimientos.filter((m) => new Date(m.fecha_hora).toDateString() === hoy);
  }, [movimientos]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term) ||
        p.codigo_qr.toLowerCase().includes(term)
    );
  }, [productos, q]);

  const abrirEditar = (p: Producto) => {
    setProductoAEditar(p);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoAEditar(null); // Limpiamos el producto al cerrar
  };

  const handleEliminar = async (p: Producto) => {
    if (confirm(`¿Estás seguro de eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) {
      await eliminarProducto(p.id);
      refresh();
    }
  };

  return (
    <Layout>
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Panel administrativo</p>
            <h1 className="font-display text-3xl md:text-4xl mt-1">Dashboard de Inventario</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalAbierto(true)} className="bg-primary shadow-md">
              <ScanLine className="size-4 mr-2" />
              Nuevo Producto
            </Button>
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {/* ... (Sección de StatCards igual que antes) ... */}

        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="font-display text-xl">Catálogo de licores</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Código QR</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Precio (Bs.)</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10">Cargando...</TableCell></TableRow>
                  ) : filtrados.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell><Badge variant="secondary">{p.categoria}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo_qr}</TableCell>
                      <TableCell className="text-right font-semibold">{p.stock}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.precio.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)} className="size-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEliminar(p)} className="size-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <NuevoProductoModal 
          isOpen={modalAbierto} 
          onClose={cerrarModal} 
          onRefresh={refresh}
          productoAEditar={productoAEditar} // Pasamos el producto si existe
        />
      </div>
    </Layout>
  );
}

// ... (StatCard igual)