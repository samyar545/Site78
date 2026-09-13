import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { HomeSections } from "@/components/storefront/sections/SectionRenderer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <HomeSections />
      </main>
      <Footer />
    </>
  );
}
