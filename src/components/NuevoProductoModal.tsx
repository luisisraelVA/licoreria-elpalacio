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
      await html5QrCode.start(
        { facingMode: "environment" },
        { 
          fps: 15, 
          qrbox: (width, height) => ({ width: width * 0.7, height: height * 0.7 }) 
        },
        (decodedText) => {
          setCodigo(decodedText);
          detenerCamaraGlobal();
          toast.success("Código capturado");
        },
        () => {}
      );
    } catch (err) {
      setEscaneando(false);
      toast.error("No se pudo acceder a la cámara");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border-none">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-xl font-display font-bold text-primary">
            {productoAEditar ? `Editar: ${productoAEditar.nombre}` : "Registrar Nuevo Licor"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5" />
          </Button>
        </div>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* LECTOR QR GRANDE Y PROFESIONAL */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-inner flex items-center justify-center group">
              <div id="lector-modal" className="w-full h-full" />
              
              {!escaneando && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 backdrop-blur-[2px]">
                  <Button 
                    type="button" 
                    onClick={iniciarEscaneo}
                    size="lg"
                    className="rounded-full shadow-lg scale-110 hover:scale-115 transition-transform"
                  >
                    <Camera className="size-5 mr-2" />
                    {codigo ? "Cambiar Código" : "Escanear QR / Barra"}
                  </Button>
                  {codigo && (
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                      Código actual: {codigo}
                    </p>
                  )}
                </div>
              )}

              {escaneando && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 z-20 rounded-full size-10 shadow-lg"
                  onClick={detenerCamaraGlobal}
                >
                  <X className="size-5" />
                </Button>
              )}
            </div>

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
                  className="font-mono bg-muted/30" 
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
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold" disabled={cargando}>
                {cargando ? (
                  <RefreshCcw className="size-4 mr-2 animate-spin" />
                ) : (
                  <Save className="size-4 mr-2" />
                )}
                {cargando ? "Guardando..." : (productoAEditar ? "Actualizar" : "Guardar Producto")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}