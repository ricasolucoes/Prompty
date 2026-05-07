// gamification.jsx — v2 deep gamification + L2/L3 screens
// Loaded after the inline script in Promptys v2.html so it can use
// existing Icon, Avatar, Header, USERS, PROMPTYS, PrimaryButton, SecondaryButton.

// ════════════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════════════

const LEVELS = [
  { id: 'L1', name: 'Explorador',  min: 0,    color: '#22D3EE', emoji: '🌱', desc: 'Você está começando — copie, gere, avalie.' },
  { id: 'L2', name: 'Curador',     min: 50,   color: '#7C3AED', emoji: '✨', desc: 'Buscar, salvar, seguir criadores.' },
  { id: 'L3', name: 'Criador',     min: 250,  color: '#FF6B4A', emoji: '🎨', desc: 'Criar Promptys, remixar e disputar o ranking.' },
  { id: 'L4', name: 'Mestre',      min: 1000, color: '#FFB020', emoji: '👑', desc: 'Reconhecido pela comunidade. Promptys com selo verificado.' },
  { id: 'L5', name: 'Lendário',    min: 5000, color: '#EC4899', emoji: '🔮', desc: 'Topo do topo. Acesso a beta de novos modelos.' },
];

const BADGES = [
  // Onboarding
  { id: 'first_copy',    name: 'Primeiro Copy',     desc: 'Copiou seu primeiro prompt',          icon: 'copy',     color: '#22D3EE', tier: 'bronze',  trigger: 'copy_count >= 1' },
  { id: 'first_rate',    name: 'Voz da Comunidade', desc: 'Avaliou seu primeiro Prompty',         icon: 'starFill', color: '#FFB020', tier: 'bronze',  trigger: 'rate_count >= 1' },
  { id: 'first_save',    name: 'Coleção Iniciada',  desc: 'Salvou um favorito',                   icon: 'bookmark', color: '#7C3AED', tier: 'bronze',  trigger: 'save_count >= 1' },
  // Volume
  { id: 'curious_10',    name: 'Curioso',           desc: 'Copiou 10 prompts',                    icon: 'copy',     color: '#22D3EE', tier: 'silver',  trigger: 'copy_count >= 10' },
  { id: 'critic_5',      name: 'Crítico',           desc: '5 avaliações com nota e imagem',       icon: 'starFill', color: '#FFB020', tier: 'silver',  trigger: 'rate_with_image >= 5' },
  { id: 'collector_25',  name: 'Colecionador',      desc: '25 Promptys salvos',                   icon: 'bookmark', color: '#7C3AED', tier: 'silver',  trigger: 'save_count >= 25' },
  // Creation (L3)
  { id: 'first_prompty', name: 'Primeira Receita',  desc: 'Publicou seu primeiro Prompty',        icon: 'wand',     color: '#FF6B4A', tier: 'gold',    trigger: 'create_count >= 1' },
  { id: 'remix_master',  name: 'Mestre do Remix',   desc: '5 remixes aceitos pela comunidade',    icon: 'sparkle',  color: '#EC4899', tier: 'gold',    trigger: 'remix_accepted >= 5' },
  { id: 'trendsetter',   name: 'Tendência',         desc: 'Um Prompty seu chegou ao Em Alta',     icon: 'flame',    color: '#FF3B6B', tier: 'gold',    trigger: 'trended >= 1' },
  // Streak
  { id: 'streak_7',      name: 'Semana Cheia',      desc: '7 dias seguidos no app',               icon: 'flame',    color: '#FF6B4A', tier: 'silver',  trigger: 'streak >= 7' },
  { id: 'streak_30',     name: 'Mês Lendário',      desc: '30 dias seguidos no app',              icon: 'flame',    color: '#EC4899', tier: 'gold',    trigger: 'streak >= 30' },
  // Quality
  { id: 'helpful_50',    name: 'Útil',              desc: '50 avaliações marcadas úteis',         icon: 'heartFill',color: '#FF3B6B', tier: 'gold',    trigger: 'helpful_count >= 50' },
  { id: 'verified',      name: 'Verificado',        desc: 'Identidade verificada (L4+)',          icon: 'check',    color: '#34D399', tier: 'platinum',trigger: 'verified === true' },
];

// Daily/weekly missions — drive return visits
const MISSIONS = [
  { id: 'm_daily_copy',  scope: 'daily',  title: 'Copie 1 Prompty',                     reward: 5,  progress: 1, target: 1, icon: 'copy',     done: true },
  { id: 'm_daily_rate',  scope: 'daily',  title: 'Avalie 2 Promptys que você usou',     reward: 10, progress: 1, target: 2, icon: 'starFill', done: false },
  { id: 'm_daily_like',  scope: 'daily',  title: 'Curta 5 Promptys',                    reward: 3,  progress: 3, target: 5, icon: 'heart',    done: false },
  { id: 'm_week_streak', scope: 'weekly', title: 'Mantenha streak de 5 dias',           reward: 25, progress: 4, target: 5, icon: 'flame',    done: false },
  { id: 'm_week_create', scope: 'weekly', title: 'Publique 1 Prompty novo',             reward: 50, progress: 0, target: 1, icon: 'wand',     done: false, requiresLevel: 'L3' },
  { id: 'm_week_remix',  scope: 'weekly', title: 'Faça 2 remixes',                      reward: 30, progress: 0, target: 2, icon: 'sparkle',  done: false, requiresLevel: 'L3' },
];

// Categories for search/explore
const CATEGORIES = [
  { id: 'portrait',  label: 'Retratos',     emoji: '👤', cover: 'linear-gradient(135deg,#7C3AED,#FF6B4A)' },
  { id: 'landscape', label: 'Paisagens',    emoji: '🏞️', cover: 'linear-gradient(135deg,#06b6d4,#7C3AED)' },
  { id: 'product',   label: 'Produto',      emoji: '📦', cover: 'linear-gradient(135deg,#FFB020,#FF6B4A)' },
  { id: 'character', label: 'Personagem',   emoji: '🎭', cover: 'linear-gradient(135deg,#EC4899,#7C3AED)' },
  { id: 'editorial', label: 'Editorial',    emoji: '🗞️', cover: 'linear-gradient(135deg,#FF3B6B,#FFCC00)' },
  { id: 'mascot',    label: 'Mascote 3D',   emoji: '🦊', cover: 'linear-gradient(135deg,#34D399,#FDE68A)' },
  { id: 'fantasy',   label: 'Fantasia',     emoji: '🐉', cover: 'linear-gradient(135deg,#1e3a8a,#7C3AED)' },
  { id: 'logo',      label: 'Logos',        emoji: '✦',  cover: 'linear-gradient(135deg,#0ea5e9,#22D3EE)' },
];

// Weekly ranking mock
const RANKING = [
  { user: 'u3', points: 2420, deltaRank: 0,  promptys: 8 },
  { user: 'u1', points: 1980, deltaRank: 2,  promptys: 6 },
  { user: 'u5', points: 1540, deltaRank: 1,  promptys: 5 },
  { user: 'u2', points: 1230, deltaRank: -1, promptys: 4 },
  { user: 'u4', points: 980,  deltaRank: 3,  promptys: 3 },
  { user: 'ume',points: 240,  deltaRank: 5,  promptys: 1 },
];

// Helpers
const levelOf = (points) => {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (points >= l.min) cur = l;
  return cur;
};
const nextLevel = (points) => LEVELS.find(l => l.min > points) || null;

// ════════════════════════════════════════════════════════════════
// SHARED MICRO-COMPONENTS
// ════════════════════════════════════════════════════════════════

const PointsBubble = ({ value, color = 'var(--primary)' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 9px', borderRadius: 999,
    background: color, color: '#fff',
    fontSize: 11, fontWeight: 800, letterSpacing: 0.3,
    fontFamily: 'Space Grotesk, sans-serif',
  }}>+{value}p</span>
);

const StreakFlame = ({ days, size = 22 }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 999,
    background: 'linear-gradient(135deg,#FF6B4A,#FFB020)',
    color: '#fff', fontWeight: 800, fontSize: 12,
    boxShadow: '0 2px 8px rgba(255,107,74,0.35)',
    fontFamily: 'Space Grotesk, sans-serif',
  }}>
    🔥 <span>{days} {days === 1 ? 'dia' : 'dias'}</span>
  </div>
);

const TierRing = ({ tier = 'bronze', size = 64, children }) => {
  const ring = {
    bronze:   'linear-gradient(135deg,#cd7f32,#8b5a2b)',
    silver:   'linear-gradient(135deg,#e5e7eb,#9ca3af)',
    gold:     'linear-gradient(135deg,#FFD700,#FF9500)',
    platinum: 'linear-gradient(135deg,#7C3AED,#22D3EE,#FF6B4A)',
  }[tier];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: ring,
      padding: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{children}</div>
    </div>
  );
};

const Badge = ({ badge, earned, size = 64 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: earned ? 1 : 0.4 }}>
    <TierRing tier={badge.tier} size={size}>
      <Icon name={badge.icon} size={size * 0.42} color={earned ? badge.color : 'var(--text-3)'} strokeWidth={2}/>
    </TierRing>
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text-1)',
      textAlign: 'center', maxWidth: size + 16, lineHeight: 1.15,
    }}>{badge.name}</div>
    {!earned && <div style={{ fontSize: 9.5, color: 'var(--text-3)' }}>bloqueado</div>}
  </div>
);

const ProgressBar = ({ value, max, color = 'linear-gradient(90deg,#7C3AED,#22D3EE)', height = 8 }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height, borderRadius: height / 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width .4s' }}/>
    </div>
  );
};

const MissionRow = ({ mission, level }) => {
  if (mission.requiresLevel && (mission.requiresLevel === 'L3' && level !== 'L3')) return null;
  const pct = Math.min(mission.progress / mission.target, 1);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 14,
      background: mission.done ? 'rgba(52,211,153,0.10)' : 'var(--surface)',
      border: `1px solid ${mission.done ? 'rgba(52,211,153,0.25)' : 'var(--line)'}`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: mission.done ? 'rgba(52,211,153,0.18)' : 'var(--primary-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={mission.done ? 'check' : mission.icon} size={20}
              color={mission.done ? '#34D399' : 'var(--primary)'} strokeWidth={2.2}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6,
        }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)',
            textDecoration: mission.done ? 'line-through' : 'none',
          }}>{mission.title}</div>
          <PointsBubble value={mission.reward} color={mission.done ? '#34D399' : 'var(--primary)'}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}><ProgressBar value={mission.progress} max={mission.target} height={5}/></div>
          <span style={{
            fontSize: 11, color: 'var(--text-3)', fontFamily: 'ui-monospace, monospace',
            minWidth: 30, textAlign: 'right',
          }}>{mission.progress}/{mission.target}</span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// PROFILE — fully redesigned with gamification core
// ════════════════════════════════════════════════════════════════

const ProfileScreenV2 = ({ state, level }) => {
  const me = USERS.ume;
  const [tab, setTab] = useState('progresso');

  // Compute live points: 1 per like (cap), 5 per copy, 5 per rate
  const points = state.copiedIds.size * 5 + state.ratedIds.size * 5 + Math.min(state.liked.size, 10);
  const cur = levelOf(points);
  const next = nextLevel(points);
  const pctToNext = next ? (points - cur.min) / (next.min - cur.min) : 1;

  // Earned badges based on counts
  const ctx = {
    copy_count: state.copiedIds.size,
    rate_count: state.ratedIds.size,
    save_count: state.saved?.size || 0,
    rate_with_image: 2, // mock
    streak: state.streak || 4,
    helpful_count: 12,
    create_count: state.created?.size || 0,
    remix_accepted: 1,
    trended: 0,
    verified: false,
  };
  const isEarned = (b) => {
    const expr = b.trigger;
    try {
      // trivial parser for our triggers
      const [k, op, v] = expr.split(/\s+/);
      const val = ctx[k];
      const target = isNaN(+v) ? (v === 'true') : +v;
      if (op === '>=') return val >= target;
      if (op === '===') return val === target;
      return false;
    } catch { return false; }
  };

  return (
    <div style={{ paddingBottom: 110 }}>
      <Header level={level}/>

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '24px 18px 18px',
        background: `linear-gradient(135deg, ${cur.color}33, transparent 60%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <TierRing tier={cur.id === 'L1' ? 'bronze' : cur.id === 'L2' ? 'silver' : cur.id === 'L3' ? 'gold' : 'platinum'} size={76}>
            <Avatar user={me} size={64}/>
          </TierRing>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
            }}>
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800,
                color: 'var(--text-1)', letterSpacing: -0.4,
              }}>{me.name}</span>
              <span style={{ fontSize: 18 }}>{cur.emoji}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 8 }}>@{me.handle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 999,
                background: cur.color, color: '#fff',
                fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
                fontFamily: 'Space Grotesk, sans-serif',
              }}>{cur.name.toUpperCase()}</span>
              <StreakFlame days={state.streak || 4}/>
            </div>
          </div>
        </div>

        {/* Level progress */}
        <div style={{ marginTop: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 6, fontSize: 12, color: 'var(--text-2)',
          }}>
            <span><b style={{ color: 'var(--text-1)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 16 }}>{points}</b> pontos</span>
            {next ? (
              <span>{next.min - points}p para <b>{next.name}</b> {next.emoji}</span>
            ) : (
              <span>nível máximo 🏆</span>
            )}
          </div>
          <ProgressBar value={pctToNext * 100} max={100} color={`linear-gradient(90deg,${cur.color},${next?.color || cur.color})`} height={10}/>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Copias',    value: state.copiedIds.size, icon: 'copy',     color: '#22D3EE' },
            { label: 'Avaliações',value: state.ratedIds.size,  icon: 'starFill', color: '#FFB020' },
            { label: 'Curtidas',  value: state.liked.size,     icon: 'heartFill',color: '#FF3B6B' },
            { label: 'Salvos',    value: state.saved?.size || 0,icon: 'bookmark',color: '#7C3AED' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 6px', borderRadius: 12, textAlign: 'center',
              background: 'var(--surface)', border: '1px solid var(--line)',
            }}>
              <Icon name={s.icon} size={16} color={s.color} strokeWidth={2}/>
              <div style={{
                fontSize: 17, fontWeight: 800, color: 'var(--text-1)',
                fontFamily: 'Space Grotesk, sans-serif', marginTop: 2, lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 8,
        padding: '0 4px', background: 'var(--bg)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex' }}>
          {[
            ['progresso', 'Progresso'],
            ['missoes', 'Missões'],
            ['conquistas', 'Conquistas'],
            ['biblioteca', 'Biblioteca'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              all: 'unset', cursor: 'pointer', flex: 1, padding: '12px 4px', textAlign: 'center',
              fontSize: 12.5, fontWeight: 700,
              color: tab === k ? 'var(--text-1)' : 'var(--text-3)',
              borderBottom: tab === k ? `2px solid ${cur.color}` : '2px solid transparent',
              transition: 'color .15s, border-color .15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {tab === 'progresso' && <ProgressTab cur={cur} next={next} points={points} ctx={ctx}/>}
        {tab === 'missoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionTitle>Diárias · resetam à meia-noite</SectionTitle>
            {MISSIONS.filter(m => m.scope === 'daily').map(m => <MissionRow key={m.id} mission={m} level={level}/>)}
            <div style={{ height: 8 }}/>
            <SectionTitle>Semanais · resetam segunda-feira</SectionTitle>
            {MISSIONS.filter(m => m.scope === 'weekly').map(m => <MissionRow key={m.id} mission={m} level={level}/>)}
          </div>
        )}
        {tab === 'conquistas' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14,
            }}>
              <SectionTitle compact>Conquistas</SectionTitle>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {BADGES.filter(isEarned).length}<span style={{ opacity: 0.5 }}>/{BADGES.length}</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, justifyItems: 'center' }}>
              {BADGES.map(b => <Badge key={b.id} badge={b} earned={isEarned(b)}/>)}
            </div>
          </div>
        )}
        {tab === 'biblioteca' && <LibraryTab state={state}/>}
      </div>
    </div>
  );
};

const SectionTitle = ({ children, compact }) => (
  <div style={{
    fontSize: compact ? 13 : 11, fontWeight: 700, color: 'var(--text-3)',
    textTransform: compact ? 'none' : 'uppercase', letterSpacing: compact ? 0 : 0.6,
    marginBottom: compact ? 0 : 10,
  }}>{children}</div>
);

const ProgressTab = ({ cur, next, points, ctx }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{
      padding: 16, borderRadius: 18,
      background: `linear-gradient(135deg, ${cur.color}1c, transparent)`,
      border: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{cur.emoji}</span>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>seu nível</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 19, color: 'var(--text-1)', letterSpacing: -0.4 }}>{cur.name}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>{cur.desc}</div>
    </div>

    {next && (
      <div style={{
        padding: 14, borderRadius: 16,
        background: 'var(--surface)', border: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="lock" size={16} color="var(--text-3)"/>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Próximo: {next.name} {next.emoji}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45, marginBottom: 12 }}>
          {next.desc}
        </div>
        <ProgressBar value={points - cur.min} max={next.min - cur.min} color={`linear-gradient(90deg,${cur.color},${next.color})`} height={8}/>
        <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'ui-monospace, monospace', textAlign: 'right' }}>
          {points - cur.min} / {next.min - cur.min}
        </div>
      </div>
    )}

    {/* How to earn points */}
    <div style={{ padding: 14, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <SectionTitle>Como ganhar pontos</SectionTitle>
      {[
        ['copy', 'Copiar um Prompty', '+5p', '#22D3EE'],
        ['starFill', 'Avaliar um Prompty usado', '+5p', '#FFB020'],
        ['heart', 'Curtir (até 10/dia)', '+1p', '#FF3B6B'],
        ['flame', 'Manter streak diário', '+2p/dia', '#FF6B4A'],
        ['wand', 'Publicar Prompty (L3)', '+50p', '#FF6B4A'],
        ['sparkle', 'Remix aceito (L3)', '+25p', '#EC4899'],
      ].map(([icon, label, pts, color]) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
          borderBottom: '1px solid var(--line)',
        }}>
          <Icon name={icon} size={16} color={color}/>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'Space Grotesk, sans-serif' }}>{pts}</span>
        </div>
      ))}
    </div>
  </div>
);

const LibraryTab = ({ state }) => {
  const [section, setSection] = useState('used');
  const ids = section === 'used' ? [...state.copiedIds] : [...(state.saved || [])];
  const items = ids.map(id => PROMPTYS.find(p => p.id === id)).filter(Boolean);
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          ['used', `Usados (${state.copiedIds.size})`],
          ['saved', `Salvos (${state.saved?.size || 0})`],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setSection(k)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
            color: section === k ? '#fff' : 'var(--text-2)',
            background: section === k ? 'var(--primary)' : 'var(--surface)',
            border: `1px solid ${section === k ? 'var(--primary)' : 'var(--line)'}`,
          }}>{l}</button>
        ))}
      </div>
      {items.length === 0 ? (
        <div style={{
          padding: 28, borderRadius: 14, textAlign: 'center',
          border: '1px dashed var(--line-strong)', color: 'var(--text-3)', fontSize: 13,
        }}>
          {section === 'used' ? 'Você ainda não copiou nenhum Prompty.' : 'Você ainda não salvou nenhum Prompty.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {items.map(p => (
            <div key={p.id} style={{
              borderRadius: 14, overflow: 'hidden',
              background: p.cover, aspectRatio: '4/5',
              position: 'relative', border: '1px solid var(--line)',
            }}>
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                padding: '24px 10px 10px',
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7))',
                color: '#fff',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{p.title}</div>
                <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2 }}>@{USERS[p.author].handle}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// SEARCH SCREEN (L2+)
// ════════════════════════════════════════════════════════════════

const SearchScreen = ({ state, dispatch, level }) => {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState(null);

  const filtered = useMemo(() => {
    let r = PROMPTYS;
    if (query) r = r.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.prompt.toLowerCase().includes(query.toLowerCase())
    );
    return r;
  }, [query]);

  return (
    <div style={{ paddingBottom: 110 }}>
      <Header level={level}/>

      {/* Search bar */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 14,
          background: 'var(--surface)', border: '1px solid var(--line)',
        }}>
          <Icon name="search" size={18} color="var(--text-3)"/>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por estilo, autor ou palavra…"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: 'inherit', fontSize: 14, color: 'var(--text-1)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ all: 'unset', cursor: 'pointer' }}>
              <Icon name="x" size={16} color="var(--text-3)"/>
            </button>
          )}
        </div>
      </div>

      {!query && (
        <>
          {/* Categories grid */}
          <div style={{ padding: '14px 16px 8px' }}>
            <SectionTitle>Categorias</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
                  all: 'unset', cursor: 'pointer',
                  height: 78, borderRadius: 14, padding: 14,
                  background: c.cover, color: '#fff',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span style={{ fontSize: 26 }}>{c.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: -0.2 }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div style={{ padding: '14px 16px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon name="flame" size={16} color="#FF6B4A"/>
              <SectionTitle compact>Em alta esta semana</SectionTitle>
            </div>
            <div style={{ display: 'flex', overflowX: 'auto', gap: 10, paddingBottom: 4 }} className="hscroll">
              {PROMPTYS.slice(0, 5).map((p, i) => (
                <div key={p.id} style={{
                  flexShrink: 0, width: 130,
                }}>
                  <div style={{
                    width: '100%', aspectRatio: '4/5', borderRadius: 12,
                    background: p.cover, position: 'relative', overflow: 'hidden',
                    border: '1px solid var(--line)',
                  }}>
                    <span style={{
                      position: 'absolute', top: 6, left: 6,
                      width: 22, height: 22, borderRadius: 6,
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                      color: '#fff', fontSize: 11, fontWeight: 800,
                      fontFamily: 'Space Grotesk, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-1)',
                    marginTop: 6, lineHeight: 1.25,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>@{USERS[p.author].handle}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top creators */}
          <div style={{ padding: '14px 16px 8px' }}>
            <SectionTitle>Criadores em destaque</SectionTitle>
            {Object.values(USERS).filter(u => u.handle !== 'voce').slice(0, 4).map(u => (
              <div key={u.handle} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--line)',
              }}>
                <Avatar user={u} size={42}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{u.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>@{u.handle}</div>
                </div>
                <SecondaryButton>Seguir</SecondaryButton>
              </div>
            ))}
          </div>
        </>
      )}

      {query && (
        <div style={{ padding: '4px 16px 8px' }}>
          <SectionTitle>Resultados ({filtered.length})</SectionTitle>
          {filtered.length === 0 && (
            <div style={{
              padding: 28, borderRadius: 14, textAlign: 'center',
              border: '1px dashed var(--line-strong)', color: 'var(--text-3)', fontSize: 13,
            }}>Nada encontrado para "{query}".</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                borderRadius: 14, overflow: 'hidden',
                background: p.cover, aspectRatio: '4/5',
                position: 'relative', border: '1px solid var(--line)',
              }}>
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  padding: '24px 10px 10px',
                  background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7))',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{p.title}</div>
                  <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2 }}>@{USERS[p.author].handle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// RANKINGS SCREEN (L3 only)
// ════════════════════════════════════════════════════════════════

const RankingsScreen = ({ state, level }) => {
  const [scope, setScope] = useState('week');
  return (
    <div style={{ paddingBottom: 110 }}>
      <Header level={level}/>
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800,
          color: 'var(--text-1)', letterSpacing: -0.6, marginBottom: 4,
        }}>Ranking 🏆</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          Os criadores que mais contribuíram com a comunidade.
        </div>
      </div>

      <div style={{ padding: '8px 16px' }}>
        <div style={{
          display: 'flex', padding: 4, borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--line)',
        }}>
          {[['week', 'Semana'], ['month', 'Mês'], ['all', 'Geral']].map(([k, l]) => (
            <button key={k} onClick={() => setScope(k)} style={{
              all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center',
              padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: scope === k ? 'var(--surface)' : 'transparent',
              color: scope === k ? 'var(--text-1)' : 'var(--text-3)',
              boxShadow: scope === k ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr',
          alignItems: 'end', gap: 10,
        }}>
          <PodiumStep rank={2} entry={RANKING[1]} height={92} medal="🥈"/>
          <PodiumStep rank={1} entry={RANKING[0]} height={120} medal="🥇"/>
          <PodiumStep rank={3} entry={RANKING[2]} height={70} medal="🥉"/>
        </div>
      </div>

      {/* Rest of list */}
      <div style={{ padding: '20px 16px 0' }}>
        {RANKING.slice(3).map((entry, i) => {
          const u = USERS[entry.user];
          const isMe = entry.user === 'ume';
          return (
            <div key={entry.user} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', marginBottom: 8, borderRadius: 14,
              background: isMe ? 'var(--primary-soft)' : 'var(--surface)',
              border: `1px solid ${isMe ? 'var(--primary)' : 'var(--line)'}`,
            }}>
              <div style={{
                width: 32, fontSize: 14, fontWeight: 800, textAlign: 'center',
                color: 'var(--text-3)', fontFamily: 'Space Grotesk, sans-serif',
              }}>{i + 4}</div>
              <Avatar user={u} size={40}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 700,
                  color: isMe ? 'var(--primary)' : 'var(--text-1)',
                }}>{u.name}{isMe && ' (você)'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{entry.promptys} promptys publicados</div>
              </div>
              <DeltaArrow delta={entry.deltaRank}/>
              <div style={{
                fontSize: 14, fontWeight: 800, color: 'var(--text-1)',
                fontFamily: 'Space Grotesk, sans-serif',
              }}>{entry.points.toLocaleString('pt-BR')}<span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>p</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PodiumStep = ({ rank, entry, height, medal }) => {
  const u = USERS[entry.user];
  const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <Avatar user={u} size={rank === 1 ? 60 : 48}/>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textAlign: 'center', maxWidth: 100, lineHeight: 1.2 }}>{u.name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>@{u.handle}</div>
      <div style={{
        width: '100%', height, borderRadius: '14px 14px 0 0',
        background: `linear-gradient(180deg, ${colors[rank]}, ${colors[rank]}80)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
        padding: '8px 4px', color: '#000', position: 'relative',
      }}>
        <span style={{ fontSize: 26 }}>{medal}</span>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, marginTop: 4,
        }}>{entry.points.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
};

const DeltaArrow = ({ delta }) => {
  if (delta === 0) return <span style={{ fontSize: 11, color: 'var(--text-3)', width: 28, textAlign: 'center' }}>—</span>;
  const up = delta > 0;
  return (
    <span style={{
      width: 28, fontSize: 11, fontWeight: 700, textAlign: 'center',
      color: up ? '#34D399' : '#FF6B4A',
    }}>{up ? '▲' : '▼'} {Math.abs(delta)}</span>
  );
};

// ════════════════════════════════════════════════════════════════
// CREATE FLOW (L3) — abbreviated 3-step flow
// ════════════════════════════════════════════════════════════════

const CreateScreen = ({ state, dispatch, level }) => {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    prompt: '',
    category: 'portrait',
    cover: 'linear-gradient(135deg,#7C3AED,#22D3EE)',
  });
  const steps = ['Inspiração', 'Prompt', 'Publicar'];

  return (
    <div style={{ paddingBottom: 110 }}>
      <Header level={level}/>

      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <button onClick={() => step === 0 ? dispatch({ type: 'go', screen: 'feed' }) : setStep(step - 1)} style={{
            all: 'unset', cursor: 'pointer', padding: 6, borderRadius: 8,
          }}>
            <Icon name="chevronL" size={20} color="var(--text-2)"/>
          </button>
          <div style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800,
            color: 'var(--text-1)', letterSpacing: -0.4,
          }}>Criar Prompty</div>
          <span style={{ flex: 1 }}/>
          <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: 'var(--text-3)' }}>
            {step + 1}/{steps.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? 'linear-gradient(90deg,#7C3AED,#22D3EE)' : 'var(--line)',
            }}/>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Título" hint="curto, descritivo">
              <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
                placeholder="ex: Retrato cinematográfico" style={inputStyle()}/>
            </FormField>
            <FormField label="Descrição">
              <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}
                rows={3} placeholder="o que esse Prompty gera, em 2 frases…"
                style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit' }}/>
            </FormField>
            <FormField label="Categoria">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setDraft({ ...draft, category: c.id })} style={{
                    all: 'unset', cursor: 'pointer',
                    padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                    background: draft.category === c.id ? 'var(--primary)' : 'var(--surface)',
                    color: draft.category === c.id ? '#fff' : 'var(--text-1)',
                    border: `1px solid ${draft.category === c.id ? 'var(--primary)' : 'var(--line)'}`,
                  }}>{c.emoji} {c.label}</button>
                ))}
              </div>
            </FormField>
            <FormField label="Capa" hint="opcional — boa amostra ajuda no feed">
              <image-slot id="create-cover-v2" shape="rounded" radius="14"
                placeholder="solte uma imagem"
                style={{ width: '100%', height: 160, '--is-bg': 'var(--surface)', '--is-border': 'var(--line)' }}/>
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormField label="Prompt completo" hint="o texto que será copiado e colado">
              <textarea value={draft.prompt} onChange={e => setDraft({ ...draft, prompt: e.target.value })}
                rows={14} placeholder="Cole ou escreva aqui o prompt que você testou e funcionou…"
                style={{ ...inputStyle(), fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.5, resize: 'vertical' }}/>
            </FormField>
            <div style={{
              padding: 12, borderRadius: 12,
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
              fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4,
            }}>
              💡 <b>Dica:</b> teste o prompt em pelo menos 2 modelos diferentes antes de publicar. Promptys que funcionam em vários modelos sobem mais rápido no ranking.
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{
              padding: 16, borderRadius: 16, marginBottom: 16,
              background: 'linear-gradient(135deg, rgba(255,107,74,0.14), transparent)',
              border: '1px solid rgba(255,107,74,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="sparkle" size={18} color="#FF6B4A"/>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>Pronto para publicar</span>
                <span style={{ flex: 1 }}/>
                <PointsBubble value={50} color="#FF6B4A"/>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
                Promptys publicados entram no feed em <b>Em alta</b> por 24h. Cada teste e avaliação que ele recebe acumula reputação para você.
              </div>
            </div>

            <SectionTitle>Resumo</SectionTitle>
            <div style={{
              padding: 14, borderRadius: 14,
              background: 'var(--surface)', border: '1px solid var(--line)',
            }}>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 800,
                color: 'var(--text-1)', letterSpacing: -0.4, marginBottom: 4,
              }}>{draft.title || 'Sem título'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
                {draft.description || '(sem descrição)'}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
                {draft.prompt.length} caracteres · categoria {CATEGORIES.find(c => c.id === draft.category)?.label}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 96,
      }}>
        {step < steps.length - 1 ? (
          <PrimaryButton full icon="chevronR" onClick={() => setStep(step + 1)}>Continuar</PrimaryButton>
        ) : (
          <PrimaryButton full icon="check" onClick={() => dispatch({ type: 'publish', draft })}>
            Publicar Prompty
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

const FormField = ({ label, hint, children }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{label}</span>
      {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const inputStyle = () => ({
  width: '100%', padding: '10px 12px', borderRadius: 10,
  background: 'var(--surface)', border: '1px solid var(--line)',
  color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
});

// ════════════════════════════════════════════════════════════════
// LEVEL UP CELEBRATION
// ════════════════════════════════════════════════════════════════

const LevelUpModal = ({ open, level, onDismiss }) => {
  if (!open || !level) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      animation: 'fadeIn .25s',
    }}>
      <div style={{
        position: 'relative',
        width: 'calc(100% - 40px)', maxWidth: 340,
        background: 'var(--surface)', borderRadius: 24,
        padding: '32px 24px 24px',
        textAlign: 'center', overflow: 'hidden',
        animation: 'pop .35s cubic-bezier(.2,1.4,.4,1)',
      }}>
        {/* confetti gradient burst */}
        <div style={{
          position: 'absolute', top: -50, left: -50, right: -50, height: 200,
          background: `radial-gradient(circle at 50% 100%, ${level.color}55, transparent 70%)`,
          pointerEvents: 'none',
        }}/>
        <div style={{ fontSize: 12, fontWeight: 800, color: level.color, letterSpacing: 1.4, marginBottom: 8 }}>
          NOVO NÍVEL
        </div>
        <div style={{ fontSize: 64, marginBottom: 4 }}>{level.emoji}</div>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 30, fontWeight: 800,
          color: 'var(--text-1)', letterSpacing: -0.8,
        }}>{level.name}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.45, marginTop: 10, marginBottom: 22 }}>
          {level.desc}
        </div>

        <div style={{
          padding: 12, borderRadius: 12, marginBottom: 22,
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Você desbloqueou</div>
          {level.id === 'L2' && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
              <li>Buscar Promptys por estilo</li>
              <li>Salvar favoritos na sua biblioteca</li>
              <li>Seguir criadores</li>
            </ul>
          )}
          {level.id === 'L3' && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
              <li>Publicar seus próprios Promptys</li>
              <li>Remixar Promptys de outros</li>
              <li>Ranking semanal</li>
            </ul>
          )}
          {level.id === 'L4' && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
              <li>Selo de verificado nos seus Promptys</li>
              <li>Acesso antecipado a novos modelos</li>
              <li>Convite para o Discord da comunidade</li>
            </ul>
          )}
        </div>

        <PrimaryButton full icon="sparkle" onClick={onDismiss} color={level.color}>
          Continuar explorando
        </PrimaryButton>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════

Object.assign(window, {
  // data
  LEVELS, BADGES, MISSIONS, CATEGORIES, RANKING,
  levelOf, nextLevel,
  // micro components
  PointsBubble, StreakFlame, TierRing, Badge, ProgressBar, MissionRow, SectionTitle,
  // screens
  ProfileScreenV2, SearchScreen, RankingsScreen, CreateScreen, LevelUpModal,
  FormField, inputStyle,
});
