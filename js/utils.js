function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const FAVORITES_KEY = 'dnd-buddy-favorites';

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || { magias: [] };
  } catch {
    return { magias: [] };
  }
}

function saveFavorites(favs) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

function isFavorite(type, slug) {
  return (getFavorites()[type] || []).includes(slug);
}

function toggleFavorite(type, slug) {
  const favs = getFavorites();
  if (!favs[type]) favs[type] = [];
  const idx = favs[type].indexOf(slug);
  if (idx === -1) {
    favs[type].unshift(slug);
  } else {
    favs[type].splice(idx, 1);
  }
  saveFavorites(favs);
  updateNavBadge();
  return idx === -1;
}

function getAllFavorites() {
  return getFavorites();
}

function updateNavBadge() {
  const favs = getFavorites();
  const total = (favs.magias || []).length;
  const badge = document.getElementById('nav-fav-badge');
  if (!badge) return;
  badge.classList.toggle('empty', total === 0);
  badge.querySelector('.fav-count').textContent = total > 0 ? total : '';
}

function schoolBadgeClass(escola) {
  const map = {
    'abjuração': 'badge-abjuracao',
    'adivinhação': 'badge-adivinhacao',
    'conjuração': 'badge-conjuracao',
    'encantamento': 'badge-encantamento',
    'evocação': 'badge-evocacao',
    'ilusão': 'badge-ilusao',
    'necromancia': 'badge-necromancia',
    'transmutação': 'badge-transmutacao',
  };
  return map[(escola || '').toLowerCase()] || 'badge-default';
}

function circuloLabel(circulo) {
  if (String(circulo) === '0') return 'Truque';
  return `${circulo}° Círculo`;
}

function setActiveNav(pageName) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageName);
  });
}

function renderText(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function injectModal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal">
        <button class="modal-close" id="modal-close" aria-label="Fechar">✕</button>
        <div class="modal-title-row">
          <h2 class="modal-title" id="modal-title"></h2>
          <button class="modal-fav-btn" id="modal-fav-btn" aria-label="Favoritar"></button>
        </div>
        <div class="modal-badges" id="modal-badges"></div>
        <hr class="modal-divider">
        <div class="modal-stats" id="modal-stats"></div>
        <p class="modal-description" id="modal-description"></p>
        <div class="modal-tracos" id="modal-tracos"></div>
      </div>
    </div>
  `);
}

function navHTML(activeHref) {
  return `
    <nav>
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">⚔ D&amp;D Buddy</a>
        <div class="nav-links">
          <a href="magias.html" class="nav-link" data-page="magias">Magias</a>
          <a href="classes.html" class="nav-link" data-page="classes">Classes</a>
          <a href="especies.html" class="nav-link" data-page="especies">Espécies</a>
        </div>
        <a href="favoritos.html" class="nav-fav-badge" id="nav-fav-badge">
          ★ <span class="fav-count"></span>
        </a>
      </div>
    </nav>
  `;
}
