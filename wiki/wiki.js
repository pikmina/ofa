(() => {
  const WP_API_BASE = "https://saxagenia.com/wp-json";
  const CATEGORIES_ENDPOINT = `${WP_API_BASE}/wp/v2/doc_category?per_page=100`;
  const CUSTOM_WIKI_ENDPOINT = `${WP_API_BASE}/saxagenia/v1/wiki`;

  function el(id) { return document.getElementById(id); }
  async function tryFetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Fetch failed:", url, res.status);
        return null;
      }
      return await res.json();
    } catch (e) {
      console.warn("Fetch error:", url, e);
      return null;
    }
  }

  let BD_CATEGORIES = [];

  async function loadCategories() {
    const treeEl = el('bd-tree');
    if (treeEl) treeEl.innerHTML = 'Cargando categorías...';

    const cats = await tryFetchJson(CATEGORIES_ENDPOINT);
    if (!cats) {
      if (treeEl) treeEl.innerHTML = '<div class="bd-error">No se pudieron cargar las categorías.</div>';
      return;
    }

    BD_CATEGORIES = cats;

    const byId = {};
    cats.forEach(c => { byId[c.id] = c; c.children = []; });
    const roots = [];
    cats.forEach(c => {
      const p = c.parent || 0;
      if (p && byId[p]) byId[p].children.push(c);
      else roots.push(c);
    });

    treeEl.innerHTML = '';
    roots.sort((a, b) => a.name.localeCompare(b.name)).forEach(r => {
      treeEl.appendChild(renderCategoryNode(r));
    });
  }

  function renderCategoryNode(cat) {
    const wrap = document.createElement('div');
    wrap.className = 'bd-cat';
    wrap.innerHTML = `
      <div class="bd-cat-row">
        <button class="bd-toggle" aria-expanded="false">▶</button>
        <span class="bd-cat-name">${cat.name}</span>
      </div>
      <div class="bd-children" style="display:none;"></div>
    `;
    const toggle = wrap.querySelector('.bd-toggle');
    const childrenWrap = wrap.querySelector('.bd-children');

    toggle.addEventListener('click', async () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        childrenWrap.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '▶';
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = '▼';
        if (!childrenWrap.dataset.loaded) {
          childrenWrap.innerHTML = '<div class="bd-loading">Cargando artículos...</div>';
          const articles = await fetchWikiByCategorySlug(cat.slug);
          childrenWrap.dataset.loaded = '1';
          childrenWrap.innerHTML = '';
          if (!articles || articles.length === 0) {
            childrenWrap.innerHTML = '<div class="bd-empty">No hay artículos en esta categoría.</div>';
          } else {
            articles.forEach(a => {
              const aEl = document.createElement('div');
              aEl.className = 'bd-article-line';

              // detectar slug válido
              const artSlug = a.slug || a.post_name || a.article_slug || "";

              aEl.innerHTML = `<a href="?cat=${cat.slug}&art=${encodeURIComponent(artSlug)}">${a.title}</a>`;
              aEl.querySelector('a').addEventListener('click', ev => {
                ev.preventDefault();
                navigateTo(cat.slug, artSlug);
              });

              childrenWrap.appendChild(aEl);
            });
          }
        }
        childrenWrap.style.display = 'block';
      }
    });

    if (cat.children && cat.children.length) {
      cat.children.sort((a, b) => a.name.localeCompare(b.name))
        .forEach(ch => childrenWrap.appendChild(renderCategoryNode(ch)));
    }

    return wrap;
  }

  async function fetchWikiByCategorySlug(slug) {
    const url = `${CUSTOM_WIKI_ENDPOINT}?category=${encodeURIComponent(slug)}&per_page=200`;
    const data = await tryFetchJson(url);
    if (!data || !data.items) return [];
    return data.items;
  }

  async function fetchFullArticle(idOrSlug) {
    // intentamos varios endpoints posibles
    const candidates = [
      `${WP_API_BASE}/wp/v2/docs/${idOrSlug}`,
      `${WP_API_BASE}/wp/v2/doc/${idOrSlug}`,
      `${WP_API_BASE}/wp/v2/posts/${idOrSlug}`,
      `${WP_API_BASE}/wp/v2/knowledgebase/${idOrSlug}`,
      `${WP_API_BASE}/wp/v2/kb/${idOrSlug}`,
      `${WP_API_BASE}/wp/v2/wiki/${idOrSlug}`
    ];

    for (const url of candidates) {
      const res = await tryFetchJson(url);
      if (res && res.content && typeof res.content.rendered === "string") {
        return {
          id: res.id,
          title: res.title?.rendered || "(Sin título)",
          link: res.link || "",
          date: res.date || "",
          content: res.content.rendered,
          excerpt: res.excerpt?.rendered || ""
        };
      }
    }

    console.warn("❌ Ningún endpoint devolvió content para:", idOrSlug);
    return null;
  }

  function sanitizeHtml(html) {
    if (!html) return '';
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }

  function buildTOCFromContainer(container) {
    const headings = Array.from(container.querySelectorAll('h2,h3,h4'));
    const toc = document.createElement('div');
    toc.className = 'bd-toc-inner';
    if (headings.length === 0) {
      toc.innerHTML = '<strong>Sin tabla de contenidos</strong>';
      return toc;
    }
    const ul = document.createElement('ul');
    headings.forEach(h => {
      if (!h.id) h.id = 'hdr-' + Math.random().toString(36).slice(2, 9);
      const li = document.createElement('li');
      li.className = 'bd-toc-' + h.tagName.toLowerCase();
      li.innerHTML = `<a href="#${h.id}">${h.textContent}</a>`;
      ul.appendChild(li);
    });
    toc.appendChild(ul);
    return toc;
  }

  async function openArticle(articleObj) {
    let art = articleObj;

    // Si no tiene contenido, lo traemos por REST
    if (!art.content) {
      // articleObj.id puede ser undefined, en ese caso usamos slug
      const idOrSlug = art.id != null ? art.id : (art.slug || art.post_name || art.article_slug);
      const full = await fetchFullArticle(idOrSlug);
      if (full) art = full;
    }

    el('bd-list').style.display = 'none';
    el('bd-article').style.display = 'block';

    el('bd-article-title').innerHTML = art.title || '(Sin título)';
    el('bd-article-date').textContent = art.date ? new Date(art.date).toLocaleDateString() : '';
    el('bd-article-link').href = art.link || '#';

    const safe = sanitizeHtml(art.content || art.excerpt || '');
    el('bd-article-body').innerHTML = safe;

    const tocWrap = el('bd-toc');
    tocWrap.innerHTML = '';
    tocWrap.appendChild(buildTOCFromContainer(el('bd-article-body')));

    el('bd-article').scrollIntoView({ behavior: 'smooth' });
  }

  function installSearch() {
    const input = el('bd-search-input');
    if (!input) return;
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => runSearch(input.value.trim()), 350);
    });
  }

  async function runSearch(q) {
    if (!q) {
      el('bd-list').innerHTML = 'Selecciona una categoría para ver artículos.';
      el('bd-article').style.display = 'none';
      return;
    }
    el('bd-list').style.display = '';
    el('bd-article').style.display = 'none';
    el('bd-list').innerHTML = '<div class="bd-loading">Buscando...</div>';
    const url = `${CUSTOM_WIKI_ENDPOINT}?per_page=200`;
    const data = await tryFetchJson(url);
    if (!data || !data.items) {
      el('bd-list').innerHTML = '<div class="bd-empty">No se encontraron resultados.</div>';
      return;
    }
    const results = data.items.filter(it =>
      (it.title && it.title.toLowerCase().includes(q.toLowerCase())) ||
      (it.excerpt && it.excerpt.toLowerCase().includes(q.toLowerCase()))
    );
    if (results.length === 0) {
      el('bd-list').innerHTML = '<div class="bd-empty">No se encontraron resultados.</div>';
      return;
    }
    el('bd-list').innerHTML = '';
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'bd-list-item';
      const artSlug = item.slug || item.post_name || item.article_slug || "";
      div.innerHTML = `<h3><a href="?art=${encodeURIComponent(artSlug)}">${item.title}</a></h3>`;
      div.querySelector('a').addEventListener('click', ev => {
        ev.preventDefault();
        navigateTo(null, artSlug);
      });
      el('bd-list').appendChild(div);
    });
  }

  async function navigateTo(catSlug, artSlug) {
    const params = new URLSearchParams();
    if (catSlug) params.set("cat", catSlug);
    if (artSlug) params.set("art", artSlug);
    const newUrl = "?" + params.toString();
    history.pushState({}, "", newUrl);
    await handleURLRouting();
  }

  async function handleURLRouting() {
    const params = new URLSearchParams(location.search);
    const catSlug = params.get("cat");
    const artSlug = params.get("art");

    if (!catSlug && !artSlug) {
      el('bd-list').style.display = '';
      el('bd-article').style.display = 'none';
      return;
    }

    if (BD_CATEGORIES.length === 0) {
      BD_CATEGORIES = await tryFetchJson(CATEGORIES_ENDPOINT) || [];
    }

    let category = null;
    if (catSlug) category = BD_CATEGORIES.find(c => c.slug === catSlug);

    let articles = [];
    if (category) {
      articles = await fetchWikiByCategorySlug(category.slug);
    } else if (artSlug) {
      const data = await tryFetchJson(`${CUSTOM_WIKI_ENDPOINT}?per_page=200`);
      articles = data?.items || [];
    }

    if (!artSlug) {
      el('bd-list').innerHTML = '';
      articles.forEach(a => {
        const div = document.createElement('div');
        div.className = 'bd-list-item';
        const artSlug2 = a.slug || a.post_name || a.article_slug || "";
        div.innerHTML = `<h3><a href="?cat=${catSlug}&art=${encodeURIComponent(artSlug2)}">${a.title}</a></h3>`;
        div.querySelector('a').addEventListener('click', ev => {
          ev.preventDefault();
          navigateTo(catSlug, artSlug2);
        });
        el('bd-list').appendChild(div);
      });
      el('bd-list').style.display = '';
      el('bd-article').style.display = 'none';
      return;
    }

    // buscamos el artículo adecuado
    const art = articles.find(a =>
      (a.slug && a.slug === artSlug) ||
      (a.post_name && a.post_name === artSlug) ||
      (a.article_slug && a.article_slug === artSlug)
    );

    if (!art) {
      el('bd-list').innerHTML = '<div class="bd-error">Artículo no encontrado.</div>';
      el('bd-list').style.display = '';
      el('bd-article').style.display = 'none';
      return;
    }

    await openArticle(art);
  }

  window.addEventListener("popstate", handleURLRouting);

  (async function init(){
    if (!el('bd-tree')) {
      document.addEventListener('DOMContentLoaded', async ()=>{
        await loadCategories();
        installSearch();
        await handleURLRouting();
      });
    } else {
      await loadCategories();
      installSearch();
      await handleURLRouting();
    }
  })();

  // Opcional: exponer funciones para depuración
  window.__wikiApp = { loadCategories, fetchWikiByCategorySlug, fetchFullArticle, navigateTo, handleURLRouting };

})();
