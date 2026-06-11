let allSpellData = [];
let sortOrder = 'alpha';

async function init() {
  injectModal();
  setActiveNav('favoritos');
  updateNavBadge();

  allSpellData = await fetch('data/spells.json').then(r => r.ok ? r.json() : []).catch(() => []);

  document.getElementById('sort-order').addEventListener('change', e => {
    sortOrder = e.target.value;
    render();
  });
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  render();
}

function render() {
  const favs = getAllFavorites();
  const container = document.getElementById('fav-container');
  const magiaItems = matchFavs(favs.magias, allSpellData);
  magiaItems.sort(sortOrder === 'circulo'
    ? (a, b) => Number(a.circulo) - Number(b.circulo) || a.nome.localeCompare(b.nome, 'pt-BR')
    : (a, b) => a.nome.localeCompare(b.nome, 'pt-BR')
  );

  if (magiaItems.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">★</div>
      <h3>Nenhum favorito ainda</h3>
      <p>Na página de Magias, toque em ☆ em qualquer magia para salvá-la aqui.</p>
    </div>`;
    return;
  }

  container.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'fav-section';
  const grid = document.createElement('div');
  grid.className = 'cards-grid';
  magiaItems.forEach(item => grid.appendChild(buildCard(item)));
  section.innerHTML = '<h2 class="section-title">Magias</h2>';
  section.appendChild(grid);
  container.appendChild(section);
}

function matchFavs(slugs, data) {
  if (!slugs || !data.length) return [];
  return slugs.map(slug => data.find(item => slugify(item.nome) === slug)).filter(Boolean);
}

function buildCard(spell) {
  const slug = slugify(spell.nome);
  const isTruque = String(spell.circulo) === '0';
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${spell.nome}</div>
      <button class="fav-btn active" data-slug="${slug}" title="Remover dos favoritos" aria-label="Remover dos favoritos">★</button>
    </div>
    <div class="card-badges">
      <span class="badge ${isTruque ? 'badge-circulo-0' : 'badge-circulo'}">${circuloLabel(spell.circulo)}</span>
      <span class="badge ${schoolBadgeClass(spell.escola)}">${spell.escola}</span>
    </div>
    ${spell.classes ? `<div class="card-meta">${spell.classes}</div>` : ''}
  `;
  card.addEventListener('click', e => {
    if (e.target.closest('.fav-btn')) return;
    openModal(spell);
  });
  card.querySelector('.fav-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite('magias', slug);
    render();
  });
  return card;
}

function openModal(spell) {
  const slug = slugify(spell.nome);
  const isTruque = String(spell.circulo) === '0';

  document.getElementById('modal-title').textContent = spell.nome;
  document.getElementById('modal-badges').innerHTML = `
    <span class="badge ${isTruque ? 'badge-circulo-0' : 'badge-circulo'}">${circuloLabel(spell.circulo)}</span>
    <span class="badge ${schoolBadgeClass(spell.escola)}">${spell.escola}</span>
  `;
  document.getElementById('modal-description').innerHTML = renderText(spell.descricao);

  const fields = [
    ['Tempo de Conjuração', spell.tempo_conjuracao],
    ['Alcance', spell.alcance],
    ['Componentes', spell.componentes],
    ['Duração', spell.duracao],
    ['Classes', spell.classes],
  ];
  document.getElementById('modal-stats').innerHTML = fields
    .filter(([, v]) => v)
    .map(([label, value]) => `
      <div class="modal-stat">
        <div class="modal-stat-label">${label}</div>
        <div class="modal-stat-value">${value}</div>
      </div>
    `).join('');

  document.getElementById('modal-tracos').innerHTML = '';
  setFavBtn(slug);
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function setFavBtn(slug) {
  const fav = isFavorite('magias', slug);
  const btn = document.getElementById('modal-fav-btn');
  btn.className = `modal-fav-btn ${fav ? 'active' : ''}`;
  btn.textContent = fav ? '★' : '☆';
  btn.title = fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  btn.onclick = () => {
    toggleFavorite('magias', slug);
    setFavBtn(slug);
    render();
  };
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', init);
