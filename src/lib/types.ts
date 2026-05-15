export type Categoria = "Whisky" | "Vino" | "Cerveza" | "Singani" | "Ron" | "Vodka" | "Tequila" | "Otros";

export interface Producto {
  id: number;
  nombre: string;
  categoria: Categoria;
  codigo_qr: string;
  stock: number;
  precio: number;
}

export interface Movimiento {
  id: number;
  producto_id: number;
  tipo: "entrada" | "salida";
  cantidad: number;
  fecha_hora: string;
}