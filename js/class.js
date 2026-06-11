const CLASS_META = {
  barbarian: { name: 'Bárbaro',    icon: '🪓' },
  bard:      { name: 'Bardo',      icon: '🎵' },
  warlock:   { name: 'Bruxo',      icon: '🔮' },
  cleric:    { name: 'Clérigo',    icon: '✦'  },
  druid:     { name: 'Druida',     icon: '🌿' },
  sorcerer:  { name: 'Feiticeiro', icon: '✨' },
  ranger:    { name: 'Guardião',   icon: '🏹' },
  fighter:   { name: 'Guerreiro',  icon: '🛡' },
  rogue:     { name: 'Ladino',     icon: '🗡' },
  wizard:    { name: 'Mago',       icon: '📚' },
  monk:      { name: 'Monge',      icon: '☯'  },
  paladin:   { name: 'Paladino',   icon: '⚔'  },
};

async function init() {
  updateNavBadge();

  const slug = new URLSearchParams(window.location.search).get('slug');
  const meta = CLASS_META[slug];

  if (!meta) {
    window.location.replace('../classes.html');
    return;
  }

  document.title = `${meta.name} — D&D Buddy`;
  document.getElementById('detail-icon').textContent = meta.icon;
  document.getElementById('detail-name').textContent = meta.name;
  document.getElementById('class-header').hidden = false;

  const content = document.getElementById('class-content');
  try {
    const res = await fetch(`${slug}.md`);
    if (!res.ok) throw new Error('Arquivo não encontrado');
    const markdown = await res.text();
    content.innerHTML = marked.parse(markdown);
  } catch (e) {
    content.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">⚠</div>
      <h3>Erro ao carregar</h3>
      <p>${e.message}</p>
    </div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
