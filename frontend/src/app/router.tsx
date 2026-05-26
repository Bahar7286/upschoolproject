import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../components/layout/app-layout';
import { ProtectedRoute } from '../components/layout/protected-route';
import AudioGuidePage from '../pages/audio-guide-page';
import DiscoverPage from '../pages/discover-page';
import GuideDashboardPage from '../pages/guide-dashboard-page';
import GuideVerificationPage from '../pages/guide-verification-page';
import GuidePublicPage from '../pages/guide-public-page';
import GuidesMarketplacePage from '../pages/guides-marketplace-page';
import TripRequestsPage from '../pages/trip-requests-page';
import TripRequestNewPage from '../pages/trip-request-new-page';
import AdminPage from '../pages/admin-page';
import CheckoutPage from '../pages/checkout-page';
import CheckoutSuccessPage from '../pages/checkout-success-page';
import ForgotPasswordPage from '../pages/forgot-password-page';
import ResetPasswordPage from '../pages/reset-password-page';
import LandingPage from '../pages/landing-page';
import LoginPage from '../pages/login-page';
import MapPage from '../pages/map-page';
import NotFoundPage from '../pages/not-found-page';
import OnboardingPage from '../pages/onboarding-page';
import ProfilePage from '../pages/profile-page';
import PurchasesPage from '../pages/purchases-page';
import RegisterPage from '../pages/register-page';
import TermsPage from '../pages/terms-page';
import PrivacyPage from '../pages/privacy-page';
import RouteDetailPage from '../pages/route-detail-page';
import PlaceDetailPage from '../pages/place-detail-page';
import PlannerPage from '../pages/planner-page';

export function AppRouter(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
      <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      <Route element={<AppLayout />}>
        <Route path="/home" element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/routes/:routeId" element={<RouteDetailPage />} />
        <Route path="/places/:placeId" element={<PlaceDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/audio" element={<AudioGuidePage />} />

        <Route path="/rehberler" element={<GuidesMarketplacePage />} />
        <Route path="/rehberler/:guideId" element={<GuidePublicPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/talepler" element={<TripRequestsPage />} />
          <Route path="/talepler/yeni" element={<TripRequestNewPage />} />
          <Route path="/teklifler" element={<Navigate to="/talepler" replace />} />
          <Route path="/quotes" element={<Navigate to="/talepler" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/odeme" element={<CheckoutPage />} />
          <Route path="/odeme/basarili" element={<CheckoutSuccessPage />} />
          <Route path="/guide" element={<GuideDashboardPage />} />
          <Route path="/guide/dogrulama" element={<GuideVerificationPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
