import TopMenuBar from "@/components/TopMenuBar";
import ProductoDetailPage from "@/components/producto/ProductoDetailPage";

type ProductoDetailRoutePageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export default async function ProductoDetailRoutePage({
  params,
}: ProductoDetailRoutePageProps) {
  const resolvedParams = await params;

  return (
    <div className="min-h-screen bg-[#E8E8E8]">
      <TopMenuBar />
      <main className="-mt-[85px]">
        <ProductoDetailPage slug={resolvedParams.slug} />
      </main>
    </div>
  );
}

