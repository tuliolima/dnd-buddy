let allSpells = [];
let showOnlyFavorites = false;
let sortOrder = 'alpha';

async function init() {
  injectModal();
  setActiveNav('spells');
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

  const schools = [...new Set(allSpells.map(s => s.escola).filter(Boolean))].sort();
  const schoolSelect = document.getElementById('filter-school');
  schools.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    schoolSelect.appendChild(opt);
  });

  const classSet = new Set();
  allSpells.forEach(s => {
    (s.classes || '').split(',').forEach(c => {
      const t = c.trim();
      if (t) classSet.add(t);
    });
  });
  const classSelect = document.getElementById('filter-class');
  [...classSet].sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    classSelect.appendChild(opt);
  });

  document.getElementById('search').addEventListener('input', applyFilters);
  schoolSelect.addEventListener('change', applyFilters);
  document.getElementById('filter-level').addEventListener('change', applyFilters);
  classSelect.addEventListener('change', applyFilters);
  document.getElementById('sort-order').addEventListener('change', e => {
    sortOrder = e.target.value;
    applyFilters();
  });
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
  const school = document.getElementById('filter-school').value;
  const level = document.getElementById('filter-level').value;
  const cls = document.getElementById('filter-class').value;

  const filtered = allSpells.filter(s => {
    if (search && !s.nome.toLowerCase().includes(search)) return false;
    if (school && s.escola !== school) return false;
    if (level && String(s.circulo) !== level) return false;
    if (cls && !(s.classes || '').split(',').map(c => c.trim()).includes(cls)) return false;
    if (showOnlyFavorites && !isFavorite('spells', slugify(s.nome))) return false;
    return true;
  });

  filtered.sort(sortOrder === 'circulo'
    ? (a, b) => Number(a.circulo) - Number(b.circulo) || a.nome.localeCompare(b.nome, 'pt-BR')
    : (a, b) => a.nome.localeCompare(b.nome, 'pt-BR')
  );
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
    const fav = isFavorite('spells', slug);
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
        <span class="badge ${isTruque ? 'badge-circulo-0' : 'badge-circulo'}">${spellLevelLabel(spell.circulo)}</span>
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
      const added = toggleFavorite('spells', slug);
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
  const fav = isFavorite('spells', slug);
  const isTruque = String(spell.circulo) === '0';

  document.getElementById('modal-title').textContent = spell.nome;
  document.getElementById('modal-badges').innerHTML = `
    <span class="badge ${isTruque ? 'badge-circulo-0' : 'badge-circulo'}">${spellLevelLabel(spell.circulo)}</span>
    <span class="badge ${schoolBadgeClass(spell.escola)}">${spell.escola}</span>
  `;
  document.getElementById('modal-description').innerHTML = renderText(spell.descricao);

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
    const added = toggleFavorite('spells', slug);
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
