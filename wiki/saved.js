<div id="wiki-wrapper">
    <div id="wiki-sidebar">Cargando categorías…</div>
    <div id="wiki-content">
        <input id="wiki-search" type="text" placeholder="Buscar artículo…" />
        <div id="wiki-list">Cargando artículos…</div>
        <div id="wiki-article" style="display:none;">Cargando…</div>
    </div>
</div>

<script>
// ===============================
// CONFIG
// ===============================
const API_CATEGORIES = "https://saxagenia.com/wp-json/wp/v2/doc_category";
const API_DOCS = "https://saxagenia.com/wp-json/wp/v2/docs";
const API_DOC = id => `https://saxagenia.com/wp-json/wp/v2/docs/${id}`;

let ALL_DOCS = [];
let ALL_CATEGORIES = [];

// ===============================
// LOAD CATEGORIES (SIDEBAR)
// ===============================
async function loadCategories(categories) {
    const side = document.getElementById("wiki-sidebar");

    let html = "<h3>Enciclopedia</h3><ul class='wiki-tree'>";
    categories.sort((a, b) => a.name.localeCompare(b.name))
    .forEach(cat => {
        html += `
        <li class="wiki-cat" data-cat="${cat.id}">
            📁 ${cat.name}
        </li>`;
    });
    html += "</ul>";

    side.innerHTML = html;

    document.querySelectorAll(".wiki-cat").forEach(el => {
        el.addEventListener("click", () => {
            const id = parseInt(el.getAttribute("data-cat"));
            filterByCategory(id);
        });
    });
}

// ===============================
// LOAD DOCS (LIST)
// ===============================
function loadDocs(docs, categories) {
    ALL_DOCS = docs;
    ALL_CATEGORIES = categories;
    renderDocs(docs);
}

// ===============================
// RENDER LIST (CARDS)
// ===============================
function renderDocs(list) {
    const listBox = document.getElementById("wiki-list");
    const articleBox = document.getElementById("wiki-article");

    listBox.style.display = "block";
    articleBox.style.display = "none";

    listBox.innerHTML = "";

    list.sort((a, b) => a.title.rendered.localeCompare(b.title.rendered))
    .forEach(doc => {
        const catId = doc.doc_category?.[0] ?? null;
        const cat = ALL_CATEGORIES.find(c => c.id === catId);

        listBox.innerHTML += `
            <div class="wiki-card" data-id="${doc.id}">
                <div class="wiki-card-title">${doc.title.rendered}</div>
                <div class="wiki-card-cat">${cat?.name ?? "General"}</div>
            </div>
        `;
    });

    // Click → load article
    document.querySelectorAll(".wiki-card").forEach(card => {
        card.addEventListener("click", () => {
            loadArticle(parseInt(card.getAttribute("data-id")));
        });
    });
}

// ===============================
// FILTER BY CATEGORY
// ===============================
function filterByCategory(catId) {
    const filtered = ALL_DOCS.filter(doc => (doc.doc_category || []).includes(catId));
    renderDocs(filtered);
}

// ===============================
// LOAD ARTICLE CONTENT (INSIDE FORUM)
// ===============================
async function loadArticle(id) {
    const list = document.getElementById("wiki-list");
    const box = document.getElementById("wiki-article");

    list.style.display = "none";
    box.style.display = "block";

    box.innerHTML = "Cargando artículo…";

    const data = await fetch(API_DOC(id)).then(r => r.json());

    // Insert article AND generate ToC
    box.innerHTML = `
        <h2>${data.title.rendered}</h2>
        <div id="wiki-toc"></div>
        <div id="wiki-article-body">${data.content.rendered}</div>
    `;

    generateTOC();
}

// ===============================
// TABLE OF CONTENTS (HEADINGS)
// ===============================
function generateTOC() {
    const body = document.getElementById("wiki-article-body");
    const toc = document.getElementById("wiki-toc");

    const headers = [...body.querySelectorAll("h1, h2, h3, h4")];

    if (headers.length === 0) {
        toc.innerHTML = "";
        return;
    }

    let html = "<div class='toc'><b>Contenido</b><ul>";
    headers.forEach((h, i) => {
        const id = "section-" + i;
        h.id = id;
        html += `<li><a href="#${id}">${h.textContent}</a></li>`;
    });
    html += "</ul></div>";

    toc.innerHTML = html;
}

// ===============================
// SEARCH
// ===============================
document.addEventListener("input", e => {
    if (e.target.id === "wiki-search") {
        const q = e.target.value.toLowerCase();
        const filtered = ALL_DOCS.filter(doc =>
            doc.title.rendered.toLowerCase().includes(q)
        );
        renderDocs(filtered);
    }
});

// ===============================
// INITIAL LOAD
// ===============================
async function initWiki() {
    const [cats, docs] = await Promise.all([
        fetch(API_CATEGORIES).then(r => r.json()),
        fetch(API_DOCS).then(r => r.json())
    ]);

    loadCategories(cats);
    loadDocs(docs, cats);
}

initWiki();
</script>

<style>
/* Layout */
#wiki-wrapper {
    display: flex;
    gap: 20px;
    font-family: Verdana;
}

/* Sidebar */
#wiki-sidebar {
    width: 230px;
    border-right: 2px solid #ccc;
    padding-right: 10px;
}
.wiki-tree li {
    cursor: pointer;
    margin: 5px 0;
}
.wiki-tree li:hover {
    text-decoration: underline;
}

/* Cards */
.wiki-card {
    padding: 12px;
    margin-bottom: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;
    cursor: pointer;
}
.wiki-card:hover {
    background: #f0f0f0;
}
.wiki-card-title {
    font-size: 18px;
    font-weight: bold;
}
.wiki-card-cat {
    color: #666;
    font-size: 12px;
}

/* Article viewer */
#wiki-article {
    padding: 10px;
}
#wiki-article h2 {
    margin-top: 0;
}

/* ToC */
.toc {
    background: #f2f2f2;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 15px;
}
.toc ul {
    margin: 0;
    padding-left: 20px;
}
</style>
