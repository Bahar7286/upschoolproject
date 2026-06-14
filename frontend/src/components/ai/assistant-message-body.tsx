import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import {
  resolveAssistantVenueHref,
  type AssistantVenueLinkContext,
} from '../../lib/assistant-venue-link';

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-theme">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderVenueList(
  block: string,
  key: number,
  linkContext?: AssistantVenueLinkContext,
): ReactElement | null {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const header = lines[0]?.startsWith('**') ? lines[0] : null;
  const items: { title: string; meta: string; addr: string }[] = [];
  let current: { title: string; meta: string; addr: string } | null = null;

  for (const line of lines) {
    const numbered = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/);
    if (numbered) {
      if (current) items.push(current);
      current = { title: numbered[2], meta: numbered[3].trim(), addr: '' };
      continue;
    }
    if (line.startsWith('📍') && current) {
      current.addr = line.replace(/^📍\s*/, '');
    }
  }
  if (current) items.push(current);
  if (items.length === 0) return null;

  return (
    <div key={key} className="space-y-3">
      {header ? <p className="font-medium text-theme">{renderInline(header)}</p> : null}
      <ol className="space-y-3">
        {items.map((item, i) => {
          const href =
            linkContext && item.title
              ? resolveAssistantVenueHref(item.title, item.addr, linkContext)
              : null;
          return (
            <li key={i}>
              {href ? (
                <Link
                  to={href}
                  className="tap-scale block rounded-xl border border-stone-900/8 bg-stone-50/80 p-3 transition hover:border-primary/40 hover:bg-primary/5 dark:border-white/10 dark:bg-zinc-800/60 dark:hover:bg-primary/10"
                >
                  <p className="font-semibold text-primary">
                    {i + 1}. {item.title}
                    {item.meta ? <span className="font-normal text-theme-muted">{item.meta}</span> : null}
                  </p>
                  {item.addr ? (
                    <p className="mt-1 text-xs leading-relaxed text-theme-muted">📍 {item.addr}</p>
                  ) : null}
                </Link>
              ) : (
                <div className="rounded-xl border border-stone-900/8 bg-stone-50/80 p-3 dark:border-white/10 dark:bg-zinc-800/60">
                  <p className="font-semibold text-theme">
                    {i + 1}. {item.title}
                    {item.meta ? <span className="font-normal text-theme-muted">{item.meta}</span> : null}
                  </p>
                  {item.addr ? (
                    <p className="mt-1 text-xs leading-relaxed text-theme-muted">📍 {item.addr}</p>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function renderBlock(block: string, key: number, linkContext?: AssistantVenueLinkContext): ReactElement {
  const venue = renderVenueList(block, key, linkContext);
  if (venue) return venue;

  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const isBulletList = lines.length > 1 && lines.every((l) => /^[*•-]\s+/.test(l));
  const isNumberedList = lines.length > 1 && lines.every((l) => /^\d+[.)]\s+/.test(l));

  if (isBulletList) {
    return (
      <ul key={key} className="list-disc space-y-1.5 pl-5">
        {lines.map((line, i) => (
          <li key={i}>{renderInline(line.replace(/^[*•-]\s+/, ''))}</li>
        ))}
      </ul>
    );
  }

  if (isNumberedList) {
    return (
      <ol key={key} className="list-decimal space-y-1.5 pl-5">
        {lines.map((line, i) => (
          <li key={i}>{renderInline(line.replace(/^\d+[.)]\s+/, ''))}</li>
        ))}
      </ol>
    );
  }

  return (
    <p key={key} className="leading-relaxed text-theme">
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

export function AssistantMessageBody({
  content,
  linkContext,
}: {
  content: string;
  linkContext?: AssistantVenueLinkContext;
}): ReactElement {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {blocks.map((block, i) => renderBlock(block, i, linkContext))}
    </div>
  );
}
