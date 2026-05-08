import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Save, RefreshCcw } from "lucide-react";
import { agregarProducto, actualizarProducto } from "@/lib/inventory-store";
import { toast } from "sonner";
import type { Categoria, Producto } from "@/lib/types";

export function NuevoProductoModal({ 
  isOpen, 
  onClose, 
  onRefresh, 
  productoAEditar 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onRefresh: () => void,
  productoAEditar?: Producto | null 
}) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Otros");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("0");
  const [codigo, setCodigo] = useState("");
  
  const [escaneando, setEscaneando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Llenar datos si es edición
  useEffect(() => {
    if (productoAEditar) {
      setNombre(productoAEditar.nombre);
      setCategoria(productoAEditar.categoria);
      setPrecio(productoAEditar.precio.toString());
      setStock(productoAEditar.stock.toString());
      setCodigo(productoAEditar.codigo_qr);
    } else {
      setNombre("");
      setCategoria("Otros");
      setPrecio("");
      setStock("0");
      setCodigo("");
    }
  }, [productoAEditar, isOpen]);

  const detenerCamaraGlobal = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (err) {
        console.error("Error al detener la cámara:", err);
      }
      qrScannerRef.current = null;
    }
    setEscaneando(false);
  };

  useEffect(() => {
    if (!isOpen) detenerCamaraGlobal();
    return () => { detenerCamaraGlobal(); };
  }, [isOpen]);

  const iniciarEscaneo = async () => {
    setEscaneando(true);
    
    // Pequeño delay para asegurar que el DOM del lector esté listo
    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("lector-modal");
      qrScannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Cámara trasera
          { 
            fps: 20, 
            // Eliminamos qrbox para que el escaneo sea LIBRE en toda la pantalla
          },
          (decodedText) => {
            setCodigo(decodedText);
            detenerCamaraGlobal();
            toast.success("Código capturado con éxito");
          },
          () => {
            // Escaneo en curso (no detectado aún)
          }
        );
      } catch (err) {
        console.error("Error al iniciar cámara:", err);
        setEscaneando(false);
        toast.error("No se pudo abrir la cámara", {
          description: "Revisa los permisos o asegúrate de usar HTTPS."
        });
      }
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !codigo || !precio) return toast.error("Por favor llena todos los campos");

    setCargando(true);
    const datos = {
      nombre,
      categoria,
      codigo_qr: codigo,
      precio: parseFloat(precio),
      stock: parseInt(stock)
    };

    let res;
    if (productoAEditar) {
      res = await actualizarProducto(productoAEditar.id, datos);
    } else {
      res = await agregarProducto(datos);
    }

    if (res.success) {
      onRefresh();
      onClose();
    }
    setCargando(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/40">
          <h2 className="text-xl font-display font-bold text-primary">
            {productoAEditar ? `Editar: ${productoAEditar.nombre}` : "Nuevo Producto"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5" />
          </Button>
        </div>
        
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            
            {/* ÁREA DEL LECTOR - FULL WIDTH Y SIN MARCOS */}
            <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
              <div id="lector-modal" className="w-full h-full object-cover" />
              
              {!escaneando && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                  <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-dashed border-primary/50 mb-4">
                    <Camera className="size-8 text-primary" />
                  </div>
                  <Button 
                    type="button" 
                    onClick={iniciarEscaneo}
                    size="lg"
                    className="rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
                  >
                    {codigo ? "Escanear de Nuevo" : "Escanear Código"}
                  </Button>
                  {codigo && (
                    <p className="mt-3 text-xs font-mono text-white/70 bg-black/40 px-3 py-1 rounded">
                      Capturado: {codigo}
                    </p>
                  )}
                </div>
              )}

              {escaneando && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4 z-20 rounded-full size-10 shadow-lg opacity-80"
                    onClick={detenerCamaraGlobal}
                  >
                    <X className="size-5" />
                  </Button>
                  {/* Animación de línea de escaneo */}
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary/60 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-pulse z-10" />
                </>
              )}
            </div>

            {/* Campos del Formulario */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Nombre</label>
                  <Input 
                    placeholder="Nombre del licor" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Código QR/Barra</label>
                  <Input 
                    className="font-mono bg-muted/30" 
                    value={codigo} 
                    onChange={e => setCodigo(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Categoría</label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none" 
                    value={categoria} 
                    onChange={e => setCategoria(e.target.value as Categoria)}
                  >
                    <option value="Whisky">Whisky</option>
                    <option value="Vino">Vino</option>
                    <option value="Cerveza">Cerveza</option>
                    <option value="Singani">Singani</option>
                    <option value="Ron">Ron</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Precio (Bs.)</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={precio} 
                    onChange={e => setPrecio(e.target.value)} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Stock</label>
                  <Input 
                    type="number" 
                    value={stock} 
                    onChange={e => setStock(e.target.value)} 
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 font-bold" disabled={cargando}>
                  {cargando ? (
                    <RefreshCcw className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-2" />
                  )}
                  {cargando ? "Guardando..." : (productoAEditar ? "Actualizar" : "Guardar")}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}