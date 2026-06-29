"use client";

import Link from "next/link";
import Image from "next/image";

type QuickCategoryItem = {
  label: string;
  href: string;
  imageSrc: string;
  icon: React.ComponentType<{ className?: string }>;
};

function HeadsetIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 13v3a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 2Zm16 0v3a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13a8 8 0 1 1 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 18v2.2a1.8 1.8 0 0 1-1.8 1.8H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GraduationCapIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="m2 9.5 10-5 10 5-10 5-10-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.6v4.1c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 9.5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GridIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect
        x="3.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="7"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="13.5"
        y="13.5"
        width="7"
        height="7"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const quickItems: QuickCategoryItem[] = [
  {
    label: "Soporte Técnico",
    href: "/soporte",
    imageSrc: "/assets/static/SoporteTecnico.png",
    icon: HeadsetIcon,
  },
  {
    label: "Academia",
    href: "/academia",
    imageSrc: "/assets/static/Academia.png",
    icon: GraduationCapIcon,
  },
  {
    label: "Marcas",
    href: "/marcas",
    imageSrc: "/assets/static/Marcas.png",
    icon: GridIcon,
  },
];

const hoverGradient =
  "linear-gradient(138deg, #EF4F39 0%, rgba(86,100,111,0.8) 78%, rgba(86,100,111,1) 100%)";

export default function HomeQuickCategoriesStrip() {
  return (
    <section className="bg-white pb-24">
      <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="relative overflow-hidden rounded-[34px] bg-[#5F6B76] px-8 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: "url('/assets/static/blue_texture_1.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            {quickItems.map((item) => {
              const HoverIcon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-5 rounded-full p-2 text-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <span className="relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-full border-[3px] border-white/90 sm:h-[128px] sm:w-[128px] md:h-[146px] md:w-[146px] lg:h-[164px] lg:w-[164px] md:border-4">
                    <Image
                      src={item.imageSrc}
                      alt={item.label}
                      fill
                      sizes="164px"
                      className="object-cover transition-opacity duration-250 group-hover:opacity-10"
                    />

                    <span
                      className="absolute inset-0 opacity-0 transition-opacity duration-250 group-hover:opacity-100"
                      style={{ backgroundImage: hoverGradient }}
                    />

                    <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 scale-95 transition-all duration-250 group-hover:scale-100 group-hover:opacity-100">
                      <HoverIcon className="h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />
                    </span>
                  </span>

                  <span className="text-base font-medium leading-none whitespace-nowrap sm:text-lg">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
