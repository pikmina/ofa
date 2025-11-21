// ===============================
// CONFIG
// ===============================
const API_CATEGORIES = "https://saxagenia.com/wp-json/wp/v2/doc_category";
const API_DOCS = "https://saxagenia.com/wp-json/wp/v2/docs";
const API_DOC = id => `https://saxagenia.com/wp-json/wp/v2/docs/${id}`;

let ALL_DOCS = [];
let ALL_CATEGORIES = [];


// ===============================
// LOAD DOCS (LIST)
// ===============================
function loadDocs(docs, categories) {
    ALL_DOCS = docs;
    ALL_CATEGORIES = categories;
    renderDocs(docs);
}


// ===============================
// LOAD CATEGORIES (SIDEBAR)
// ===============================
function loadCategories(categories) {
    const side = document.getElementById("wiki-sidebar");

    let html = "<h3>Wiki</h3><ul class='wiki-tree'>";

    categories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => {
        
        const docsForCat = ALL_DOCS
            .filter(doc => {
                const catsField = doc.docs_category ?? doc.doc_category ?? [];
                return Array.isArray(catsField) && catsField.includes(cat.id);
            })
            .sort((a, b) => (a.title?.rendered || '').localeCompare(b.title?.rendered || ''));

        html += `
        <li class="wiki-cat" data-cat="${cat.id}">
            <div class="wiki-cat-title">${cat.name}</div>
            <ul class="wiki-sublist">
        `;

        if (docsForCat.length === 0) {
            html += `<li class="wiki-doc-empty"><i>Sin Artículos</i></li>`;
        } else {
            docsForCat.forEach(doc => {
                html += `
                <li class="wiki-doc">
                    <a href="#" data-id="${doc.id}" data-slug="${encodeURIComponent(doc.slug)}">
                        ${doc.title.rendered}
                    </a>
                </li>`;
            });
        }

        html += `</ul></li>`;
    });

    html += "</ul>";
    side.innerHTML = html;


    // === CLICK LISTENER (CATEGORÍAS + ARTÍCULOS) ===
    side.addEventListener("click", function (e) {
        const a = e.target.closest(".wiki-doc a");

        // Click en un artículo
        if (a) {
            e.preventDefault();

            const prev = side.querySelector(".wiki-doc a.active");
            if (prev) prev.classList.remove("active");
            a.classList.add("active");

            const id = parseInt(a.dataset.id, 10);

            if (!isNaN(id)) {
                loadArticle(id);

                // URL → ?art=slug
                history.pushState({}, "", `?art=${a.dataset.slug}`);
            }
            return;
        }

        // Click en categoría
        const catTitle = e.target.closest(".wiki-cat-title");
        if (catTitle) {
            const parent = catTitle.closest(".wiki-cat");
            const catId = parseInt(parent.dataset.cat, 10);
            if (!isNaN(catId)) {
                filterByCategory(catId);

                const cat = ALL_CATEGORIES.find(c => c.id === catId);
                
                // URL → ?cat=slug
                if (cat?.slug) {
                    history.pushState({}, "", `?cat=${encodeURIComponent(cat.slug)}`);
                }
            }
        }
    });
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

    document.querySelectorAll(".wiki-card").forEach(card => {
        card.addEventListener("click", () =>
            loadArticle(parseInt(card.dataset.id))
        );
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
// LOAD ARTICLE CONTENT
// ===============================
async function loadArticle(id) {
    const list = document.getElementById("wiki-list");
    const box = document.getElementById("wiki-article");

    list.style.display = "none";
    box.style.display = "block";
    box.innerHTML = "Cargando artículo…";

    const data = await fetch(API_DOC(id)).then(r => r.json());

    // ACTUALIZAR URL → ?art=slug
    if (data.slug) {
        history.pushState({}, "", `?art=${encodeURIComponent(data.slug)}`);
    }

    box.innerHTML = `
        <h2>${data.title.rendered}</h2>
        <div id="wiki-toc"></div>
        <div id="wiki-article-body">${data.content.rendered}</div>
    `;

    generateTOC();
}


// ===============================
// TABLE OF CONTENTS
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
// AUTOLOAD BASED ON URL
// ===============================
function checkURLForAutoLoad() {
    const params = new URLSearchParams(window.location.search);

    // Cargar ARTÍCULO
    if (params.has("art")) {
        const slug = params.get("art");
        const doc = ALL_DOCS.find(d => d.slug === slug);
        if (doc) {
            loadArticle(doc.id);
            return true;
        }
    }

    // Cargar CATEGORÍA
    if (params.has("cat")) {
        const slug = params.get("cat");
        const cat = ALL_CATEGORIES.find(c => c.slug === slug);
        if (cat) {
            filterByCategory(cat.id);
            return true;
        }
    }

    return false;
}


// ===============================
// INITIAL LOAD
// ===============================
async function initWiki() {
    const [cats, docs] = await Promise.all([
        fetch(API_CATEGORIES).then(r => r.json()),
        fetch(API_DOCS).then(r => r.json())
    ]);

    ALL_CATEGORIES = Array.isArray(cats) ? cats : [];
    ALL_DOCS = Array.isArray(docs) ? docs : [];

    loadCategories(ALL_CATEGORIES);
    loadDocs(ALL_DOCS, ALL_CATEGORIES);

    // SI LA URL TIENE ?art= o ?cat=
    checkURLForAutoLoad();
}

initWiki();
