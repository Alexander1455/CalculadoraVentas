document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js cargado correctamente");

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
  const btnAgregarFila = document.getElementById("btnAgregarFila");
  const guardarListaBtn = document.getElementById("guardarLista");
  const imprimirListaBtn = document.getElementById("imprimirLista");
  const volverCalcBtn = document.getElementById("volverCalc");

  const historialDiv = document.getElementById("historial");
  const listaHistorial = document.getElementById("listaHistorial");
  const menu = document.getElementById("menu");
  const volverDesdeHistorialBtn = document.getElementById("volverDesdeHistorial");
  const exportarHistorialBtn = document.getElementById("exportarHistorial");
  const importarHistorialBtn = document.getElementById("importarHistorial");
  const archivoHistorialInput = document.getElementById("archivoHistorial");

  let operacion = "";
  let preciosGuardados = [];
  let historialDatos = [];
  let listaActualIndex = null;
  const STORAGE_KEY = "calculadoraVentas.historial";
  const DB_NAME = "calculadoraVentas.db";
  const DB_VERSION = 1;
  const DB_STORE = "historial";
  let dbPromise = null;
  let resultadoPendiente = false;
  let expresionLimpiada = false;

  inicializarHistorial();

  function actualizarPantalla(texto) {
    pantalla.textContent = texto;
    requestAnimationFrame(() => {
      pantalla.scrollLeft = pantalla.scrollWidth;
    });
  }

  function obtenerTerminoActual() {
    const ultimoSeparador = operacion.lastIndexOf("+");
    const termino = ultimoSeparador === -1 ? operacion : operacion.slice(ultimoSeparador + 1);
    return termino.trim();
  }

  function terminoActualTienePunto() {
    return obtenerTerminoActual().includes(".");
  }

  function ultimoCaracter() {
    return operacion.length > 0 ? operacion[operacion.length - 1] : "";
  }

  function terminaConSigno() {
    return ultimoCaracter() === "+";
  }

  function terminaConPunto() {
    return ultimoCaracter() === ".";
  }

  // ===== CALCULADORA =====
  botones.forEach(boton => {
    boton.addEventListener("click", () => {
      const valor = boton.textContent;
      if (["←", "SUP", "=", "LISTA"].includes(valor)) return;
      if (valor === "." && (terminoActualTienePunto() || terminaConPunto())) return;
      if (valor === "+" && (operacion.length === 0 || terminaConSigno())) return;
      operacion += valor;
      resultadoPendiente = false;
      expresionLimpiada = false;
      actualizarPantalla(operacion);
    });
  });

  borrar.addEventListener("click", () => {
    operacion = operacion.slice(0, -1);
    resultadoPendiente = false;
    actualizarPantalla(operacion);
    expresionLimpiada = operacion.length === 0;
    if (expresionLimpiada) {
      preciosGuardados = [];
    }
  });

  sup.addEventListener("click", () => {
    operacion = "";
    actualizarPantalla("");
    preciosGuardados = [];
    resultadoPendiente = false;
    expresionLimpiada = true;
  });

  igual.addEventListener("click", () => {
    try {
      if (!operacion.trim()) return;
      preciosGuardados = parsearOperacion(operacion);
      const resultado = preciosGuardados.reduce((a, b) => a + b, 0);
      actualizarPantalla(resultado.toFixed(2));
      operacion = "";
      resultadoPendiente = true;
      expresionLimpiada = false;
    } catch {
      actualizarPantalla("Error");
      resultadoPendiente = false;
      expresionLimpiada = false;
    }
  });

  // ===== ABRIR LISTA =====
  listaBtn.addEventListener("click", () => {
    const posibles = parsearOperacion(operacion);
    if (posibles.length > 0) {
      preciosGuardados = posibles;
      resultadoPendiente = true;
    }
    abrirListaCon(preciosGuardados);
  });

  async function abrirListaCon(precios = []) {
    if (preciosGuardados.length > 0 && precios.length === 0 && !resultadoPendiente) {
      if (typeof Swal === "undefined") {
        const confirmar = confirm("¿Deseas iniciar una nueva lista? Esto eliminará la lista anterior.");
        if (!confirmar) return;
      } else {
        const resultado = await Swal.fire({
          title: "¿Iniciar nueva lista?",
          text: "Esto eliminará la lista anterior.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#4CAF50",
          cancelButtonColor: "#d33",
          confirmButtonText: "Sí, nueva lista",
          cancelButtonText: "Cancelar"
        });
        if (!resultado.isConfirmed) return;
      }
      preciosGuardados = [];
    }

    document.getElementById("calculadora").classList.add("oculto");
    historialDiv.classList.add("oculto");
    listaProductosDiv.classList.remove("oculto");

    if (precios.length === 0 || expresionLimpiada) {
      preciosGuardados = [];
    }

    listaActualIndex = null;
    cuerpoLista.innerHTML = "";
    nombreListaInput.value = "";

    if (preciosGuardados.length > 0) {
      preciosGuardados.forEach(p => agregarFila("", p));
    } else {
      agregarFila("", 0);
    }
    recalcularTotal();
    resultadoPendiente = false;
    expresionLimpiada = false;
  }

  // ===== AGREGAR FILA =====
  btnAgregarFila.addEventListener("click", () => agregarFila("", 0));

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
    inPrecio.value = Number.isFinite(precio) ? precio.toFixed(2) : "";
    inPrecio.addEventListener("input", recalcularTotal);
    tdPrecio.appendChild(inPrecio);

    const tdEliminar = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-eliminar";
    btnEliminar.textContent = "❌";
    btnEliminar.addEventListener("click", () => {
      tr.remove();
      recalcularTotal();
    });
    tdEliminar.appendChild(btnEliminar);

    tr.appendChild(tdNombre);
    tr.appendChild(tdPrecio);
    tr.appendChild(tdEliminar);

    cuerpoLista.appendChild(tr);
    recalcularTotal();
  }

  // ===== TOTAL =====
  function recalcularTotal() {
    const precios = [...cuerpoLista.querySelectorAll('input[type="number"]')]
      .map(i => parseFloat(i.value))
      .filter(v => !isNaN(v));
    const total = precios.reduce((a, b) => a + b, 0);
    totalValor.textContent = `S/ ${total.toFixed(2)}`;
  }

  // ===== GUARDAR / IMPRIMIR / VOLVER =====
  guardarListaBtn.addEventListener("click", () => {
    const filas = obtenerFilasValidas();
    if (filas.items.length === 0) {
      mostrarAlerta("Atención", "Agrega productos válidos antes de guardar.", "info");
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
    sincronizarHistorialPersistido();
    mostrarAlerta("✅ Guardado", "Lista guardada correctamente.", "success");
    preciosGuardados = [];
    resultadoPendiente = false;
    expresionLimpiada = true;
  });

  imprimirListaBtn.addEventListener("click", () => {
    const filas = obtenerFilasValidas();
    if (filas.items.length === 0)
      return mostrarAlerta("Sin productos", "Agrega productos antes de imprimir", "info");

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

  volverCalcBtn.addEventListener("click", () => {
    listaProductosDiv.classList.add("oculto");
    document.getElementById("calculadora").classList.remove("oculto");
  });

  // ===== HISTORIAL =====
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

  exportarHistorialBtn.addEventListener("click", () => {
    if (historialDatos.length === 0) {
      mostrarAlerta("Sin historial", "No hay listas guardadas para exportar.", "info");
      return;
    }
    descargarHistorialComoArchivo();
  });

  importarHistorialBtn.addEventListener("click", () => {
    if (!archivoHistorialInput) return;
    archivoHistorialInput.click();
  });

  archivoHistorialInput?.addEventListener("change", async event => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    try {
      const contenido = await archivo.text();
      const json = JSON.parse(contenido);
      const datosCrudos = Array.isArray(json?.historial) ? json.historial : json;
      const historialImportado = normalizarHistorial(datosCrudos);

      if (!historialImportado || historialImportado.length === 0) {
        mostrarAlerta("Archivo sin listas", "El archivo seleccionado no contiene listas válidas.", "info");
        return;
      }

      let modo = "replace";
      if (historialDatos.length > 0) {
        modo = await preguntarModoImportacion();
        if (!modo) {
          mostrarAlerta("Importación cancelada", "Se mantuvo el historial actual.", "info");
          return;
        }
      }

      if (modo === "replace" || historialDatos.length === 0) {
        historialDatos = historialImportado;
      } else {
        historialDatos = fusionarHistoriales(historialDatos, historialImportado);
      }

      renderHistorial();
      sincronizarHistorialPersistido();
      mostrarAlerta("Historial importado", "Las listas se cargaron correctamente.", "success");
    } catch (error) {
      console.error("No se pudo importar el historial", error);
      mostrarAlerta("Error", "No se pudo importar el archivo seleccionado.", "error");
    } finally {
      event.target.value = "";
    }
  });

  function renderHistorial() {
    listaHistorial.innerHTML = "";
    if (historialDatos.length === 0) {
      const li = document.createElement("li");
      li.classList.add("historial-vacio");
      li.textContent = "No hay listas guardadas";
      listaHistorial.appendChild(li);
      return;
    }

    historialDatos.forEach((reg, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `<div><strong>${reg.nombre}</strong><br/>Total: S/ ${reg.total.toFixed(2)}</div>`;
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
    preciosGuardados = reg.items.map(it => it.precio);
    resultadoPendiente = false;
    expresionLimpiada = false;
  }

  // ===== UTIL =====
  function obtenerFilasValidas() {
    const filas = [...cuerpoLista.querySelectorAll("tr")];
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

  function parsearOperacion(opStr) {
    if (!opStr) return [];
    return opStr
      .split("+")
      .map(x => parseFloat(x.trim()))
      .filter(x => !isNaN(x));
  }

  function mostrarAlerta(titulo, texto, icono = "info") {
    if (typeof Swal === "undefined") {
      alert(`${titulo}\n${texto}`);
    } else {
      Swal.fire(titulo, texto, icono);
    }
  }

  function cargarHistorialDesdeStorage() {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return normalizarHistorial(JSON.parse(raw));
    } catch (error) {
      console.warn("No se pudo cargar el historial desde el almacenamiento local", error);
      return null;
    }
  }

  function guardarHistorialEnStorage() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historialDatos));
    } catch (error) {
      console.warn("No se pudo guardar el historial en el almacenamiento local", error);
    }
  }

  function normalizarRegistro(registro) {
    const nombre = typeof registro?.nombre === "string" && registro.nombre.trim() ? registro.nombre.trim() : "Sin nombre";
    const items = Array.isArray(registro?.items)
      ? registro.items
          .map(item => {
            const itemNombre = typeof item?.nombre === "string" && item.nombre.trim() ? item.nombre.trim() : "(sin nombre)";
            const precio = Number(item?.precio);
            return Number.isFinite(precio) ? { nombre: itemNombre, precio } : null;
          })
          .filter(Boolean)
      : [];
    const total = items.reduce((acum, item) => acum + item.precio, 0);

    return { nombre, items, total };
  }

  function normalizarHistorial(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map(registro => normalizarRegistro(registro))
      .filter(registro => registro.items.length > 0);
  }

  function fusionarHistoriales(actual, nuevos) {
    const mapa = new Map();
    [...actual, ...nuevos].forEach(registro => {
      const clave = generarClaveRegistro(registro);
      if (!mapa.has(clave)) {
        mapa.set(clave, registro);
      }
    });
    return Array.from(mapa.values());
  }

  function generarClaveRegistro(registro) {
    const itemsClave = [...registro.items]
      .map(item => `${item.nombre}|${item.precio}`)
      .sort()
      .join(";");
    return `${registro.nombre}|${registro.total}|${itemsClave}`;
  }

  async function inicializarHistorial() {
    const desdeLocal = cargarHistorialDesdeStorage();
    if (desdeLocal) {
      historialDatos = desdeLocal;
    } else {
      const desdeIndexedDB = await cargarHistorialDesdeIndexedDB();
      if (desdeIndexedDB && desdeIndexedDB.length > 0) {
        historialDatos = desdeIndexedDB;
        guardarHistorialEnStorage();
      }
    }
    renderHistorial();
    solicitarAlmacenamientoPersistente();
  }

  function sincronizarHistorialPersistido() {
    guardarHistorialEnStorage();
    guardarHistorialEnIndexedDB();
  }

  function obtenerDB() {
    if (dbPromise) return dbPromise;
    if (typeof indexedDB === "undefined") {
      dbPromise = Promise.reject(new Error("indexedDB no disponible"));
      return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Error al abrir la base de datos"));
    });

    return dbPromise;
  }

  async function cargarHistorialDesdeIndexedDB() {
    if (typeof indexedDB === "undefined") return null;
    try {
      const db = await obtenerDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readonly");
        const store = tx.objectStore(DB_STORE);
        const request = store.get("datos");
        request.onsuccess = () => {
          const resultado = normalizarHistorial(request.result);
          resolve(resultado);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn("No se pudo cargar el historial desde IndexedDB", error);
      return null;
    }
  }

  function guardarHistorialEnIndexedDB() {
    if (typeof indexedDB === "undefined") return;
    obtenerDB()
      .then(db => {
        const tx = db.transaction(DB_STORE, "readwrite");
        const store = tx.objectStore(DB_STORE);
        store.put(historialDatos, "datos");
        return new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
      })
      .catch(error => {
        console.warn("No se pudo guardar el historial en IndexedDB", error);
      });
  }

  async function solicitarAlmacenamientoPersistente() {
    if (!navigator.storage || typeof navigator.storage.persist !== "function") return;
    try {
      const yaConcedido = await navigator.storage.persisted();
      if (!yaConcedido) {
        await navigator.storage.persist();
      }
    } catch (error) {
      console.warn("No se pudo solicitar almacenamiento persistente", error);
    }
  }

  function descargarHistorialComoArchivo() {
    try {
      const payload = {
        version: 1,
        exportadoEn: new Date().toISOString(),
        historial: historialDatos
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      const fecha = new Date().toISOString().split("T")[0];
      enlace.href = url;
      enlace.download = `historial-calculadora-${fecha}.json`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
      mostrarAlerta("Historial exportado", "Se descargó un respaldo en formato JSON.", "success");
    } catch (error) {
      console.error("No se pudo exportar el historial", error);
      mostrarAlerta("Error", "Ocurrió un problema al generar el archivo.", "error");
    }
  }

  async function preguntarModoImportacion() {
    if (typeof Swal !== "undefined") {
      const resultado = await Swal.fire({
        title: "¿Cómo deseas importar?",
        text: "Puedes combinar las listas con el historial actual o reemplazarlo completamente.",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Combinar",
        denyButtonText: "Reemplazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#4caf50",
        denyButtonColor: "#d33"
      });
      if (resultado.isConfirmed) return "merge";
      if (resultado.isDenied) return "replace";
      return null;
    }

    const confirmarReemplazo = confirm(
      "Ya tienes listas guardadas. Aceptar para reemplazarlas con el archivo, Cancelar para combinarlas."
    );
    return confirmarReemplazo ? "replace" : "merge";
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sincronizarHistorialPersistido();
    }
  });

  window.addEventListener("pagehide", () => {
    sincronizarHistorialPersistido();
  });
});
