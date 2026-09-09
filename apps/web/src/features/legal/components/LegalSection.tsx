import type { ReactNode } from 'react';

type LegalSectionProps = {
  title?: string;
  paragraphs?: ReactNode[];
  list?: ReactNode[];
  ordered?: boolean;
  children?: ReactNode;
};

export function LegalSection({
  title,
  paragraphs,
  list,
  ordered = false,
  children,
}: LegalSectionProps) {
  const ListTag = ordered ? 'ol' : 'ul';
  const listClassName = ordered
    ? 'mb-4 ml-5 list-decimal space-y-2 last:mb-0'
    : 'mb-4 ml-5 list-disc space-y-2 last:mb-0';

  return (
    <section>
      {title ? (
        <h2 className="font-display text-(--text) mb-4 text-xl font-semibold">{title}</h2>
      ) : null}

      {paragraphs?.map((paragraph, index) => (
        <p key={index} className="mb-4 last:mb-0">
          {paragraph}
        </p>
      ))}

      {list && list.length > 0 ? (
        <ListTag className={listClassName}>
          {list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ListTag>
      ) : null}

      {children}
    </section>
  );
}
