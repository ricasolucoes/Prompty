// screens-feed.jsx — Feed, Search, Rankings, Profile, Onboarding

const userById = (id) => MOCK_USERS.find(u => u.id === id);
const promptyById = (id) => MOCK_PROMPTYS.find(p => p.id === id);

// ────────────────────────────────────────────────────────────────
// HEADER (inside-app, not iOS native chrome)
// ────────────────────────────────────────────────────────────────
const AppHeader = ({ me, onSearch, onCreate, onProfile, onRanking, onNotif }) => {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      padding: '54px 16px 10px',
      background: 'var(--header-bg)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--chip-bd)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo size={28}/>
          <div style={{
            fontFamily: 'Space Grotesk, ui-sans-serif, system-ui',
            fontWeight: 700, fontSize: 22, color: 'var(--text-1)', letterSpacing: -0.6,
          }}>Promptys</div>
        </div>
        <div style={{ flex: 1 }}/>
        <button onClick={onRanking} style={iconBtnStyle()}>
          <Icon name="trophy" size={20}/>
        </button>
        <button onClick={onNotif} style={{ ...iconBtnStyle(), position: 'relative' }}>
          <Icon name="bell" size={20}/>
          <span style={{
            position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4,
            background: '#FF6B4A', border: '2px solid var(--header-bg)',
          }}/>
        </button>
        <button onClick={onProfile} style={{ marginLeft: 4, padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Avatar user={me} size={36}/>
        </button>
      </div>

      <button onClick={onSearch} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', borderRadius: 14,
        background: 'var(--input-bg)', border: '1px solid var(--chip-bd)',
        color: 'var(--text-3)', fontSize: 14, fontFamily: 'inherit', cursor: 'text',
        textAlign: 'left',
      }}>
        <Icon name="search" size={18}/>
        <span style={{ flex: 1 }}>Buscar promptys, autores, modelos…</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 6px', borderRadius: 6, background: 'var(--chip-bg)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>⌘K</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <PointsPill points={me.points} level={me.level}/>
        <Button variant="primary" size="sm" icon="plus" onClick={onCreate}>Criar Prompty</Button>
      </div>
    </div>
  );
};

const iconBtnStyle = () => ({
  width: 36, height: 36, borderRadius: 12,
  border: '1px solid var(--chip-bd)', background: 'var(--card-bg)',
  color: 'var(--text-1)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
});

const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="2" y="4" width="22" height="22" rx="6" fill="url(#lg1)"/>
    <path d="M9 12h2m10 0h2M9 17h2m10 0h2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="26" cy="6" r="3.5" fill="#22D3EE"/>
    <path d="M26 4l.6 1.4L28 6l-1.4.6L26 8l-.6-1.4L24 6l1.4-.6z" fill="#fff"/>
    <defs>
      <linearGradient id="lg1" x1="2" y1="4" x2="24" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#22D3EE"/>
      </linearGradient>
    </defs>
  </svg>
);

const PointsPill = ({ points, level }) => {
  const lvl = LEVELS.find(l => l.n === level) || LEVELS[0];
  const next = LEVELS.find(l => l.n === level + 1);
  const pct = next ? Math.min(100, ((points - lvl.pts) / (next.pts - lvl.pts)) * 100) : 100;
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 12px 6px 8px', borderRadius: 999,
      background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 13,
        background: 'linear-gradient(135deg,#7C3AED,#22D3EE)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 12,
      }}>{level}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{lvl.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{points}p</span>
        </div>
        <Progress value={pct} max={100} height={3}/>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// FEED CARD
// ────────────────────────────────────────────────────────────────
const FeedCard = ({ prompty, onOpen, onLike, onSave, onRemix, liked, saved }) => {
  const author = userById(prompty.author);
  return (
    <article style={{
      background: 'var(--card-bg)', borderRadius: 20, overflow: 'hidden',
      border: '1px solid var(--chip-bd)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 14px rgba(0,0,0,0.04)',
    }}>
      <button onClick={onOpen} style={{
        display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer',
        textAlign: 'left',
      }}>
        <PromptyCover prompty={prompty} height={260} radius={0} slot={true}/>
      </button>

      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Avatar user={author} size={26}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>@{author.username}</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>v{prompty.version}</span>
        </div>

        <button onClick={onOpen} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
          <h3 style={{
            margin: '0 0 6px', fontSize: 17, lineHeight: 1.25, fontWeight: 700,
            color: 'var(--text-1)', letterSpacing: -0.3,
          }}>{prompty.title}</h3>
          <p style={{
            margin: '0 0 10px', fontSize: 13, lineHeight: 1.4, color: 'var(--text-2)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{prompty.description}</p>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <ModelChips models={prompty.models} max={3}/>
          <Difficulty level={prompty.difficulty}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatPill icon="starFill" iconColor="#FFB020" value={prompty.stats.ratingAvg.toFixed(1)} sub={`${prompty.stats.ratingCount}`}/>
          <StatPill icon="lightning" iconColor="#22D3EE" value={prompty.stats.tests} label="testes"/>
          <StatPill icon="remix" iconColor="#7C3AED" value={prompty.stats.remixes} label="remix"/>
          <div style={{ flex: 1 }}/>
          <button onClick={onLike} style={iconActionStyle(liked)} aria-label="curtir">
            <Icon name={liked ? 'heartFill' : 'heart'} size={20} color={liked ? '#FF6B4A' : 'currentColor'}/>
          </button>
          <button onClick={onSave} style={iconActionStyle(saved)} aria-label="salvar">
            <Icon name={saved ? 'bookmarkFill' : 'bookmark'} size={20} color={saved ? '#7C3AED' : 'currentColor'}/>
          </button>
          <button onClick={onRemix} style={iconActionStyle()} aria-label="remixar">
            <Icon name="remix" size={20}/>
          </button>
        </div>
      </div>
    </article>
  );
};

const iconActionStyle = (active) => ({
  width: 36, height: 36, borderRadius: 10, border: 'none',
  background: 'transparent', color: active ? 'var(--text-1)' : 'var(--text-2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});

const StatPill = ({ icon, iconColor, value, sub, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
    <Icon name={icon} size={13} color={iconColor}/>
    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{value}</span>
    {sub && <span style={{ color: 'var(--text-3)' }}>·{sub}</span>}
    {label && <span>{label}</span>}
  </span>
);

// ────────────────────────────────────────────────────────────────
// HOME FEED SCREEN
// ────────────────────────────────────────────────────────────────
const HomeScreen = ({ state, dispatch }) => {
  const [tab, setTab] = React.useState('trending');
  const me = state.users.u_me;

  const sortedPromptys = React.useMemo(() => {
    const list = [...MOCK_PROMPTYS];
    switch (tab) {
      case 'new':     return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case 'tested':  return list.sort((a, b) => b.stats.tests - a.stats.tests);
      case 'top':     return list.sort((a, b) => b.stats.ratingAvg - a.stats.ratingAvg);
      case 'remix':   return list.filter(p => p.license === 'community-remix');
      case 'easy':    return list.filter(p => p.difficulty === 'beginner');
      default:        return list.sort((a, b) => b.stats.likes - a.stats.likes);
    }
  }, [tab]);

  return (
    <div>
      <AppHeader
        me={me}
        onSearch={() => dispatch({ type: 'go', screen: 'search' })}
        onCreate={() => dispatch({ type: 'go', screen: 'create' })}
        onProfile={() => dispatch({ type: 'go', screen: 'profile' })}
        onRanking={() => dispatch({ type: 'go', screen: 'rankings' })}
        onNotif={() => dispatch({ type: 'go', screen: 'profile', tab: 'activity' })}
      />

      {/* Tabs */}
      <div style={{
        position: 'sticky', top: 161, zIndex: 20,
        background: 'var(--header-bg)', backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--chip-bd)',
        padding: '10px 0',
      }}>
        <div style={{
          display: 'flex', gap: 6, padding: '0 12px', overflowX: 'auto',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {FEED_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: tab === t.key ? 'var(--text-1)' : 'var(--chip-bg)',
              color: tab === t.key ? 'var(--bg)' : 'var(--text-2)',
              fontFamily: 'inherit',
            }}>
              {t.key === 'trending' && <span style={{ marginRight: 5 }}>🔥</span>}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 12px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sortedPromptys.map(p => (
          <FeedCard
            key={p.id}
            prompty={p}
            liked={state.liked.has(p.id)}
            saved={state.saved.has(p.id)}
            onOpen={() => dispatch({ type: 'go', screen: 'prompty', id: p.id })}
            onLike={() => dispatch({ type: 'toggleLike', id: p.id })}
            onSave={() => dispatch({ type: 'toggleSave', id: p.id })}
            onRemix={() => dispatch({ type: 'go', screen: 'remix', id: p.id })}
          />
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// SEARCH SCREEN
// ────────────────────────────────────────────────────────────────
const SearchScreen = ({ state, dispatch }) => {
  const [query, setQuery] = React.useState('');
  const [filterModel, setFilterModel] = React.useState(null);
  const [filterDiff, setFilterDiff] = React.useState(null);

  const trendingTags = ['retrato', 'cinematográfico', 'logo', 'arquitetura', 'y2k', 'comida', 'render', 'editorial', 'personagem', 'stop-motion'];
  const trendingSearches = ['anamórfico', 'flux schnell', 'paleta noir', 'mãos consistentes', 'luz golden hour'];

  const filtered = React.useMemo(() => {
    return MOCK_PROMPTYS.filter(p => {
      if (query && !((p.title + ' ' + p.description + ' ' + p.styleTags.join(' ')).toLowerCase().includes(query.toLowerCase()))) return false;
      if (filterModel && !p.models.includes(filterModel)) return false;
      if (filterDiff && p.difficulty !== filterDiff) return false;
      return true;
    });
  }, [query, filterModel, filterDiff]);

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        padding: '54px 16px 10px',
        background: 'var(--header-bg)', backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--chip-bd)',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => dispatch({ type: 'back' })} style={iconBtnStyle()}>
            <Icon name="chevronL" size={20}/>
          </button>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 14,
            background: 'var(--input-bg)', border: '1px solid var(--input-bd)',
          }}>
            <Icon name="search" size={18} color="var(--text-3)"/>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="promptys, autores, tags…"
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 14, color: 'var(--text-1)', fontFamily: 'inherit',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-3)' }}>
                <Icon name="x" size={16}/>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {['Midjourney', 'Flux', 'SDXL', 'DALL-E'].map(m => (
            <Chip key={m} active={filterModel === m} onClick={() => setFilterModel(filterModel === m ? null : m)}>{m}</Chip>
          ))}
          <span style={{ width: 8, flexShrink: 0 }}/>
          {[['beginner', 'Iniciante'], ['intermediate', 'Médio'], ['advanced', 'Avançado']].map(([k, l]) => (
            <Chip key={k} active={filterDiff === k} onClick={() => setFilterDiff(filterDiff === k ? null : k)}>{l}</Chip>
          ))}
        </div>
      </div>

      {!query && !filterModel && !filterDiff ? (
        <div style={{ padding: 16 }}>
          <SectionLabel>Em alta agora</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {trendingTags.map(t => <Chip key={t} icon="flame" tone="coral" onClick={() => setQuery(t)}>{t}</Chip>)}
          </div>
          <SectionLabel>Buscas recentes da comunidade</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
            {trendingSearches.map(t => (
              <button key={t} onClick={() => setQuery(t)} style={{
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 8px', borderRadius: 10,
              }}>
                <Icon name="search" size={16} color="var(--text-3)"/>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)' }}>{t}</span>
                <Icon name="arrow" size={14} color="var(--text-3)"/>
              </button>
            ))}
          </div>
          <SectionLabel>Autores em destaque</SectionLabel>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 0' }}>
            {MOCK_USERS.filter(u => u.id !== 'u_me').slice(0, 5).map(u => (
              <div key={u.id} style={{
                width: 110, flexShrink: 0, padding: 12,
                background: 'var(--card-bg)', borderRadius: 14, border: '1px solid var(--chip-bd)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <Avatar user={u} size={48}/>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>@{u.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>nível {u.level}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '4px 4px 12px' }}>
            {filtered.length} prompty{filtered.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(p => <SearchResult key={p.id} prompty={p} onOpen={() => dispatch({ type: 'go', screen: 'prompty', id: p.id })}/>)}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                <Icon name="search" size={36} color="var(--text-3)"/>
                <div style={{ marginTop: 8, fontSize: 14 }}>Nada por aqui ainda. Tente outros filtros.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6,
    color: 'var(--text-3)', marginBottom: 10, marginTop: 4,
  }}>{children}</div>
);

const SearchResult = ({ prompty, onOpen }) => {
  const author = userById(prompty.author);
  return (
    <button onClick={onOpen} style={{
      all: 'unset', cursor: 'pointer', display: 'flex', gap: 12,
      padding: 10, borderRadius: 14,
      background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
    }}>
      <div style={{ width: 72, height: 72, borderRadius: 12, background: prompty.cover, flexShrink: 0 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{prompty.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>@{author.username}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Stars value={prompty.stats.ratingAvg} size={11}/>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{prompty.stats.tests} testes</span>
          <Difficulty level={prompty.difficulty}/>
        </div>
      </div>
    </button>
  );
};

// ────────────────────────────────────────────────────────────────
// RANKINGS SCREEN
// ────────────────────────────────────────────────────────────────
const RankingsScreen = ({ state, dispatch }) => {
  const [tab, setTab] = React.useState('week');
  const ranked = [...MOCK_USERS].sort((a, b) => b.points - a.points);
  const me = ranked.findIndex(u => u.id === 'u_me');

  return (
    <div>
      <SimpleHeader title="Ranking" onBack={() => dispatch({ type: 'back' })}/>

      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[['week', 'Semana'], ['month', 'Mês'], ['all', 'Geral']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none',
              background: tab === k ? 'var(--text-1)' : 'var(--chip-bg)',
              color: tab === k ? 'var(--bg)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>

        {/* Podium */}
        <div style={{
          position: 'relative', height: 220, marginBottom: 16,
          background: 'linear-gradient(180deg, rgba(124,58,237,0.16), rgba(34,211,238,0.04))',
          borderRadius: 18, border: '1px solid var(--chip-bd)',
          padding: '20px 16px', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px 14px', fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            ATUALIZADO HÁ 2 MIN
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, height: '100%' }}>
            <PodiumPlace user={ranked[1]} place={2} height={120}/>
            <PodiumPlace user={ranked[0]} place={1} height={160}/>
            <PodiumPlace user={ranked[2]} place={3} height={100}/>
          </div>
        </div>

        {/* Your position */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 12, borderRadius: 14, marginBottom: 12,
          background: 'linear-gradient(90deg,rgba(124,58,237,0.16),rgba(34,211,238,0.16))',
          border: '1px solid rgba(124,58,237,0.3)',
        }}>
          <div style={{ width: 28, fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>#{me + 1}</div>
          <Avatar user={state.users.u_me} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Você</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>+85 pts esta semana</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{state.users.u_me.points}p</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ranked.slice(3).map((u, i) => (
            <RankRow key={u.id} user={u} place={i + 4}/>
          ))}
        </div>
      </div>
    </div>
  );
};

const PodiumPlace = ({ user, place, height }) => {
  const colors = { 1: '#FFCC00', 2: '#A8B3CC', 3: '#FF8E53' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
      {place === 1 && <div style={{ position: 'absolute', top: -16, fontSize: 22 }}>👑</div>}
      <Avatar user={user} size={place === 1 ? 56 : 48} ring={place === 1}/>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{user.username}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{user.points}p</div>
      <div style={{
        width: 76, height,
        borderRadius: '12px 12px 0 0',
        background: `linear-gradient(180deg, ${colors[place]}55, ${colors[place]}22)`,
        border: `1px solid ${colors[place]}`,
        borderBottom: 'none',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 10,
        fontSize: 22, fontWeight: 800,
        color: colors[place],
        fontFamily: 'Space Grotesk, sans-serif',
      }}>{place}</div>
    </div>
  );
};

const RankRow = ({ user, place }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 12,
    background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
  }}>
    <div style={{ width: 28, fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>#{place}</div>
    <Avatar user={user} size={34}/>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>@{user.username}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>nível {user.level} · {LEVELS.find(l => l.n === user.level)?.name}</div>
    </div>
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{user.points}p</div>
  </div>
);

const SimpleHeader = ({ title, onBack, right }) => (
  <div style={{
    position: 'sticky', top: 0, zIndex: 30,
    padding: '54px 16px 12px',
    background: 'var(--header-bg)', backdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid var(--chip-bd)',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <button onClick={onBack} style={iconBtnStyle()}>
      <Icon name="chevronL" size={20}/>
    </button>
    <div style={{
      flex: 1, fontSize: 18, fontWeight: 700, color: 'var(--text-1)', letterSpacing: -0.3,
    }}>{title}</div>
    {right}
  </div>
);

// ────────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ────────────────────────────────────────────────────────────────
const ProfileScreen = ({ state, dispatch }) => {
  const me = state.users.u_me;
  const [tab, setTab] = React.useState(state.profileTab || 'promptys');
  const myPromptys = MOCK_PROMPTYS.filter(p => p.author === 'u_me' || state.myDrafts.includes(p.id));
  const lvl = LEVELS.find(l => l.n === me.level);
  const nextLvl = LEVELS.find(l => l.n === me.level + 1);

  return (
    <div style={{ paddingBottom: 20 }}>
      <SimpleHeader title="Perfil" onBack={() => dispatch({ type: 'back' })}
        right={<button style={iconBtnStyle()}><Icon name="settings" size={20}/></button>}
      />

      {/* Hero card */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          padding: 18, borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(34,211,238,0.10) 60%, rgba(255,107,74,0.08))',
          border: '1px solid var(--chip-bd)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar user={me} size={64} ring/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: -0.3 }}>{me.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>@{me.username}</div>
            </div>
            <Button variant="secondary" size="sm" icon="edit">Editar</Button>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              padding: '5px 11px', borderRadius: 999,
              background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
              fontSize: 12, fontWeight: 700, color: '#A684F6', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>⬢</span> Nível {me.level} · {lvl.name}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{me.points}p</span>
          </div>
          {nextLvl && (
            <div style={{ marginTop: 10 }}>
              <Progress value={(me.points - lvl.pts)} max={nextLvl.pts - lvl.pts}/>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                faltam <b style={{ color: 'var(--text-1)' }}>{nextLvl.pts - me.points}p</b> para <b style={{ color: 'var(--text-1)' }}>{nextLvl.name}</b>
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Promptys', value: 4 },
            { label: 'Testes', value: 67 },
            { label: 'Remixes', value: 8 },
            { label: 'Curtidas', value: 312 },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 8px', borderRadius: 12,
              background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        position: 'sticky', top: 73, zIndex: 10,
        marginTop: 16, padding: '8px 16px 0',
        background: 'var(--bg)',
      }}>
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid var(--chip-bd)',
        }}>
          {[
            ['promptys', 'Promptys'],
            ['badges', 'Badges'],
            ['activity', 'Atividade'],
            ['saved', 'Salvos'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '10px 6px', border: 'none', background: 'none',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              color: tab === k ? 'var(--text-1)' : 'var(--text-3)',
              borderBottom: tab === k ? '2px solid #7C3AED' : '2px solid transparent',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {tab === 'promptys' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {myPromptys.map(p => (
              <button key={p.id} onClick={() => dispatch({ type: 'go', screen: 'prompty', id: p.id })} style={{
                all: 'unset', cursor: 'pointer', display: 'block',
              }}>
                <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 14, background: p.cover, marginBottom: 8 }}/>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.25 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{p.stats.tests} testes · {p.stats.ratingAvg.toFixed(1)}★</div>
              </button>
            ))}
            {myPromptys.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                Você ainda não publicou nenhum Prompty.
              </div>
            )}
          </div>
        )}

        {tab === 'badges' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
              {BADGES.filter(b => b.earned).length} de {BADGES.length} desbloqueadas
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, justifyItems: 'center',
            }}>
              {BADGES.map(b => <BadgeTile key={b.key} badge={b}/>)}
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ACTIVITY.map(a => {
              const u = userById(a.user);
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px',
                  borderBottom: '1px solid var(--chip-bd)',
                }}>
                  <Avatar user={u} size={34}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-1)' }}>
                      <b>{a.user === 'u_me' ? 'Você' : '@' + u.username}</b> {a.text}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>há {a.daysAgo}d</div>
                  </div>
                  {a.points && <Chip tone="violet" size="sm">{a.points}</Chip>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'saved' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[...state.saved].map(id => {
              const p = promptyById(id);
              if (!p) return null;
              return (
                <button key={id} onClick={() => dispatch({ type: 'go', screen: 'prompty', id })} style={{ all: 'unset', cursor: 'pointer' }}>
                  <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 14, background: p.cover, marginBottom: 8 }}/>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{p.title}</div>
                </button>
              );
            })}
            {state.saved.size === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                Salve promptys do feed pra revisitar depois.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// ONBOARDING
// ────────────────────────────────────────────────────────────────
const OnboardingScreen = ({ state, dispatch }) => {
  const [step, setStep] = React.useState(0);
  const slides = [
    {
      title: 'Promptys', sub: 'A rede social dos prompts visuais que realmente funcionam.',
      visual: 'logo',
      body: 'Crie, teste, remixe e avalie prompts avançados de geração de imagem — junto com a comunidade.',
    },
    {
      title: 'Cada Prompty é um template vivo',
      sub: 'Variáveis. Imagens de referência. Negativos. Versões.',
      visual: 'template',
      body: 'Não é só um texto. É um template parametrizável testado pela comunidade em vários modelos.',
    },
    {
      title: 'Teste, remixe, ganhe pontos',
      sub: 'Cada contribuição vira reputação',
      visual: 'gamification',
      body: 'Publique +50p · Teste +15p · Remix aceito +25p · Avaliação útil +10p.',
    },
    {
      title: '100% gratuito, sem ads',
      sub: 'Aberto, transparente e colaborativo',
      visual: 'free',
      body: 'Histórico de versões aberto. Licenças de remix transparentes. Nada de paywall.',
    },
  ];

  const s = slides[step];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: step === 0
        ? 'linear-gradient(160deg,#090A14 0%, #1B1240 50%, #042939 100%)'
        : 'var(--bg)',
      color: step === 0 ? '#fff' : 'var(--text-1)',
    }}>
      <div style={{ paddingTop: 64, padding: '64px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 3,
              background: i === step ? '#7C3AED' : (step === 0 ? 'rgba(255,255,255,0.25)' : 'var(--chip-bd)'),
              transition: 'width .3s',
            }}/>
          ))}
        </div>
        {step < slides.length - 1 && (
          <button onClick={() => dispatch({ type: 'go', screen: 'home' })} style={{
            all: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: step === 0 ? 'rgba(255,255,255,0.7)' : 'var(--text-3)',
          }}>Pular</button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <OnboardingVisual kind={s.visual} dark={step === 0}/>
        <div style={{
          fontSize: 30, fontWeight: 800, lineHeight: 1.1, marginTop: 36, letterSpacing: -0.8,
          fontFamily: 'Space Grotesk, sans-serif',
        }}>{s.title}</div>
        <div style={{
          fontSize: 16, marginTop: 10, opacity: 0.85, fontWeight: 500,
        }}>{s.sub}</div>
        <div style={{
          fontSize: 14, marginTop: 16, lineHeight: 1.5, maxWidth: 320,
          opacity: 0.7,
        }}>{s.body}</div>
      </div>

      <div style={{ padding: '0 24px 48px' }}>
        {step < slides.length - 1 ? (
          <Button variant="primary" size="lg" full iconRight="arrow" onClick={() => setStep(step + 1)}>
            Continuar
          </Button>
        ) : (
          <Button variant="primary" size="lg" full iconRight="arrow" onClick={() => dispatch({ type: 'go', screen: 'home' })}>
            Entrar na comunidade
          </Button>
        )}
        {step === slides.length - 1 && (
          <button onClick={() => dispatch({ type: 'go', screen: 'home' })} style={{
            all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center', width: '100%',
            marginTop: 14, fontSize: 13, color: 'var(--text-3)',
          }}>Já tenho conta · Entrar</button>
        )}
      </div>
    </div>
  );
};

const OnboardingVisual = ({ kind, dark }) => {
  if (kind === 'logo') {
    return (
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 48,
          background: 'linear-gradient(135deg,#7C3AED,#22D3EE)',
          boxShadow: '0 30px 80px rgba(124,58,237,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Logo size={120}/>
        </div>
        <div style={{
          position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%',
          background: 'radial-gradient(circle, #FF6B4A, transparent 70%)', filter: 'blur(8px)',
        }}/>
      </div>
    );
  }
  if (kind === 'template') {
    return (
      <div style={{
        width: 280, padding: 16, borderRadius: 18,
        background: 'var(--code-bg)', color: 'var(--code-fg)',
        textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.7,
        border: '1px solid var(--chip-bd)',
      }}>
        <div style={{ color: 'var(--text-3)' }}>// Retrato Cinematográfico</div>
        cinematic portrait of <span style={{ background: 'rgba(124,58,237,0.2)', color: '#A684F6', padding: '0 4px', borderRadius: 3 }}>{`{{subject}}`}</span><br/>
        in <span style={{ background: 'rgba(34,211,238,0.2)', color: '#22D3EE', padding: '0 4px', borderRadius: 3 }}>{`{{environment}}`}</span><br/>
        lighting: <span style={{ background: 'rgba(255,107,74,0.2)', color: '#FF8E66', padding: '0 4px', borderRadius: 3 }}>{`{{light}}`}</span><br/>
        <span style={{ color: 'var(--text-3)' }}>// 412 testes · 4.7 ★</span>
      </div>
    );
  }
  if (kind === 'gamification') {
    return (
      <div style={{ display: 'flex', gap: 14 }}>
        {BADGES.slice(0, 4).map((b, i) => (
          <div key={b.key} style={{
            width: 60, height: 60, borderRadius: 18,
            background: `radial-gradient(circle at 30% 25%, ${b.color}, ${b.color}33 70%)`,
            border: `1px solid ${b.color}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: '#fff',
            transform: `rotate(${[-8, -2, 4, 10][i]}deg)`,
            boxShadow: `0 10px 24px ${b.color}33`,
          }}>{b.icon}</div>
        ))}
      </div>
    );
  }
  if (kind === 'free') {
    return (
      <div style={{
        width: 220, height: 140, borderRadius: 24, position: 'relative',
        background: 'linear-gradient(135deg, var(--card-bg), var(--card-bg))',
        border: '1px solid var(--chip-bd)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 56, letterSpacing: -2, background: 'linear-gradient(135deg,#7C3AED,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Free
        </div>
        <div style={{ position: 'absolute', bottom: 16, fontSize: 11, color: 'var(--text-3)', letterSpacing: 1, fontFamily: 'JetBrains Mono, monospace' }}>NO ADS · NO PAYWALL</div>
      </div>
    );
  }
  return null;
};

Object.assign(window, {
  HomeScreen, SearchScreen, RankingsScreen, ProfileScreen, OnboardingScreen,
  AppHeader, FeedCard, SimpleHeader, Logo, PointsPill,
  iconBtnStyle, userById, promptyById,
});
