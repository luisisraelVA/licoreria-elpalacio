import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, Camera, ScanLine, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { buscarPorCodigo, registrarMovimiento, useInventory } from "@/lib/inventory-store";
import type { Producto } from "@/lib/types";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/escaner")({
  head: () => ({
    meta: [
      { title: "Terminal de Escaneo · El Palacio" },
      { name: "description", content: "Escanea códigos QR para registrar entradas y salidas de inventario." },
    ],
  }),
  component: EscanerPage,
});

function EscanerPage() {
  const navigate = useNavigate();

  // Guardián de seguridad: Expulsa si no hay sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/login", replace: true });
      }
    });
  }, [navigate]);
  const { productos, movimientos, refresh } = useInventory();
  const [codigo, setCodigo] = useState("");
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [procesando, setProcesando] = useState(false);
  
  const [escaneando, setEscaneando] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);

  // Convertido a asíncrono
  const escanear = async (cod: string) => {
    toast.loading("Buscando en base de datos...", { id: "busqueda" });
    const found = await buscarPorCodigo(cod);
    
    if (found) {
      setProducto(found);
      setCodigo(found.codigo_qr);
      setCantidad(1);
      toast.success("Producto detectado", { id: "busqueda" });
    } else {
      toast.error("Código no encontrado", { id: "busqueda", description: "Verifica que esté registrado en el sistema." });
    }
  };

  const iniciarCamara = async () => {
    setEscaneando(true);
    try {
      const qrCodeInstance = new Html5Qrcode("lector-camara");
      setHtml5QrCode(qrCodeInstance);
      
      await qrCodeInstance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (textoDecodificado) => {
          detenerCamara(qrCodeInstance);
          escanear(textoDecodificado);
        },
        () => {} // Ignorar errores de lectura en progreso
      );
    } catch (err) {
      toast.error("Error al acceder a la cámara", { description: "Asegúrate de dar permisos." });
      setEscaneando(false);
    }
  };

  const detenerCamara = async (instancia = html5QrCode) => {
    if (instancia) {
      try {
        await instancia.stop();
        instancia.clear();
      } catch (err) {
        console.error("Error deteniendo cámara", err);
      }
    }
    setEscaneando(false);
  };

  useEffect(() => {
    return () => {
      if (escaneando && html5QrCode) detenerCamara(html5QrCode);
    };
  }, [escaneando, html5QrCode]);


  const submitCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) escanear(codigo.trim());
  };

  // Convertido a asíncrono e integrado con Supabase
  const accion = async (tipo: "entrada" | "salida") => {
    if (!producto) return;
    if (cantidad < 1) return toast.error("Cantidad inválida");
    if (tipo === "salida" && cantidad > producto.stock) {
      return toast.error("Stock insuficiente", { description: `Solo quedan ${producto.stock} unidades.` });
    }

    setProcesando(true);
    toast.loading("Registrando movimiento...", { id: "movimiento" });

    // Petición a Supabase
    const res = await registrarMovimiento(producto.id, tipo, cantidad, producto.stock);

    if (res.success) {
      const nuevoStock = tipo === "entrada" ? producto.stock + cantidad : producto.stock - cantidad;
      setProducto({ ...producto, stock: nuevoStock });
      toast.success(tipo === "entrada" ? "Entrada registrada" : "Salida registrada", {
        id: "movimiento",
        description: `${cantidad} × ${producto.nombre}`,
      });
      refresh(); // Recargar historial inferior
    } else {
      toast.error("Hubo un error al registrar", { id: "movimiento" });
    }
    setProcesando(false);
  };

  const limpiar = () => {
    setProducto(null);
    setCodigo("");
    setCantidad(1);
  };

  const ultimos = movimientos.slice(0, 4);

  return (
    <Layout>
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-sm text-muted-foreground">Terminal móvil</p>
          <h1 className="font-display text-2xl md:text-3xl mt-1">Escaneo rápido</h1>
        </header>

        <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-elegant)]">
          <div className="relative bg-sidebar flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
            <div id="lector-camara" className="w-full h-full max-w-sm mx-auto" />

            {!escaneando && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-sidebar/95 z-10 p-6 text-center">
                <ScanLine className="size-16 mb-4 text-sidebar-primary/50" />
                <Button onClick={iniciarCamara} size="lg" className="w-full max-w-xs shadow-lg">
                  <Camera className="mr-2 size-5" />
                  Activar Cámara
                </Button>
                <p className="text-xs text-muted-foreground mt-4">Requiere permisos de cámara</p>
              </div>
            )}
            
            {escaneando && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                 <Button onClick={() => detenerCamara()} variant="destructive" className="shadow-lg">
                  Cancelar Escaneo
                </Button>
              </div>
            )}
          </div>

          <CardContent className="p-4 space-y-3 bg-card relative z-30">
            <form onSubmit={submitCodigo} className="flex gap-2">
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ingresa código manual (ej. 123456789)"
                className="font-mono"
              />
              <Button type="submit" variant="secondary">Buscar</Button>
            </form>

          </CardContent>
        </Card>

        {producto ? (
          <Card className="mt-4 border-primary/30 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge variant="secondary" className="mb-2">{producto.categoria}</Badge>
                  <h2 className="font-display text-xl leading-tight">{producto.nombre}</h2>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{producto.codigo_qr}</p>
                </div>
                <button onClick={limpiar} className="text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Stock actual</p>
                  <p className="font-display text-2xl">{producto.stock}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Precio</p>
                  <p className="font-display text-2xl">Bs. {producto.precio.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">Cantidad a registrar</label>
                <div className="flex items-center gap-2 mt-1">
                  <Button type="button" variant="outline" size="lg" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</Button>
                  <Input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))} className="text-center text-lg h-12 font-semibold" />
                  <Button type="button" variant="outline" size="lg" onClick={() => setCantidad((c) => c + 1)}>+</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <Button size="lg" disabled={procesando} className="h-16 text-base bg-success text-success-foreground hover:bg-success/90" onClick={() => accion("entrada")}>
                  <ArrowDownToLine className="size-5 mr-2" /> Entrada
                </Button>
                <Button size="lg" disabled={procesando} variant="destructive" className="h-16 text-base" onClick={() => accion("salida")}>
                  <ArrowUpFromLine className="size-5 mr-2" /> Salida
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4 border-dashed bg-transparent">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Activa la cámara o ingresa un código para iniciar. (Intenta con 123456789)
            </CardContent>
          </Card>
        )}

        <section className="mt-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Últimos movimientos</h3>
          <div className="space-y-2">
            {ultimos.map((m) => {
              const p = productos.find((x) => x.id === m.producto_id);
              const entrada = m.tipo_movimiento === "entrada";
              return (
                <div key={m.id} className="flex items-center justify-between bg-card border border-border/60 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-9 rounded-md flex items-center justify-center ${entrada ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {entrada ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p?.nombre ?? "Producto eliminado"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.fecha_hora).toLocaleString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${entrada ? "text-success" : "text-destructive"}`}>
                    {entrada ? "+" : "−"}{m.cantidad}
                  </span>
                </div>
              );
            })}
            {ultimos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay movimientos recientes.</p>}
          </div>
        </section>
      </div>
    </Layout>
  );
}