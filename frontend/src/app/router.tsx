import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../components/layout/app-layout';
import { ProtectedRoute } from '../components/layout/protected-route';
import AudioGuidePage from '../pages/audio-guide-page';
import DiscoverPage from '../pages/discover-page';
import GuideDashboardPage from '../pages/guide-dashboard-page';
import LandingPage from '../pages/landing-page';
import LoginPage from '../pages/login-page';
import MapPage from '../pages/map-page';
import NotFoundPage from '../pages/not-found-page';
import OnboardingPage from '../pages/onboarding-page';
import ProfilePage from '../pages/profile-page';
import PurchasesPage from '../pages/purchases-page';
import RegisterPage from '../pages/register-page';
import RouteDetailPage from '../pages/route-detail-page';

export function AppRouter(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppLayout />}>
        <Route path="/home" element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/routes/:routeId" element={<RouteDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/audio" element={<AudioGuidePage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/guide" element={<GuideDashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
