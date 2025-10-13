// ====== ELEMENTOS ======
const pantalla = document.getElementById("pantalla");
const botones = document.querySelectorAll("#botones button");
const borrar = document.getElementById("borrar");
const sup = document.getElementById("sup");
const igual = document.getElementById("igual");
const listaBtn = document.getElementById("lista");

const listaProductosDiv = document.getElementById("listaProductos");
const nombreListaInput = document.getElementById("nombreLista");
const cuerpoLista = document.getElementById("cuerpoLista");
const totalValor = document.getElementById("totalValor");
const guardarListaBtn = document.getElementById("guardarLista");
const imprimirListaBtn = document.getElementById("imprimirLista");
const volverCalcBtn = document.getElementById("volverCalc");
const btnAgregarFila = document.getElementById("btnAgregarFila");

const historialDiv = document.getElementById("historial");
const listaHistorial = document.getElementById("listaHistorial");
const menu = document.getElementById("menu");
const volverDesdeHistorialBtn = document.getElementById("volverDesdeHistorial");

// ====== ESTADO ======
let operacion = "";
let preciosGuardados = [];
let historialDatos = []; // [{nombre,total,items:[{nombre,precio}]}]
let listaActualIndex = null;

// ====== CALCULADORA ======
botones.forEach(boton => {
  boton.addEventListener("click", () => {
    const valor = boton.textContent;
    if (["←", "SUP", "=", "LISTA"].includes(valor)) return;
    operacion += valor;
    pantalla.textContent = operacion;
  });
});

borrar.addEventListener("click", () => {
  operacion = operacion.slice(0, -1);
  pantalla.textContent = operacion;
});

sup.addEventListener("click", () => {
  operacion = "";
  pantalla.textContent = "";
});

igual.addEventListener("click", () => {
  try {
    preciosGuardados = operacion
      .split("+")
      .map(n => parseFloat(n))
      .filter(n => !isNaN(n));
    const resultado = preciosGuardados.reduce((a, b) => a + b, 0);
    pantalla.textContent = resultado.toFixed(2);
    operacion = ""; // se limpia pero se conserva preciosGuardados
  } catch {
    pantalla.textContent = "Error";
  }
});

// ====== ABRIR LISTA ======
listaBtn.addEventListener("click", () => {
  document.getElementById("calculadora").classList.add("oculto");
  historialDiv.classList.add("oculto");
  listaProductosDiv.classList.remove("oculto");

  listaActualIndex = null;
  cuerpoLista.innerHTML = "";

  // Si se venía de la calculadora con sumas
  if (operacion && operacion.includes("+")) {
    preciosGuardados = operacion
      .split("+")
      .map(n => parseFloat(n))
      .filter(n => !isNaN(n));
  }

  if (preciosGuardados.length > 0) {
    preciosGuardados.forEach(p => agregarFila("Producto", p));
  } else {
    agregarFila("", 0);
  }

  recalcularTotal();
});

// ====== AGREGAR FILA ======
function agregarFila(nombre = "", precio = 0) {
  const tr = document.createElement("tr");

  const tdNombre = document.createElement("td");
  const inNombre = document.createElement("input");
  inNombre.type = "text";
  inNombre.placeholder = "Producto";
  inNombre.value = nombre;
  tdNombre.appendChild(inNombre);

  const tdPrecio = document.createElement("td");
  const inPrecio = document.createElement("input");
  inPrecio.type = "number";
  inPrecio.placeholder = "0.00";
  inPrecio.step = "0.01";
  inPrecio.min = "0";
  inPrecio.value = precio ? precio.toFixed(2) : "";
  inPrecio.addEventListener("input", recalcularTotal);
  tdPrecio.appendChild(inPrecio);

  const tdEliminar = document.createElement("td");
  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn-eliminar";
  btnEliminar.textContent = "❌";
  btnEliminar.title = "Eliminar producto";
  btnEliminar.addEventListener("click", () => {
    tr.remove();
    recalcularTotal();
  });
  tdEliminar.appendChild(btnEliminar);

  tr.appendChild(tdNombre);
  tr.appendChild(tdPrecio);
  tr.appendChild(tdEliminar);

  const filaAgregar = document.getElementById("filaAgregar");
  cuerpoLista.insertBefore(tr, filaAgregar);
  recalcularTotal();
}

// ✅ se asegura que el botón funcione siempre
btnAgregarFila.onclick = () => agregarFila("", 0);

// ====== CALCULAR TOTAL ======
function recalcularTotal() {
  const precios = [...cuerpoLista.querySelectorAll('input[type="number"]')]
    .map(i => parseFloat(i.value))
    .filter(v => !isNaN(v));
  const total = precios.reduce((a, b) => a + b, 0);
  totalValor.textContent = `S/ ${total.toFixed(2)}`;
}

// ====== GUARDAR ======
guardarListaBtn.addEventListener("click", () => {
  const filas = obtenerFilasValidas();
  if (filas.items.length === 0) {
    alert("Agrega productos válidos antes de guardar");
    return;
  }

  const registro = {
    nombre: (nombreListaInput.value || "Sin nombre").trim(),
    total: filas.total,
    items: filas.items
  };

  if (listaActualIndex === null) {
    historialDatos.push(registro);
    listaActualIndex = historialDatos.length - 1;
  } else {
    historialDatos[listaActualIndex] = registro;
  }

  renderHistorial();
  alert("✅ Lista guardada correctamente");
});

// ====== IMPRIMIR ======
imprimirListaBtn.addEventListener("click", () => {
  const filas = obtenerFilasValidas();
  if (filas.items.length === 0) return alert("No hay productos para imprimir");

  const nombre = (nombreListaInput.value || "Lista sin nombre").trim();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(nombre, 10, 10);
  doc.text("Lista de productos", 10, 20);

  let y = 30;
  filas.items.forEach(it => {
    doc.text(`${it.nombre} - S/ ${it.precio.toFixed(2)}`, 10, y);
    y += 10;
  });

  doc.text(`TOTAL: S/ ${filas.total.toFixed(2)}`, 10, y + 10);
  doc.save(`${nombre}.pdf`);
});

// ====== VOLVER ======
volverCalcBtn.addEventListener("click", () => {
  listaProductosDiv.classList.add("oculto");
  document.getElementById("calculadora").classList.remove("oculto");
  // conservamos preciosGuardados si quieres continuar luego
});

// ====== HISTORIAL ======
menu.addEventListener("click", () => {
  document.getElementById("calculadora").classList.add("oculto");
  listaProductosDiv.classList.add("oculto");
  historialDiv.classList.remove("oculto");
  renderHistorial();
});

volverDesdeHistorialBtn.addEventListener("click", () => {
  historialDiv.classList.add("oculto");
  document.getElementById("calculadora").classList.remove("oculto");
});

// ====== HISTORIAL FUNCIONAL ======
function renderHistorial() {
  listaHistorial.innerHTML = "";
  historialDatos.forEach((reg, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>${reg.nombre}</strong><br/>Total: S/ ${reg.total.toFixed(
      2
    )}</div>`;
    const ver = document.createElement("button");
    ver.textContent = "VER";
    ver.addEventListener("click", () => abrirListaGuardada(idx));
    li.appendChild(ver);
    listaHistorial.appendChild(li);
  });
}

function abrirListaGuardada(index) {
  const reg = historialDatos[index];
  listaActualIndex = index;

  historialDiv.classList.add("oculto");
  listaProductosDiv.classList.remove("oculto");
  document.getElementById("calculadora").classList.add("oculto");

  nombreListaInput.value = reg.nombre;
  cuerpoLista.innerHTML = "";
  reg.items.forEach(it => agregarFila(it.nombre, it.precio));
  recalcularTotal();
}

// ====== UTIL ======
function obtenerFilasValidas() {
  const filas = [...cuerpoLista.querySelectorAll("tbody tr")];
  const items = [];
  let total = 0;
  filas.forEach(tr => {
    const inNombre = tr.querySelector('input[type="text"]');
    const inPrecio = tr.querySelector('input[type="number"]');
    if (!inPrecio) return;
    const precio = parseFloat(inPrecio.value);
    if (!isNaN(precio)) {
      const nombre = (inNombre?.value || "(sin nombre)").trim();
      items.push({ nombre, precio });
      total += precio;
    }
  });
  return { items, total };
}