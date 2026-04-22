import { FormEvent, useState } from 'react';

import { loginUser } from './services/auth-service';

type RoutePreview = {
  id: string;
  title: string;
  thumbnail_alt: string;
  duration: string;
  level: 'Easy' | 'Moderate' | 'Hard';
  description: string;
  category: 'History' | 'Culture' | 'Nature';
  badge?: 'New' | 'Staff Pick';
  is_enrolled: boolean;
  progress_percent?: number;
};

const route_previews: RoutePreview[] = [
  {
    id: 'route-1',
    title: 'Old City Highlights',
    thumbnail_alt: 'Historic clock tower and old city street',
    duration: '90 min',
    level: 'Easy',
    description: 'Walk through major landmarks with short AI audio stories.',
    category: 'History',
    badge: 'Staff Pick',
    is_enrolled: true,
    progress_percent: 62,
  },
  {
    id: 'route-2',
    title: 'Hidden Streets & Cafes',
    thumbnail_alt: 'Narrow street with local cafe tables',
    duration: '2 hours',
    level: 'Moderate',
    description: 'Discover quieter streets and local cafes away from crowds.',
    category: 'Culture',
    badge: 'New',
    is_enrolled: false,
  },
  {
    id: 'route-3',
    title: 'Sunset Coast Trail',
    thumbnail_alt: 'Coastal hiking route during sunset',
    duration: '2.5 hours',
    level: 'Hard',
    description: 'Scenic route with elevation and panoramic coastal viewpoints.',
    category: 'Nature',
    is_enrolled: true,
    progress_percent: 28,
  },
];

const category_class_map: Record<RoutePreview['category'], string> = {
  History: 'route-card__tag--history',
  Culture: 'route-card__tag--culture',
  Nature: 'route-card__tag--nature',
};

export function App() {
  const [is_authenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [is_logging_in, setIsLoggingIn] = useState(false);
  const [login_error, setLoginError] = useState('');

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await loginUser({
        email,
        password,
      });
      localStorage.setItem('historial_go_access_token', response.access_token);
      setIsAuthenticated(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!is_authenticated) {
    return (
      <div className="layout layout--auth">
        <main className="auth" aria-labelledby="auth-title">
          <section className="auth-card">
            <p className="auth-card__eyebrow">Welcome to Historial-GO</p>
            <h1 className="auth-card__title" id="auth-title">
              Sign in to start your route
            </h1>
            <p className="auth-card__description">
              Access personalized route suggestions, map interactions, and audio
              guidance.
            </p>
            <form className="auth-card__form" onSubmit={handleLoginSubmit}>
              <label className="auth-card__label" htmlFor="email">
                Email
              </label>
              <input
                className="auth-card__input"
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
              <label className="auth-card__label" htmlFor="password">
                Password
              </label>
              <input
                className="auth-card__input"
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
              {login_error ? (
                <p className="auth-card__error" role="alert">
                  {login_error}
                </p>
              ) : null}
              <button
                className="button button--primary"
                type="submit"
                disabled={is_logging_in}
              >
                {is_logging_in ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <header className="top-nav">
        <a className="top-nav__brand" href="/">
          Historial-GO
        </a>
        <nav aria-label="Main navigation" className="top-nav__menu">
          <a className="top-nav__link" href="#discover">
            Discover
          </a>
          <a className="top-nav__link" href="#map">
            Map
          </a>
          <a className="top-nav__link" href="#onboarding">
            Onboarding
          </a>
        </nav>
      </header>

      <main className="home">
        <section className="hero" aria-labelledby="hero-title">
          <p className="hero__eyebrow">AI-powered city exploration</p>
          <h1 className="hero__title" id="hero-title">
            Explore routes faster, clearer, and smarter
          </h1>
          <p className="hero__description">
            Get personalized route ideas, map-first discovery, and audio guidance
            for every stop.
          </p>
          <div className="hero__actions">
            <button className="button button--primary" type="button">
              Start Exploring
            </button>
            <button className="button button--secondary" type="button">
              Preview Map
            </button>
          </div>
        </section>

        <section className="map-panel" id="map" aria-labelledby="map-title">
          <h2 className="map-panel__title" id="map-title">
            Live Map Experience
          </h2>
          <p className="map-panel__description">
            Fullscreen map on mobile, split layout on desktop for quick
            route-and-map decisions.
          </p>
          <div
            className="map-panel__placeholder"
            aria-label="Map preview placeholder"
            role="img"
          >
            Interactive map preview
          </div>
        </section>

        <section
          className="route-list"
          id="discover"
          aria-labelledby="route-list-title"
        >
          <h2 className="route-list__title" id="route-list-title">
            Suggested Routes
          </h2>
          <div className="route-list__grid">
            {route_previews.map((route) => (
              <article className="route-card" key={route.id}>
                <div
                  className="route-card__thumbnail"
                  role="img"
                  aria-label={route.thumbnail_alt}
                >
                  {route.badge ? (
                    <span className="route-card__badge">{route.badge}</span>
                  ) : null}
                  <span className="route-card__thumbnail-text">{route.title}</span>
                </div>
                <div className="route-card__content">
                  <span className={`route-card__tag ${category_class_map[route.category]}`}>
                    {route.category}
                  </span>
                <h3 className="route-card__title">{route.title}</h3>
                <p className="route-card__meta">
                  {route.duration} • {route.level}
                </p>
                <p className="route-card__description">{route.description}</p>
                  {route.is_enrolled && typeof route.progress_percent === 'number' ? (
                    <progress
                      className="progress-bar"
                      aria-label={`${route.title} completion`}
                      max={100}
                      value={route.progress_percent}
                    />
                  ) : null}
                <button className="button button--secondary" type="button">
                  Open Route
                </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="onboarding"
          id="onboarding"
          aria-labelledby="onboarding-title"
        >
          <h2 className="onboarding__title" id="onboarding-title">
            Quick Onboarding
          </h2>
          <form className="onboarding__form">
            <label className="onboarding__label" htmlFor="interest">
              Choose your travel style
            </label>
            <select className="onboarding__select" id="interest" name="interest">
              <option value="history">History Focused</option>
              <option value="food">Food & Culture</option>
              <option value="nature">Nature & Views</option>
            </select>
            <button className="button button--primary" type="submit">
              Save Preferences
            </button>
          </form>
        </section>
      </main>

      <footer className="page-footer">
        <p className="page-footer__text">
          Historial-GO helps tourists and guides discover better routes in
          real-time.
        </p>
      </footer>
    </div>
  );
}
