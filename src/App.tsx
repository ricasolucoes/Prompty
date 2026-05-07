import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { OnboardingPage, hasOnboarded } from '@/pages/OnboardingPage'
import { FeedPage } from '@/pages/FeedPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { PublicProfilePage } from '@/pages/PublicProfilePage'
import { AppHeader } from '@/components/layout/AppHeader'
import { TabBar } from '@/components/layout/TabBar'
import { TweaksPanel } from '@/components/dev/TweaksPanel'

/**
 * App routing shell. The Feed and Profile contents are added in plans 06 and 08.
 * For now, the shell renders the chrome (header + tab bar) and a placeholder body.
 */
export default function App() {
  const location = useLocation()
  // Send first-time visitors to onboarding before showing the feed
  if (location.pathname === '/' && !hasOnboarded()) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<ChromeShell />} />
      </Routes>
      {import.meta.env.DEV && <TweaksPanel />}
    </>
  )
}

function ChromeShell() {
  return (
    <>
      <AppHeader />
      <main style={{ paddingBottom: 96 }}>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/u/:username" element={<PublicProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </>
  )
}
