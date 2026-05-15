import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useInventory, eliminarProducto } from "@/lib/inventory-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Boxes, TrendingUp, Search, RefreshCw, ScanLine, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react"; // Quitamos useEffect por ahora
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { NuevoProductoModal } from "@/components/NuevoProductoModal";
import type { Producto } from "@/lib/types";

const STOCK_BAJO_UMBRAL = 5;

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // 1. Verificamos que ya estamos en el navegador (evita el error de Node.js)
    if (typeof window !== "undefined") {
      // 2. Ahora sí, leemos la sesión de forma segura
      if (!localStorage.getItem("palacio_sesion")) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  
  // Ahora useInventory trae los datos desde MySQL via Bun
  const { productos, loading, refresh } = useInventory();
  const [q, setQ] = useState("");

  // COMENTAMOS O ELIMINAMOS EL CHEQUEO DE SUPABASE
  /* useEffect(() => {
    // Aquí pondremos el login de MySQL más adelante
  }, [navigate]); 
  */

  const totalProductos = useMemo(() => productos.reduce((a, p) => a + p.stock, 0), [productos]);
  const stockBajo = useMemo(() => productos.filter((p) => p.stock <= STOCK_BAJO_UMBRAL), [productos]);

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
    setProductoAEditar(null);
  };

const handleEliminar = async (p: Producto) => {
  if (confirm(`¿Estás seguro de eliminar "${p.nombre}"?`)) {
    await eliminarProducto(Number(p.id)); // <-- Agrega Number() aquí
    refresh();
  }
};

  return (
    <Layout>
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Panel administrativo de El Palacio</p>
            <h1 className="font-display text-3xl md:text-4xl mt-1 text-primary">Inventario MySQL</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalAbierto(true)} className="shadow-md">
              <ScanLine className="size-4 mr-2" />
              Nuevo Producto
            </Button>
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {/* ... (Sección de StatCards) ... */}

        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="font-display text-xl text-primary">Catálogo de Licores</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o QR..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Precio (Bs.)</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10">Conectando con MySQL...</TableCell></TableRow>
                  ) : filtrados.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No hay productos registrados.</TableCell></TableRow>
                  ) : filtrados.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell><Badge variant="secondary">{p.categoria}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo_qr}</TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={p.stock <= STOCK_BAJO_UMBRAL ? "text-destructive" : ""}>
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{Number(p.precio).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)} className="size-8 text-blue-500">
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEliminar(p)} className="size-8 text-destructive">
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
          productoAEditar={productoAEditar} 
        />
      </div>
    </Layout>
  );
}