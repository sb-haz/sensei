import { Hero } from "@/components/hero";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navbar />
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            FOOTER
          </p>
        </footer>
      </div>
    </main>
  );
}