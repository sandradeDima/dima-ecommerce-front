"use client";

import Image from "next/image";
import bannerImage from "@/app/assets/banner.webp";

export default function CatalogoHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,55,127,0.18),rgba(23,55,127,0.36))]" />
      <Image
        src={bannerImage}
        alt="Banner del catálogo Dima"
        priority
        className="h-[300px] w-full object-cover object-center sm:h-[380px] lg:h-[460px]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,30,76,0.82)_0%,rgba(23,55,127,0.52)_45%,rgba(23,55,127,0.18)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.84),rgba(255,255,255,0)_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-16 rounded-t-[100%] bg-[var(--dima-page)] sm:h-20" />
    </section>
  );
}
