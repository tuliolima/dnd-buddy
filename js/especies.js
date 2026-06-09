let allEspecies = [];
let showOnlyFavorites = false;

async function init() {
  setActiveNav('especies');
  updateNavBadge();

  const grid = document.getElementById('cards-grid');

  try {
    const res = await fetch('data/especies.json');
    if (!res.ok) throw new Error('Arquivo não encontrado.');
    allEspecies = await res.json();
  } catch (e) {
    grid.innerHTML = emptyState('⚠️', 'Erro ao carregar espécies', e.message);
    return;
  }

  if (allEspecies.length === 0) {
    document.getElementById('filters').style.display = 'none';
    grid.innerHTML = emptyState(
      '🌿',
      'Nenhuma espécie cadastrada ainda',
      `Crie o arquivo <code>data/especies.json</code> seguindo o schema da documentação e adicione suas espécies.`
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
    const esp = allEspecies.find(e => slugify(e.nome) === hash);
    if (esp) openModal(esp);
  }
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase().trim();
  const filtered = allEspecies.filter(e => {
    if (search && !e.nome.toLowerCase().includes(search)) return false;
    if (showOnlyFavorites && !isFavorite('especies', slugify(e.nome))) return false;
    return true;
  });
  renderCards(filtered);
}

function renderCards(especies) {
  const grid = document.getElementById('cards-grid');
  const countEl = document.getElementById('results-count');
  const n = especies.length;
  countEl.textContent = `${n} espécie${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}`;

  if (n === 0) {
    grid.innerHTML = emptyState('🔍', 'Nenhuma espécie encontrada', 'Tente ajustar a busca.');
    return;
  }

  grid.innerHTML = '';
  especies.forEach(esp => {
    const slug = slugify(esp.nome);
    const fav = isFavorite('especies', slug);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${esp.nome}</div>
        <button class="fav-btn ${fav ? 'active' : ''}" data-slug="${slug}" title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-label="Favoritar">
          ${fav ? '★' : '☆'}
        </button>
      </div>
      <div class="card-badges">
        ${esp.tamanho ? `<span class="badge badge-default">${esp.tamanho}</span>` : ''}
        ${esp.deslocamento ? `<span class="badge badge-circulo">${esp.deslocamento}</span>` : ''}
      </div>
      ${esp.tracos && esp.tracos.length > 0
        ? `<div class="card-meta">${esp.tracos.slice(0, 3).map(t => typeof t === 'string' ? t : t.nome).join(' · ')}</div>`
        : ''}
    `;
    card.addEventListener('click', e => {
      if (e.target.closest('.fav-btn')) return;
      openModal(esp);
    });
    card.querySelector('.fav-btn').addEventListener('click', e => {
      e.stopPropagation();
      const added = toggleFavorite('especies', slug);
      const btn = e.currentTarget;
      btn.classList.toggle('active', added);
      btn.textContent = added ? '★' : '☆';
      btn.title = added ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    });
    grid.appendChild(card);
  });
}

function openModal(esp) {
  const slug = slugify(esp.nome);
  const fav = isFavorite('especies', slug);

  document.getElementById('modal-title').textContent = esp.nome;
  document.getElementById('modal-badges').innerHTML = `
    ${esp.tamanho ? `<span class="badge badge-default">${esp.tamanho}</span>` : ''}
    ${esp.deslocamento ? `<span class="badge badge-circulo">Deslocamento: ${esp.deslocamento}</span>` : ''}
  `;
  document.getElementById('modal-description').textContent = esp.descricao || '';

  const statFields = [
    ['Tamanho', esp.tamanho],
    ['Deslocamento', esp.deslocamento],
  ];
  document.getElementById('modal-stats').innerHTML = statFields
    .filter(([, v]) => v)
    .map(([label, value]) => `
      <div class="modal-stat">
        <div class="modal-stat-label">${label}</div>
        <div class="modal-stat-value">${value}</div>
      </div>
    `).join('');

  const tracos = esp.tracos || [];
  const tracosEl = document.getElementById('modal-tracos');
  if (tracos.length > 0) {
    tracosEl.innerHTML = `
      <hr class="modal-divider">
      <p class="modal-tracos-title">Traços Raciais</p>
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
    const added = toggleFavorite('especies', slug);
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
