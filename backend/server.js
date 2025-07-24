const express = require("express");
const app = express();
const PORT = 3000;
const fs = require("fs");
const path = require("path");

// Middleware para leer JSON
app.use(express.json());

const cors = require("cors");
app.use(cors({
  origin: "*",             // Permitir cualquier origen (solo para desarrollo)
  methods: ["GET", "POST", "DELETE", "OPTIONS"], // Métodos permitidos
  allowedHeaders: ["Content-Type"]
}));


// Ruta básica
app.get("/", (req, res) => {
  res.send("¡Servidor Eddycel listo!");
});


// Archivo donde guardamos los servicios
const serviciosPath = path.join(__dirname, "servicios.json");

// Ruta POST para recibir y guardar servicios
app.post("/servicios", (req, res) => {
  const nuevoServicio = req.body;

  if (!nuevoServicio || !nuevoServicio.servicio || !nuevoServicio.precio) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  // Leer los servicios actuales
  let serviciosGuardados = [];
  if (fs.existsSync(serviciosPath)) {
    const datos = fs.readFileSync(serviciosPath);
    serviciosGuardados = JSON.parse(datos);
  }

  // Agregar el nuevo servicio
  nuevoServicio.id = Date.now(); // ID único temporal
  serviciosGuardados.push(nuevoServicio);

  // Guardar nuevamente
  fs.writeFileSync(serviciosPath, JSON.stringify(serviciosGuardados, null, 2));

  res.status(201).json({ mensaje: "Servicio guardado correctamente", servicio: nuevoServicio });
});

// Ruta GET para consultar todos los servicios
app.get("/servicios", (req, res) => {
  const fecha = req.query.fecha;
  let servicios = [];

  if (fs.existsSync(serviciosPath)) {
    const datos = fs.readFileSync(serviciosPath);
    servicios = JSON.parse(datos);
  }

  // Si hay fecha en la consulta, filtramos
  if (fecha) {
    servicios = servicios.filter(s => s.fecha === fecha);
  }

  res.json(servicios);
});

app.delete("/servicios/:id", (req, res) => {
  const idEliminar = parseInt(req.params.id, 10);

  if (!fs.existsSync(serviciosPath)) {
    return res.status(404).json({ mensaje: "Archivo no encontrado" });
  }

  const datos = JSON.parse(fs.readFileSync(serviciosPath));
  const filtrados = datos.filter(s => s.id !== idEliminar);

  if (filtrados.length === datos.length) {
    return res.status(404).json({ mensaje: "Servicio no encontrado" });
  }

  fs.writeFileSync(serviciosPath, JSON.stringify(filtrados, null, 2));
  res.status(200).json({ mensaje: "Servicio eliminado correctamente", id: idEliminar });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
