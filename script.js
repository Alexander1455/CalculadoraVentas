const pantalla = document.getElementById("pantalla");
const botones = document.querySelectorAll("#botones button");
const borrar = document.getElementById("borrar");
const sup = document.getElementById("sup");
const igual = document.getElementById("igual");
const listaBtn = document.getElementById("lista");
const listaProductosDiv = document.getElementById("listaProductos");
const cuerpoLista = document.getElementById("cuerpoLista");
const imprimirLista = document.getElementById("imprimirLista");
const volverCalc = document.getElementById("volverCalc");
const historialDiv = document.getElementById("historial");
const listaHistorial = document.getElementById("listaHistorial");
const menu = document.getElementById("menu");
const volverDesdeHistorial = document.getElementById("volverDesdeHistorial");

let operacion = "";
let preciosGuardados = [];
let historialDatos = [];

// --- CALCULADORA ---
botones.forEach(boton => {
  boton.addEventListener("click", () => {
    const valor = boton.textContent;
    if (["←","SUP","=","LISTA"].includes(valor)) return;
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
    preciosGuardados = operacion.split("+").map(n => parseFloat(n)).filter(n => !isNaN(n));
    const resultado = preciosGuardados.reduce((a,b) => a+b, 0);
    pantalla.textContent = resultado.toFixed(2);
    operacion = "";
  } catch {
    pantalla.textContent = "Error";
  }
});

// --- LISTA ---
listaBtn.addEventListener("click", () => {
  document.getElementById("calculadora").classList.add("oculto");
  listaProductosDiv.classList.remove("oculto");
  cuerpoLista.innerHTML = "";

  // Si hay precios guardados, mostrarlos
  if (preciosGuardados.length > 0) {
    preciosGuardados.forEach(precio => {
      agregarFila("Producto", precio);
    });
  } 
  // Si no hay sumas, lista vacía
  else {
    agregarFila("", 0);
  }

  agregarBotonAgregar();
  agregarFilaTotal();
});

// --- AGREGAR FILA ---
function agregarFila(nombre = "", precio = 0) {
  const fila = document.createElement("tr");

  const tdNombre = document.createElement("td");
  const inputNombre = document.createElement("input");
  inputNombre.placeholder = "Producto";
  inputNombre.value = nombre;
  tdNombre.appendChild(inputNombre);

  const tdPrecio = document.createElement("td");
  const inputPrecio = document.createElement("input");
  inputPrecio.type = "number";
  inputPrecio.min = "0";
  inputPrecio.step = "0.01";
  inputPrecio.value = precio ? precio.toFixed(2) : "";
  inputPrecio.placeholder = "0.00";
  tdPrecio.appendChild(inputPrecio);

  // Nueva columna de eliminar
  const tdEliminar = document.createElement("td");
  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "❌";
  btnEliminar.title = "Eliminar producto";
  btnEliminar.style.background = "transparent";
  btnEliminar.style.border = "none";
  btnEliminar.style.cursor = "pointer";
  btnEliminar.style.fontSize = "16px";
  btnEliminar.addEventListener("click", () => {
    fila.remove();
    calcularTotalLista();
  });
  tdEliminar.appendChild(btnEliminar);

  // Evento de recálculo al cambiar precio
  inputPrecio.addEventListener("input", calcularTotalLista);

  fila.appendChild(tdNombre);
  fila.appendChild(tdPrecio);
  fila.appendChild(tdEliminar);

  const filaAgregar = document.getElementById("filaAgregar");
  if (filaAgregar) {
    cuerpoLista.insertBefore(fila, filaAgregar);
  } else {
    cuerpoLista.appendChild(fila);
  }

  calcularTotalLista();
}

// --- BOTÓN "AGREGAR PRODUCTO" ---
function agregarBotonAgregar() {
  if (document.getElementById("filaAgregar")) return;

  const fila = document.createElement("tr");
  fila.id = "filaAgregar";

  const tdBoton = document.createElement("td");
  tdBoton.colSpan = 3;
  tdBoton.style.textAlign = "center";

  const btnAgregar = document.createElement("button");
  btnAgregar.textContent = "+ Agregar producto";
  btnAgregar.style.background = "#4CAF50";
  btnAgregar.style.color = "white";
  btnAgregar.style.border = "none";
  btnAgregar.style.borderRadius = "8px";
  btnAgregar.style.padding = "8px 12px";
  btnAgregar.style.cursor = "pointer";
  btnAgregar.style.fontWeight = "bold";
  btnAgregar.style.marginTop = "5px";
  btnAgregar.addEventListener("click", () => agregarFila("", 0));

  tdBoton.appendChild(btnAgregar);
  fila.appendChild(tdBoton);
  cuerpoLista.appendChild(fila);
}

// --- FILA TOTAL ---
function agregarFilaTotal() {
  const fila = document.createElement("tr");
  fila.id = "filaTotal";

  const tdLabel = document.createElement("td");
  tdLabel.textContent = "TOTAL";
  tdLabel.colSpan = 2;
  tdLabel.style.fontWeight = "bold";

  const tdValor = document.createElement("td");
  tdValor.id = "totalValor";
  tdValor.textContent = "S/ 0.00";
  tdValor.style.fontWeight = "bold";

  fila.appendChild(tdLabel);
  fila.appendChild(tdValor);
  cuerpoLista.appendChild(fila);

  calcularTotalLista();
}

// --- CALCULAR TOTAL ---
function calcularTotalLista() {
  const precios = [...cuerpoLista.querySelectorAll("tr input[type='number']")]
    .map(input => parseFloat(input.value))
    .filter(val => !isNaN(val));

  const total = precios.reduce((a,b) => a+b, 0);
  const totalCell = document.getElementById("totalValor");
  if (totalCell) totalCell.textContent = `S/ ${total.toFixed(2)}`;
}

// --- VOLVER ---
volverCalc.addEventListener("click", () => {
  guardarListaEnHistorial();
  preciosGuardados = [];
  cuerpoLista.innerHTML = "";
  pantalla.textContent = "";
  operacion = "";
  listaProductosDiv.classList.add("oculto");
  document.getElementById("calculadora").classList.remove("oculto");
});

// --- GUARDAR LISTA EN HISTORIAL ---
function guardarListaEnHistorial() {
  const filas = [...cuerpoLista.querySelectorAll("tr")].filter(f => 
    f.id !== "filaTotal" && f.id !== "filaAgregar"
  );
  if (filas.length === 0) return;

  const items = [];
  let total = 0;

  filas.forEach(fila => {
    const nombre = fila.querySelector("input[type='text']").value || "(sin nombre)";
    const precio = parseFloat(fila.querySelector("input[type='number']").value);
    if (!isNaN(precio)) {
      items.push({ nombre, precio });
      total += precio;
    }
  });

  if (items.length > 0) {
    historialDatos.push({ total, items });
    mostrarHistorial();
  }
}

// --- MOSTRAR HISTORIAL ---
function mostrarHistorial() {
  listaHistorial.innerHTML = "";
  historialDatos.forEach((registro, index) => {
    const li = document.createElement("li");
    li.textContent = `Lista ${index+1} - Total: S/ ${registro.total.toFixed(2)} `;

    const btnVer = document.createElement("button");
    btnVer.textContent = "VER";
    btnVer.addEventListener("click", () => abrirListaDesdeHistorial(index));

    li.appendChild(btnVer);
    listaHistorial.appendChild(li);
  });
}

// --- ABRIR LISTA DESDE HISTORIAL ---
function abrirListaDesdeHistorial(index) {
  const registro = historialDatos[index];
  document.getElementById("calculadora").classList.add("oculto");
  historialDiv.classList.add("oculto");
  listaProductosDiv.classList.remove("oculto");

  cuerpoLista.innerHTML = "";
  registro.items.forEach(item => agregarFila(item.nombre, item.precio));
  agregarBotonAgregar();
  agregarFilaTotal();
}

// --- HISTORIAL BOTÓN ☰ ---
menu.addEventListener("click", () => {
  document.getElementById("calculadora").classList.add("oculto");
  listaProductosDiv.classList.add("oculto");
  historialDiv.classList.remove("oculto");
});

// --- VOLVER DESDE HISTORIAL ---
volverDesdeHistorial.addEventListener("click", () => {
  historialDiv.classList.add("oculto");
  document.getElementById("calculadora").classList.remove("oculto");
});

// --- IMPRIMIR LISTA ---
imprimirLista.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Lista de productos", 10, 10);

  let y = 20;
  let total = 0;

  [...cuerpoLista.querySelectorAll("tr")].forEach(fila => {
    const nombreInput = fila.querySelector("input[type='text']");
    const precioInput = fila.querySelector("input[type='number']");
    if (!nombreInput || !precioInput) return;

    const nombre = nombreInput.value || "(sin nombre)";
    const precio = parseFloat(precioInput.value);
    if (!isNaN(precio)) {
      total += precio;
      doc.text(`${nombre} - S/ ${precio.toFixed(2)}`, 10, y);
      y += 10;
    }
  });

  doc.text(`TOTAL: S/ ${total.toFixed(2)}`, 10, y + 10);
  doc.save("lista.pdf");
});
