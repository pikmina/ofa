/* CONFIGURACIÓN */
const API_URL = "https://script.google.com/macros/s/AKfycbw1luBLVRy54DPKa2dZHkRGpodiJPfmK-_Ci5QvAKI3kZA1WoXbEYCC0_8_PTY3oKELBw/exec"; // ← reemplazar

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("tienda")) return;

  // Obtener productos desde Google Sheets
  const productos = await fetch(API_URL).then(r => r.json());

  // Construir categorías
  const categorias = [...new Set(productos.map(p => p.Categoría))];

  let html = "";
  categorias.forEach(cat => {
    html += `<h2>${cat}</h2><div class="product-list">`;
    productos
      .filter(p => p.Categoría === cat)
      .forEach(p => {
        const precioExp = p.PrecioEXP || 0;
        const precioYen = p.PrecioYenes || 0;

        html += `
        <div class="product">
          <p-title>${p.Nombre}</p-title>
          <small>${p.Descripción}</small>
          
          <p-price>
          ${precioExp > 0 ? `EXP: ${precioExp}<br>` : ""}
          ${precioYen > 0 ? `¥: ${precioYen}<br>` : ""}
          </p-price>

          ${p.Imagen ? `<img src="${p.Imagen}" class="producto-img">` : ""}
          
          <button class="btn-add" 
                  data-nombre="${p.Nombre}" 
                  data-exp="${precioExp}" 
                  data-yen="${precioYen}">
            Agregar al carrito
          </button>
        </div>`;
      });
    html += "</div>";
  });

  document.getElementById("tienda").innerHTML = html;

  // Carrito
  let carrito = [];

  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.onclick = () => {
      carrito.push({
        nombre: btn.dataset.nombre,
        exp: Number(btn.dataset.exp),
        yen: Number(btn.dataset.yen)
      });
      renderCarrito();
    };
  });

  function renderCarrito() {
    const totalEXP = carrito.reduce((s, p) => s + p.exp, 0);
    const totalYEN = carrito.reduce((s, p) => s + p.yen, 0);

    if (carrito.length === 0) {
      document.getElementById("carrito").innerHTML = "<i>Carrito vacío</i>";
      return;
    }

    let html = carrito
      .map(p => {
        let linea = `• ${p.nombre} – `;
        if (p.exp > 0) linea += `${p.exp} EXP`;
        if (p.yen > 0) linea += `${p.yen} ¥`;
        return linea;
      })
      .join("<br>");

    html += `<br><b>Total EXP:</b> ${totalEXP}`;
    html += `<br><b>Total ¥:</b> ${totalYEN}`;

    document.getElementById("carrito").innerHTML = html;
  }

  // Finalizar compra: postea al foro
document.getElementById("btn-finalizar").onclick = async () => {
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  const totalEXP = carrito.reduce((s, p) => s + p.exp, 0);
  const totalYEN = carrito.reduce((s, p) => s + p.yen, 0);

  /* ========== 1. Obtener saldo del usuario ========== */
  const saldoEXP = await getExperiencia();
  const saldoYEN = await getYenes();

  /* ========== 2. Verificar si alcanza ========== */
  if (saldoEXP < totalEXP) {
    alert(`No tienes suficiente EXP.\nNecesitas: ${totalEXP}\nTienes: ${saldoEXP}`);
    return;
  }

  if (saldoYEN < totalYEN) {
    alert(`No tienes suficientes Yenes.\nNecesitas: ${totalYEN}\nTienes: ${saldoYEN}`);
    return;
  }

  /* ========== 3. Descontar monedas ========== */
  await setExperiencia(saldoEXP - totalEXP);
  await setYenes(saldoYEN - totalYEN);

  /* ========== 4. Crear mensaje final ========== */
  const texto =
    `[b]Compra realizada:[/b]\n\n` +
    carrito
      .map(p => {
        let linea = `• ${p.nombre} – `;
        if (p.exp > 0) linea += `${p.exp} EXP `;
        if (p.yen > 0) linea += `${p.yen} ¥`;
        return linea;
      })
      .join("\n") +
    `\n\n[b]Total EXP:[/b] ${totalEXP}\n[b]Total ¥:[/b] ${totalYEN}`;

  document.getElementById("mensaje-post").value = texto;
  document.getElementById("form-post").submit();
};


  /* ============================================
   FUNCIONES PARA LEER Y EDITAR PUNTOS EN FOROACTIVO
   ============================================ */

/* Leer valor actual de un campo de puntos (por field_id) */
async function getPuntos(fieldId) {
  const url = `/profile?mode=editprofile&page_profil=${fieldId}`;

  const html = await fetch(url, {
    method: "GET",
    credentials: "include"
  }).then(r => r.text());

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const input = doc.querySelector("input[name='field_"+fieldId+"']");
  if (!input) return null;

  return Number(input.value || 0);
}


/* Descontar puntos y guardarlos */
async function setPuntos(fieldId, nuevoValor) {
  const url = `/profile?mode=editprofile&page_profil=${fieldId}`;

  const html = await fetch(url, {
    method: "GET",
    credentials: "include"
  }).then(r => r.text());

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const form = doc.querySelector("form[name='formulaire']");
  if (!form) {
    alert("No se pudo acceder al formulario del perfil.");
    return false;
  }

  const formData = new FormData(form);
  formData.set("field_" + fieldId, nuevoValor);

  // submit real
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  return res.ok;
}


/* Funciones directas para tus monedas */
async function getYenes() {
  return await getPuntos(13);
}

async function getExperiencia() {
  return await getPuntos(1);
}

async function setYenes(valor) {
  return await setPuntos(13, valor);
}

async function setExperiencia(valor) {
  return await setPuntos(1, valor);
}

});
