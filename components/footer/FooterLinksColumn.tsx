"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getPageTypeFromPath, trackGenerateLead } from "@/lib/analytics/ga4";

export type FooterLinkItem = {
  label: string;
  href: string;
  icon: ReactNode;
  analyticsSourceSection?: string;
};

type FooterLinksColumnProps = {
  title?: string;
  links: FooterLinkItem[];
  className?: string;
};

export default function FooterLinksColumn({
  title,
  links,
  className = "",
}: FooterLinksColumnProps) {
  const pathname = usePathname();
  const pageType = getPageTypeFromPath(pathname ?? "/");

  const handleLinkClick = (link: FooterLinkItem) => {
    if (!link.analyticsSourceSection) return;

    trackGenerateLead({
      cta_name: "cotizar",
      page_type: pageType,
      source_section: link.analyticsSourceSection,
    });
  };

  return (
    <div className={className}>
      {title ? (
        <h3 className="text-[15px] font-medium leading-none text-white/95 sm:text-[16px] lg:text-[17px]">
          {title}
        </h3>
      ) : null}

      <ul className="mt-3 space-y-2.5 sm:space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => handleLinkClick(link)}
              className="group inline-flex items-center gap-3 text-[15px] text-white/90 transition-colors hover:text-[#F54029] sm:text-[17px] lg:text-[18px]"
            >
              <span className="text-white/90 transition-colors group-hover:text-[#F54029]">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
