import type { ReactNode } from 'react';

export function LegalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-(--text) font-medium">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
