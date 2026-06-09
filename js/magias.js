let allSpells = [];
let showOnlyFavorites = false;

async function init() {
  setActiveNav('magias');
  updateNavBadge();

  const grid = document.getElementById('cards-grid');

  try {
    const res = await fetch('data/spells.json');
    if (!res.ok) throw new Error('Arquivo não encontrado.');
    allSpells = await res.json();
  } catch (e) {
    grid.innerHTML = emptyState('⚠️', 'Erro ao carregar magias', e.message);
    return;
  }

  // Populate escola filter
  const escolas = [...new Set(allSpells.map(s => s.escola).filter(Boolean))].sort();
  const escolaSelect = document.getElementById('filter-escola');
  escolas.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e;
    opt.textContent = e;
    escolaSelect.appendChild(opt);
  });

  // Populate classe filter
  const classeSet = new Set();
  allSpells.forEach(s => {
    (s.classes || '').split(',').forEach(c => {
      const t = c.trim();
      if (t) classeSet.add(t);
    });
  });
  const classeSelect = document.getElementById('filter-classe');
  [...classeSet].sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    classeSelect.appendChild(opt);
  });

  document.getElementById('search').addEventListener('input', applyFilters);
  escolaSelect.addEventListener('change', applyFilters);
  document.getElementById('filter-circulo').addEventListener('change', applyFilters);
  classeSelect.addEventListener('change', applyFilters);
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
    const spell = allSpells.find(s => slugify(s.nome) === hash);
    if (spell) openModal(spell);
  }
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase().trim();
  const escola = document.getElementById('filter-escola').value;
  const circulo = document.getElementById('filter-circulo').value;
  const classe = document.getElementById('filter-classe').value;

  const filtered = allSpells.filter(s => {
    if (search && !s.nome.toLowerCase().includes(search)) return false;
    if (escola && s.escola !== escola) return false;
    if (circulo && String(s.circulo) !== circulo) return false;
    if (classe && !(s.classes || '').split(',').map(c => c.trim()).includes(classe)) return false;
    if (showOnlyFavorites && !isFavorite('magias', slugify(s.nome))) return false;
    return true;
  });

  renderCards(filtered);
}

function renderCards(spells) {
  const grid = document.getElementById('cards-grid');
  const countEl = document.getElementById('results-count');
  const n = spells.length;
  countEl.textContent = `${n} magia${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}`;

  if (n === 0) {
    grid.innerHTML = emptyState('🔍', 'Nenhuma magia encontrada', 'Tente ajustar os filtros de busca.');
    return;
  }

  grid.innerHTML = '';
  spells.forEach(spell => {
    const slug = slugify(spell.nome);
    const fav = isFavorite('magias', slug);
    const isTruque = String(spell.circulo) === '0';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${spell.nome}</div>
        <button class="fav-btn ${fav ? 'active' : ''}" data-slug="${slug}" title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-label="Favoritar">
          ${fav ? '★' : '☆'}
        </button>
      </div>
      <div class="card-badges">
        <span class="badge ${isTruque ? 'badge-circulo-0' : 'badge-circulo'}">${circuloLabel(spell.circulo)}</span>
        <span class="badge ${schoolBadgeClass(spell.escola)}">${spell.escola}</span>
      </div>
      <div class="card-meta">${spell.classes || ''}</div>
    `;
    card.addEventListener('click', e => {
      if (e.target.closest('.fav-btn')) return;
      openModal(spell);
    });
    card.querySelector('.fav-btn').addEventListener('click', e => {
      e.stopPropagation();
      const added = toggleFavorite('magias', slug);
      const btn = e.currentTarget;
      btn.classList.toggle('active', added);
      btn.textContent = added ? '★' : '☆';
      btn.title = added ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    });
    grid.appendChild(card);
  });
}

function openModal(spell) {
  const slug = slugify(spell.nome);
  const fav = isFavorite('magias', slug);
  const isTruque = String(spell.circulo) === '0';

  document.getElementById('modal-title').textContent = spell.nome;
  document.getElementById('modal-badges').innerHTML = `
    <span class="badge ${isTruque ? 'badge-circulo-0' : 'badge-circulo'}">${circuloLabel(spell.circulo)}</span>
    <span class="badge ${schoolBadgeClass(spell.escola)}">${spell.escola}</span>
  `;
  document.getElementById('modal-description').textContent = spell.descricao || '';

  const statFields = [
    ['Tempo de Conjuração', spell.tempo_conjuracao],
    ['Alcance', spell.alcance],
    ['Componentes', spell.componentes],
    ['Duração', spell.duracao],
    ['Classes', spell.classes],
  ];
  document.getElementById('modal-stats').innerHTML = statFields
    .filter(([, v]) => v)
    .map(([label, value]) => `
      <div class="modal-stat">
        <div class="modal-stat-label">${label}</div>
        <div class="modal-stat-value">${value}</div>
      </div>
    `).join('');

  setFavBtn(slug, fav);
  history.replaceState(null, '', `#${slug}`);
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function setFavBtn(slug, fav) {
  const btn = document.getElementById('modal-fav-btn');
  btn.className = `modal-fav-btn ${fav ? 'active' : ''}`;
  btn.textContent = fav ? '★' : '☆';
  btn.title = fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  btn.onclick = () => {
    const added = toggleFavorite('magias', slug);
    setFavBtn(slug, added);
    const cardBtn = document.querySelector(`.fav-btn[data-slug="${slug}"]`);
    if (cardBtn) {
      cardBtn.classList.toggle('active', added);
      cardBtn.textContent = added ? '★' : '☆';
      cardBtn.title = added ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
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
