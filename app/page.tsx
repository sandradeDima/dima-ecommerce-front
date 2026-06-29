import TopMenuBar from "@/components/TopMenuBar";
import HeroBanner from "@/components/HeroBanner";
import HomeBrandsProducts from "@/components/home/HomeBrandsProducts";
import CategoriesCarouselSection from "@/components/home/CategoriesCarouselSection";
import HomeQuickCategoriesStrip from "@/components/home/HomeQuickCategoriesStrip";
import LatestNewsSection from "@/components/home/LatestNewsSection";
import HomeFindUsSection from "@/components/home/HomeFindUsSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopMenuBar />
      <main className="-mt-[85px]">
        <HeroBanner />
        <HomeBrandsProducts />
        <CategoriesCarouselSection />
        <HomeQuickCategoriesStrip />
        <LatestNewsSection />
        <HomeFindUsSection />
      </main>
    </div>
  );
}
