import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Save } from "lucide-react";
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

  // EFECTO: Si recibimos un producto para editar, llenamos los campos
  useEffect(() => {
    if (productoAEditar) {
      setNombre(productoAEditar.nombre);
      setCategoria(productoAEditar.categoria);
      setPrecio(productoAEditar.precio.toString());
      setStock(productoAEditar.stock.toString());
      setCodigo(productoAEditar.codigo_qr);
    } else {
      // Si no hay producto, limpiamos para que esté vacío para uno nuevo
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
        { fps: 10, qrbox: 200 },
        (decodedText) => {
          setCodigo(decodedText);
          detenerCamaraGlobal();
          toast.success("Código capturado");
        },
        () => {}
      );
    } catch (err) {
      setEscaneando(false);
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
      // ACTUALIZAR
      res = await actualizarProducto(productoAEditar.id, datos);
    } else {
      // AGREGAR NUEVO
      res = await agregarProducto(datos);
    }

    if (res.success) {
      onRefresh();
      onClose();
    }
    setCargando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-display font-bold text-primary">
            {productoAEditar ? `Editar: ${productoAEditar.nombre}` : "Registrar Nuevo Licor"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-5" /></Button>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Lector oculto si estamos editando (opcional, podrías dejarlo por si quieres cambiar el QR) */}
            <div className="relative bg-sidebar border-2 border-dashed border-sidebar-border rounded-lg overflow-hidden min-h-[120px] flex flex-col items-center justify-center">
              <div id="lector-modal" className="w-full" />
              {!escaneando && (
                <Button type="button" variant="outline" size="sm" onClick={iniciarEscaneo}>
                   <Camera className="size-4 mr-2" /> {codigo ? "Cambiar Código" : "Escanear Código"}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase">Nombre</label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">Código</label>
                <Input className="font-mono" value={codigo} onChange={e => setCodigo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">Categoría</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={categoria} onChange={e => setCategoria(e.target.value as Categoria)}>
                  <option value="Whisky">Whisky</option>
                  <option value="Vino">Vino</option>
                  <option value="Cerveza">Cerveza</option>
                  <option value="Singani">Singani</option>
                  <option value="Ron">Ron</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">Precio (Bs.)</label>
                <Input type="number" step="0.1" value={precio} onChange={e => setPrecio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">Stock Actual</label>
                <Input type="number" value={stock} onChange={e => setStock(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={cargando}>
                <Save className="size-4 mr-2" /> {cargando ? "Guardando..." : (productoAEditar ? "Actualizar" : "Guardar")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}