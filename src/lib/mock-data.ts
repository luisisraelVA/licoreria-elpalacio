import type { Producto, Movimiento } from "./types";

export const productosIniciales: Producto[] = [
  { id: "p1", nombre: "Singani Casa Real Etiqueta Negra", categoria: "Singani", codigo_qr: "QR-SING-001", stock: 24, precio: 95.0 },
  { id: "p2", nombre: "Singani Los Parrales Reserva", categoria: "Singani", codigo_qr: "QR-SING-002", stock: 8, precio: 78.5 },
  { id: "p3", nombre: "Whisky Johnnie Walker Black Label", categoria: "Whisky", codigo_qr: "QR-WHIS-001", stock: 15, precio: 320.0 },
  { id: "p4", nombre: "Whisky Chivas Regal 12 Años", categoria: "Whisky", codigo_qr: "QR-WHIS-002", stock: 4, precio: 285.0 },
  { id: "p5", nombre: "Whisky Jack Daniel's Old No. 7", categoria: "Whisky", codigo_qr: "QR-WHIS-003", stock: 12, precio: 260.0 },
  { id: "p6", nombre: "Cerveza Paceña Pilsener 620ml", categoria: "Cerveza", codigo_qr: "QR-CERV-001", stock: 144, precio: 12.0 },
  { id: "p7", nombre: "Cerveza Huari Premium 620ml", categoria: "Cerveza", codigo_qr: "QR-CERV-002", stock: 96, precio: 14.5 },
  { id: "p8", nombre: "Cerveza Corona Extra 355ml", categoria: "Cerveza", codigo_qr: "QR-CERV-003", stock: 6, precio: 18.0 },
  { id: "p9", nombre: "Vino Campos de Solana Cabernet", categoria: "Vino", codigo_qr: "QR-VINO-001", stock: 30, precio: 85.0 },
  { id: "p10", nombre: "Vino Aranjuez Tannat Reserva", categoria: "Vino", codigo_qr: "QR-VINO-002", stock: 18, precio: 110.0 },
  { id: "p11", nombre: "Ron Bacardí Carta Blanca", categoria: "Ron", codigo_qr: "QR-RON-001", stock: 22, precio: 95.0 },
  { id: "p12", nombre: "Ron Havana Club Añejo 7 Años", categoria: "Ron", codigo_qr: "QR-RON-002", stock: 3, precio: 180.0 },
  { id: "p13", nombre: "Vodka Absolut Original", categoria: "Vodka", codigo_qr: "QR-VODK-001", stock: 14, precio: 145.0 },
  { id: "p14", nombre: "Tequila José Cuervo Especial Reposado", categoria: "Tequila", codigo_qr: "QR-TEQU-001", stock: 9, precio: 165.0 },
  { id: "p15", nombre: "Fernet Branca 750ml", categoria: "Otros", codigo_qr: "QR-OTRO-001", stock: 5, precio: 130.0 },
];

const hoy = new Date();
const horasAtras = (h: number) => new Date(hoy.getTime() - h * 3600_000).toISOString();

export const movimientosIniciales: Movimiento[] = [
  { id: "m1", producto_id: "p6", tipo_movimiento: "entrada", cantidad: 48, fecha_hora: horasAtras(2) },
  { id: "m2", producto_id: "p3", tipo_movimiento: "salida", cantidad: 2, fecha_hora: horasAtras(3) },
  { id: "m3", producto_id: "p1", tipo_movimiento: "salida", cantidad: 1, fecha_hora: horasAtras(5) },
  { id: "m4", producto_id: "p9", tipo_movimiento: "entrada", cantidad: 12, fecha_hora: horasAtras(7) },
  { id: "m5", producto_id: "p8", tipo_movimiento: "salida", cantidad: 6, fecha_hora: horasAtras(9) },
  { id: "m6", producto_id: "p12", tipo_movimiento: "salida", cantidad: 1, fecha_hora: horasAtras(11) },
];

export const STOCK_BAJO_UMBRAL = 10;
