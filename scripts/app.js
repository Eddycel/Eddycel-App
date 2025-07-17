const modal = document.getElementById("modal-edicion");
const clienteModal = document.getElementById("cliente-modal");
const precioModal = document.getElementById("precio-modal");
const precioUSDModal = document.getElementById("precio-usd");
const checkboxTransferencia = document.getElementById("checkbox-transferencia");
const guardarBtn = document.getElementById("guardar-edicion");
const cerrarBtn = document.getElementById("cerrar-modal");

let registroTemporal = null;
const serviciosDelDia = [];

const botones = document.querySelectorAll(".servicio-btn");
const tablaServicios = document.getElementById("tabla-servicios");
const totalElemento = document.getElementById("valor-total");

botones.forEach((boton) => {
  boton.addEventListener("click", () => {
    const nombre = boton.textContent;
    const precio = definirPrecio(nombre);

    registroTemporal = {
      servicio: nombre,
      precio,
      usd: 0,
      cliente: "",
      transferencia: false
    };

    clienteModal.value = "";
    precioModal.value = precio;
    precioUSDModal.value = 0;
    checkboxTransferencia.checked = false;
    modal.style.display = "flex";
  });
});

guardarBtn.addEventListener("click", () => {
  registroTemporal.cliente = clienteModal.value || "—";
  registroTemporal.precio = parseInt(precioModal.value) || 0;
  registroTemporal.usd = parseFloat(precioUSDModal.value) || 0;
  registroTemporal.transferencia = checkboxTransferencia.checked;

  serviciosDelDia.push(registroTemporal);
  actualizarTabla();
  actualizarTotal();
  modal.style.display = "none";
});

cerrarBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

function actualizarTabla() {
  tablaServicios.innerHTML = "";
  serviciosDelDia.forEach((servicio, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${servicio.servicio}</td>
      <td>${servicio.precio}</td>
      <td>${servicio.cliente}</td>
      <td>${servicio.usd}</td>
      <td>${servicio.transferencia ? "Sí" : "No"}</td>
      <td><button class="eliminar-btn" data-index="${index}">❌</button></td>
    `;
    tablaServicios.appendChild(fila);
  });
}

tablaServicios.addEventListener("click", (e) => {
  if (e.target.classList.contains("eliminar-btn")) {
    const index = parseInt(e.target.dataset.index);
    serviciosDelDia.splice(index, 1);
    actualizarTabla();
    actualizarTotal();
  }
});

function actualizarTotal() {
  let totalCUP = 0;
  let totalUSD = 0;
  let totalTransferenciaCUP = 0;
  let totalTransferenciaUSD = 0;
  let totalEfectivoCUP = 0;

  serviciosDelDia.forEach((item) => {
    totalCUP += item.precio;
    totalUSD += item.usd;

    if (item.transferencia) {
      totalTransferenciaCUP += item.precio;
      totalTransferenciaUSD += item.usd;
    } else {
      totalEfectivoCUP += item.precio;
    }
  });

  totalElemento.textContent = totalCUP;
  document.getElementById("total-efectivo-cup").textContent = totalEfectivoCUP;
  document.getElementById("total-transferencia-cup").textContent = totalTransferenciaCUP;
  document.getElementById("total-transferencia-usd").textContent = totalTransferenciaUSD;
  document.getElementById("total-usd").textContent = totalUSD;
}

function definirPrecio(nombre) {
  const precios = {
    "Instalar aplicación": 300,
    "Protector de pantalla": 1500,
    "Cable USB": 1500,
    "Cargador": 1500,
    "Auriculares": 2000,
    "Cambio de pantalla": 1000,
    "Puerto de carga": 600,
    "Batería": 550,
    "Micrófono": 400,
    "Limpieza interna": 300,
    "Cortocircuito": 1200,
    "FPC / soldadura": 800,
    "Reparación general": 700,
    "Venta de teléfono": 3000,
    "Desbloqueo": 500,
    "Actualizacion": 200,
    "FRP / Bypass": 650,
    "Servicio personalizado": 0
  };
  return precios[nombre] || 0;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch((err) => console.log('Error al registrar SW', err));
}
