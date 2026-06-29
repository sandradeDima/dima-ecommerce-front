import { Suspense } from "react";
import TopMenuBar from "@/components/TopMenuBar";
import CatalogoPageContent from "@/components/catalogo/CatalogoPageContent";

export default function CatalogoPage() {
  return (
    <div className="min-h-screen bg-[#E8E8E8]">
      <TopMenuBar />
      <main className="-mt-[85px]">
        <Suspense
          fallback={
            <div className="mx-auto max-w-[1260px] px-6 pt-24 pb-16 sm:px-8 lg:px-10">
              <div className="h-12 w-64 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 h-64 animate-pulse rounded-3xl bg-slate-200" />
            </div>
          }
        >
          <CatalogoPageContent />
        </Suspense>
      </main>
    </div>
  );
}
