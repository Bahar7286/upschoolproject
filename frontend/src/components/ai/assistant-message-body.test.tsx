import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssistantMessageBody } from './assistant-message-body';

describe('AssistantMessageBody', () => {
  it('renders structured venue list with addresses', () => {
    const content = [
      '**Eminönü için öneriler:**',
      '',
      '1. **Hamdi Restaurant** ⭐ 4.5',
      '🍽️ Kebap · Orta',
      '📍 Eminönü, Fatih',
      '',
      '2. **Balıkçı Sabahattin** ⭐ 4.3',
      '📍 Cankurtaran, Fatih',
    ].join('\n');

    render(<AssistantMessageBody content={content} />);

    expect(screen.getByText(/Hamdi Restaurant/)).toBeTruthy();
    expect(screen.getByText(/Balıkçı Sabahattin/)).toBeTruthy();
    expect(screen.getByText(/Eminönü, Fatih/)).toBeTruthy();
  });
});
