"use client";

import { useEffect, useState } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient, STUDY_USER_ID } from "@/lib/supabase";
import { ProgressBar } from "@/components/ProgressBar";
import { BLOCO_LABELS, type BlocoKey } from "@/types";

interface BlocoStat {
  bloco: string;
  total: number;
  dominados: number;
  acertos: number;
  tentativas: number;
}

interface DiaAtividade {
  data: string;
  estudados: number;
}

interface SessaoDia {
  cards_estudados: number;
  cards_acertados: number;
}

export default function StatsPage() {
  const [blocoStats, setBlocoStats]     = useState<BlocoStat[]>([]);
  const [atividade, setAtividade]       = useState<DiaAtividade[]>([]);
  const [streak, setStreak]             = useState(0);
  const [totalDominados, setDominados]  = useState(0);
  const [totalCards, setTotalCards]     = useState(0);
  const [sessaoHoje, setSessaoHoje]     = useState<SessaoDia | null>(null);
  const [sessaoOntem, setSessaoOntem]   = useState<SessaoDia | null>(null);
  const [loading, setLoading]           = useState(true);
  const supabase = createClient();
  const hoje = format(new Date(), "yyyy-MM-dd");
  const ontem = format(subDays(new Date(), 1), "yyyy-MM-dd");

  useEffect(() => {
    async function carregar() {
      const [{ data: cards }, { data: progressos }, { data: sessoes }] = await Promise.all([
        supabase.from("flashcards").select("id, bloco"),
        supabase.from("card_progress").select("*").eq("user_id", STUDY_USER_ID),
        supabase.from("sessoes").select("*").eq("user_id", STUDY_USER_ID).order("data", { ascending: false }),
      ]);

      if (!cards) { setLoading(false); return; }

      setTotalCards(cards.length);

      const progressoMap = new Map((progressos ?? []).map((p) => [p.card_id, p]));
      const dominados = (progressos ?? []).filter((p) => p.intervalo >= 14).length;
      setDominados(dominados);

      // stats por bloco
      const blocos = Array.from(new Set(cards.map((c) => c.bloco)));
      const stats: BlocoStat[] = blocos.map((bloco) => {
        const cardsDoBloco = cards.filter((c) => c.bloco === bloco);
        const dominadosBloco = cardsDoBloco.filter((c) => {
          const p = progressoMap.get(c.id);
          return p && p.intervalo >= 14;
        }).length;
        const progressosBloco = cardsDoBloco
          .map((c) => progressoMap.get(c.id))
          .filter(Boolean);
        const acertos = progressosBloco.filter(
          (p) => p!.ultima_avaliacao !== "errou"
        ).length;
        return {
          bloco,
          total:      cardsDoBloco.length,
          dominados:  dominadosBloco,
          acertos,
          tentativas: progressosBloco.length,
        };
      });
      setBlocoStats(stats.sort((a, b) => b.tentativas - a.tentativas));

      // atividade 28 dias
      const ultimos28 = eachDayOfInterval({
        start: subDays(new Date(), 27),
        end:   new Date(),
      });
      const sessaoMap = new Map(
        (sessoes ?? []).map((s) => [s.data, s.cards_estudados])
      );
      const atv: DiaAtividade[] = ultimos28.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return { data: key, estudados: sessaoMap.get(key) ?? 0 };
      });
      setAtividade(atv);

      // ranking hoje vs ontem
      const hojeS  = (sessoes ?? []).find((s) => s.data === hoje);
      const ontemS = (sessoes ?? []).find((s) => s.data === ontem);
      setSessaoHoje(hojeS ? { cards_estudados: hojeS.cards_estudados, cards_acertados: hojeS.cards_acertados } : null);
      setSessaoOntem(ontemS ? { cards_estudados: ontemS.cards_estudados, cards_acertados: ontemS.cards_acertados } : null);

      // streak
      let s = 0;
      for (let i = 0; i < 365; i++) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        if (sessaoMap.has(d) && (sessaoMap.get(d) ?? 0) > 0) s++;
        else if (i > 0) break;
      }
      setStreak(s);

      setLoading(false);
    }
    carregar();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-yas-burgundy border-t-transparent animate-spin" />
      </div>
    );
  }

  const pctDominados = totalCards > 0 ? Math.round((totalDominados / totalCards) * 100) : 0;

  const hojeCards   = sessaoHoje?.cards_estudados ?? 0;
  const ontemCards  = sessaoOntem?.cards_estudados ?? 0;
  const deltaCds    = hojeCards - ontemCards;
  const hojeAcerto  = sessaoHoje && sessaoHoje.cards_estudados > 0
    ? Math.round((sessaoHoje.cards_acertados / sessaoHoje.cards_estudados) * 100) : null;
  const ontemAcerto = sessaoOntem && sessaoOntem.cards_estudados > 0
    ? Math.round((sessaoOntem.cards_acertados / sessaoOntem.cards_estudados) * 100) : null;
  const deltaAcerto = hojeAcerto !== null && ontemAcerto !== null ? hojeAcerto - ontemAcerto : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-yas-burgundy font-semibold">Estatísticas</h1>
        <p className="font-body text-xs text-yas-ink/50 mt-0.5">seu progresso</p>
      </div>

      {/* cartões de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-yas-burgundy p-4 text-white">
          <p className="font-body text-xs opacity-70">Cards dominados</p>
          <p className="font-display text-3xl font-semibold mt-1">{totalDominados}</p>
          <p className="font-body text-xs opacity-60">de {totalCards} ({pctDominados}%)</p>
        </div>
        <div className="rounded-xl bg-yas-ink p-4 text-white">
          <p className="font-body text-xs opacity-70">Sequência</p>
          <p className="font-display text-3xl font-semibold mt-1">{streak}</p>
          <p className="font-body text-xs opacity-60">dias seguidos 🔥</p>
        </div>
      </div>

      {/* comparativo hoje vs ontem */}
      {(sessaoHoje || sessaoOntem) && (
        <div className="rounded-xl border border-yas-ink/10 bg-yas-ink/5 p-4">
          <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide mb-3">
            Comparativo — hoje vs ontem
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-body text-[10px] text-yas-ink/50 uppercase tracking-wide">Ontem</p>
              <p className="font-display text-2xl font-semibold text-yas-ink mt-1">{ontemCards}</p>
              <p className="font-body text-xs text-yas-ink/40">
                {ontemAcerto !== null ? `${ontemAcerto}% acerto` : "sem dados"}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              {deltaCds !== 0 && (
                <p className={`font-body text-lg font-bold ${deltaCds > 0 ? "text-green-600" : "text-yas-terracotta"}`}>
                  {deltaCds > 0 ? "↑" : "↓"}
                </p>
              )}
              {deltaCds === 0 && <p className="font-body text-lg text-yas-ink/30">=</p>}
              <p className={`font-body text-xs font-semibold ${
                deltaCds > 0 ? "text-green-600" : deltaCds < 0 ? "text-yas-terracotta" : "text-yas-ink/40"
              }`}>
                {deltaCds > 0 ? `+${deltaCds}` : deltaCds} cards
              </p>
              {deltaAcerto !== null && (
                <p className={`font-body text-[10px] mt-0.5 font-semibold ${
                  deltaAcerto > 0 ? "text-green-600" : deltaAcerto < 0 ? "text-yas-terracotta" : "text-yas-ink/40"
                }`}>
                  {deltaAcerto > 0 ? `+${deltaAcerto}` : deltaAcerto}pp acerto
                </p>
              )}
            </div>
            <div>
              <p className="font-body text-[10px] text-yas-ink/50 uppercase tracking-wide">Hoje</p>
              <p className="font-display text-2xl font-semibold text-yas-burgundy mt-1">{hojeCards}</p>
              <p className="font-body text-xs text-yas-ink/40">
                {hojeAcerto !== null ? `${hojeAcerto}% acerto` : "sem dados"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* dominados geral */}
      <ProgressBar
        value={totalDominados}
        max={totalCards}
        label="Cards dominados (intervalo ≥ 14 dias)"
        colorClass="bg-yas-burgundy"
      />

      {/* atividade 28 dias */}
      <div>
        <p className="font-body text-sm font-semibold text-yas-ink mb-3">
          Atividade — últimos 28 dias
        </p>
        <div className="grid grid-cols-7 gap-1">
          {atividade.map((d) => {
            const intensidade =
              d.estudados === 0 ? "bg-yas-lavender/10" :
              d.estudados < 5  ? "bg-yas-lavender/40" :
              d.estudados < 15 ? "bg-yas-plum/60" :
                                 "bg-yas-burgundy";
            const isHoje = d.data === hoje;
            return (
              <div
                key={d.data}
                title={`${d.data}: ${d.estudados} cards`}
                className={`aspect-square rounded-sm ${intensidade} ${isHoje ? "ring-1 ring-yas-burgundy" : ""}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span className="text-[10px] font-body text-yas-ink/40">menos</span>
          {["bg-yas-lavender/10","bg-yas-lavender/40","bg-yas-plum/60","bg-yas-burgundy"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] font-body text-yas-ink/40">mais</span>
        </div>
      </div>

      {/* stats por bloco */}
      <div>
        <p className="font-body text-sm font-semibold text-yas-ink mb-3">
          Desempenho por bloco
        </p>
        <div className="flex flex-col gap-3">
          {blocoStats.map((b) => {
            const pct = b.tentativas > 0 ? Math.round((b.acertos / b.tentativas) * 100) : 0;
            const label = BLOCO_LABELS[b.bloco as BlocoKey] ?? b.bloco;
            return (
              <div key={b.bloco} className="rounded-xl bg-white/60 border border-yas-ink/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-body text-sm font-medium text-yas-ink">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-body text-yas-ink/50">
                      {b.dominados}/{b.total} dom.
                    </span>
                    <span className="text-xs font-body font-semibold text-yas-plum">
                      {b.tentativas > 0 ? `${pct}%` : "—"}
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={b.acertos}
                  max={Math.max(b.tentativas, 1)}
                  colorClass={pct >= 80 ? "bg-yas-plum" : pct >= 50 ? "bg-yas-lavender" : "bg-yas-terracotta"}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
