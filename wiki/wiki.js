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

    let html = "<h3>Wiki</h3><ul class='wiki-tree'>";
    categories.sort((a, b) => a.name.localeCompare(b.name))
    .forEach(cat => {
        html += `
        <li class="wiki-cat" data-cat="${cat.id}">
            > ${cat.name}
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