// screens-prompty.jsx — Prompty detail, Create flow, Test view, Remix view

// Helper: assemble final prompt
const assembleFinalPrompt = (prompty, inputValues) => {
  let out = prompty.template;
  prompty.inputs.forEach(input => {
    const v = inputValues[input.key] ?? input.value ?? '';
    out = out.replaceAll(`{{${input.key}}}`, v || `[${input.label}]`);
  });
  return out;
};

// ────────────────────────────────────────────────────────────────
// PROMPTY DETAIL
// ────────────────────────────────────────────────────────────────
const PromptyScreen = ({ state, dispatch }) => {
  const prompty = MOCK_PROMPTYS.find(p => p.id === state.activePromptyId) || MOCK_PROMPTYS[0];
  const author = MOCK_USERS.find(u => u.id === prompty.author);
  const [tab, setTab] = React.useState('inputs'); // inputs | tests | ratings | remix
  const [inputValues, setInputValues] = React.useState(
    Object.fromEntries(prompty.inputs.map(i => [i.key, i.value ?? '']))
  );
  const [showFullPrompt, setShowFullPrompt] = React.useState(false);
  const [openImageInput, setOpenImageInput] = React.useState(null);

  const finalPrompt = assembleFinalPrompt(prompty, inputValues);
  const tests = MOCK_TESTS.filter(t => t.promptyId === prompty.id);
  const remixes = MOCK_REMIXES.filter(r => r.originalId === prompty.id);

  const liked = state.liked.has(prompty.id);
  const saved = state.saved.has(prompty.id);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Sticky back button overlay */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        padding: '54px 16px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        background: 'linear-gradient(180deg,rgba(9,10,20,0.5),transparent)',
        backdropFilter: 'blur(8px)',
        marginBottom: -260,
      }}>
        <button onClick={() => dispatch({ type: 'back' })} style={floatingBtn()}>
          <Icon name="chevronL" size={20} color="#fff"/>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => dispatch({ type: 'toggleLike', id: prompty.id })} style={floatingBtn()}>
            <Icon name={liked ? 'heartFill' : 'heart'} size={18} color={liked ? '#FF6B4A' : '#fff'}/>
          </button>
          <button onClick={() => dispatch({ type: 'toggleSave', id: prompty.id })} style={floatingBtn()}>
            <Icon name={saved ? 'bookmarkFill' : 'bookmark'} size={18} color={saved ? '#7C3AED' : '#fff'}/>
          </button>
          <button style={floatingBtn()}>
            <Icon name="send" size={18} color="#fff"/>
          </button>
        </div>
      </div>

      {/* Hero cover */}
      <div style={{ position: 'relative', height: 360 }}>
        <PromptyCover prompty={prompty} height={360} radius={0} slot={true} slotId={`detail-${prompty.id}`}/>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 120,
          background: 'linear-gradient(180deg, transparent, var(--bg))',
        }}/>
      </div>

      <div style={{ padding: '12px 16px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <ModelChips models={prompty.models} max={4}/>
          <Difficulty level={prompty.difficulty} withLabel/>
          <span style={{ flex: 1 }}/>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>v{prompty.version}</span>
        </div>

        <h1 style={{
          margin: '4px 0 6px', fontSize: 26, fontWeight: 800, letterSpacing: -0.6,
          color: 'var(--text-1)', lineHeight: 1.15,
          fontFamily: 'Space Grotesk, sans-serif',
        }}>{prompty.title}</h1>
        <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-2)' }}>
          {prompty.description}
        </p>

        {/* Author + stats strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 14, marginBottom: 14,
          background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
        }}>
          <Avatar user={author} size={36}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{author.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>@{author.username} · nível {author.level}</div>
          </div>
          <Button variant="secondary" size="sm">Seguir</Button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
          {[
            { label: '★ Média', value: prompty.stats.ratingAvg.toFixed(1), accent: '#FFB020' },
            { label: 'Testes', value: prompty.stats.tests, accent: '#22D3EE' },
            { label: 'Remixes', value: prompty.stats.remixes, accent: '#7C3AED' },
            { label: 'Salvos', value: prompty.stats.saves, accent: '#FF6B4A' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 8px', borderRadius: 12, textAlign: 'center',
              background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
            }}>
              <div style={{
                fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: -0.4,
                fontFamily: 'Space Grotesk, sans-serif',
              }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5, padding: '0 16px',
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--chip-bd)' }}>
          {[
            ['inputs', 'Inputs', null],
            ['tests', 'Testes', tests.length],
            ['ratings', 'Avaliações', prompty.stats.ratingCount],
            ['remix', 'Remixes', remixes.length],
          ].map(([k, l, n]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '10px 4px', border: 'none', background: 'none',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              color: tab === k ? 'var(--text-1)' : 'var(--text-3)',
              borderBottom: tab === k ? '2px solid #7C3AED' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              {l}{n != null && <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'var(--chip-bg)',
                color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace',
              }}>{n}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {tab === 'inputs' && (
          <PromptyInputsTab
            prompty={prompty}
            values={inputValues}
            setValues={setInputValues}
            finalPrompt={finalPrompt}
            onPreview={() => setShowFullPrompt(true)}
            onTest={() => dispatch({ type: 'test', id: prompty.id, inputs: inputValues, finalPrompt })}
            onCopy={() => dispatch({ type: 'toast', toast: { text: 'Prompt copiado', icon: 'copy' } })}
            onOpenImage={(key) => setOpenImageInput(key)}
          />
        )}
        {tab === 'tests' && <PromptyTestsTab tests={tests} prompty={prompty}/>}
        {tab === 'ratings' && <PromptyRatingsTab prompty={prompty}/>}
        {tab === 'remix' && <PromptyRemixTab remixes={remixes} prompty={prompty} dispatch={dispatch}/>}
      </div>

      {/* Floating action bar */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 20,
        padding: '12px 16px 16px',
        background: 'linear-gradient(180deg,transparent,var(--bg) 30%)',
        display: 'flex', gap: 8,
      }}>
        <Button variant="secondary" size="lg" icon="remix"
                onClick={() => dispatch({ type: 'go', screen: 'remix', id: prompty.id })}>
          Remixar
        </Button>
        <Button variant="primary" size="lg" full icon="play"
                onClick={() => dispatch({ type: 'test', id: prompty.id, inputs: inputValues, finalPrompt })}>
          Usar este Prompty
        </Button>
      </div>

      {/* Full prompt modal */}
      <Sheet open={showFullPrompt} onClose={() => setShowFullPrompt(false)} title="Prompt final" height="85%">
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Template com variáveis</div>
          <PromptBlock text={prompty.template}/>
          <div style={{ fontSize: 12, color: 'var(--text-3)', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Resultado com seus valores</div>
          <PromptBlock text={finalPrompt} highlightVars={false}/>
          {prompty.negative && (
            <>
              <div style={{ fontSize: 12, color: '#FF6B4A', margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Negative prompt</div>
              <PromptBlock text={prompty.negative} highlightVars={false} style={{ borderColor: 'rgba(255,107,74,0.3)' }}/>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button variant="secondary" full icon="copy" onClick={() => setShowFullPrompt(false)}>Copiar</Button>
            <Button variant="primary" full icon="send" onClick={() => setShowFullPrompt(false)}>Abrir no modelo</Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={!!openImageInput} onClose={() => setOpenImageInput(null)} title="Imagem de referência" height="60%">
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
            Solte uma foto que será usada como referência visual. O Prompty preserva traços principais e ignora artefatos.
          </div>
          <image-slot
            id={`ref-${prompty.id}-${openImageInput}`}
            shape="rounded"
            radius="14"
            placeholder="solte aqui ou toque para escolher"
            style={{ width: '100%', height: 280, '--is-bg': 'var(--card-bg)', '--is-border': 'var(--chip-bd)' }}
          />
          <Button variant="primary" full size="lg" style={{ marginTop: 12 }} onClick={() => setOpenImageInput(null)}>Usar referência</Button>
        </div>
      </Sheet>
    </div>
  );
};

const floatingBtn = () => ({
  width: 38, height: 38, borderRadius: 19,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});

// ── Inputs Tab ────────────────────────────────────────────────────
const PromptyInputsTab = ({ prompty, values, setValues, finalPrompt, onPreview, onTest, onCopy, onOpenImage }) => {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
        Variáveis
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {prompty.inputs.map(input => (
          <InputRow
            key={input.key}
            input={input}
            value={values[input.key]}
            onChange={(v) => setValues(prev => ({ ...prev, [input.key]: v }))}
            onOpenImage={() => onOpenImage(input.key)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0 10px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
          Preview do prompt
        </div>
        <span style={{ flex: 1, height: 1, background: 'var(--chip-bd)' }}/>
        <button onClick={onPreview} style={{
          all: 'unset', cursor: 'pointer', fontSize: 12, color: '#7C3AED', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Icon name="eye" size={14}/> Ver completo
        </button>
      </div>

      <PromptBlock text={finalPrompt.length > 320 ? finalPrompt.slice(0, 320) + '\n…' : finalPrompt} highlightVars={false}/>

      {prompty.negative && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#FF6B4A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
            Negative prompt
          </div>
          <PromptBlock text={prompty.negative} highlightVars={false} style={{ borderColor: 'rgba(255,107,74,0.3)' }}/>
        </div>
      )}
    </div>
  );
};

const InputRow = ({ input, value, onChange, onOpenImage }) => {
  const baseStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    background: 'var(--input-bg)', border: '1px solid var(--input-bd)',
    color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelEl = (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          color: '#7C3AED', background: 'rgba(124,58,237,0.12)', padding: '1px 6px', borderRadius: 4,
        }}>{`{{${input.key}}}`}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{input.label}</span>
        {input.required && <span style={{ color: '#FF6B4A', fontSize: 12 }}>*</span>}
      </div>
    </div>
  );

  if (input.type === 'enum') {
    return (
      <div>
        {labelEl}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {input.options.map(opt => (
            <Chip key={opt} active={value === opt} onClick={() => onChange(opt)}>{opt}</Chip>
          ))}
        </div>
      </div>
    );
  }

  if (input.type === 'image') {
    return (
      <div>
        {labelEl}
        <button onClick={onOpenImage} style={{
          ...baseStyle, padding: '20px 14px', display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', textAlign: 'left',
          borderStyle: 'dashed', background: 'transparent',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="image" size={20} color="#22D3EE"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Adicionar imagem de referência</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>opcional · jpg, png, webp</div>
          </div>
          <Icon name="chevronR" size={16} color="var(--text-3)"/>
        </button>
      </div>
    );
  }

  if (input.type === 'number') {
    return (
      <div>
        {labelEl}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range" min={input.min} max={input.max} value={value || 0}
            onChange={e => onChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#7C3AED' }}
          />
          <div style={{
            width: 56, padding: '6px 10px', borderRadius: 8, textAlign: 'center',
            background: 'var(--chip-bg)', fontSize: 13, fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-1)',
          }}>{value || 0}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {labelEl}
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={input.placeholder}
        style={baseStyle}
      />
    </div>
  );
};

// ── Tests Tab ─────────────────────────────────────────────────────
const PromptyTestsTab = ({ tests, prompty }) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
          {tests.length} testes da comunidade
        </div>
        <span style={{ flex: 1, height: 1, background: 'var(--chip-bd)' }}/>
        <Chip size="xs" tone="neutral">recentes</Chip>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tests.map(t => {
          const u = userById(t.userId);
          return (
            <div key={t.id} style={{
              borderRadius: 14, overflow: 'hidden',
              background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
            }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', background: t.cover }}>
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.5)',
                  color: '#fff', fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                }}>{t.model}</div>
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Avatar user={u} size={20}/>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>@{u.username}</span>
                  <span style={{ flex: 1 }}/>
                  <Stars value={t.rating} size={10}/>
                </div>
                <div style={{
                  fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.35,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{t.notes}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Ratings Tab ───────────────────────────────────────────────────
const PromptyRatingsTab = ({ prompty }) => {
  const dimensions = [
    ['visual_quality', 'Qualidade visual'],
    ['prompt_accuracy', 'Fidelidade ao prompt'],
    ['reproducibility', 'Reprodutibilidade'],
    ['originality', 'Originalidade'],
    ['model_compat', 'Compatibilidade com modelos'],
  ];

  return (
    <div>
      {/* Average hero */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: 16, borderRadius: 16, marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(34,211,238,0.06))',
        border: '1px solid var(--chip-bd)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: -2,
            fontFamily: 'Space Grotesk, sans-serif',
            background: 'linear-gradient(135deg,#7C3AED,#22D3EE)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{prompty.stats.ratingAvg.toFixed(1)}</div>
          <Stars value={prompty.stats.ratingAvg} size={14}/>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{prompty.stats.ratingCount} avaliações</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dimensions.map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-2)', flex: 1 }}>{l}</span>
              <Progress value={prompty.ratingsBreakdown[k]} max={5} color="#7C3AED" height={4}/>
              <span style={{ width: 24, textAlign: 'right', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>{prompty.ratingsBreakdown[k].toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 12 }}>
        Comentários
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MOCK_COMMENTS.map(c => {
          const u = userById(c.userId);
          return (
            <div key={c.id} style={{ display: 'flex', gap: 10 }}>
              <Avatar user={u} size={32}/>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--chip-bd)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>@{u.username}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>há {c.daysAgo}d</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>{c.text}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text-3)' }}>
                  <button style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="heart" size={13}/> útil ({c.helpful})
                  </button>
                  <button style={{ all: 'unset', cursor: 'pointer' }}>responder</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginTop: 16,
        padding: '8px 12px', borderRadius: 12,
        background: 'var(--input-bg)', border: '1px solid var(--input-bd)',
      }}>
        <Avatar user={MOCK_USERS.find(u => u.id === 'u_me')} size={28}/>
        <input
          placeholder="Deixe um comentário…"
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13, color: 'var(--text-1)', fontFamily: 'inherit',
          }}
        />
        <button style={{
          width: 32, height: 32, borderRadius: 10, border: 'none',
          background: '#7C3AED', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="send" size={16} color="#fff"/>
        </button>
      </div>
    </div>
  );
};

// ── Remix Tab ─────────────────────────────────────────────────────
const PromptyRemixTab = ({ remixes, prompty, dispatch }) => {
  return (
    <div>
      <div style={{
        padding: 14, borderRadius: 14, marginBottom: 16,
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Icon name="remix" size={16} color="#7C3AED"/>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#A684F6' }}>licença community-remix</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
          Você pode criar variações deste Prompty mantendo crédito ao autor original. Remixes aceitos somam pontos para você e para quem criou.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {remixes.map(r => {
          const u = userById(r.author);
          return (
            <div key={r.id} style={{
              display: 'flex', gap: 12, padding: 10, borderRadius: 14,
              background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 10, background: r.cover, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>por @{u.username} · há {r.daysAgo}d</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <Chip size="xs" tone="violet" icon="remix">remix</Chip>
                  <Chip size="xs" tone="neutral">aceito pelo autor</Chip>
                </div>
              </div>
              <button style={iconBtnStyle()}><Icon name="chevronR" size={16}/></button>
            </div>
          );
        })}
      </div>

      <Button variant="secondary" full size="lg" icon="remix" style={{ marginTop: 16 }}
              onClick={() => dispatch({ type: 'go', screen: 'remix', id: prompty.id })}>
        Criar meu remix
      </Button>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// CREATE PROMPTY FLOW (multi-step)
// ────────────────────────────────────────────────────────────────
const CreateScreen = ({ state, dispatch }) => {
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState({
    title: '',
    description: '',
    template: 'A cinematic portrait of {{subject}} in {{environment}}, lit by {{lighting}}, shot on {{camera}}.',
    negative: '',
    inputs: [
      { key: 'subject', label: 'Personagem', type: 'text' },
      { key: 'environment', label: 'Ambiente', type: 'text' },
    ],
    models: ['Midjourney'],
    difficulty: 'intermediate',
    styleTags: [],
    license: 'community-remix',
  });

  const steps = ['Básico', 'Template', 'Inputs', 'Detalhes', 'Revisar'];

  return (
    <div style={{ paddingBottom: 100 }}>
      <SimpleHeader
        title={`Criar Prompty · ${steps[step]}`}
        onBack={() => step === 0 ? dispatch({ type: 'back' }) : setStep(step - 1)}
        right={<button onClick={() => dispatch({ type: 'back' })} style={{
          all: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-3)',
        }}>cancelar</button>}
      />

      {/* Stepper */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? 'linear-gradient(90deg,#7C3AED,#22D3EE)' : 'var(--chip-bd)',
            }}/>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          {step + 1}/{steps.length} · {steps[step]}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {step === 0 && <CreateBasic draft={draft} setDraft={setDraft}/>}
        {step === 1 && <CreateTemplate draft={draft} setDraft={setDraft}/>}
        {step === 2 && <CreateInputs draft={draft} setDraft={setDraft}/>}
        {step === 3 && <CreateDetails draft={draft} setDraft={setDraft}/>}
        {step === 4 && <CreateReview draft={draft}/>}
      </div>

      <div style={{
        position: 'sticky', bottom: 0, padding: '12px 16px 16px',
        background: 'linear-gradient(180deg,transparent,var(--bg) 30%)',
        display: 'flex', gap: 8,
      }}>
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)} icon="chevronL">
            Voltar
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button variant="primary" size="lg" full iconRight="arrow" onClick={() => setStep(step + 1)}>
            Continuar
          </Button>
        ) : (
          <Button variant="primary" size="lg" full icon="check" onClick={() => dispatch({ type: 'publish', draft })}>
            Publicar Prompty (+50p)
          </Button>
        )}
      </div>
    </div>
  );
};

const CreateBasic = ({ draft, setDraft }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <FormField label="Título" hint="curto, descritivo, memorável">
      <input
        value={draft.title}
        onChange={e => setDraft({ ...draft, title: e.target.value })}
        placeholder="ex: Retrato Cinematográfico"
        style={fieldInput()}
      />
    </FormField>
    <FormField label="Descrição" hint="conte para que serve, em 2-3 frases">
      <textarea
        value={draft.description}
        onChange={e => setDraft({ ...draft, description: e.target.value })}
        placeholder="ex: Gera um retrato editorial premium com foto de referência opcional…"
        rows={4}
        style={{ ...fieldInput(), resize: 'vertical', fontFamily: 'inherit' }}
      />
    </FormField>
    <FormField label="Imagem de capa" hint="opcional — uma boa amostra ajuda no feed">
      <image-slot
        id="create-cover"
        shape="rounded" radius="14"
        placeholder="solte uma imagem ou toque para escolher"
        style={{ width: '100%', height: 180, '--is-bg': 'var(--card-bg)', '--is-border': 'var(--chip-bd)' }}
      />
    </FormField>
  </div>
);

const CreateTemplate = ({ draft, setDraft }) => {
  const matches = [...draft.template.matchAll(/\{\{([a-z_][a-z0-9_]*)\}\}/g)];
  const detected = [...new Set(matches.map(m => m[1]))];
  const inputKeys = draft.inputs.map(i => i.key);
  const missing = detected.filter(d => !inputKeys.includes(d));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FormField label="Template do prompt" hint="use {{variavel}} para campos preenchíveis">
        <textarea
          value={draft.template}
          onChange={e => setDraft({ ...draft, template: e.target.value })}
          rows={10}
          style={{
            ...fieldInput(),
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.5,
            resize: 'vertical',
          }}
        />
      </FormField>

      {detected.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Variáveis detectadas:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {detected.map(v => (
              <span key={v} style={{
                padding: '4px 8px', borderRadius: 6, fontSize: 11.5,
                fontFamily: 'JetBrains Mono, monospace',
                background: missing.includes(v) ? 'rgba(255,107,74,0.12)' : 'rgba(124,58,237,0.12)',
                color: missing.includes(v) ? '#FF6B4A' : '#7C3AED',
                border: `1px solid ${missing.includes(v) ? 'rgba(255,107,74,0.3)' : 'rgba(124,58,237,0.3)'}`,
              }}>{`{{${v}}}`}{missing.includes(v) && ' · novo'}</span>
            ))}
          </div>
        </div>
      )}

      <FormField label="Negative prompt (opcional)" hint="o que evitar na imagem">
        <textarea
          value={draft.negative}
          onChange={e => setDraft({ ...draft, negative: e.target.value })}
          rows={3}
          placeholder="low quality, blurry, watermark…"
          style={{ ...fieldInput(), fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, resize: 'vertical' }}
        />
      </FormField>
    </div>
  );
};

const CreateInputs = ({ draft, setDraft }) => {
  const matches = [...draft.template.matchAll(/\{\{([a-z_][a-z0-9_]*)\}\}/g)];
  const detected = [...new Set(matches.map(m => m[1]))];
  // sync detected variables into inputs list (preserving existing config)
  React.useEffect(() => {
    const existing = Object.fromEntries(draft.inputs.map(i => [i.key, i]));
    const next = detected.map(k => existing[k] || { key: k, label: k.replace(/_/g, ' '), type: 'text' });
    if (JSON.stringify(next) !== JSON.stringify(draft.inputs)) setDraft({ ...draft, inputs: next });
    // eslint-disable-next-line
  }, []);

  const updateInput = (i, patch) => {
    const next = [...draft.inputs];
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, inputs: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
        Configure cada variável detectada. Tipos diferentes mostram controles diferentes para quem usa o Prompty.
      </div>
      {draft.inputs.map((inp, i) => (
        <div key={inp.key} style={{
          padding: 12, borderRadius: 14,
          background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              color: '#7C3AED', background: 'rgba(124,58,237,0.12)', padding: '2px 7px', borderRadius: 4,
            }}>{`{{${inp.key}}}`}</span>
            <input
              value={inp.label}
              onChange={e => updateInput(i, { label: e.target.value })}
              style={{ flex: 1, ...fieldInput(), padding: '5px 8px', fontSize: 13 }}
            />
            <button style={{ ...iconBtnStyle(), width: 30, height: 30 }}>
              <Icon name="trash" size={14}/>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['text', 'enum', 'image', 'number', 'boolean'].map(t => (
              <Chip key={t} size="xs" active={inp.type === t} onClick={() => updateInput(i, { type: t })}>{t}</Chip>
            ))}
          </div>
        </div>
      ))}
      <button style={{
        padding: 14, borderRadius: 14,
        background: 'transparent', border: '1px dashed var(--chip-bd)',
        color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Icon name="plus" size={16}/> Adicionar variável manual
      </button>
    </div>
  );
};

const CreateDetails = ({ draft, setDraft }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <FormField label="Modelos compatíveis" hint="selecione todos onde você testou">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['Midjourney', 'Flux', 'SDXL', 'DALL-E'].map(m => (
          <Chip key={m} active={draft.models.includes(m)} size="md"
                onClick={() => setDraft({ ...draft, models: draft.models.includes(m) ? draft.models.filter(x => x !== m) : [...draft.models, m] })}>
            {m}
          </Chip>
        ))}
      </div>
    </FormField>

    <FormField label="Dificuldade">
      <div style={{ display: 'flex', gap: 6 }}>
        {[['beginner', 'Iniciante'], ['intermediate', 'Médio'], ['advanced', 'Avançado']].map(([k, l]) => (
          <Chip key={k} size="md" active={draft.difficulty === k} onClick={() => setDraft({ ...draft, difficulty: k })}>{l}</Chip>
        ))}
      </div>
    </FormField>

    <FormField label="Tags de estilo" hint="separadas por enter">
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        padding: 10, borderRadius: 10,
        background: 'var(--input-bg)', border: '1px solid var(--input-bd)', minHeight: 44,
      }}>
        {draft.styleTags.map(t => (
          <Chip key={t} tone="violet" icon="x" onClick={() => setDraft({ ...draft, styleTags: draft.styleTags.filter(x => x !== t) })}>{t}</Chip>
        ))}
        <input
          placeholder={draft.styleTags.length ? '' : 'ex: retrato, cinematográfico…'}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              setDraft({ ...draft, styleTags: [...draft.styleTags, e.target.value.trim()] });
              e.target.value = '';
              e.preventDefault();
            }
          }}
          style={{ flex: 1, minWidth: 80, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text-1)', fontFamily: 'inherit' }}
        />
      </div>
    </FormField>

    <FormField label="Licença">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['community-remix', 'Community Remix', 'qualquer um pode remixar mantendo crédito'],
          ['no-derivatives', 'Sem derivados', 'permite uso, não permite remix'],
          ['private', 'Privado', 'só você vê'],
        ].map(([k, l, d]) => (
          <button key={k} onClick={() => setDraft({ ...draft, license: k })} style={{
            all: 'unset', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: 12, borderRadius: 12,
            background: draft.license === k ? 'rgba(124,58,237,0.1)' : 'var(--card-bg)',
            border: `1px solid ${draft.license === k ? 'rgba(124,58,237,0.4)' : 'var(--chip-bd)'}`,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 9, marginTop: 1,
              border: `2px solid ${draft.license === k ? '#7C3AED' : 'var(--chip-bd)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {draft.license === k && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#7C3AED' }}/>}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{l}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{d}</div>
            </div>
          </button>
        ))}
      </div>
    </FormField>
  </div>
);

const CreateReview = ({ draft }) => (
  <div>
    <div style={{
      padding: 16, borderRadius: 16, marginBottom: 16,
      background: 'linear-gradient(135deg, rgba(52,211,153,0.12), transparent)',
      border: '1px solid rgba(52,211,153,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name="check" size={16} color="#34D399"/>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#34D399' }}>Pronto para publicar</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
        Promptys publicados entram no feed em <b>Em alta</b> por 24h. Você ganha <b>+50p</b>, e cada teste/avaliação acumula reputação adicional.
      </div>
    </div>

    <SectionLabel>Resumo</SectionLabel>
    <div style={{
      padding: 14, borderRadius: 14, marginBottom: 16,
      background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
    }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: -0.3, fontFamily: 'Space Grotesk, sans-serif' }}>{draft.title || 'Sem título'}</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>{draft.description || '(sem descrição)'}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <ModelChips models={draft.models}/>
        <Difficulty level={draft.difficulty} withLabel/>
        <Chip size="xs" tone="violet" icon="remix">{draft.license}</Chip>
      </div>
    </div>

    <SectionLabel>Template</SectionLabel>
    <PromptBlock text={draft.template}/>

    <div style={{ marginTop: 16 }}>
      <SectionLabel>Inputs ({draft.inputs.length})</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {draft.inputs.map(i => (
          <Chip key={i.key} tone="violet" size="sm">{`{{${i.key}}} · ${i.type}`}</Chip>
        ))}
      </div>
    </div>
  </div>
);

const FormField = ({ label, hint, children }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 6,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{label}</span>
      {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const fieldInput = () => ({
  width: '100%', padding: '10px 12px', borderRadius: 10,
  background: 'var(--input-bg)', border: '1px solid var(--input-bd)',
  color: 'var(--text-1)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
});

// ────────────────────────────────────────────────────────────────
// TEST RESULT SCREEN  (after pressing "Usar este Prompty")
// ────────────────────────────────────────────────────────────────
const TestScreen = ({ state, dispatch }) => {
  const prompty = MOCK_PROMPTYS.find(p => p.id === state.activePromptyId);
  const [phase, setPhase] = React.useState('config'); // config | running | result
  const [model, setModel] = React.useState(prompty.models[0]);
  const [rating, setRating] = React.useState(5);
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (phase === 'running') {
      const t = setTimeout(() => setPhase('result'), 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div style={{ paddingBottom: 100 }}>
      <SimpleHeader title={`Testar · ${prompty.title}`} onBack={() => dispatch({ type: 'back' })}/>

      <div style={{ padding: 16 }}>
        {phase === 'config' && (
          <div>
            <SectionLabel>Modelo</SectionLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              {prompty.models.map(m => (
                <Chip key={m} active={model === m} size="md" onClick={() => setModel(m)}>{m}</Chip>
              ))}
            </div>

            <SectionLabel>Prompt final</SectionLabel>
            <PromptBlock text={state.activeFinalPrompt || prompty.template} highlightVars={false} style={{ maxHeight: 240, overflow: 'auto' }}/>

            <Button variant="primary" full size="lg" icon="play" style={{ marginTop: 18 }}
                    onClick={() => setPhase('running')}>
              Gerar imagem em {model}
            </Button>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>
              usa sua chave de API · ou conecta no MVP-2
            </div>
          </div>
        )}

        {phase === 'running' && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{
              width: 240, height: 300, margin: '0 auto', borderRadius: 18,
              background: prompty.cover, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 1.6s infinite',
              }}/>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}>gerando…</div>
            </div>
            <div style={{ marginTop: 24, fontSize: 14, color: 'var(--text-2)' }}>
              <Icon name="lightning" size={16} color="#22D3EE"/> {model} processando seu prompt
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
              ETA ~12s
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div>
            <div style={{
              borderRadius: 18, overflow: 'hidden', marginBottom: 16,
              background: prompty.cover, position: 'relative',
            }}>
              <image-slot
                id={`test-${prompty.id}`}
                shape="rect"
                placeholder="resultado gerado · solte para substituir"
                style={{ width: '100%', height: 320, '--is-bg': 'transparent', '--is-border': 'rgba(255,255,255,0.4)', '--is-fg': 'rgba(255,255,255,0.95)' }}
              />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                padding: '4px 10px', borderRadius: 8,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
              }}>{model} · seed 4827193</div>
            </div>

            <div style={{
              padding: 14, borderRadius: 14, marginBottom: 16,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(34,211,238,0.06))',
              border: '1px solid rgba(124,58,237,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="sparkle" size={18} color="#7C3AED"/>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Sua avaliação ajuda a comunidade</span>
                <span style={{ flex: 1 }}/>
                <Chip tone="violet" size="xs">+15p</Chip>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                Quão bem este Prompty entregou em {model}?
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} style={{
                    all: 'unset', cursor: 'pointer', padding: 4,
                  }}>
                    <Icon name={n <= rating ? 'starFill' : 'star'} size={32} color={n <= rating ? '#FFB020' : 'var(--chip-bd)'}/>
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="dicas, ajustes que funcionaram, o que evitar…"
                rows={3}
                style={{ ...fieldInput(), resize: 'vertical', fontFamily: 'inherit', background: 'var(--bg)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" full size="lg" icon="remix"
                      onClick={() => dispatch({ type: 'go', screen: 'remix', id: prompty.id })}>
                Remixar
              </Button>
              <Button variant="primary" full size="lg" icon="check"
                      onClick={() => dispatch({ type: 'submitTest', id: prompty.id, rating, notes, model })}>
                Publicar teste
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// REMIX SCREEN
// ────────────────────────────────────────────────────────────────
const RemixScreen = ({ state, dispatch }) => {
  const original = MOCK_PROMPTYS.find(p => p.id === state.activePromptyId);
  const [title, setTitle] = React.useState(original.title + ' · meu remix');
  const [template, setTemplate] = React.useState(original.template);
  const [changes, setChanges] = React.useState('Troquei a iluminação de neon rim light para soft natural daylight, e adicionei filme analógico no estilo visual.');

  return (
    <div style={{ paddingBottom: 100 }}>
      <SimpleHeader title="Remixar Prompty" onBack={() => dispatch({ type: 'back' })}/>

      <div style={{ padding: 16 }}>
        {/* Origin card */}
        <div style={{
          display: 'flex', gap: 12, padding: 12, borderRadius: 14, marginBottom: 16,
          background: 'var(--card-bg)', border: '1px solid var(--chip-bd)',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, background: original.cover, flexShrink: 0 }}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>BASE · v{original.version}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{original.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>por @{userById(original.author).username} · crédito automático</div>
          </div>
        </div>

        <FormField label="Título do remix">
          <input value={title} onChange={e => setTitle(e.target.value)} style={fieldInput()}/>
        </FormField>

        <div style={{ height: 16 }}/>

        <FormField label="Template" hint="parta do original e ajuste">
          <textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            rows={10}
            style={{
              ...fieldInput(),
              fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
        </FormField>

        <div style={{ height: 16 }}/>

        <FormField label="O que você mudou" hint="ajuda a comunidade a entender o remix">
          <textarea
            value={changes}
            onChange={e => setChanges(e.target.value)}
            rows={3}
            style={{ ...fieldInput(), resize: 'vertical', fontFamily: 'inherit' }}
          />
        </FormField>

        <div style={{
          marginTop: 18, padding: 12, borderRadius: 12,
          background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Icon name="remix" size={14} color="#22D3EE"/>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0891b2' }}>Remix recompensa a base</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
            Quando o remix é aceito pela comunidade, você ganha <b>+25p</b> e @{userById(original.author).username} ganha <b>+10p</b> pelo Prompty original.
          </div>
        </div>
      </div>

      <div style={{
        position: 'sticky', bottom: 0, padding: '12px 16px 16px',
        background: 'linear-gradient(180deg,transparent,var(--bg) 30%)',
        display: 'flex', gap: 8,
      }}>
        <Button variant="primary" size="lg" full icon="check"
                onClick={() => dispatch({ type: 'publishRemix', original, title, template, changes })}>
          Publicar remix
        </Button>
      </div>
    </div>
  );
};

Object.assign(window, {
  PromptyScreen, CreateScreen, TestScreen, RemixScreen,
});
