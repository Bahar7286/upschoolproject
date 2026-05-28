import type { ReactElement, ReactNode } from 'react';

/** Basit markdown: paragraflar, **kalın**, madde işaretleri */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-stone-900 dark:text-stone-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderBlock(block: string, key: number): ReactElement {
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
    <p key={key} className="leading-relaxed">
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

export function AssistantMessageBody({ content }: { content: string }): ReactElement {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-stone-800 dark:text-stone-100">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
