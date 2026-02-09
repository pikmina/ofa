// 👉 URL de TU hoja de cálculo
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQm9H974C5O1TPyBm4CFM7Iu2_OVDyE4b2ndHeduqxWwFldHVuPpuZ1lii09WCgRs0QpIKF82mRp8sd/pub?gid=1538740590&single=true&output=csv";

let registros = [];
let sortColumn = "";
let sortAsc = true;

// ----------------------
// Cargar CSV
// ----------------------
function cargarCSV() {
  fetch(CSV_URL)
    .then(r => r.text())
    .then(text => {
      registros = parseCSV(text);
      generarFiltros();
      mostrarTabla();
    });
}

// ----------------------
// Parsear CSV → Array de objetos
// ----------------------
function parseCSV(data) {
  const rows = data.split("\n").map(r => r.split(","));
  const headers = rows.shift().map(h => h.trim());

  return rows
    .filter(r => r.length >= headers.length && r.some(c => c.trim() !== ""))
    .map(r => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = (r[i] || "").trim());
      return obj;
    });
}

// ----------------------
// Generar filtros dinámicos
// ----------------------
function generarFiltros() {
  generarCheckbox("Grupo", "filtro-grupo");
  generarCheckbox("Tipo de Don", "filtro-don");
  generarCheckbox("Sexo", "filtro-sexo");
}

function generarCheckbox(campo, contenedorId) {
  const valores = [...new Set(registros.map(r => r[campo]).filter(v => v))];
  const cont = document.getElementById(contenedorId);
  cont.innerHTML = "";

  valores.sort().forEach(val => {
    const id = campo + "-" + val.replace(/\s/g, "_");
    cont.innerHTML += `
      <label>
        <input type="checkbox" class="chk" data-campo="${campo}" value="${val}">
        ${val}
      </label><br>
    `;
  });

  cont.querySelectorAll(".chk").forEach(chk =>
    chk.addEventListener("change", mostrarTabla)
  );
}

// ----------------------
// Mostrar tabla filtrada y ordenada
// ----------------------
function mostrarTabla() {
  let filtrados = registros.filter(r => {
    let ok = true;

    document.querySelectorAll(".chk").forEach(chk => {
      if (chk.checked && r[chk.dataset.campo] !== chk.value) {
        ok = false;
      }
    });

    return ok;
  });

  if (sortColumn) {
    filtrados.sort((a, b) => {
      let A = a[sortColumn].toLowerCase();
      let B = b[sortColumn].toLowerCase();
      return (A < B ? -1 : A > B ? 1 : 0) * (sortAsc ? 1 : -1);
    });
  }

  const tbody = document.querySelector("#tabla-registros tbody");
  tbody.innerHTML = "";

  filtrados.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r["Nombre"]}</td>
        <td>${r["Apellido"]}</td>
        <td>${r["Grupo"]}</td>
        <td>${r["Tipo de Don"]}</td>
        <td>${r["Alineación"]}</td>
        <td>${r["Tipo de Sangre"]}</td>
        <td>${r["Apodo"]}</td>
        <td>${r["Sexo"]}</td>
        <td>${r["PB"]}</td>
      </tr>
    `;
  });
}

// ----------------------
// Ordenar por columna
// ----------------------
function ordenar(col) {
  if (sortColumn === col) {
    sortAsc = !sortAsc;
  } else {
    sortColumn = col;
    sortAsc = true;
  }
  mostrarTabla();
}

cargarCSV();