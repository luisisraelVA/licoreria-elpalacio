const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 CONEXIÓN A LA NUBE (Con soporte SSL para TiDB)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'licoreria_el_palacio',
  port: process.env.DB_PORT || 3306,
  // Esta línea es obligatoria para TiDB en la nube:
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } 
});



db.connect((err) => {
  if (err) {
    console.error('❌ Error crítico de conexión a BD:', err.message);
    return;
  }
  console.log('✅ Base de datos conectada en la NUBE: Licorería El Palacio');
});

// --- LOGIN ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === "admin@elpalacio.com" && password === "admin123") {
    res.json({ success: true, user: { email } });
  } else {
    res.status(401).json({ error: "El correo o la contraseña son incorrectos." });
  }
});

// --- PRODUCTOS ---
app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos ORDER BY nombre ASC', (err, results) => {
    if (err) return res.status(500).json({ error: "Error al consultar la base de datos" });
    res.json(results);
  });
});

app.post('/api/productos', (req, res) => {
  const { nombre, categoria, codigo_qr, precio, stock } = req.body;

  if (precio < 0 || stock < 0) {
    return res.status(400).json({ error: "El precio y el stock no pueden ser negativos." });
  }

  const sql = 'INSERT INTO productos (nombre, categoria, codigo_qr, precio, stock) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [nombre.trim(), categoria, codigo_qr.trim(), precio, stock], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "Ya existe un producto con ese Nombre o Código QR." });
      }
      return res.status(500).json({ error: "Error al registrar el producto." });
    }
    res.json({ success: true, id: result.insertId });
  });
});

app.put('/api/productos/:id', (req, res) => {
  const { nombre, categoria, codigo_qr, precio, stock } = req.body;
  if (precio < 0 || stock < 0) return res.status(400).json({ error: "Valores numéricos inválidos." });

  const sql = 'UPDATE productos SET nombre=?, categoria=?, codigo_qr=?, precio=?, stock=? WHERE id=?';
  db.query(sql, [nombre.trim(), categoria, codigo_qr.trim(), precio, stock, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Error al actualizar los datos." });
    res.json({ success: true });
  });
});

app.get('/api/productos/buscar', (req, res) => {
  const codigo = req.query.codigo;
  if (!codigo) return res.status(400).json({ error: "Falta código de búsqueda" });

  db.query('SELECT * FROM productos WHERE codigo_qr = ?', [codigo], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: "No encontrado" });
    res.json(result[0]);
  });
});

app.delete('/api/productos/:id', (req, res) => {
  db.query('DELETE FROM productos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "No se pudo eliminar el producto." });
    res.json({ success: true });
  });
});

// --- MOVIMIENTOS ---
app.post('/api/movimientos', (req, res) => {
  const { producto_id, tipo, cantidad } = req.body;
  const numCantidad = parseInt(cantidad);

  if (numCantidad <= 0) return res.status(400).json({ error: "La cantidad debe ser mayor a cero." });

  db.query('SELECT stock, nombre FROM productos WHERE id = ?', [producto_id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: "Producto inexistente." });

    const stockActual = results[0].stock;

    if (tipo === 'salida' && stockActual < numCantidad) {
      return res.status(400).json({ 
        error: `Operación cancelada: Stock insuficiente para "${results[0].nombre}". Disponible: ${stockActual}` 
      });
    }

    db.query('INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES (?, ?, ?)', 
    [producto_id, tipo, numCantidad], (err) => {
      if (err) return res.status(500).json({ error: "Error al registrar el historial." });

      const sqlUpdate = tipo === 'entrada' 
        ? 'UPDATE productos SET stock = stock + ? WHERE id = ?'
        : 'UPDATE productos SET stock = stock - ? WHERE id = ?';
      
      db.query(sqlUpdate, [numCantidad, producto_id], (err2) => {
        if (err2) return res.status(500).json({ error: "Error al sincronizar el stock." });
        res.json({ success: true });
      });
    });
  });
});

// --- HISTORIAL ---
app.get('/api/historial', (req, res) => {
  const sql = `
    SELECT h.id, p.nombre, h.tipo, h.cantidad, h.fecha_hora 
    FROM movimientos h
    JOIN productos p ON h.producto_id = p.id
    ORDER BY h.fecha_hora DESC 
    LIMIT 100
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor blindado en puerto ${PORT}`));