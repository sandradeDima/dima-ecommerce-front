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
      <ol className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[#D7DEE9] bg-white/95 px-4 py-2 text-[12px] font-medium text-[#5A6573] shadow-[0_6px_16px_rgba(15,23,42,0.10)]">
        {items.map((item, index) => {
          const key = `${item.label}-${index}`;
          const isLast = index === items.length - 1;

          return (
            <li key={key} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-[#F54029]">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[#2F3B4A]" : ""}>{item.label}</span>
              )}

              {!isLast ? <span className="text-[#98A1AD]">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
