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
    preciosGuardados = operacion.split("+").map(n => parseFloat(n));
    const resultado = preciosGuardados.reduce((a,b) => a+b, 0);
    pantalla.textContent = resultado.toFixed(2);
    operacion = "";
  } catch {
    pantalla.textContent = "Error";
  }
});

// --- LISTA ---
listaBtn.addEventListener("click", () => {
  if (preciosGuardados.length === 0) {
    alert("Primero realiza una operación con '='");
    return;
  }
  document.getElementById("calculadora").classList.add("oculto");
  listaProductosDiv.classList.remove("oculto");

  // Construir tabla editable
  cuerpoLista.innerHTML = "";
  preciosGuardados.forEach(precio => {
    const fila = document.createElement("tr");

    const tdNombre = document.createElement("td");
    const inputNombre = document.createElement("input");
    inputNombre.placeholder = "Producto";
    tdNombre.appendChild(inputNombre);

    const tdPrecio = document.createElement("td");
    tdPrecio.textContent = precio.toFixed(2);

    fila.appendChild(tdNombre);
    fila.appendChild(tdPrecio);
    cuerpoLista.appendChild(fila);
  });
});

// --- VOLVER ---
volverCalc.addEventListener("click", () => {
  guardarListaEnHistorial();
  listaProductosDiv.classList.add("oculto");
  document.getElementById("calculadora").classList.remove("oculto");
});

// --- GUARDAR LISTA EN HISTORIAL ---
function guardarListaEnHistorial() {
  const items = [];
  let total = 0;

  [...cuerpoLista.querySelectorAll("tr")].forEach(fila => {
    const nombre = fila.querySelector("input").value || "(sin nombre)";
    const precio = parseFloat(fila.cells[1].textContent);
    items.push({ nombre, precio });
    total += precio;
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
    btnVer.addEventListener("click", () => {
      abrirListaDesdeHistorial(index);
    });

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
  registro.items.forEach(item => {
    const fila = document.createElement("tr");

    const tdNombre = document.createElement("td");
    const inputNombre = document.createElement("input");
    inputNombre.value = item.nombre;
    tdNombre.appendChild(inputNombre);

    const tdPrecio = document.createElement("td");
    tdPrecio.textContent = item.precio.toFixed(2);

    fila.appendChild(tdNombre);
    fila.appendChild(tdPrecio);
    cuerpoLista.appendChild(fila);
  });
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
    const nombre = fila.querySelector("input").value || "(sin nombre)";
    const precio = parseFloat(fila.cells[1].textContent);
    total += precio;
    doc.text(`${nombre} - S/ ${precio.toFixed(2)}`, 10, y);
    y += 10;
  });

  doc.text(`TOTAL: S/ ${total.toFixed(2)}`, 10, y + 10);

  doc.save("lista.pdf");
});
