import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useInventory, eliminarProducto } from "@/lib/inventory-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, ScanLine, Pencil, Trash2,酒 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { NuevoProductoModal } from "@/components/NuevoProductoModal";
import type { Producto } from "@/lib/types";
import { toast } from "sonner";

const STOCK_BAJO_UMBRAL = 5;

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
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
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const { productos, loading, refresh } = useInventory();
  const [q, setQ] = useState("");

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
      setIsDeleting(Number(p.id));
      try {
        await eliminarProducto(Number(p.id));
        toast.success("Producto eliminado del inventario");
        refresh();
      } catch (error) {
        toast.error("No se pudo eliminar el producto");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <Layout>
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Gestión de Stock</p>
            <h1 className="font-display text-4xl mt-1 text-[#241312] font-bold">El Palacio</h1>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setModalAbierto(true)} className="bg-[#D9A05B] hover:bg-[#c48d4a] text-[#241312] font-bold shadow-lg rounded-xl">
              <ScanLine className="size-4 mr-2" />
              Nuevo Producto
            </Button>
            <Button variant="outline" onClick={refresh} disabled={loading} className="rounded-xl border-[#D9A05B]/20 text-[#D9A05B] hover:bg-[#D9A05B]/5">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {/* Resumen Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">Botellas Totales</p>
                  <h3 className="text-3xl font-black text-[#241312] mt-1">{totalProductos}</h3>
                </div>
                <div className="p-3 bg-[#D9A05B]/10 rounded-2xl">
                  <Boxes className="text-[#D9A05B] size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">Stock Crítico</p>
                  <h3 className="text-3xl font-black text-red-500 mt-1">{stockBajo.length}</h3>
                </div>
                <div className="p-3 bg-red-50 rounded-2xl">
                  <AlertTriangle className="text-red-500 size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-none shadow-xl bg-white rounded-[2rem]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-8 pb-4">
            <CardTitle className="font-display text-2xl text-[#241312] font-bold">Catálogo de Licores</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Buscar licores o códigos..." 
                className="pl-10 h-12 rounded-2xl border-[#D9A05B]/10 focus:ring-[#D9A05B]" 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#fcfaf8] border-b border-[#D9A05B]/5">
                    <TableHead className="font-bold text-[#241312] px-8">Producto</TableHead>
                    <TableHead className="font-bold text-[#241312]">Categoría</TableHead>
                    <TableHead className="font-bold text-[#241312]">QR / Barra</TableHead>
                    <TableHead className="text-right font-bold text-[#241312]">Stock</TableHead>
                    <TableHead className="text-right font-bold text-[#241312]">Precio</TableHead>
                    <TableHead className="text-center font-bold text-[#241312] px-8">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium">Sincronizando con el Palacio...</TableCell></TableRow>
                  ) : filtrados.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No se encontraron productos en la cava.</TableCell></TableRow>
                  ) : filtrados.map((p) => (
                    <TableRow key={p.id} className="hover:bg-[#fcfaf8]/50 transition-colors">
                      <TableCell className="font-bold text-[#241312] px-8 py-5">{p.nombre}</TableCell>
                      <TableCell><Badge className="bg-[#D9A05B]/10 text-[#D9A05B] border-none px-3 py-1 rounded-lg uppercase text-[10px] font-black tracking-widest">{p.categoria}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.codigo_qr}</TableCell>
                      <TableCell className="text-right font-black">
                        <span className={p.stock <= STOCK_BAJO_UMBRAL ? "text-red-500 bg-red-50 px-3 py-1 rounded-lg" : "text-[#241312]"}>
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-[#241312]">Bs. {Number(p.precio).toFixed(2)}</TableCell>
                      <TableCell className="text-center px-8">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)} className="size-10 text-[#D9A05B] hover:bg-[#D9A05B]/10 rounded-xl">
                            <Pencil className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEliminar(p)} 
                            className="size-10 text-red-400 hover:bg-red-50 rounded-xl"
                            disabled={isDeleting === Number(p.id)}
                          >
                            {isDeleting === Number(p.id) ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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