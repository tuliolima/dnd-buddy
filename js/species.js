let allSpecies = [];

async function init() {
  setActiveNav('species');
  updateNavBadge();

  const grid = document.getElementById('cards-grid');

  try {
    const res = await fetch('data/species.json');
    if (!res.ok) throw new Error('Arquivo não encontrado.');
    allSpecies = await res.json();
  } catch (e) {
    grid.innerHTML = emptyState('⚠️', 'Erro ao carregar espécies', e.message);
    return;
  }

  if (allSpecies.length === 0) {
    document.getElementById('filters').style.display = 'none';
    grid.innerHTML = emptyState(
      '🌿',
      'Nenhuma espécie cadastrada ainda',
      `Crie o arquivo <code>data/species.json</code> seguindo o schema da documentação e adicione suas espécies.`
    );
    return;
  }

  document.getElementById('search').addEventListener('input', applyFilters);

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  applyFilters();

  const hash = window.location.hash.slice(1);
  if (hash) {
    const sp = allSpecies.find(e => slugify(e.nome) === hash);
    if (sp) openModal(sp);
  }
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase().trim();
  const filtered = allSpecies.filter(sp => {
    if (search && !sp.nome.toLowerCase().includes(search)) return false;
    return true;
  });
  renderCards(filtered);
}

function renderCards(species) {
  const grid = document.getElementById('cards-grid');
  const countEl = document.getElementById('results-count');
  const n = species.length;
  countEl.textContent = `${n} espécie${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}`;

  if (n === 0) {
    grid.innerHTML = emptyState('🔍', 'Nenhuma espécie encontrada', 'Tente ajustar a busca.');
    return;
  }

  grid.innerHTML = '';
  species.forEach(sp => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${sp.nome}</div>
      </div>
      <div class="card-badges">
        ${sp.tamanho ? `<span class="badge badge-default">${sp.tamanho}</span>` : ''}
        ${sp.deslocamento ? `<span class="badge badge-circulo">${sp.deslocamento}</span>` : ''}
      </div>
      ${sp.tracos && sp.tracos.length > 0
        ? `<div class="card-meta">${sp.tracos.slice(0, 3).map(t => typeof t === 'string' ? t : t.nome).join(' · ')}</div>`
        : ''}
    `;
    card.addEventListener('click', () => openModal(sp));
    grid.appendChild(card);
  });
}

function openModal(sp) {
  const slug = slugify(sp.nome);

  document.getElementById('modal-title').textContent = sp.nome;
  document.getElementById('modal-badges').innerHTML = `
    ${sp.tamanho ? `<span class="badge badge-default">${sp.tamanho}</span>` : ''}
    ${sp.deslocamento ? `<span class="badge badge-circulo">Deslocamento: ${sp.deslocamento}</span>` : ''}
  `;
  document.getElementById('modal-description').textContent = sp.descricao || '';

  const statFields = [
    ['Tamanho', sp.tamanho],
    ['Deslocamento', sp.deslocamento],
  ];
  document.getElementById('modal-stats').innerHTML = statFields
    .filter(([, v]) => v)
    .map(([label, value]) => `
      <div class="modal-stat">
        <div class="modal-stat-label">${label}</div>
        <div class="modal-stat-value">${value}</div>
      </div>
    `).join('');

  const traits = sp.tracos || [];
  const traitsEl = document.getElementById('modal-tracos');
  if (traits.length > 0) {
    traitsEl.innerHTML = `
      <hr class="modal-divider">
      <p class="modal-tracos-title">Traços Raciais</p>
      ${traits.map(t => typeof t === 'string'
        ? `<div class="modal-traco"><div class="modal-traco-desc">• ${t}</div></div>`
        : `<div class="modal-traco"><div class="modal-traco-nome">${t.nome}</div><div class="modal-traco-desc">${t.descricao}</div></div>`
      ).join('')}
    `;
  } else {
    traitsEl.innerHTML = '';
  }

  history.replaceState(null, '', `#${slug}`);
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
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
