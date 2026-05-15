import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Package, Plus, Minus, Trash2, Camera, ArrowRightLeft } from "lucide-react";
import { buscarPorCodigo, registrarMovimiento } from "@/lib/inventory-store";
import { toast } from "sonner";
import type { Producto } from "@/lib/types";

export const Route = createFileRoute("/escaner")({
  component: EscanerPage,
});

function EscanerPage() {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<string>("1"); // Usamos string para que el input sea fácil de editar
  const [isScanning, setIsScanning] = useState(false);
  const qrRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.stop();
        qrRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Error al detener cámara:", err);
      }
    }
  };

  const startScanner = async () => {
    setProducto(null); // Limpiamos producto previo
    try {
      const html5QrCode = new Html5Qrcode("reader");
      qrRef.current = html5QrCode;
      setIsScanning(true);

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          const p = await buscarPorCodigo(decodedText);
          if (p) {
            setProducto(p);
            toast.success(`Detectado: ${p.nombre}`);
            // ✅ DESACTIVACIÓN AUTOMÁTICA: Detenemos la cámara apenas lo encontramos
            await stopScanner(); 
          } else {
            toast.error("Producto no registrado en el inventario");
          }
        },
        () => {} 
      );
    } catch (err) {
      toast.error("No se pudo acceder a la cámara");
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleProcesar = async (tipo: 'entrada' | 'salida') => {
    const numCantidad = parseInt(cantidad);

    // ✅ VALIDACIÓN: No permitir 0 o negativos
    if (!numCantidad || numCantidad <= 0) {
      return toast.error("La cantidad debe ser mayor a 0");
    }

    if (!producto) return;
    
    if (tipo === 'salida' && producto.stock < numCantidad) {
      return toast.error(`Stock insuficiente. Solo quedan ${producto.stock} unidades.`);
    }

    const res = await registrarMovimiento({
      producto_id: producto.id,
      tipo,
      cantidad: numCantidad
    });

    if (res.success) {
      toast.success(tipo === 'entrada' ? "Stock repuesto" : "Venta registrada");
      setProducto(null);
      setCantidad("1");
      // Opcional: Reiniciar escáner tras la venta
      // startScanner(); 
    }
  };

  return (
    <Layout>
      <div className="px-4 py-8 max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-bold text-primary tracking-tight">Terminal de Movimientos</h1>
            <p className="text-muted-foreground italic">Operaciones rápidas - Licorería El Palacio</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">MySQL Local Activo</Badge>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LADO IZQUIERDO: EL ESCÁNER */}
          <div className="relative">
            <Card className="overflow-hidden border-0 bg-black aspect-square shadow-2xl flex items-center justify-center relative">
              <div id="reader" className="w-full h-full" />
              
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                  <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-dashed border-primary/50 mb-6">
                    <Camera className="size-10 text-primary" />
                  </div>
                  <Button onClick={startScanner} size="lg" className="rounded-full px-8 font-bold shadow-xl">
                    {producto ? "Escanear otra botella" : "Iniciar Escáner"}
                  </Button>
                </div>
              )}

              {isScanning && (
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-primary/60 shadow-[0_0_20px_rgba(var(--primary),0.8)] z-20 animate-scanner-line" />
              )}
            </Card>
          </div>

          {/* LADO DERECHO: ACCIONES Y CANTIDAD */}
          <div className="space-y-6">
            {producto ? (
              <Card className="border-2 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex justify-between">
                    <Badge variant="outline">{producto.categoria}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">REF: {producto.codigo_qr.slice(0,8)}...</span>
                  </div>
                  <CardTitle className="text-3xl font-display mt-2">{producto.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Stock Actual</p>
                      <p className="text-4xl font-display font-bold text-primary">{producto.stock}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Precio Unitario</p>
                      <p className="text-3xl font-display font-bold">Bs. {Number(producto.precio).toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                       <ArrowRightLeft className="size-4" /> Cantidad:
                    </label>
                    <Input 
                      type="number" 
                      value={cantidad} 
                      onChange={(e) => setCantidad(e.target.value)} // Permite borrar y escribir libremente
                      className="text-4xl h-20 text-center font-bold border-2 focus-visible:ring-primary bg-background shadow-inner"
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => handleProcesar('salida')}
                      variant="destructive" 
                      className="h-20 text-xl font-bold rounded-2xl shadow-lg transition-transform active:scale-95"
                    >
                      <Minus className="mr-2 size-8" /> VENTA
                    </Button>
                    <Button 
                      onClick={() => handleProcesar('entrada')}
                      className="bg-emerald-600 hover:bg-emerald-700 h-20 text-xl font-bold rounded-2xl shadow-lg transition-transform active:scale-95"
                    >
                      <Plus className="mr-2 size-8" /> ENTRADA
                    </Button>
                  </div>

                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={startScanner}>
                    <Trash2 className="size-4 mr-2" /> Cancelar escaneo actual
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full border-dashed border-2 border-muted flex flex-col items-center justify-center p-12 text-center bg-muted/5">
                <Package className="size-16 text-muted-foreground/20 mb-4" />
                <h3 className="font-bold text-xl text-muted-foreground/60">Listo para escanear</h3>
                <p className="text-sm text-muted-foreground/40 mt-2 max-w-[200px]">
                  Presiona el botón para encender la cámara y registrar un movimiento.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}