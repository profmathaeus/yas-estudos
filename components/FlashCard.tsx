"use client";

import { useState } from "react";
import type { Avaliacao, BlocoKey } from "@/types";
import { BLOCO_LABELS, BLOCO_COLORS } from "@/types";

interface FlashCardProps {
  frente: string;
  verso: string;
  bloco: string;
  onAvaliar: (av: Avaliacao) => void;
  cardIndex: number;
  totalCards: number;
}

export function FlashCard({ frente, verso, bloco, onAvaliar, cardIndex, totalCards }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  function handleFlip() {
    if (!flipped) setFlipped(true);
  }

  function handleAvaliar(av: Avaliacao) {
    setFlipped(false);
    setTimeout(() => onAvaliar(av), 50);
  }

  const blocoKey = bloco as BlocoKey;
  const blocoLabel = BLOCO_LABELS[blocoKey] ?? bloco;
  const blocoColor = BLOCO_COLORS[blocoKey] ?? "bg-yas-plum text-white";

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto select-none">
      {/* progresso */}
      <div className="flex items-center justify-between w-full mb-4 px-1">
        <span className={`text-xs font-body font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${blocoColor}`}>
          {blocoLabel}
        </span>
        <span className="text-xs font-body text-yas-ink/50">
          {cardIndex + 1} / {totalCards}
        </span>
      </div>

      {/* card com flip 3D */}
      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: "1200px", height: "340px" }}
        onClick={handleFlip}
        role="button"
        aria-label={flipped ? "Card virado — verso visível" : "Toque para revelar a resposta"}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* frente */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl bg-yas-cream border border-yas-lavender/30 shadow-lg"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="font-body text-yas-ink text-center text-lg leading-relaxed">
              {frente}
            </p>
            <span className="mt-6 text-xs text-yas-ink/30 font-body">
              toque para revelar
            </span>
          </div>

          {/* verso */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl bg-yas-burgundy shadow-lg"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="font-body text-white text-center text-base leading-relaxed">
              {verso}
            </p>
          </div>
        </div>
      </div>

      {/* botões de avaliação — só aparecem quando o card está virado */}
      <div
        className={`w-full mt-6 transition-all duration-300 ${
          flipped ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <p className="text-center text-xs font-body text-yas-ink/40 mb-3">
          como foi?
        </p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleAvaliar("errou"); }}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-yas-terracotta/15 border border-yas-terracotta/30 active:scale-95 transition-transform"
          >
            <span className="text-xl">😰</span>
            <span className="text-xs font-body font-semibold text-yas-terracotta">Não lembrei</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleAvaliar("dificil"); }}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-yas-lavender/20 border border-yas-lavender/40 active:scale-95 transition-transform"
          >
            <span className="text-xl">🤔</span>
            <span className="text-xs font-body font-semibold text-yas-plum">Difícil</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleAvaliar("facil"); }}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-yas-yellow/40 border border-yas-yellow/60 active:scale-95 transition-transform"
          >
            <span className="text-xl">✨</span>
            <span className="text-xs font-body font-semibold text-yas-ink">Lembrei!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
