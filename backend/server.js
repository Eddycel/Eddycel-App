// server.js
const express = require('express');
const cors    = require('cors');
const fs      = require('fs').promises;
const path    = require('path');

const app       = express();
const PORT      = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'servicios.json');

// --- A) CORS global **antes** de todo
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], 
  methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

// Responder preflight para **todas** las rutas
app.options('*', cors(corsOptions), (req, res) => {
  res.sendStatus(204);
});

// --- B) JSON parser
app.use(express.json());

// --- C) Inicializar JSON si no existe
;(async () => {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
    console.log('🔧 servicios.json creado');
  }
})();

// --- D) Helpers de I/O
async function readServicios() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}
async function writeServicios(arr) {
  await fs.writeFile(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// --- E) Rutas CRUD

// Prueba
app.get('/', (req, res) => {
  res.send(`Servidor levantado en puerto ${PORT}`);
});

// Listar (opcional filtro por fecha)
app.get('/servicios', async (req, res) => {
  try {
    let data = await readServicios();
    if (req.query.fecha) {
      data = data.filter(s => s.fecha === req.query.fecha);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al leer servicios' });
  }
});

// Crear
app.post('/servicios', async (req, res) => {
  const { servicio, precio } = req.body;
  if (!servicio || precio == null) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
  }
  try {
    const lista = await readServicios();
    const nuevo = { id: Date.now(), servicio, precio, fecha: new Date().toISOString().slice(0,10) };
    lista.push(nuevo);
    await writeServicios(lista);
    res.status(201).json({ mensaje: 'Creado', servicio: nuevo });
  } catch {
    res.status(500).json({ mensaje: 'Error al guardar servicio' });
  }
});

// Eliminar
app.delete('/servicios/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ mensaje: 'ID inválido' });
  try {
    const lista = await readServicios();
    const filtrados = lista.filter(s => s.id !== id);
    if (filtrados.length === lista.length) {
      return res.status(404).json({ mensaje: 'No encontrado' });
    }
    await writeServicios(filtrados);
    res.json({ mensaje: 'Eliminado', id });
  } catch {
    res.status(500).json({ mensaje: 'Error al eliminar servicio' });
  }
});

// --- F) Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Corriendo en http://localhost:${PORT}`);
});
