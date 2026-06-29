"use client";

export default function CatalogoHero() {
  return (
    <section className="relative h-[190px] overflow-hidden md:h-[230px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/heros/catalogo.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(239,79,57,0.71),rgba(86,100,111,0.71))]" />

      <div className="relative z-10 flex h-full items-center justify-center">
        <h1 className="text-center text-[36px] font-semibold leading-none text-white">
          Catálogo
        </h1>
      </div>
    </section>
  );
}
