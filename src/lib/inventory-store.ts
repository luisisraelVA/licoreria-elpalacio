import { useState, useEffect } from "react";
import { Producto } from "./types";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
// Ayudante para manejar errores del servidor de forma centralizada
async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Error en la operación");
  }
  return data;
}

export async function getProductos(): Promise<Producto[]> {
  try {
    const res = await fetch(`${API_URL}/productos`);
    return await handleResponse(res);
  } catch (error: any) {
    console.error(error.message);
    return [];
  }
}

export async function buscarPorCodigo(codigo: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${API_URL}/productos/buscar?codigo=${encodeURIComponent(codigo)}`);
    if (res.status === 404) return null;
    return await handleResponse(res);
  } catch (error) {
    return null;
  }
}

export async function agregarProducto(datos: any) {
  try {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const result = await handleResponse(res);
    toast.success("Producto registrado exitosamente");
    return result;
  } catch (error: any) {
    toast.error(error.message);
    return { success: false };
  }
}

export async function actualizarProducto(id: number, datos: any) {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const result = await handleResponse(res);
    toast.success("Datos actualizados");
    return result;
  } catch (error: any) {
    toast.error(error.message);
    return { success: false };
  }
}

export async function eliminarProducto(id: number) {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
    const result = await handleResponse(res);
    toast.success("Producto eliminado");
    return result;
  } catch (error: any) {
    toast.error(error.message);
    return { success: false };
  }
}

export async function registrarMovimiento(datos: { producto_id: number, tipo: 'entrada' | 'salida', cantidad: number }) {
  try {
    const res = await fetch(`${API_URL}/movimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await handleResponse(res);
  } catch (error: any) {
    toast.error(error.message);
    return { success: false };
  }
}

export function useInventory() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await getProductos();
    setProductos(data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  return { productos, loading, refresh };
}