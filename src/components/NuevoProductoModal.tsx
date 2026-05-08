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
      await qrScannerRef.current.stop();
      qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
    setEscaneando(false);
  };

  useEffect(() => {
    if (!isOpen) detenerCamaraGlobal();
    return () => { detenerCamaraGlobal(); };
  }, [isOpen]);

  if (!isOpen) return null;

  const iniciarEscaneo = async () => {
    setEscaneando(true);
    const html5QrCode = new Html5Qrcode("lector-modal");
    qrScannerRef.current = html5QrCode;
    try {
      // CONFIGURACIÓN DE CÁMARA POTENCIADA
      const configCamara = {
        facingMode: "environment", // Usar cámara trasera
        video: {
          width: { ideal: 1920 },  // Solicitar Full HD 1080p
          height: { ideal: 1080 },
          frameRate: { ideal: 30 } // 30 cuadros por segundo para fluidez
        }
      };

      // CONFIGURACIÓN DEL ESCÁNER LIBRE (SIN MARCO)
      const configEscaner = { 
        fps: 20, // Aumentamos la frecuencia de análisis por segundo
        // REMOVIDO qrbox AQUÍ -> Escanea toda la pantalla
      };

      await html5QrCode.start(
        configCamara, // Pasamos la nueva configuración de calidad
        configEscaner, // Pasamos la configuración libre
        (decodedText) => {
          setCodigo(decodedText);
          detenerCamaraGlobal();
          toast.success("Código capturado");
        },
        () => {} // Ignorar errores de escaneo fallido por frame
      );
    } catch (err) {
      console.error("Error al iniciar cámara:", err);
      setEscaneando(false);
      toast.error("No se pudo acceder a la cámara o no soporta HD");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !codigo || !precio) return toast.error("Faltan datos");

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border-none overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/40">
          <h2 className="text-xl font-display font-bold text-primary">
            {productoAEditar ? `Editar: ${productoAEditar.nombre}` : "Registrar Nuevo Licor"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5" />
          </Button>
        </div>
        
        <CardContent className="p-0"> {/* Eliminamos padding para que la cámara llegue al borde */}
          <form onSubmit={handleSubmit} className="space-y-0">
            
            {/* LECTOR QR HD, LIBRE Y COMPLETO */}
            <div className="relative bg-black aspect-[4/3] shadow-inner flex items-center justify-center group overflow-hidden">
              {/* Contenedor del video - Ahora sin marcos visuales */}
              <div id="lector-modal" className="w-full h-full object-cover" />
              
              {!escaneando && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] z-10 p-6">
                  <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-dashed border-primary/30 mb-6 animate-pulse">
                      <Camera className="size-10 text-primary" />
                  </div>
                  <Button 
                    type="button" 
                    onClick={iniciarEscaneo}
                    size="lg"
                    className="rounded-full shadow-2xl scale-110 hover:scale-115 transition-transform bg-primary font-bold px-8"
                  >
                    {codigo ? "Cambiar Código" : "Escanear Producto"}
                  </Button>
                  {codigo && (
                    <div className="mt-6 bg-background/80 px-4 py-2 rounded-full border border-border/50 shadow-md">
                        <p className="text-sm font-mono text-center text-foreground">
                        Actual: {codigo}
                        </p>
                    </div>
                  )}
                </div>
              )}

              {escaneando && (
                <>
                    {/* Botón de cierre elegante sobre la cámara */}
                    <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4 z-20 rounded-full size-10 shadow-xl opacity-80 hover:opacity-100"
                    onClick={detenerCamaraGlobal}
                    >
                    <X className="size-5" />
                    </Button>
                    
                    {/* Indicador visual minimalista de escaneo libre (opcional, una línea central) */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary/40 shadow-[0_0_15px_3px_rgba(var(--primary-rgb),0.3)] animate-scan-line z-10"/>
                </>
              )}
            </div>

            {/* Formulario con espaciado ajustado */}
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Nombre del Producto</label>
                    <Input 
                    placeholder="Ej. Whisky Johnnie Walker Blue Label"
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Código</label>
                    <Input 
                    className="font-mono bg-muted/40" 
                    value={codigo} 
                    onChange={e => setCodigo(e.target.value)} 
                    placeholder="Manual o QR"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Categoría</label>
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

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Precio (Bs.)</label>
                    <Input 
                    type="number" 
                    step="0.1" 
                    value={precio} 
                    onChange={e => setPrecio(e.target.value)} 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Stock Inicial</label>
                    <Input 
                    type="number" 
                    value={stock} 
                    onChange={e => setStock(e.target.value)} 
                    />
                </div>
                </div>

                <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold text-lg" disabled={cargando}>
                    {cargando ? (
                    <RefreshCcw className="size-5 mr-2 animate-spin" />
                    ) : (
                    <Save className="size-5 mr-2" />
                    )}
                    {cargando ? "Guardando..." : (productoAEditar ? "Actualizar" : "Guardar Producto")}
                </Button>
                </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}