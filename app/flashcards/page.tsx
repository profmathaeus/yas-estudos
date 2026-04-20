"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { FlashCard } from "@/components/FlashCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Timer } from "@/components/Timer";
import { createClient, STUDY_USER_ID } from "@/lib/supabase";
import { calcularProximaRevisao, cardStateFromProgress, DEFAULT_CARD_STATE } from "@/lib/sm2";
import type { Avaliacao, CardComProgresso } from "@/types";

type SessionCard = CardComProgresso & { sessionId: string };

interface SessaoDia {
  cards_estudados: number;
  cards_acertados: number;
}

const FONTE_KEY = "yas_filtro_fonte";

export default function FlashcardsPage() {
  const [queue, setQueue]             = useState<SessionCard[]>([]);
  const [index, setIndex]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [done, setDone]               = useState(false);
  const [estudados, setEstudados]     = useState(0);
  const [acertados, setAcertados]     = useState(0);
  const [totalHoje, setTotalHoje]     = useState(0);
  const [filtroBloco, setFiltroBloco] = useState<string>("todos");
  const [filtroFonte, setFiltroFonte] = useState<string>("todas");
  const [blocos, setBlocos]           = useState<string[]>([]);
  const [fontes, setFontes]           = useState<string[]>([]);
  const [sessaoHoje, setSessaoHoje]   = useState<SessaoDia | null>(null);
  const [sessaoOntem, setSessaoOntem] = useState<SessaoDia | null>(null);

  const supabase = createClient();
  const hoje = format(new Date(), "yyyy-MM-dd");
  const ontem = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const carregarRanking = useCallback(async () => {
    const { data } = await supabase
      .from("sessoes")
      .select("data, cards_estudados, cards_acertados")
      .eq("user_id", STUDY_USER_ID)
      .in("data", [hoje, ontem]);
    setSessaoHoje(data?.find((s) => s.data === hoje) ?? null);
    setSessaoOntem(data?.find((s) => s.data === ontem) ?? null);
  }, [supabase, hoje, ontem]);

  const carregarCards = useCallback(async (bloco: string, fonte: string) => {
    setLoading(true);
    setDone(false);
    setIndex(0);
    setEstudados(0);
    setAcertados(0);

    const { data: todasFontes } = await supabase.from("flashcards").select("fonte");
    const uniqueFontes = Array.from(
      new Set((todasFontes ?? []).map((c: { fonte: string }) => c.fonte))
    ).sort() as string[];
    setFontes(uniqueFontes);

    let query = supabase.from("flashcards").select("*").order("bloco");
    if (fonte !== "todas") query = query.eq("fonte", fonte);
    const { data: cards } = await query;

    if (!cards || cards.length === 0) {
      setBlocos([]);
      setQueue([]);
      setTotalHoje(0);
      setLoading(false);
      return;
    }

    const { data: progressos } = await supabase
      .from("card_progress")
      .select("*")
      .eq("user_id", STUDY_USER_ID)
      .lte("proxima_revisao", hoje);

    const progressoMap = new Map((progressos ?? []).map((p) => [p.card_id, p]));

    const uniqueBlocos = Array.from(new Set(cards.map((c: { bloco: string }) => c.bloco))) as string[];
    setBlocos(uniqueBlocos);

    const cardsParaHoje = cards.filter((c: { id: string; bloco: string }) => {
      const prog = progressoMap.get(c.id);
      const vencido = prog ? prog.proxima_revisao <= hoje : true;
      const blocoOk = bloco === "todos" || c.bloco === bloco;
      return vencido && blocoOk;
    });

    setTotalHoje(cardsParaHoje.length);
    setQueue(
      cardsParaHoje.map((c: Record<string, unknown>) => ({
        ...c,
        progresso: progressoMap.get(c.id as string) ?? null,
        sessionId: `${c.id}-${Date.now()}`,
      })) as SessionCard[]
    );
    setLoading(false);
  }, [supabase, hoje]);

  useEffect(() => {
    const savedFonte = localStorage.getItem(FONTE_KEY) ?? "todas";
    setFiltroFonte(savedFonte);
    carregarCards("todos", savedFonte);
    carregarRanking();
  }, [carregarCards, carregarRanking]);

  function handleFonte(f: string) {
    setFiltroFonte(f);
    setFiltroBloco("todos");
    localStorage.setItem(FONTE_KEY, f);
    carregarCards("todos", f);
  }

  async function handleAvaliar(av: Avaliacao) {
    const card = queue[index];
    if (!card) return;

    const estado = card.progresso
      ? cardStateFromProgress(card.progresso)
      : { ...DEFAULT_CARD_STATE };
    const novoEstado = calcularProximaRevisao(estado, av);

    const novoEstudados = estudados + 1;
    const novosAcertados = av !== "errou" ? acertados + 1 : acertados;
    setEstudados(novoEstudados);
    setAcertados(novosAcertados);

    supabase.from("card_progress").upsert({
      user_id:          STUDY_USER_ID,
      card_id:          card.id,
      intervalo:        novoEstado.intervalo,
      repeticoes:       novoEstado.repeticoes,
      fator_facilidade: novoEstado.fatorFacilidade,
      proxima_revisao:  novoEstado.proximaRevisao,
      ultima_avaliacao: av,
      updated_at:       new Date().toISOString(),
    }, { onConflict: "user_id,card_id" }).then();

    supabase.from("sessoes").upsert({
      user_id:         STUDY_USER_ID,
      data:            hoje,
      cards_estudados: novoEstudados,
      cards_acertados: novosAcertados,
    }, { onConflict: "user_id,data" }).then(() => {
      setSessaoHoje({ cards_estudados: novoEstudados, cards_acertados: novosAcertados });
    });

    if (av === "errou") {
      setQueue((q) => [...q, { ...card, sessionId: `${card.id}-retry-${Date.now()}` }]);
    }

    const proxIndex = index + 1;
    if (proxIndex >= queue.length) setDone(true);
    else setIndex(proxIndex);
  }

  // --- ranking helpers ---
  const hojeCards   = sessaoHoje?.cards_estudados ?? 0;
  const ontemCards  = sessaoOntem?.cards_estudados ?? 0;
  const deltaCds    = hojeCards - ontemCards;
  const hojeAcerto  = sessaoHoje && sessaoHoje.cards_estudados > 0
    ? Math.round((sessaoHoje.cards_acertados / sessaoHoje.cards_estudados) * 100) : null;
  const ontemAcerto = sessaoOntem && sessaoOntem.cards_estudados > 0
    ? Math.round((sessaoOntem.cards_acertados / sessaoOntem.cards_estudados) * 100) : null;
  const deltaAcerto = hojeAcerto !== null && ontemAcerto !== null ? hojeAcerto - ontemAcerto : null;
  const showRanking = sessaoHoje !== null || sessaoOntem !== null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-yas-burgundy border-t-transparent animate-spin" />
        <p className="font-body text-yas-ink/50 text-sm">carregando cards...</p>
      </div>
    );
  }

  if (done || queue.length === 0) {
    const pct = estudados > 0 ? Math.round((acertados / estudados) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="text-6xl">{totalHoje === 0 ? "🎉" : pct >= 80 ? "🌟" : pct >= 50 ? "💪" : "📚"}</div>
        <div>
          <h2 className="font-display text-3xl text-yas-burgundy font-semibold">
            {totalHoje === 0 ? "Em dia!" : "Sessão concluída"}
          </h2>
          <p className="font-body text-yas-ink/60 mt-1 text-sm">
            {totalHoje === 0
              ? "Nenhum card vencido para hoje. Volte amanhã!"
              : `${acertados}/${estudados} acertos (${pct}%)`}
          </p>
        </div>
        {totalHoje > 0 && (
          <ProgressBar value={acertados} max={estudados} label="Taxa de acerto" colorClass="bg-yas-burgundy" />
        )}
        <button
          onClick={() => carregarCards(filtroBloco, filtroFonte)}
          className="mt-2 px-6 py-3 rounded-xl bg-yas-burgundy text-white font-body font-semibold text-sm active:scale-95 transition-transform"
        >
          Estudar novamente
        </button>
      </div>
    );
  }

  const card = queue[index];
  const progresso    = queue.slice(0, index).filter((c) => !c.sessionId.includes("retry")).length;
  const totalOriginal = queue.filter((c) => !c.sessionId.includes("retry")).length;

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-yas-burgundy font-semibold">Flashcards</h1>
          <p className="font-body text-xs text-yas-ink/50 mt-0.5">
            {totalHoje} card{totalHoje !== 1 ? "s" : ""} para hoje
          </p>
        </div>
        <Timer />
      </div>

      {/* ranking hoje vs ontem */}
      {showRanking && (
        <div className="rounded-xl bg-yas-ink/5 border border-yas-ink/10 p-3 flex gap-3">
          <div className="flex-1 text-center">
            <p className="font-body text-[10px] text-yas-ink/50 uppercase tracking-wide">Hoje</p>
            <p className="font-display text-lg font-semibold text-yas-ink mt-0.5">{hojeCards}</p>
            <p className="font-body text-[10px] text-yas-ink/40">cards</p>
            {deltaCds !== 0 && (
              <p className={`font-body text-xs font-semibold mt-0.5 ${deltaCds > 0 ? "text-green-600" : "text-yas-terracotta"}`}>
                {deltaCds > 0 ? "+" : ""}{deltaCds}
              </p>
            )}
          </div>
          <div className="w-px bg-yas-ink/10" />
          <div className="flex-1 text-center">
            <p className="font-body text-[10px] text-yas-ink/50 uppercase tracking-wide">Acerto hoje</p>
            <p className="font-display text-lg font-semibold text-yas-ink mt-0.5">
              {hojeAcerto !== null ? `${hojeAcerto}%` : "—"}
            </p>
            <p className="font-body text-[10px] text-yas-ink/40">
              ontem: {ontemAcerto !== null ? `${ontemAcerto}%` : "—"}
            </p>
            {deltaAcerto !== null && deltaAcerto !== 0 && (
              <p className={`font-body text-xs font-semibold mt-0.5 ${deltaAcerto > 0 ? "text-green-600" : "text-yas-terracotta"}`}>
                {deltaAcerto > 0 ? "+" : ""}{deltaAcerto}pp
              </p>
            )}
          </div>
          <div className="w-px bg-yas-ink/10" />
          <div className="flex-1 text-center">
            <p className="font-body text-[10px] text-yas-ink/50 uppercase tracking-wide">Ontem</p>
            <p className="font-display text-lg font-semibold text-yas-ink mt-0.5">{ontemCards}</p>
            <p className="font-body text-[10px] text-yas-ink/40">cards</p>
          </div>
        </div>
      )}

      {/* filtro por fonte */}
      {fontes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {["todas", ...fontes].map((f) => (
            <button
              key={f}
              onClick={() => handleFonte(f)}
              className={`shrink-0 text-xs font-body font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filtroFonte === f
                  ? "bg-yas-plum text-white border-yas-plum"
                  : "bg-transparent text-yas-ink/60 border-yas-ink/20"
              }`}
            >
              {f === "todas" ? "Todas as fontes" : f}
            </button>
          ))}
        </div>
      )}

      {/* filtro por bloco */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {["todos", ...blocos].map((b) => (
          <button
            key={b}
            onClick={() => { setFiltroBloco(b); carregarCards(b, filtroFonte); }}
            className={`shrink-0 text-xs font-body font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filtroBloco === b
                ? "bg-yas-burgundy text-white border-yas-burgundy"
                : "bg-transparent text-yas-ink/60 border-yas-ink/20"
            }`}
          >
            {b === "todos" ? "Todos" : b}
          </button>
        ))}
      </div>

      {/* barra de progresso da sessão */}
      <ProgressBar
        value={progresso}
        max={totalOriginal}
        label="Progresso da sessão"
        colorClass="bg-yas-burgundy"
      />

      {/* flashcard */}
      <FlashCard
        key={card.sessionId}
        frente={card.frente}
        verso={card.verso}
        bloco={card.bloco}
        onAvaliar={handleAvaliar}
        cardIndex={progresso}
        totalCards={totalOriginal}
      />
    </div>
  );
}
