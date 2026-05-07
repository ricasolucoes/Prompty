// ui.jsx — shared UI primitives for Promptys

// ─── ICONS (24px stroke, monoline) ──────────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor', strokeWidth = 1.8 }) => {
  const c = color, sw = strokeWidth, s = size;
  const props = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':     return <svg {...props}><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z"/></svg>;
    case 'search':   return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'plus':     return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'crown':    return <svg {...props}><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/></svg>;
    case 'user':     return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    case 'heart':    return <svg {...props}><path d="M12 21s-7-4.5-9.5-9.5C1 7 4 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3 0 6 3 4.5 7.5C19 16.5 12 21 12 21z"/></svg>;
    case 'heartFill':return <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M12 21s-7-4.5-9.5-9.5C1 7 4 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3 0 6 3 4.5 7.5C19 16.5 12 21 12 21z"/></svg>;
    case 'bookmark': return <svg {...props}><path d="M6 3h12v18l-6-4-6 4z"/></svg>;
    case 'bookmarkFill': return <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M6 3h12v18l-6-4-6 4z"/></svg>;
    case 'remix':    return <svg {...props}><path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/><path d="M21 16v5h-5"/><path d="M3 8V3h5"/></svg>;
    case 'sparkle':  return <svg {...props}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2L22 19.7l-2.3.7L19 23l-.7-2.6L16 19.7l2.3-.7z"/></svg>;
    case 'star':     return <svg {...props}><path d="M12 3l2.6 6 6.4.6-4.9 4.4 1.5 6.5L12 17l-5.6 3.5 1.5-6.5L3 9.6l6.4-.6z"/></svg>;
    case 'starFill': return <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M12 3l2.6 6 6.4.6-4.9 4.4 1.5 6.5L12 17l-5.6 3.5 1.5-6.5L3 9.6l6.4-.6z"/></svg>;
    case 'chevronR': return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevronL': return <svg {...props}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chevronD': return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'check':    return <svg {...props}><path d="M5 13l4 4L19 7"/></svg>;
    case 'x':        return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'flag':     return <svg {...props}><path d="M5 3v18M5 4h11l-2 4 2 4H5"/></svg>;
    case 'image':    return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
    case 'send':     return <svg {...props}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>;
    case 'copy':     return <svg {...props}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>;
    case 'play':     return <svg {...props}><path d="M6 4l14 8-14 8z"/></svg>;
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/></svg>;
    case 'bell':     return <svg {...props}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 01-4 0"/></svg>;
    case 'flame':    return <svg {...props}><path d="M12 2c0 6 6 6 6 12a6 6 0 11-12 0c0-3 1.5-4 3-5 0 3 2 4 3 4-1-3 0-7 0-11z"/></svg>;
    case 'trophy':   return <svg {...props}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0z"/><path d="M17 5h3v3a3 3 0 01-3 3M7 5H4v3a3 3 0 003 3"/></svg>;
    case 'code':     return <svg {...props}><path d="M9 9l-4 3 4 3M15 9l4 3-4 3"/></svg>;
    case 'menu':     return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case 'arrow':    return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'edit':     return <svg {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z"/></svg>;
    case 'eye':      return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'trash':    return <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14"/></svg>;
    case 'message':  return <svg {...props}><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    case 'lightning':return <svg {...props}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>;
    default: return null;
  }
};

// ─── AVATAR ─────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 32, ring = false }) => {
  if (!user) return null;
  const initials = user.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${user.avatar} 0%, ${user.avatar}99 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 600, fontSize: size * 0.36,
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 4px ${user.avatar}` : 'none',
      letterSpacing: -0.3,
    }}>{initials}</div>
  );
};

// ─── CHIP / TAG ─────────────────────────────────────────────────────────────
const Chip = ({ children, tone = 'neutral', size = 'sm', icon, onClick, active }) => {
  const tones = {
    neutral: { bg: 'var(--chip-bg)', fg: 'var(--text-2)', bd: 'var(--chip-bd)' },
    violet:  { bg: 'rgba(124,58,237,0.12)', fg: '#7C3AED', bd: 'rgba(124,58,237,0.22)' },
    cyan:    { bg: 'rgba(34,211,238,0.12)', fg: '#0891b2', bd: 'rgba(34,211,238,0.24)' },
    coral:   { bg: 'rgba(255,107,74,0.12)', fg: '#e0481f', bd: 'rgba(255,107,74,0.24)' },
    mint:    { bg: 'rgba(52,211,153,0.14)', fg: '#0a8e60', bd: 'rgba(52,211,153,0.24)' },
    solid:   { bg: '#7C3AED', fg: '#fff', bd: '#7C3AED' },
    dark:    { bg: 'rgba(0,0,0,0.7)', fg: '#fff', bd: 'transparent' },
  };
  const t = tones[tone] || tones.neutral;
  const sizes = { xs: { p: '3px 8px', f: 11, r: 6 }, sm: { p: '4px 10px', f: 12, r: 8 }, md: { p: '6px 12px', f: 13, r: 10 } };
  const sz = sizes[size];
  const a = active ? { background: '#7C3AED', color: '#fff', borderColor: '#7C3AED' } : {};
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: sz.p, fontSize: sz.f, fontWeight: 500,
        borderRadius: sz.r, lineHeight: 1.2,
        background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap', fontFamily: 'inherit',
        ...a,
      }}
    >
      {icon && <Icon name={icon} size={sz.f + 2} />}
      {children}
    </button>
  );
};

// ─── BUTTON ─────────────────────────────────────────────────────────────────
const Button = ({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, disabled, full, style = {} }) => {
  const variants = {
    primary:   { bg: 'linear-gradient(180deg,#8B4DF5,#7C3AED)', fg: '#fff', bd: 'transparent', sh: '0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 16px rgba(124,58,237,0.35)' },
    secondary: { bg: 'var(--btn-2-bg)', fg: 'var(--text-1)', bd: 'var(--btn-2-bd)', sh: 'none' },
    ghost:     { bg: 'transparent', fg: 'var(--text-1)', bd: 'transparent', sh: 'none' },
    danger:    { bg: 'linear-gradient(180deg,#FF7B5C,#FF6B4A)', fg: '#fff', bd: 'transparent', sh: '0 6px 16px rgba(255,107,74,0.3)' },
    cyan:      { bg: 'linear-gradient(180deg,#33DCEC,#22D3EE)', fg: '#04364a', bd: 'transparent', sh: '0 6px 16px rgba(34,211,238,0.3)' },
  };
  const sizes = { sm: { p: '7px 12px', f: 13, r: 10, ic: 16 }, md: { p: '11px 16px', f: 14, r: 12, ic: 18 }, lg: { p: '14px 20px', f: 15, r: 14, ic: 20 } };
  const v = variants[variant], sz = sizes[size];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: sz.p, fontSize: sz.f, fontWeight: 600, fontFamily: 'inherit',
        borderRadius: sz.r, border: `1px solid ${v.bd}`,
        background: v.bg, color: v.fg, boxShadow: v.sh,
        opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: -0.1, lineHeight: 1.2,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={sz.ic} strokeWidth={2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sz.ic} strokeWidth={2} />}
    </button>
  );
};

// ─── DIFFICULTY DOT ROW ─────────────────────────────────────────────────────
const Difficulty = ({ level, withLabel = false }) => {
  const map = { beginner: { n: 1, label: 'Iniciante', color: '#34D399' }, intermediate: { n: 2, label: 'Médio', color: '#FF6B4A' }, advanced: { n: 3, label: 'Avançado', color: '#7C3AED' } };
  const d = map[level] || map.beginner;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
      <span style={{ display: 'inline-flex', gap: 2 }}>
        {[1, 2, 3].map(i => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i <= d.n ? d.color : 'var(--chip-bd)' }} />
        ))}
      </span>
      {withLabel && <span>{d.label}</span>}
    </span>
  );
};

// ─── MODEL CHIPS ROW ────────────────────────────────────────────────────────
const ModelChips = ({ models, max = 99 }) => {
  const colors = { Midjourney: '#FF6B4A', Flux: '#22D3EE', SDXL: '#7C3AED', 'DALL-E': '#34D399' };
  const visible = models.slice(0, max);
  const extra = models.length - visible.length;
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {visible.map(m => (
        <span key={m} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 7px 2px 6px', fontSize: 10.5, fontWeight: 600,
          borderRadius: 5, background: 'var(--chip-bg)', color: 'var(--text-2)',
          border: '1px solid var(--chip-bd)', letterSpacing: 0.1,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors[m] || '#888' }} />
          {m}
        </span>
      ))}
      {extra > 0 && <span style={{ fontSize: 10.5, color: 'var(--text-3)', alignSelf: 'center' }}>+{extra}</span>}
    </span>
  );
};

// ─── RATING STARS ───────────────────────────────────────────────────────────
const Stars = ({ value, size = 13, color = '#FFB020', max = 5 }) => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = value >= i + 1;
        const half = !filled && value > i + 0.3 && value < i + 1;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
            <Icon name="star" size={size} color={'var(--chip-bd)'} strokeWidth={1.5}/>
            {(filled || half) && (
              <span style={{ position: 'absolute', inset: 0, width: half ? size * 0.5 : size, overflow: 'hidden' }}>
                <Icon name="starFill" size={size} color={color}/>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
};

// ─── PROMPT BLOCK (syntax-ish) ──────────────────────────────────────────────
const PromptBlock = ({ text, highlightVars = true, mono = true, style = {} }) => {
  // wrap {{var}} with span
  const parts = highlightVars
    ? text.split(/(\{\{[^}]+\}\})/g)
    : [text];
  return (
    <pre style={{
      margin: 0, padding: 14,
      background: 'var(--code-bg)', color: 'var(--code-fg)',
      borderRadius: 12, border: '1px solid var(--chip-bd)',
      fontFamily: mono ? 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
      fontSize: 12, lineHeight: 1.6,
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      ...style,
    }}>
      {parts.map((p, i) =>
        p.startsWith('{{')
          ? <span key={i} style={{
              background: 'rgba(124,58,237,0.18)', color: '#A684F6',
              padding: '0 4px', borderRadius: 4, border: '1px solid rgba(124,58,237,0.3)',
            }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </pre>
  );
};

// ─── PROMPTY COVER (image-slot wrapper that falls back to gradient) ────────
const PromptyCover = ({ prompty, height = 220, radius = 16, slot = false, slotId, style = {} }) => {
  // Use image-slot placeholder; the cover gradient behind shows through where empty
  return (
    <div style={{
      position: 'relative', width: '100%', height, borderRadius: radius,
      overflow: 'hidden', background: prompty.cover,
      ...style,
    }}>
      {slot && (
        <image-slot
          id={slotId || `cover-${prompty.id}`}
          shape="rect"
          placeholder="solte aqui o resultado gerado"
          style={{ position: 'absolute', inset: 0, '--is-bg': 'transparent', '--is-border': 'rgba(255,255,255,0.35)', '--is-fg': 'rgba(255,255,255,0.9)' }}
        />
      )}
      {/* corner accent */}
      <div style={{
        position: 'absolute', top: 12, left: 12, width: 28, height: 28,
        borderRadius: 8, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="sparkle" size={14} color="#fff" strokeWidth={2}/>
      </div>
    </div>
  );
};

// ─── BADGE TILE ─────────────────────────────────────────────────────────────
const BadgeTile = ({ badge, size = 80 }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      width: size + 24,
    }}>
      <div style={{
        width: size, height: size, borderRadius: 22,
        background: badge.earned
          ? `radial-gradient(circle at 30% 25%, ${badge.color}, ${badge.color}55 70%, ${badge.color}00 100%), var(--card-bg)`
          : 'var(--card-bg)',
        border: `1px solid ${badge.earned ? badge.color + '66' : 'var(--chip-bd)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: badge.earned ? `0 8px 24px ${badge.color}33` : 'none',
        position: 'relative',
        opacity: badge.earned ? 1 : 0.55,
      }}>
        <span style={{ fontSize: size * 0.42, color: badge.earned ? '#fff' : 'var(--text-3)', fontWeight: 700 }}>{badge.icon}</span>
        {!badge.earned && badge.progress > 0 && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, height: 3, borderRadius: 3, background: 'var(--chip-bd)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${badge.progress * 100}%`, background: badge.color }}/>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: 'var(--text-1)', lineHeight: 1.2 }}>{badge.name}</div>
    </div>
  );
};

// ─── PROGRESS BAR ───────────────────────────────────────────────────────────
const Progress = ({ value, max = 100, color = '#7C3AED', height = 6 }) => (
  <div style={{ width: '100%', height, borderRadius: height, background: 'var(--chip-bd)', overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`,
      background: `linear-gradient(90deg, ${color}cc, ${color})`,
      borderRadius: height,
      transition: 'width .4s ease',
    }} />
  </div>
);

// ─── BOTTOM SHEET ───────────────────────────────────────────────────────────
const Sheet = ({ open, onClose, children, title, height = '80%' }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(9,10,20,0.55)', backdropFilter: 'blur(4px)',
        animation: 'fadeIn .2s ease',
      }}/>
      <div style={{
        position: 'relative', width: '100%', height, maxHeight: '92%',
        background: 'var(--bg)', borderRadius: '24px 24px 0 0',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp .26s cubic-bezier(.2,.8,.2,1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 4, background: 'var(--chip-bd)' }}/>
        </div>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 16px 12px', borderBottom: '1px solid var(--chip-bd)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 16, border: 'none',
              background: 'var(--chip-bg)', color: 'var(--text-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Icon name="x" size={18}/>
            </button>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── TOAST ──────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, padding: '11px 16px',
      background: 'rgba(9,10,20,0.92)', color: '#fff',
      borderRadius: 14, fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
      animation: 'toastIn .26s cubic-bezier(.2,.8,.2,1)',
      maxWidth: '88%', whiteSpace: 'nowrap',
    }}>
      {toast.icon && <Icon name={toast.icon} size={16} color={toast.color || '#22D3EE'}/>}
      <span>{toast.text}</span>
      {toast.points && (
        <span style={{ marginLeft: 4, padding: '2px 7px', borderRadius: 6, background: '#7C3AED', fontSize: 11, fontWeight: 700 }}>{toast.points}</span>
      )}
    </div>
  );
};

Object.assign(window, {
  Icon, Avatar, Chip, Button, Difficulty, ModelChips, Stars, PromptBlock,
  PromptyCover, BadgeTile, Progress, Sheet, Toast,
});
