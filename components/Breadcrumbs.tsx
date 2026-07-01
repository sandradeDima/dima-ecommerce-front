import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--dima-line)] bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--dima-ink-soft)] shadow-[0_10px_22px_rgba(24,55,122,0.12)]">
        {items.map((item, index) => {
          const key = `${item.label}-${index}`;
          const isLast = index === items.length - 1;

          return (
            <li key={key} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-[var(--dima-primary)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[var(--dima-primary)]" : ""}>{item.label}</span>
              )}

              {!isLast ? <span className="text-[var(--dima-primary-soft)]">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
