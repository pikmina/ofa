const RegistrosApp = (() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbzY6sWauov11c6RQ6H-OTJMd8d7iXh5XDvUbwNpHqfexPzmkCmLNZSxne5ZPUq6gXVz/exec";

  // --- CONFIGURACIÓN DE PESTAÑAS ---
  // Aquí puedes añadir o quitar pestañas y columnas fácilmente
  const CONFIG_TABS = {
    "personaje": {
      headers: ["Nombre Completo", "Apodo", "Tipo de Don", "Tipo de Sangre", "PB", "Alineación"],
      // Definimos cómo se llena cada celda según el header
      cells: (r) => [
        `${r["Apellido"] || ""} ${r["Nombre"] || ""}`,
        r["Apodo"], r["Tipo de Don"], r["Tipo de Sangre"], r["PB"], r["Alineación"]
      ]
    },
    "pb": {
      headers: ["Nombre Completo", "Apodo", "PB"],
      cells: (r) => [`${r["Apellido"] || ""} ${r["Nombre"] || ""}`, r["Apodo"], r["PB"]]
    },
    "rango": {
      headers: ["Ocupación", "Rango", "Nombre Completo"],
      cells: (r) => [r["Ocupación"], r["Rango"], `${r["Apellido"] || ""} ${r["Nombre"] || ""}`]
    },
    "don": {
      headers: ["Nombre Completo", "Tipo de Don", "Don", "Tipo de Sangre"],
      cells: (r) => [`${r["Apellido"] || ""} ${r["Nombre"] || ""}`, r["Tipo de Don"], r["Don"], r["Tipo de Sangre"]]
    }
  };

  let registros = [];
  let filtrosActivos = {};
  let columnaOrden = null;
  let ascendente = true;
  let pestañaActiva = "personaje";
  let busquedaTexto = "";

  function init() {
    if (!document.getElementById("tabla-registros")) return;

    activarTabs();
    activarFiltros();

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        registros = data;
        generarFiltros();
        renderTabla();
      })
      .catch(err => console.error("Error cargando datos:", err));
  }

  function activarTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pestañaActiva = btn.dataset.tab;
        renderTabla();
      });
    });
  }

  function generarFiltros() {
    crearGrupoCheckbox("Grupo", "filtro-grupo");
    crearGrupoCheckbox("Tipo de Don", "filtro-don");
    crearGrupoCheckbox("Sexo", "filtro-sexo");
  }

  function crearGrupoCheckbox(campo, contenedorId) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    const valores = [...new Set(registros.map(r => r[campo]).filter(v => v))].sort();
    cont.innerHTML = `<h4>${campo}</h4>`;

    valores.forEach(val => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" data-campo="${campo}" value="${val}"> ${val}<br>`;
      cont.appendChild(label);
    });
  }

  function activarFiltros() {
    // Escuchar cambios en cualquier checkbox dentro de los contenedores de filtro
    document.addEventListener("change", e => {
      if (!e.target.closest("#filtro-grupo, #filtro-don, #filtro-sexo")) return;

      filtrosActivos = {};
      document.querySelectorAll("#filtro-grupo input:checked, #filtro-don input:checked, #filtro-sexo input:checked")
        .forEach(chk => {
          const campo = chk.dataset.campo;
          if (!filtrosActivos[campo]) filtrosActivos[campo] = [];
          filtrosActivos[campo].push(chk.value);
        });
      renderTabla();
    });

    const btnLimpiar = document.getElementById("btn-limpiar-filtros");
    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", () => {
        document.querySelectorAll("input[type='checkbox']").forEach(chk => chk.checked = false);
        filtrosActivos = {};
        renderTabla();
      });
    }

    const inputBusqueda = document.getElementById("busqueda-texto");
    if (inputBusqueda) {
      inputBusqueda.addEventListener("input", e => {
        busquedaTexto = e.target.value.toLowerCase().trim();
        renderTabla();
      });
    }
  }

  function aplicarFiltros() {
    return registros.filter(r => {
      const pasaCheckbox = Object.keys(filtrosActivos).every(campo =>
        filtrosActivos[campo].includes(r[campo])
      );
      if (!pasaCheckbox) return false;

      if (busquedaTexto) {
        return Object.values(r).some(val => 
          String(val).toLowerCase().includes(busquedaTexto)
        );
      }
      return true;
    });
  }

  function renderTabla() {
    const config = CONFIG_TABS[pestañaActiva];
    let datos = aplicarFiltros();

    // Ordenación
    if (columnaOrden) {
      datos.sort((a, b) => {
        let A = String(a[columnaOrden] || "").toLowerCase();
        let B = String(b[columnaOrden] || "").toLowerCase();
        return A.localeCompare(B) * (ascendente ? 1 : -1);
      });
    }

    const theadRow = document.querySelector("#tabla-registros thead tr");
    const tbody = document.querySelector("#tabla-registros tbody");
    if (!theadRow || !tbody) return;

    // Render Headers
    theadRow.innerHTML = config.headers.map(h =>
      `<th style="cursor:pointer" onclick="RegistrosApp.ordenar('${h}')">${h}</th>`
    ).join("");

    // Render Body (Reducción de código drástica)
    tbody.innerHTML = datos.map(r => {
      const celdas = config.cells(r);
      return `<tr>${celdas.map(c => `<td>${c || ""}</td>`).join("")}</tr>`;
    }).join("");
  }

  function ordenar(col) {
    if (columnaOrden === col) {
      ascendente = !ascendente;
    } else {
      columnaOrden = col;
      ascendente = true;
    }
    renderTabla();
  }

  return { init, ordenar };
})();

document.addEventListener("DOMContentLoaded", RegistrosApp.init);