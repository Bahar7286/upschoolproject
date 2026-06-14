# Pages

Thin route-level shells — iş mantığı `features/` altında:

| Sayfa | Feature modülü |
|-------|----------------|
| discover-page | `features/discover/` |
| profile-page | `features/profile/` (hooks + shared components) |
| map-page | `features/map-session/` + `features/map/` |
| onboarding-page | onboarding store + page |
| route-detail-page | components/routes |
| purchases-page | services/purchase |
| guide-dashboard-page | components/guide |

Diğer sayfalar doğrudan servis/hook kullanır; yeni ağır orchestration `features/*` altına eklenmeli.
