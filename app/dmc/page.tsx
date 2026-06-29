import TopMenuBar from "@/components/TopMenuBar";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function DMCPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopMenuBar />
      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <Breadcrumbs
          className="mb-5"
          items={[
            { label: "Inicio", href: "/" },
            { label: "DMC" },
          ]}
        />

        <h1 className="text-3xl font-semibold text-slate-800">DMC</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Seccion en construccion. El menu superior reutilizable permanece
          disponible para navegar entre paginas.
        </p>
      </main>
    </div>
  );
}
