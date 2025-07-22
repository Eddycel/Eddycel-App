// 1. Capturar elementos DOM
const modal = document.getElementById("modal-edicion");
const clienteModal = document.getElementById("cliente-modal");
const precioModal = document.getElementById("precio-modal");
const checkboxTransferencia = document.getElementById("checkbox-transferencia");
const monedaModal = document.getElementById("moneda-modal");
const montoModal = document.getElementById("monto-modal");
const guardarBtn = document.getElementById("guardar-edicion");
const cerrarBtn = document.getElementById("cerrar-modal");

const botones = document.querySelectorAll(".servicio-btn");
const tablaServicios = document.getElementById("tabla-servicios");
const totalElemento = document.getElementById("valor-total");

let registroTemporal = null;
const serviciosDelDia = [];

// 2. Al hacer clic en un botón de servicio, preparar y mostrar modal
botones.forEach((boton) => {
  boton.addEventListener("click", () => {
    const nombre = boton.textContent;
    const precio = definirPrecio(nombre);

    // Nuevo registro con campos justos
    registroTemporal = {
      servicio: nombre,
      precio,
      cliente: "",
      transferencia: false,
      moneda: "USD",
      montoDivisa: 0
    };

    // Reiniciar valores del modal
    clienteModal.value = "";
    precioModal.value = precio;
    monedaModal.value = "USD";
    montoModal.value = 0;
    checkboxTransferencia.checked = false;

    modal.style.display = "flex";
  });
});

guardarBtn.addEventListener("click", () => {
  registroTemporal.cliente = clienteModal.value.trim() || "—";
  registroTemporal.precio = parseFloat(precioModal.value) || 0;
  registroTemporal.transferencia = checkboxTransferencia.checked;
  registroTemporal.moneda = monedaModal.value;
  registroTemporal.montoDivisa = parseFloat(montoModal.value) || 0;
  registroTemporal.fecha = new Date().toISOString().split("T")[0];

  serviciosDelDia.push(registroTemporal);
  localStorage.setItem("serviciosGuardados", JSON.stringify(serviciosDelDia));

fetch("https://eddycel-app.onrender.com", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(registroTemporal)
})

    .then(res => res.json())
    .then(data => {
      console.log("Servicio guardado en backend:", data);
      actualizarTabla();
      actualizarTotal();
      modal.style.display = "none";
    })
    .catch(err => {
      console.error("Error al guardar en el backend:", err);
      alert("No se pudo guardar el servicio.");
    });
});

// 4. Cerrar modal sin guardar
cerrarBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// 5. Renderizar la tabla de servicios
function actualizarTabla() {
  tablaServicios.innerHTML = "";
  serviciosDelDia.forEach((s, i) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${s.servicio}</td>
      <td>${s.precio.toFixed(2)}</td>
      <td>${s.cliente}</td>
      <td>${s.montoDivisa.toFixed(2)} ${s.moneda}</td>
      <td>${s.transferencia ? "Sí" : "No"}</td>
      <td><button class="eliminar-btn" data-index="${i}">❌</button></td>
    `;
    tablaServicios.appendChild(fila);
  });

  function actualizarTablaConArray(array) {
  tablaServicios.innerHTML = "";
  array.forEach((s, i) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${s.servicio}</td>
      <td>${s.precio.toFixed(2)}</td>
      <td>${s.cliente}</td>
      <td>${s.montoDivisa.toFixed(2)} ${s.moneda}</td>
      <td>${s.transferencia ? "Sí" : "No"}</td>
      <td><button class="eliminar-btn" data-index="${i}">❌</button></td>
    `;
    tablaServicios.appendChild(fila);
  });
}

}

// 6. Eliminar un servicio
tablaServicios.addEventListener("click", (e) => {
  if (e.target.classList.contains("eliminar-btn")) {
    const index = parseInt(e.target.dataset.index, 10);
    serviciosDelDia.splice(index, 1);
    actualizarTabla();
    actualizarTotal();
  }
});

// 7. Calcular totales por moneda y método
function actualizarTotal() {
  // 1. Acumuladores iniciales
  let efectivoCUP = 0, transferenciaCUP = 0;
  let efectivoUSD = 0, transferenciaUSD = 0;
  let efectivoEUR = 0, transferenciaEUR = 0;
  let efectivoCAD = 0, transferenciaCAD = 0;

  // 2. Sumamos en cada iteración
  serviciosDelDia.forEach(item => {
    // CUP
    if (item.transferencia) transferenciaCUP += item.precio;
    else efectivoCUP += item.precio;

    // Divisa variable
    switch (item.moneda) {
      case "USD":
        item.transferencia
          ? transferenciaUSD += item.montoDivisa
          : efectivoUSD += item.montoDivisa;
        break;
      case "EUR":
        item.transferencia
          ? transferenciaEUR += item.montoDivisa
          : efectivoEUR += item.montoDivisa;
        break;
      case "CAD":
        item.transferencia
          ? transferenciaCAD += item.montoDivisa
          : efectivoCAD += item.montoDivisa;
        break;
    }
  });

  // 3. Calculamos los “totales” de cada moneda
  let totalCUP = efectivoCUP + transferenciaCUP;
  let totalUSD = efectivoUSD + transferenciaUSD;
  let totalEUR = efectivoEUR + transferenciaEUR;
  let totalCAD = efectivoCAD + transferenciaCAD;

  // 4. Actualizamos el DOM
  document.getElementById("valor-total").textContent            = totalCUP.toFixed(2);
  document.getElementById("total-efectivo-cup").textContent     = efectivoCUP.toFixed(2);
  document.getElementById("total-transferencia-cup").textContent = transferenciaCUP.toFixed(2);

  document.getElementById("total-efectivo-usd").textContent     = efectivoUSD.toFixed(2);
  document.getElementById("total-transferencia-usd").textContent = transferenciaUSD.toFixed(2);
  document.getElementById("total-usd").textContent               = totalUSD.toFixed(2);

  document.getElementById("total-efectivo-eur").textContent     = efectivoEUR.toFixed(2);
  document.getElementById("total-transferencia-eur").textContent = transferenciaEUR.toFixed(2);
  document.getElementById("total-eur").textContent               = totalEUR.toFixed(2);

  document.getElementById("total-efectivo-cad").textContent     = efectivoCAD.toFixed(2);
  document.getElementById("total-transferencia-cad").textContent = transferenciaCAD.toFixed(2);
  document.getElementById("total-cad").textContent               = totalCAD.toFixed(2);
}


// 8. Diccionario de precios
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

// 9. Service Worker (opcional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch((err) => console.log('Error al registrar SW', err));
}

const guardados = localStorage.getItem("serviciosGuardados");
if (guardados) {
  serviciosDelDia.push(...JSON.parse(guardados));
}

const selectorFecha = document.getElementById("selector-fecha");

selectorFecha.addEventListener("change", () => {
  const fechaSeleccionada = selectorFecha.value;
  const filtrados = serviciosDelDia.filter(s => s.fecha === fechaSeleccionada);
  actualizarTablaConArray(filtrados); // función alternativa
});
