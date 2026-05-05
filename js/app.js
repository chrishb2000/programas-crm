const PAYPAL_DONATION_URL = "https://www.paypal.com/donate/?hosted_button_id=Y7MUHA7FAN5QG";
const CURRENCY_MESSAGE = "Como ventaja adicional, este programa permite configurar varias divisas segun el pais o mercado: euros para Espana, pesos colombianos para Colombia, pesos mexicanos para Mexico, dolares u otras monedas que necesite el negocio.";

const state = {
  products: [],
  category: "Todos",
  query: ""
};

const grid = document.querySelector("#productGrid");
const filters = document.querySelector("#categoryFilters");
const searchInput = document.querySelector("#searchInput");
const detailSection = document.querySelector("#detalle");

const categoryColors = {
  Automocion: "#0f766e",
  Servicios: "#be123c",
  Comercio: "#1d4ed8",
  Construccion: "#a16207",
  Marketing: "#7c3aed",
  Hostelería: "#c2410c",
  Ventas: "#0369a1",
  Educacion: "#15803d",
  Salud: "#b45309",
  Inmobiliaria: "#10b981",
  "Salud y Servicios": "#b45309"
};

function moneyText(price) {
  return price.replace("EUR", "EUR");
}

function slugToTitle(slug) {
  return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function getProductByHash() {
  const hash = window.location.hash.replace("#producto/", "");
  return state.products.find(product => product.id === hash);
}

function productCard(product) {
  const features = product.incluye.slice(0, 3).map(item => `<li>${item}</li>`).join("");
  const color = categoryColors[product.categoria] || "#334155";

  return `
    <article class="product-card">
      <div class="product-art" style="--accent:${color}">
        <i class="fas ${product.icono || 'fa-box'}"></i>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span>${product.categoria}</span>
        </div>
        <h3>${product.nombre}</h3>
        <p>${product.resumen}</p>
        <p class="currency-note">Divisas configurables: EUR, USD, COP, MXN y mas.</p>
        <ul>${features}</ul>
      </div>
      <div class="product-actions">
        <a class="button primary" href="#producto/${product.id}" aria-label="Ver detalle de ${product.nombre}">Comprar</a>
        <a class="button quiet" href="#producto/${product.id}">Ver detalle</a>
      </div>
    </article>
  `;
}

function renderFilters() {
  const categories = ["Todos", ...new Set(state.products.map(product => product.categoria))];
  filters.innerHTML = categories.map(category => {
    const selected = category === state.category ? "is-active" : "";
    return `<button class="${selected}" type="button" data-category="${category}">${category}</button>`;
  }).join("");
}

function renderCatalog() {
  const query = state.query.trim().toLowerCase();
  const visible = state.products.filter(product => {
    const matchesCategory = state.category === "Todos" || product.categoria === state.category;
    const haystack = `${product.nombre} ${product.categoria} ${product.resumen} ${product.seo}`.toLowerCase();
    return matchesCategory && haystack.includes(query);
  });

  grid.innerHTML = visible.length
    ? visible.map(productCard).join("")
    : `<div class="empty-state"><h3>No hay programas con ese filtro</h3><p>Prueba con otra categoria o una busqueda mas general.</p></div>`;
}

function renderDetail(product) {
  if (!product) {
    detailSection.hidden = true;
    return;
  }

  document.title = `${product.nombre} | GestionaPro CRM`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.nombre,
    "description": product.descripcion,
    "category": product.categoria,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "price": product.precio.replace(/[^\d]/g, ""),
      "availability": "https://schema.org/InStock"
    }
  };

  detailSection.hidden = false;
  detailSection.innerHTML = `
    <div class="detail-wrap">
      <a class="back-link" href="#catalogo"><i class="fas fa-arrow-left"></i> Volver al catalogo</a>
      <div class="detail-hero">
        <div>
          <p class="eyebrow"><i class="fas ${product.icono || 'fa-box'}"></i> ${product.categoria}</p>
          <h2>${product.nombre}</h2>
          <p>${product.descripcion}</p>
          <p class="currency-note detail-note">${CURRENCY_MESSAGE}</p>
          <div class="detail-price-box">
            <span class="price-label">Licencia Libre</span>
            <strong class="price-value">0,00€</strong>
          </div>
          <div class="detail-trust-badge">
            <i class="fas fa-check-circle"></i> Instalacion remota gratuita incluida
          </div>
          <div class="detail-actions">
            <a class="button primary" href="https://wa.me/34635983475?text=Hola%20Christian,%20me%20interesa%20obtener%20el%20${encodeURIComponent(product.nombre)}.%20¿Cómo%20podemos%20empezar?" target="_blank" rel="noopener">
              <i class="fab fa-whatsapp"></i> Solicitar Instalación Gratis
            </a>
            <a class="button quiet" href="${PAYPAL_DONATION_URL}" target="_blank" rel="noopener">
              <i class="fab fa-paypal"></i> Apoyar con un donativo
            </a>
          </div>
        </div>
        <aside class="detail-panel">
          <h3>Que incluye</h3>
          <ul>${product.incluye.map(item => `<li>${item}</li>`).join("")}</ul>
        </aside>
      </div>
      <div class="development-block">
        <h3>Descripcion del desarrollo</h3>
        <p>${product.desarrollo}</p>
        <h3>Que implica ponerlo en marcha</h3>
        <p>Se revisa la actividad del negocio, se ajustan los campos principales, se cargan los primeros datos si los tienes preparados y se deja una version operativa para trabajar desde el primer dia. La instalacion remota inicial esta incluida sin coste. Tambien se puede dejar configurada la divisa principal y divisas secundarias para usuarios de Espana, Colombia, Mexico u otros paises.</p>
      </div>
      <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    </div>
  `;
  detailSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleHashChange() {
  const product = window.location.hash.startsWith("#producto/") ? getProductByHash() : null;
  renderDetail(product);

  if (!product && window.location.hash === "#catalogo") {
    document.title = "GestionaPro CRM | Programas de gestion para negocios";
  }
}

async function init() {
  try {
    const response = await fetch("data/productos.json");
    if (!response.ok) {
      throw new Error(`Catalogo no disponible: ${response.status}`);
    }
    state.products = await response.json();
  } catch (error) {
    state.products = window.PRODUCTOS_DE_PRUEBA || [];
    console.error(error);
  }

  renderFilters();
  renderCatalog();
  handleHashChange();
}

filters.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderFilters();
  renderCatalog();
});

searchInput.addEventListener("input", event => {
  state.query = event.target.value;
  renderCatalog();
});

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

window.addEventListener("hashchange", handleHashChange);
init();
initScrollReveal();
