import { addDays, format } from "date-fns";
import type { Avaliacao } from "@/types";

export interface CardState {
  intervalo: number;
  repeticoes: number;
  fatorFacilidade: number;
  proximaRevisao: string;
}

export function calcularProximaRevisao(card: CardState, av: Avaliacao): CardState {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let { intervalo, repeticoes, fatorFacilidade } = card;

  if (av === "errou") {
    repeticoes = 0;
    intervalo = 0;
    fatorFacilidade = Math.max(1.3, fatorFacilidade - 0.2);
    return {
      intervalo,
      repeticoes,
      fatorFacilidade: parseFloat(fatorFacilidade.toFixed(2)),
      proximaRevisao: format(hoje, "yyyy-MM-dd"),
    };
  }

  const novoIntervalo =
    repeticoes === 0 ? 1 :
    repeticoes === 1 ? 3 :
    Math.round(intervalo * fatorFacilidade);

  if (av === "dificil") {
    fatorFacilidade = Math.max(1.3, fatorFacilidade - 0.15);
  } else {
    fatorFacilidade = Math.min(2.5, fatorFacilidade + 0.1);
  }

  return {
    intervalo: novoIntervalo,
    repeticoes: repeticoes + 1,
    fatorFacilidade: parseFloat(fatorFacilidade.toFixed(2)),
    proximaRevisao: format(addDays(hoje, novoIntervalo), "yyyy-MM-dd"),
  };
}

export function cardStateFromProgress(p: {
  intervalo: number;
  repeticoes: number;
  fator_facilidade: number;
  proxima_revisao: string;
}): CardState {
  return {
    intervalo: p.intervalo,
    repeticoes: p.repeticoes,
    fatorFacilidade: p.fator_facilidade,
    proximaRevisao: p.proxima_revisao,
  };
}

export const DEFAULT_CARD_STATE: CardState = {
  intervalo: 1,
  repeticoes: 0,
  fatorFacilidade: 2.5,
  proximaRevisao: format(new Date(), "yyyy-MM-dd"),
};
