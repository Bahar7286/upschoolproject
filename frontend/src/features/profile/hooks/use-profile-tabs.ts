import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type ProfileTab = 'overview' | 'history' | 'notes' | 'play' | 'look';

export function useProfileTabs() {
  const location = useLocation();
  const [tab, setTab] = useState<ProfileTab>('overview');

  useEffect(() => {
    if (location.hash !== '#settings') return;
    setTab('overview');
    const timer = window.setTimeout(() => {
      document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return { tab, setTab };
}
