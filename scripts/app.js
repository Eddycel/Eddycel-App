// scripts/app.js

// 0. Configuración
const API_BASE = 'https://eddycel-app.onrender.com/servicios';

// 1. BORRAR SERVICIO
async function borrarServicio(id) {
  console.log('⏳ Borrando servicio con ID:', id);
  const resp = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('🚧 Response DELETE status:', resp.status);
  if (!resp.ok) {
    throw new Error(`Error al borrar: ${resp.status}`);
  }
  return resp.json();
}

// 2. Capturar elementos DOM
const modal                 = document.getElementById('modal-edicion');
const clienteModal          = document.getElementById('cliente-modal');
const precioModal           = document.getElementById('precio-modal');
const checkboxTransferencia = document.getElementById('checkbox-transferencia');
const monedaModal           = document.getElementById('moneda-modal');
const montoModal            = document.getElementById('monto-modal');
const guardarBtn            = document.getElementById('guardar-edicion');
const cerrarBtn             = document.getElementById('cerrar-modal');
const botones               = document.querySelectorAll('.servicio-btn');
const tablaServicios        = document.getElementById('tabla-servicios');
const selectorFecha         = document.getElementById('selector-fecha');

// 3. Estado de la app
let registroTemporal = null;
const serviciosDelDia = [];

// 4. Cargar del localStorage al iniciar
;(function initFromStorage() {
  const guardados = localStorage.getItem('serviciosGuardados');
  if (guardados) {
    serviciosDelDia.push(...JSON.parse(guardados));
    renderTabla(serviciosDelDia);
    actualizarTotales(serviciosDelDia);
  }
})();

// 5. Abrir modal al pulsar un servicio
botones.forEach(boton => {
  boton.addEventListener('click', () => {
    const nombre = boton.textContent.trim();
    const precio = definirPrecio(nombre);

    registroTemporal = {
      servicio: nombre,
      precio,
      cliente: '',
      transferencia: false,
      moneda: 'USD',
      montoDivisa: 0,
      fecha: ''
    };

    clienteModal.value = '';
    precioModal.value  = precio;
    monedaModal.value  = 'USD';
    montoModal.value   = 0;
    checkboxTransferencia.checked = false;
    modal.style.display = 'flex';
  });
});

// 6. Guardar servicio (POST) y actualizar local
guardarBtn.addEventListener('click', () => {
  const cliente = clienteModal.value.trim() || '—';
  const precio  = parseFloat(precioModal.value) || 0;
  const monto   = parseFloat(montoModal.value) || 0;

  if (precio <= 0 && registroTemporal.servicio !== 'Servicio personalizado') {
    return alert('Precio inválido');
  }

  Object.assign(registroTemporal, {
    cliente,
    precio,
    transferencia: checkboxTransferencia.checked,
    moneda: monedaModal.value,
    montoDivisa: monto,
    fecha: new Date().toISOString().split('T')[0]
  });

  fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registroTemporal)
  })
    .then(res => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    })
    .then(({ servicio }) => {
      servicio.montoDivisa = registroTemporal.montoDivisa;
      serviciosDelDia.push(servicio);
      localStorage.setItem('serviciosGuardados', JSON.stringify(serviciosDelDia));
      renderTabla(serviciosDelDia);
      actualizarTotales(serviciosDelDia);
      modal.style.display = 'none';
    })
    .catch(err => {
      console.error('Error al guardar en el backend:', err);
      alert('No se pudo guardar el servicio.');
    });
});

// 7. Cerrar modal sin guardar
cerrarBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// 8. Eliminar servicio (DELETE) por ID usando borrarServicio()
tablaServicios.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('eliminar-btn')) return;

  const id = Number(e.target.dataset.id);
  if (isNaN(id)) return;

  try {
    await borrarServicio(id);

    // Actualizar estado local
    const idx = serviciosDelDia.findIndex(s => s.id === id);
    if (idx > -1) serviciosDelDia.splice(idx, 1);
    localStorage.setItem('serviciosGuardados', JSON.stringify(serviciosDelDia));

    // Aplicar posible filtro de fecha
    const fechaFiltro = selectorFecha.value;
    const lista = fechaFiltro
      ? serviciosDelDia.filter(s => s.fecha === fechaFiltro)
      : serviciosDelDia;

    renderTabla(lista);
    actualizarTotales(lista);
  } catch (err) {
    console.error('❌ Error al eliminar servicio:', err);
    alert('No se pudo eliminar el servicio.');
  }
});

// 9. Filtrar por fecha (GET) y actualizar vista
selectorFecha.addEventListener('change', () => {
  const fecha = selectorFecha.value;
  fetch(`${API_BASE}?fecha=${fecha}`)
    .then(res => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    })
    .then(data => {
      renderTabla(data);
      actualizarTotales(data);
    })
    .catch(err => {
      console.error('Error al cargar servicios por fecha:', err);
      alert('No se pudo consultar el historial.');
    });
});

// 10. Registrar Service Worker (opcional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('scripts/service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.log('Error al registrar SW:', err));
}

// ─── Funciones auxiliares ──────────────────────────────────────────────────────

// Renderiza cualquier array de servicios en la tabla
function renderTabla(array) {
  tablaServicios.innerHTML = '';
  array.forEach(s => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${s.servicio}</td>
      <td>${s.precio.toFixed(2)}</td>
      <td>${s.cliente}</td>
      <td>${s.montoDivisa.toFixed(2)} ${s.moneda}</td>
      <td>${s.transferencia ? 'Sí' : 'No'}</td>
      <td>
        <button class="eliminar-btn" data-id="${s.id}">❌</button>
      </td>
    `;
    tablaServicios.appendChild(fila);
  });
}

// Calcula y muestra totales en pantalla según array dado
function actualizarTotales(array) {
  const totales = {
    CUP: { efectivo: 0, transferencia: 0 },
    USD: { efectivo: 0, transferencia: 0 },
    EUR: { efectivo: 0, transferencia: 0 },
    CAD: { efectivo: 0, transferencia: 0 }
  };

  array.forEach(item => {
    if (item.transferencia) totales.CUP.transferencia += item.precio;
    else                    totales.CUP.efectivo    += item.precio;

    const m = totales[item.moneda];
    if (item.transferencia) m.transferencia += item.montoDivisa;
    else                    m.efectivo    += item.montoDivisa;
  });

  document.getElementById('valor-total').textContent            =
    (totales.CUP.efectivo + totales.CUP.transferencia).toFixed(2);
  document.getElementById('total-efectivo-cup').textContent     =
    totales.CUP.efectivo.toFixed(2);
  document.getElementById('total-transferencia-cup').textContent =
    totales.CUP.transferencia.toFixed(2);

  ['USD','EUR','CAD'].forEach(cur => {
    document.getElementById(`total-efectivo-${cur.toLowerCase()}`).textContent     =
      totales[cur].efectivo.toFixed(2);
    document.getElementById(`total-transferencia-${cur.toLowerCase()}`).textContent =
      totales[cur].transferencia.toFixed(2);
    document.getElementById(`total-${cur.toLowerCase()}`).textContent               =
      (totales[cur].efectivo + totales[cur].transferencia).toFixed(2);
  });
}

// Diccionario de precios
function definirPrecio(nombre) {
  const precios = {
    'Instalar aplicación': 300,
    'Protector de pantalla': 1500,
    'Cambio de pantalla': 1000,
    'Puerto de carga': 600,
    'Venta de teléfono': 3000,
    'Servicio personalizado': 0
  };
  return precios[nombre] || 0;
}
