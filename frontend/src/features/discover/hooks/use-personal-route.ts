import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { generatePersonalRoute, type PersonalRouteGenerateResponse } from '../../../services/ai-service';
import { useActiveRouteStore } from '../../../stores/active-route-store';

type PersonalRouteInput = {
  city: string;
  interests: string[];
  durationMinutes: number;
  budget: number;
  geoLat?: number;
  geoLng?: number;
};

export function usePersonalRoute() {
  const navigate = useNavigate();
  const setActiveRoute = useActiveRouteStore((s) => s.setActiveRoute);
  const [personalRoute, setPersonalRoute] = useState<PersonalRouteGenerateResponse | null>(null);
  const [slowRecommend, setSlowRecommend] = useState(false);

  const openPersonalRouteOnMap = (route: PersonalRouteGenerateResponse) => {
    const stops = route.stops.map((s, idx) => ({
      stop_id: -(idx + 1),
      route_id: 0,
      title: s.name,
      description: s.narration_snippet || s.reason,
      latitude: s.lat,
      longitude: s.lng,
      order_index: s.order,
      audio_url: null,
    }));
    setActiveRoute(0, route.title, stops);
    navigate(`/map?city=${encodeURIComponent(route.city)}`);
  };

  const generateMutation = useMutation({
    mutationFn: async (input: PersonalRouteInput) => {
      setSlowRecommend(false);
      const slowTimer = window.setTimeout(() => setSlowRecommend(true), 8000);
      try {
        const personal = await generatePersonalRoute({
          city: input.city,
          interests: input.interests,
          duration_minutes: input.durationMinutes,
          budget: input.budget,
          preferred_language: 'tr',
          location_lat: input.geoLat,
          location_lng: input.geoLng,
          max_stops: Math.min(8, Math.max(3, Math.round(input.durationMinutes / 45))),
        });
        setPersonalRoute(personal);
        return personal;
      } finally {
        window.clearTimeout(slowTimer);
        setSlowRecommend(false);
      }
    },
  });

  const clearPersonalRoute = () => {
    setPersonalRoute(null);
    generateMutation.reset();
  };

  return {
    personalRoute,
    slowRecommend,
    generateMutation,
    openPersonalRouteOnMap,
    clearPersonalRoute,
  };
}
