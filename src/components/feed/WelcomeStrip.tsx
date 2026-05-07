export function WelcomeStrip() {
  return (
    <section
      className="screen"
      style={{
        margin: '12px 16px 8px',
        padding: 16,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(34,211,238,0.06))',
        border: '1px solid var(--line)',
      }}
      aria-label="Como funciona"
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: 'var(--primary)',
          marginBottom: 4,
        }}
      >
        Como funciona
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.45,
          color: 'var(--text-1)',
        }}
      >
        Promptys são <strong>receitas prontas</strong> para gerar imagens com IA. Toque em <strong>Copiar prompt</strong>, cole no Gemini ou outro app, depois volte aqui e conte como ficou.
      </p>
    </section>
  )
}
