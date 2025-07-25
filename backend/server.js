// server.js
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app       = express();
const PORT      = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'servicios.json');

// 1. Asegurar existencia de servicios.json
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  console.log('🔧 servicios.json creado');
}

// 2. Middlewares
app.use(express.json());

app.use(cors({
  origin: 'http://127.0.0.1:5500',  
  methods: ['GET','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Responder preflight OPTIONS para **todas** las rutas
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

// 3. Helpers sincrónicos (fs.readFileSync/writeFileSync)
function readServicios() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeServicios(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// 4. Rutas

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('✅ Servidor Eddycel listo');
});

// GET /servicios?fecha=YYYY-MM-DD
app.get('/servicios', (req, res) => {
  let lista = readServicios();
  if (req.query.fecha) {
    lista = lista.filter(s => s.fecha === req.query.fecha);
  }
  res.json(lista);
});

// POST /servicios
app.post('/servicios', (req, res) => {
  const { servicio, precio, cliente = '', moneda = 'CUP', transferencia = false } = req.body;
  if (!servicio || precio == null) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }
  const lista = readServicios();
  const nuevo = {
    id:           Date.now(),
    servicio,
    precio,
    cliente,
    moneda,
    transferencia,
    fecha:        new Date().toISOString().slice(0,10)
  };
  lista.push(nuevo);
  writeServicios(lista);
  res.status(201).json({ mensaje: 'Servicio creado', servicio: nuevo });
});

// DELETE /servicios/:id
app.delete('/servicios/:id', (req, res) => {
  const idEliminar = Number(req.params.id);
  if (isNaN(idEliminar)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }
  const lista = readServicios();
  const filtrados = lista.filter(s => s.id !== idEliminar);
  if (filtrados.length === lista.length) {
    return res.status(404).json({ mensaje: 'Servicio no encontrado' });
  }
  writeServicios(filtrados);
  res.json({ mensaje: 'Servicio eliminado', id: idEliminar });
});

// 5. Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
