import { Routes, Route } from 'react-router-dom'

/**
 * App shell. Routes are intentionally minimal here.
 * Plans 01-05 (layout) and 01-06 (feed) will replace this with real routes.
 */
export default function App() {
  return (
    <Routes>
      <Route path="*" element={<PlaceholderHome />} />
    </Routes>
  )
}

function PlaceholderHome() {
  return (
    <main style={{ padding: 24, fontFamily: 'var(--font-sans, sans-serif)' }}>
      <h1 style={{ fontFamily: 'var(--font-display, sans-serif)' }}>Promptys</h1>
      <p>Auth scaffolding ready. Feed and routes are wired in subsequent plans.</p>
    </main>
  )
}
