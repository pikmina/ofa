const RegistrosApp = (() => {

  const API_URL = "https://script.google.com/macros/s/AKfycbzY6sWauov11c6RQ6H-OTJMd8d7iXh5XDvUbwNpHqfexPzmkCmLNZSxne5ZPUq6gXVz/exec";

  let registros = [];
  let filtrosActivos = {};
  let columnaOrden = null;
  let ascendente = true;
  let pestañaActiva = "pb";

  /* ================================
     INIT
  ================================= */
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
      .catch(err => console.error(err));
  }

  /* ================================
     TABS (USA LAS DEL HTML)
  ================================= */
  function activarTabs() {

    document.querySelectorAll(".tab-btn").forEach(btn => {

      btn.addEventListener("click", () => {

        document.querySelectorAll(".tab-btn")
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        pestañaActiva = btn.dataset.tab;
        renderTabla();
      });

    });
  }

  /* ================================
     FILTROS
  ================================= */
  function generarFiltros() {
    crearGrupoCheckbox("Grupo", "filtro-grupo");
    crearGrupoCheckbox("Tipo de Don", "filtro-don");
    crearGrupoCheckbox("Sexo", "filtro-sexo");
  }

  function crearGrupoCheckbox(campo, contenedorId) {

    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    const valores = [...new Set(
      registros.map(r => r[campo]).filter(v => v)
    )].sort();

    cont.innerHTML = "";

    /* ========= ENCABEZADO ========= */
    const titulo = document.createElement("h4");
    titulo.textContent = campo; // Usa el nombre del campo como título
    cont.appendChild(titulo);

    /* ========= CHECKBOXES ========= */
    valores.forEach(val => {

      const label = document.createElement("label");

      label.innerHTML = `
      <input type="checkbox" data-campo="${campo}" value="${val}">
      ${val}
    `;

      cont.appendChild(label);
      cont.appendChild(document.createElement("br"));
    });
  }

  function activarFiltros() {

    document.addEventListener("change", e => {

      if (!e.target.matches("#filtro-grupo input, #filtro-don input, #filtro-sexo input")) return;

      filtrosActivos = {};

      document.querySelectorAll(
        "#filtro-grupo input:checked, #filtro-don input:checked, #filtro-sexo input:checked"
      ).forEach(chk => {

        const campo = chk.dataset.campo;
        if (!filtrosActivos[campo]) filtrosActivos[campo] = [];
        filtrosActivos[campo].push(chk.value);
      });

      renderTabla();
    });
    const btnLimpiar = document.getElementById("btn-limpiar-filtros");

    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", () => {

        // Desmarcar todos los checkboxes
        document.querySelectorAll(
          "#filtro-grupo input, #filtro-don input, #filtro-sexo input"
        ).forEach(chk => chk.checked = false);

        // Vaciar filtros activos
        filtrosActivos = {};

        // Renderizar tabla completa
        renderTabla(registros);
      });
    }
  }

  function aplicarFiltros() {

    return registros.filter(r => {
      return Object.keys(filtrosActivos).every(campo =>
        filtrosActivos[campo].includes(r[campo])
      );
    });
  }

  /* ================================
     RENDER TABLA
  ================================= */
  function renderTabla() {

    let datos = aplicarFiltros();

    if (columnaOrden) {
      datos.sort((a, b) => {
        let A = (a[columnaOrden] || "").toString().toLowerCase();
        let B = (b[columnaOrden] || "").toString().toLowerCase();
        return (A < B ? -1 : A > B ? 1 : 0) * (ascendente ? 1 : -1);
      });
    }

    const theadRow = document.querySelector("#tabla-registros thead tr");
    const tbody = document.querySelector("#tabla-registros tbody");

    if (!theadRow || !tbody) return;

    let headers = [];
    let filas = "";

    if (pestañaActiva === "personaje") {
      headers = ["Nombre", "Apodo", "Tipo de Don", "Tipo de Sangre", "PB", "Alineación"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>
            <td>${r["Apodo"] || ""}</td>
            <td>${r["Tipo de Don"] || ""}</td>
            <td>${r["Tipo de Sangre"] || ""}</td>
            <td>${r["PB"] || ""}</td>
            <td>${r["Alineación"] || ""}</td>
        `;
      });
    }

    if (pestañaActiva === "pb") {
      headers = ["Nombre", "Apodo", "PB"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>
            <td>${r["Apodo"] || ""}</td>
            <td>${r["PB"] || ""}</td>
          </tr>
        `;
      });
    }

    if (pestañaActiva === "rango") {
      headers = ["Ocupación", "Rango", "Nombre"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Ocupación"] || ""}</td>
            <td>${r["Rango"] || ""}</td>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>           
          </tr>
        `;
      });
    }

    if (pestañaActiva === "don") {
      headers = ["Nombre", "Tipo de Don", "Don", "Tipo de Sangre"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>
            <td>${r["Tipo de Don"] || ""}</td>
            <td>${r["Don"] || ""}</td>
            <td>${r["Tipo de Sangre"] || ""}</td>
          </tr>
        `;
      });
    }



    // Render encabezados dinámicos
    theadRow.innerHTML = headers.map(h =>
      `<th onclick="RegistrosApp.ordenar('${h}')">${h}</th>`
    ).join("");

    tbody.innerHTML = filas;
  }

  /* ================================
     SORT
  ================================= */
  function ordenar(col) {

    if (columnaOrden === col) {
      ascendente = !ascendente;
    } else {
      columnaOrden = col;
      ascendente = true;
    }

    renderTabla();
  }

  return {
    init,
    ordenar
  };

})();

document.addEventListener("DOMContentLoaded", () => {
  RegistrosApp.init();
});