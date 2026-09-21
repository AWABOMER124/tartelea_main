import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const DiscoveryPage = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full max-w-5xl space-y-7 px-4 py-6 sm:px-6 sm:py-10">
    {children}
  </div>
);

export const DiscoveryHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
}) => (
  <header className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex max-w-2xl items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-spiritual-green/10 text-spiritual-green">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold text-spiritual-green">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
      </div>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </header>
);

export const FilterPanel = ({ children }: { children: ReactNode }) => (
  <section aria-label="تصفية النتائج" className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
    {children}
  </section>
);

export const FilterGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    <span className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">{children}</div>
  </div>
);

export const ResultsHeading = ({ count, label }: { count: number; label: string }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-lg font-bold text-foreground">{label}</h2>
    <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{count} نتيجة</span>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) => (
  <div className="rounded-lg border border-dashed border-border bg-card/60 px-5 py-12 text-center">
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Icon className="h-5 w-5" /></span>
    <h2 className="mt-4 font-bold text-foreground">{title}</h2>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
  </div>
);
