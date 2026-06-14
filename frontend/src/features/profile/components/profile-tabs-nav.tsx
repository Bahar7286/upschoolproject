import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { ProfileTab } from '../hooks/use-profile-tabs';

type TabDef = { id: ProfileTab; label: string; icon: LucideIcon };

type Props = {
  tabs: TabDef[];
  active: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
  ariaLabel: string;
};

export function ProfileTabsNav({ tabs, active, onSelect, ariaLabel }: Props): ReactElement {
  return (
    <nav className="touch-scroll-x -mx-1 px-1" aria-label={ariaLabel}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`tap-scale inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${
            active === id ? 'profile-tab--active' : 'profile-tab'
          }`}
          onClick={() => onSelect(id)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}
