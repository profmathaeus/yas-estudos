import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { SeedProvider } from "@/components/SeedProvider";

export const metadata: Metadata = {
  title: "Yas Estudos — Enfermeiro I",
  description: "App de estudos para o concurso de Enfermeiro I — Prefeitura de São Miguel do Iguaçu/PR",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A1525",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-yas-cream min-h-screen font-body">
        <SeedProvider />
        <TopBar />
        <main className="pb-nav max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 pt-2 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
