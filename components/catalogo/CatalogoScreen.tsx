import { Suspense } from "react";
import TopMenuBar from "@/components/TopMenuBar";
import CatalogoPageContent from "@/components/catalogo/CatalogoPageContent";

function CatalogoLoadingFallback() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-10">
      <div className="h-10 w-56 animate-pulse rounded-full bg-[rgba(35,74,168,0.14)]" />
      <div className="mt-6 h-[360px] animate-pulse rounded-[38px] bg-[rgba(35,74,168,0.14)]" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`catalogo-fallback-${index}`}
            className="h-[380px] animate-pulse rounded-[32px] bg-[rgba(35,74,168,0.1)]"
          />
        ))}
      </div>
    </div>
  );
}

export default function CatalogoScreen() {
  return (
    <div className="min-h-screen bg-[var(--dima-page)] text-[var(--dima-ink)]">
      <TopMenuBar />
      <main>
        <Suspense fallback={<CatalogoLoadingFallback />}>
          <CatalogoPageContent />
        </Suspense>
      </main>
    </div>
  );
}
