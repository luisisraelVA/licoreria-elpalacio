import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import type { Movimiento, Producto, TipoMovimiento } from "./types";
import { toast } from "sonner";

// Hook para obtener el inventario y movimientos en tiempo real
export function useInventory() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener productos
      const { data: prodData, error: prodError } = await supabase
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });

      if (prodError) throw prodError;

      // 2. Obtener los últimos 10 movimientos
      const { data: movData, error: movError } = await supabase
        .from("movimientos")
        .select("*")
        .order("fecha_hora", { ascending: false })
        .limit(10);

      if (movError) throw movError;

      setProductos(prodData || []);
      setMovimientos(movData || []);
    } catch (error: any) {
      toast.error("Error al cargar datos", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { productos, movimientos, loading, refresh: fetchData };
}

// Función para buscar un producto por su código QR/Barras en la base de datos
export async function buscarPorCodigo(codigo: string): Promise<Producto | null> {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("codigo_qr", codigo)
      .maybeSingle(); // Retorna un solo objeto o null si no existe

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error buscando código:", error.message);
    return null;
  }
}

// Función para registrar entradas o salidas y actualizar el stock
export async function registrarMovimiento(
  productoId: string,
  tipo: TipoMovimiento,
  cantidad: number,
  stockActual: number
) {
  try {
    // 1. Calcular nuevo stock
    const nuevoStock = tipo === "entrada" 
      ? stockActual + cantidad 
      : Math.max(0, stockActual - cantidad);

    // 2. Insertar el registro del movimiento
    const { error: movError } = await supabase
      .from("movimientos")
      .insert([
        {
          producto_id: productoId,
          tipo_movimiento: tipo,
          cantidad: cantidad,
        },
      ]);

    if (movError) throw movError;

    // 3. Actualizar el stock en la tabla de productos
    const { error: prodError } = await supabase
      .from("productos")
      .update({ stock: nuevoStock })
      .eq("id", productoId);

    if (prodError) throw prodError;

    return { success: true };
  } catch (error: any) {
    toast.error("No se pudo registrar el movimiento");
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function agregarProducto(nuevoProducto: Omit<Producto, 'id'>) {
  try {
    const { data, error } = await supabase
      .from("productos")
      .insert([nuevoProducto])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error al crear producto:", error.message);
    toast.error("Error al crear producto", { description: error.message });
    return { success: false, error: error.message };
  }
}

// Función para eliminar un producto
export async function eliminarProducto(id: string) {
  try {
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) throw error;
    toast.success("Producto eliminado del sistema");
    return { success: true };
  } catch (error: any) {
    toast.error("No se pudo eliminar");
    return { success: false };
  }
}

// Función para actualizar datos de un producto existente
export async function actualizarProducto(id: string, cambios: Partial<Producto>) {
  try {
    const { error } = await supabase
      .from("productos")
      .update(cambios)
      .eq("id", id);
      
    if (error) throw error;
    toast.success("Producto actualizado correctamente");
    return { success: true };
  } catch (error: any) {
    toast.error("Error al actualizar");
    return { success: false };
  }
}