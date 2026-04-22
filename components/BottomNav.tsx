"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/flashcards", label: "Cards",  icon: "🃏" },
  { href: "/plano",      label: "Plano",  icon: "📅" },
  { href: "/checklist",  label: "Tarefas",icon: "✅" },
  { href: "/avaliacao",  label: "Prova",  icon: "📝" },
  { href: "/stats",      label: "Stats",  icon: "📊" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-yas-ink border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg md:max-w-3xl mx-auto">
        {LINKS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-3 px-2 min-w-0 flex-1 transition-colors ${
                active ? "text-yas-lavender" : "text-white/40"
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px] font-body font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
