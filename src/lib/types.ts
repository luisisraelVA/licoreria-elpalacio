export type Categoria = "Whisky" | "Vino" | "Cerveza" | "Singani" | "Ron" | "Vodka" | "Tequila" | "Otros";

export interface Producto {
  id: string;
  nombre: string;
  categoria: Categoria;
  codigo_qr: string;
  stock: number;
  precio: number;
}

export type TipoMovimiento = "entrada" | "salida";

export interface Movimiento {
  id: string;
  producto_id: string;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  fecha_hora: string; // ISO
}
