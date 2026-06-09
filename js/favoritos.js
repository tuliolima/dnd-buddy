let allData = { magias: [], classes: [], especies: [] };

async function init() {
  setActiveNav('favoritos');
  updateNavBadge();

  [allData.magias, allData.classes, allData.especies] = await Promise.all([
    fetch('data/spells.json').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('data/classes.json').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('data/especies.json').then(r => r.ok ? r.json() : []).catch(() => []),
  ]);

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

  const sections = [
    { type: 'magias',   label: 'Magias',   items: matchFavs(favs.magias,   allData.magias) },
    { type: 'classes',  label: 'Classes',  items: matchFavs(favs.classes,  allData.classes) },
    { type: 'especies', label: 'Espécies', items: matchFavs(favs.especies, allData.especies) },
  ].filter(s => s.items.length > 0);

  if (sections.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">★</div>
      <h3>Nenhum favorito ainda</h3>
      <p>Nas páginas de Magias, Classes e Espécies, toque em ☆ em qualquer item para salvá-lo aqui.</p>
    </div>`;
    return;
  }

  container.innerHTML = '';
  sections.forEach(({ type, label, items }) => {
    const section = document.createElement('section');
    section.className = 'fav-section';
    const grid = document.createElement('div');
    grid.className = 'cards-grid';
    items.forEach(item => grid.appendChild(buildCard(item, type)));
    section.innerHTML = `<h2 class="section-title">${label}</h2>`;
    section.appendChild(grid);
    container.appendChild(section);
  });
}

function matchFavs(slugs, data) {
  if (!slugs || !data.length) return [];
  return slugs.map(slug => data.find(item => slugify(item.nome) === slug)).filter(Boolean);
}

function buildCard(item, type) {
  const slug = slugify(item.nome);
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = cardHTML(item, type, slug);
  card.addEventListener('click', e => {
    if (e.target.closest('.fav-btn')) return;
    openModal(item, type);
  });
  card.querySelector('.fav-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(type, slug);
    render();
  });
  return card;
}

function cardHTML(item, type, slug) {
  let badges = '';
  let meta = '';
  if (type === 'magias') {
    const truque = String(item.circulo) === '0';
    badges = `<span class="badge ${truque ? 'badge-circulo-0' : 'badge-circulo'}">${circuloLabel(item.circulo)}</span>
              <span class="badge ${schoolBadgeClass(item.escola)}">${item.escola}</span>`;
    meta = item.classes || '';
  } else if (type === 'classes') {
    badges = (item.dado_de_vida ? `<span class="badge badge-circulo">Dado: ${item.dado_de_vida}</span>` : '')
           + (item.conjura_magias ? `<span class="badge badge-encantamento">Conjurador</span>` : '');
    meta = item.habilidade_primaria || '';
  } else {
    badges = (item.tamanho    ? `<span class="badge badge-default">${item.tamanho}</span>` : '')
           + (item.deslocamento ? `<span class="badge badge-circulo">${item.deslocamento}</span>` : '');
  }
  return `
    <div class="card-header">
      <div class="card-title">${item.nome}</div>
      <button class="fav-btn active" data-slug="${slug}" title="Remover dos favoritos" aria-label="Remover dos favoritos">★</button>
    </div>
    <div class="card-badges">${badges}</div>
    ${meta ? `<div class="card-meta">${meta}</div>` : ''}
  `;
}

function openModal(item, type) {
  const slug = slugify(item.nome);
  document.getElementById('modal-title').textContent = item.nome;
  document.getElementById('modal-badges').innerHTML = buildModalBadges(item, type);
  document.getElementById('modal-description').textContent = item.descricao || '';
  document.getElementById('modal-stats').innerHTML = buildModalStats(item, type);

  const tracos = item.tracos || [];
  const tracosEl = document.getElementById('modal-tracos');
  tracosEl.innerHTML = tracos.length ? `
    <hr class="modal-divider">
    <p class="modal-tracos-title">${type === 'especies' ? 'Traços Raciais' : 'Traços'}</p>
    ${tracos.map(t => typeof t === 'string'
      ? `<div class="modal-traco"><div class="modal-traco-desc">• ${t}</div></div>`
      : `<div class="modal-traco"><div class="modal-traco-nome">${t.nome}</div><div class="modal-traco-desc">${t.descricao}</div></div>`
    ).join('')}
  ` : '';

  setFavBtn(slug, type);
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function buildModalBadges(item, type) {
  if (type === 'magias') {
    const truque = String(item.circulo) === '0';
    return `<span class="badge ${truque ? 'badge-circulo-0' : 'badge-circulo'}">${circuloLabel(item.circulo)}</span>
            <span class="badge ${schoolBadgeClass(item.escola)}">${item.escola}</span>`;
  }
  if (type === 'classes') {
    return (item.dado_de_vida ? `<span class="badge badge-circulo">Dado de Vida: ${item.dado_de_vida}</span>` : '')
         + (item.conjura_magias ? `<span class="badge badge-encantamento">Conjurador de Magias</span>` : '');
  }
  return (item.tamanho     ? `<span class="badge badge-default">${item.tamanho}</span>` : '')
       + (item.deslocamento ? `<span class="badge badge-circulo">Deslocamento: ${item.deslocamento}</span>` : '');
}

function buildModalStats(item, type) {
  let fields = [];
  if (type === 'magias') {
    fields = [
      ['Tempo de Conjuração', item.tempo_conjuracao],
      ['Alcance', item.alcance],
      ['Componentes', item.componentes],
      ['Duração', item.duracao],
      ['Classes', item.classes],
    ];
  } else if (type === 'classes') {
    fields = [
      ['Habilidade Primária', item.habilidade_primaria],
      ['Proficiências', item.proficiencias],
      ...(item.conjura_magias != null ? [['Conjura Magias', item.conjura_magias ? 'Sim' : 'Não']] : []),
    ];
  } else {
    fields = [
      ['Tamanho', item.tamanho],
      ['Deslocamento', item.deslocamento],
    ];
  }
  return fields.filter(([, v]) => v).map(([label, value]) => `
    <div class="modal-stat">
      <div class="modal-stat-label">${label}</div>
      <div class="modal-stat-value">${value}</div>
    </div>
  `).join('');
}

function setFavBtn(slug, type) {
  const fav = isFavorite(type, slug);
  const btn = document.getElementById('modal-fav-btn');
  btn.className = `modal-fav-btn ${fav ? 'active' : ''}`;
  btn.textContent = fav ? '★' : '☆';
  btn.title = fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  btn.onclick = () => {
    toggleFavorite(type, slug);
    setFavBtn(slug, type);
    render();
  };
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', init);
