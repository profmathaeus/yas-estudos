"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopBar() {
  const isAdmin = usePathname().startsWith("/admin");

  return (
    <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 pt-3 pb-1 flex items-center justify-between">
      <span className="font-display text-sm text-yas-burgundy/60 font-semibold">YAS Estudos</span>
      {isAdmin ? (
        <Link
          href="/flashcards"
          className="font-body text-xs text-yas-ink/50 hover:text-yas-ink transition-colors"
        >
          ← Flashcards
        </Link>
      ) : (
        <Link
          href="/admin"
          className="font-body text-xs text-yas-ink/40 hover:text-yas-ink/70 transition-colors"
        >
          ⚙ Base
        </Link>
      )}
    </div>
  );
}
