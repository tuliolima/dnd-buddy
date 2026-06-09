let allClasses = [];
let showOnlyFavorites = false;

async function init() {
  setActiveNav('classes');
  updateNavBadge();

  const grid = document.getElementById('cards-grid');

  try {
    const res = await fetch('data/classes.json');
    if (!res.ok) throw new Error('Arquivo não encontrado.');
    allClasses = await res.json();
  } catch (e) {
    grid.innerHTML = emptyState('⚠️', 'Erro ao carregar classes', e.message);
    return;
  }

  if (allClasses.length === 0) {
    document.getElementById('filters').style.display = 'none';
    grid.innerHTML = emptyState(
      '🛡',
      'Nenhuma classe cadastrada ainda',
      `Crie o arquivo <code>data/classes.json</code> seguindo o schema da documentação e adicione suas classes.`
    );
    return;
  }

  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('filter-favs').addEventListener('click', () => {
    showOnlyFavorites = !showOnlyFavorites;
    document.getElementById('filter-favs').classList.toggle('active', showOnlyFavorites);
    document.getElementById('filter-favs').textContent = showOnlyFavorites ? '★ Apenas favoritos' : '☆ Apenas favoritos';
    applyFilters();
  });

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  applyFilters();

  const hash = window.location.hash.slice(1);
  if (hash) {
    const cls = allClasses.find(c => slugify(c.nome) === hash);
    if (cls) openModal(cls);
  }
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase().trim();
  const filtered = allClasses.filter(c => {
    if (search && !c.nome.toLowerCase().includes(search)) return false;
    if (showOnlyFavorites && !isFavorite('classes', slugify(c.nome))) return false;
    return true;
  });
  renderCards(filtered);
}

function renderCards(classes) {
  const grid = document.getElementById('cards-grid');
  const countEl = document.getElementById('results-count');
  const n = classes.length;
  countEl.textContent = `${n} classe${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}`;

  if (n === 0) {
    grid.innerHTML = emptyState('🔍', 'Nenhuma classe encontrada', 'Tente ajustar a busca.');
    return;
  }

  grid.innerHTML = '';
  classes.forEach(cls => {
    const slug = slugify(cls.nome);
    const fav = isFavorite('classes', slug);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${cls.nome}</div>
        <button class="fav-btn ${fav ? 'active' : ''}" data-slug="${slug}" title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-label="Favoritar">
          ${fav ? '★' : '☆'}
        </button>
      </div>
      <div class="card-badges">
        ${cls.dado_de_vida ? `<span class="badge badge-circulo">Dado: ${cls.dado_de_vida}</span>` : ''}
        ${cls.conjura_magias ? `<span class="badge badge-encantamento">Conjurador</span>` : ''}
      </div>
      ${cls.habilidade_primaria ? `<div class="card-meta"><strong>Habilidade: </strong>${cls.habilidade_primaria}</div>` : ''}
    `;
    card.addEventListener('click', e => {
      if (e.target.closest('.fav-btn')) return;
      openModal(cls);
    });
    card.querySelector('.fav-btn').addEventListener('click', e => {
      e.stopPropagation();
      const added = toggleFavorite('classes', slug);
      const btn = e.currentTarget;
      btn.classList.toggle('active', added);
      btn.textContent = added ? '★' : '☆';
      btn.title = added ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    });
    grid.appendChild(card);
  });
}

function openModal(cls) {
  const slug = slugify(cls.nome);
  const fav = isFavorite('classes', slug);

  document.getElementById('modal-title').textContent = cls.nome;
  document.getElementById('modal-badges').innerHTML = `
    ${cls.dado_de_vida ? `<span class="badge badge-circulo">Dado de Vida: ${cls.dado_de_vida}</span>` : ''}
    ${cls.conjura_magias ? `<span class="badge badge-encantamento">Conjurador de Magias</span>` : ''}
  `;
  document.getElementById('modal-description').textContent = cls.descricao || '';

  const statFields = [
    ['Habilidade Primária', cls.habilidade_primaria],
    ['Proficiências', cls.proficiencias],
    ...(cls.conjura_magias != null ? [['Conjura Magias', cls.conjura_magias ? 'Sim' : 'Não']] : []),
  ];
  document.getElementById('modal-stats').innerHTML = statFields
    .filter(([, v]) => v != null && v !== '')
    .map(([label, value]) => `
      <div class="modal-stat">
        <div class="modal-stat-label">${label}</div>
        <div class="modal-stat-value">${value}</div>
      </div>
    `).join('');

  const tracos = cls.tracos || [];
  const tracosEl = document.getElementById('modal-tracos');
  if (tracos.length > 0) {
    tracosEl.innerHTML = `
      <hr class="modal-divider">
      <p class="modal-tracos-title">Traços</p>
      ${tracos.map(t => typeof t === 'string'
        ? `<div class="modal-traco"><div class="modal-traco-desc">• ${t}</div></div>`
        : `<div class="modal-traco"><div class="modal-traco-nome">${t.nome}</div><div class="modal-traco-desc">${t.descricao}</div></div>`
      ).join('')}
    `;
  } else {
    tracosEl.innerHTML = '';
  }

  setFavBtn(slug, fav);
  history.replaceState(null, '', `#${slug}`);
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function setFavBtn(slug, fav) {
  const btn = document.getElementById('modal-fav-btn');
  btn.className = `modal-fav-btn ${fav ? 'active' : ''}`;
  btn.innerHTML = `<span>${fav ? '★' : '☆'}</span> ${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}`;
  btn.onclick = () => {
    const added = toggleFavorite('classes', slug);
    setFavBtn(slug, added);
    const cardBtn = document.querySelector(`.fav-btn[data-slug="${slug}"]`);
    if (cardBtn) {
      cardBtn.classList.toggle('active', added);
      cardBtn.textContent = added ? '★' : '☆';
    }
  };
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', window.location.pathname);
}

function emptyState(icon, title, text) {
  return `<div class="empty-state" style="grid-column:1/-1">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3><p>${text}</p>
  </div>`;
}

document.addEventListener('DOMContentLoaded', init);
