const CLASS_LIST = [
  { slug: 'barbarian', name: 'Bárbaro',     icon: '🪓', attr: 'Força',         desc: 'Combatente feroz impulsionado pela Fúria primitiva.' },
  { slug: 'bard',      name: 'Bardo',        icon: '🎵', attr: 'Carisma',       desc: 'Artista inspirador que canaliza magia pela música e poesia.' },
  { slug: 'warlock',   name: 'Bruxo',        icon: '🔮', attr: 'Carisma',       desc: 'Conjurador cujo poder vem de um pacto com uma entidade sobrenatural.' },
  { slug: 'cleric',    name: 'Clérigo',      icon: '✦',  attr: 'Sabedoria',     desc: 'Sacerdote que canaliza o poder divino de seu deus.' },
  { slug: 'druid',     name: 'Druida',       icon: '🌿', attr: 'Sabedoria',     desc: 'Guardião da natureza com o poder de assumir formas animais.' },
  { slug: 'sorcerer',  name: 'Feiticeiro',   icon: '✨', attr: 'Carisma',       desc: 'Conjurador cuja magia flui de um poder inato e sobrenatural.' },
  { slug: 'ranger',    name: 'Guardião',     icon: '🏹', attr: 'Destreza',      desc: 'Rastreador e explorador especializado em combate à distância.' },
  { slug: 'fighter',   name: 'Guerreiro',    icon: '🛡', attr: 'Força',         desc: 'Mestre em todas as formas de combate e uso de armas.' },
  { slug: 'rogue',     name: 'Ladino',       icon: '🗡', attr: 'Destreza',      desc: 'Especialista em furtividade, trapaças e ataques precisos.' },
  { slug: 'wizard',    name: 'Mago',         icon: '📚', attr: 'Inteligência',  desc: 'Acadêmico arcano que domina a magia através do estudo.' },
  { slug: 'monk',      name: 'Monge',        icon: '☯',  attr: 'Destreza',      desc: 'Artista marcial que canaliza energia interior sobrenatural.' },
  { slug: 'paladin',   name: 'Paladino',     icon: '⚔',  attr: 'Força',         desc: 'Guerreiro sagrado ligado por um juramento divino.' },
];

function init() {
  setActiveNav('classes');
  updateNavBadge();

  const grid = document.getElementById('class-grid');
  CLASS_LIST.forEach(cls => {
    const card = document.createElement('a');
    card.className = 'class-card';
    card.href = `classes/class.html?slug=${cls.slug}`;
    card.innerHTML = `
      <div class="class-card-icon">${cls.icon}</div>
      <div class="class-card-name">${cls.name}</div>
      <div class="class-card-attr">${cls.attr}</div>
      <div class="class-card-desc">${cls.desc}</div>
    `;
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', init);
