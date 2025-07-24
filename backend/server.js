// server.js

const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;
const serviciosPath = path.join(__dirname, "servicios.json");

// 1. Middlewares
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// 2. Responder preflight para CORS
app.options("*", (req, res) => {
  res.sendStatus(204);
});

// 3. Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Servidor Eddycel listo!");
});

// 4. POST /servicios → guardar un nuevo servicio
app.post("/servicios", (req, res) => {
  const nuevoServicio = req.body;
  if (!nuevoServicio.servicio || nuevoServicio.precio == null) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  let servicios = [];
  if (fs.existsSync(serviciosPath)) {
    servicios = JSON.parse(fs.readFileSync(serviciosPath));
  }

  nuevoServicio.id    = Date.now();
  nuevoServicio.fecha = new Date().toISOString().split("T")[0];
  servicios.push(nuevoServicio);

  fs.writeFileSync(serviciosPath, JSON.stringify(servicios, null, 2));
  res.status(201).json({
    mensaje:  "Servicio guardado correctamente",
    servicio: nuevoServicio
  });
});

// 5. GET /servicios?fecha=YYYY-MM-DD → obtener servicios (opcionalmente filtrados por fecha)
app.get("/servicios", (req, res) => {
  const fecha = req.query.fecha;
  let servicios = [];

  const fecha = req.query.fecha;
  let servicios = [];

  if (fs.existsSync(serviciosPath)) {
    servicios = JSON.parse(fs.readFileSync(serviciosPath));
  }

  if (fecha) {
    servicios = servicios.filter(s => s.fecha === fecha);
  }

  res.json(servicios);
});

// 6. DELETE /servicios/:id → eliminar un servicio por ID
app.delete("/servicios/:id", (req, res) => {
  const idEliminar = parseInt(req.params.id, 10);

  if (!fs.existsSync(serviciosPath)) {
    return res.status(404).json({ mensaje: "Archivo no encontrado" });
  }

  const servicios = JSON.parse(fs.readFileSync(serviciosPath));
  const filtrados = servicios.filter(s => s.id !== idEliminar);

  if (filtrados.length === servicios.length) {
    return res.status(404).json({ mensaje: "Servicio no encontrado" });
  }

  fs.writeFileSync(serviciosPath, JSON.stringify(filtrados, null, 2));
  res.json({ mensaje: "Servicio eliminado correctamente", id: idEliminar });
});

// 7. Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
