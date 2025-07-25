// server.js

const express = require('express');
const cors    = require('cors');
const fs      = require('fs').promises;
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const serviciosPath = path.join(__dirname, 'servicios.json');

// ── Asegurar que el archivo exista al arrancar ──
(async function initFile() {
  try {
    await fs.access(serviciosPath);
  } catch {
    await fs.writeFile(serviciosPath, '[]', 'utf8');
  }
})();

// ── Middlewares ──
app.use(express.json());
app.use(cors());

// ── Helpers para lectura/escritura ──
async function readServicios() {
  const data = await fs.readFile(serviciosPath, 'utf8');
  return JSON.parse(data);
}

async function writeServicios(servicios) {
  await fs.writeFile(
    serviciosPath,
    JSON.stringify(servicios, null, 2),
    'utf8'
  );
}

// ── Ruta de prueba ──
app.get('/', (req, res) => {
  res.send('¡Servidor Eddycel listo!');
});

// ── POST /servicios → guardar un nuevo servicio ──
app.post('/servicios', async (req, res) => {
  const { servicio, precio, cliente = '', moneda = 'CUP', transferencia = false } = req.body;

  if (!servicio || precio == null) {
    return res.status(400).json({ mensaje: 'Datos incompletos' });
  }

  try {
    const servicios = await readServicios();
    const nuevo = {
      id: Date.now(),
      servicio,
      precio,
      cliente,
      moneda,
      transferencia,
      fecha: new Date().toISOString().split('T')[0]
    };

    servicios.push(nuevo);
    await writeServicios(servicios);

    res.status(201).json({
      mensaje: 'Servicio guardado correctamente',
      servicio: nuevo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// ── GET /servicios?fecha=YYYY-MM-DD → listar servicios ──
app.get('/servicios', async (req, res) => {
  const { fecha } = req.query;

  try {
    let servicios = await readServicios();
    if (fecha) servicios = servicios.filter(s => s.fecha === fecha);
    res.json(servicios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// ── DELETE /servicios/:id → eliminar servicio por ID ──
app.delete('/servicios/:id', async (req, res) => {
  const idEliminar = Number(req.params.id);
  if (Number.isNaN(idEliminar)) {
    return res.status(400).json({ mensaje: 'ID inválido' });
  }

  try {
    const servicios = await readServicios();
    const filtrados = servicios.filter(s => s.id !== idEliminar);

    if (filtrados.length === servicios.length) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    await writeServicios(filtrados);
    res.json({ mensaje: 'Servicio eliminado correctamente', id: idEliminar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// ── Arrancar servidor ──
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
