"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, STUDY_USER_ID } from "@/lib/supabase";
import { ProgressBar } from "@/components/ProgressBar";
import type { Questao } from "@/types";

type Tela = "menu" | "temas" | "prova" | "resultado" | "historico";

interface HistoricoItem {
  id: string;
  data: string;
  tema: string;
  totalQuestoes: number;
  acertos: number;
  pct: number;
}

const HISTORICO_KEY = "yas_historico_avaliacoes";

const TEMA_LABELS: Record<string, string> = {
  sus:         "SUS & Legislação",
  tecnicas:    "Técnicas de Enfermagem",
  doencas:     "Doenças & Epidemiologia",
  emergencias: "Urgência & Emergência",
  mulher:      "Saúde da Mulher & Criança",
  bio:         "Biossegurança & CME",
  farma:       "Farmacologia & PNI",
  mental:      "Saúde Mental",
  idoso:       "Saúde do Idoso",
  completa:    "Avaliação Completa",
};

function labelTema(t: string) {
  return TEMA_LABELS[t] ?? t;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Embaralha as alternativas de uma questão e recalcula gabarito + explicacoes */
function shuffleAlternativas(questao: Questao): Questao {
  const letras = ["A", "B", "C", "D", "E"];
  const corretaTexto =
    questao.alternativas.find((a) => a.letra === questao.gabarito)?.texto ?? "";

  const shuffled = shuffle(questao.alternativas);
  const novasAlternativas = shuffled.map((alt, i) => ({
    letra: letras[i],
    texto: alt.texto,
  }));

  const novoGabarito =
    novasAlternativas.find((a) => a.texto === corretaTexto)?.letra ??
    questao.gabarito;

  const novasExplicacoes: Record<string, string> = {};
  if (questao.explicacoes) {
    Object.entries(questao.explicacoes).forEach(([oldLetra, exp]) => {
      const texto = questao.alternativas.find((a) => a.letra === oldLetra)?.texto;
      if (texto) {
        const newLetra = novasAlternativas.find((a) => a.texto === texto)?.letra;
        if (newLetra) novasExplicacoes[newLetra] = exp;
      }
    });
  }

  return {
    ...questao,
    alternativas: novasAlternativas,
    gabarito: novoGabarito,
    explicacoes: novasExplicacoes,
  };
}

function salvarHistorico(item: HistoricoItem) {
  try {
    const existing = JSON.parse(
      localStorage.getItem(HISTORICO_KEY) ?? "[]"
    ) as HistoricoItem[];
    localStorage.setItem(
      HISTORICO_KEY,
      JSON.stringify([item, ...existing].slice(0, 50))
    );
  } catch {}
}

function lerHistorico(): HistoricoItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORICO_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function AvaliacaoPage() {
  const [tela, setTela]           = useState<Tela>("menu");
  const [temas, setTemas]         = useState<string[]>([]);
  const [temaSel, setTemaSel]     = useState<string>("");
  const [questoes, setQuestoes]   = useState<Questao[]>([]);
  const [indice, setIndice]       = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);
  const [modoCompleto, setModo]   = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  const supabase = createClient();

  useEffect(() => {
    setHistorico(lerHistorico());
  }, []);

  const carregarTemas = useCallback(async () => {
    const { data } = await supabase.from("questoes").select("tema");
    if (data) {
      const unicos = Array.from(
        new Set(data.map((d: { tema: string }) => d.tema))
      ).sort() as string[];
      setTemas(unicos);
    }
  }, [supabase]);

  useEffect(() => { carregarTemas(); }, [carregarTemas]);

  async function iniciarBloco(tema: string) {
    setLoading(true);
    setTemaSel(tema);
    setModo(false);
    const { data } = await supabase
      .from("questoes")
      .select("*")
      .eq("tema", tema)
      .limit(10);
    setQuestoes(shuffle(data ?? []).map(shuffleAlternativas));
    setIndice(0);
    setRespostas({});
    setLoading(false);
    setTela("prova");
  }

  async function iniciarCompleta() {
    setLoading(true);
    setTemaSel("completa");
    setModo(true);
    const { data } = await supabase
      .from("questoes")
      .select("*")
      .limit(60);
    setQuestoes(shuffle(data ?? []).map(shuffleAlternativas));
    setIndice(0);
    setRespostas({});
    setLoading(false);
    setTela("prova");
  }

  function responder(letra: string) {
    const q = questoes[indice];
    if (!q || respostas[q.id]) return;
    const acertou = letra === q.gabarito;
    setRespostas((r) => ({ ...r, [q.id]: letra }));
    supabase.from("questoes_usuario").upsert(
      {
        user_id: STUDY_USER_ID,
        questao_id: q.id,
        resposta: letra,
        acertou,
        respondido_em: new Date().toISOString(),
      },
      { onConflict: "user_id,questao_id" }
    ).then();
  }

  function avancar() {
    if (indice + 1 >= questoes.length) {
      // Salva no histórico antes de exibir resultado
      const acertos = questoes.filter(
        (q) => respostas[q.id] === q.gabarito
      ).length;
      const pct =
        questoes.length > 0
          ? Math.round((acertos / questoes.length) * 100)
          : 0;
      const item: HistoricoItem = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        tema: temaSel || "completa",
        totalQuestoes: questoes.length,
        acertos,
        pct,
      };
      salvarHistorico(item);
      setHistorico(lerHistorico());
      setTela("resultado");
    } else {
      setIndice((i) => i + 1);
    }
  }

  function reiniciarErradas() {
    const erradas = questoes.filter(
      (q) => respostas[q.id] && respostas[q.id] !== q.gabarito
    );
    if (erradas.length === 0) return;
    setQuestoes(shuffle(erradas).map(shuffleAlternativas));
    setIndice(0);
    setRespostas({});
    setTela("prova");
  }

  // ---- TELA MENU ----
  if (tela === "menu") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-yas-burgundy font-semibold">
            Avaliação
          </h1>
          <p className="font-body text-xs text-yas-ink/50 mt-0.5">
            simulados com gabarito comentado
          </p>
        </div>

        {/* Bloco por tema */}
        <div
          onClick={() => { carregarTemas(); setTela("temas"); }}
          className="rounded-xl bg-yas-plum p-5 text-white cursor-pointer active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">📚</p>
          <p className="font-display text-xl font-semibold">Bloco por tema</p>
          <p className="font-body text-xs opacity-70 mt-0.5">
            10 questões de um tema específico
          </p>
        </div>

        {/* Avaliação completa */}
        <div
          onClick={iniciarCompleta}
          className="rounded-xl bg-yas-burgundy p-5 text-white cursor-pointer active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">🎯</p>
          <p className="font-display text-xl font-semibold">Avaliação completa</p>
          <p className="font-body text-xs opacity-70 mt-0.5">
            60 questões de todos os temas
          </p>
        </div>

        {/* Histórico */}
        <div
          onClick={() => setTela("historico")}
          className="rounded-xl bg-white/60 border border-yas-ink/10 p-5 cursor-pointer active:scale-95 transition-transform"
        >
          <p className="text-2xl mb-1">📋</p>
          <p className="font-display text-xl font-semibold text-yas-ink">
            Histórico de provas
          </p>
          <p className="font-body text-xs text-yas-ink/50 mt-0.5">
            {historico.length === 0
              ? "Nenhuma prova realizada ainda"
              : `${historico.length} prova${historico.length !== 1 ? "s" : ""} realizada${historico.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-yas-burgundy border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // ---- TELA HISTÓRICO ----
  if (tela === "historico") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTela("menu")}
            className="font-body text-xs text-yas-ink/50"
          >
            ← Voltar
          </button>
          <h1 className="font-display text-xl text-yas-burgundy font-semibold">
            Histórico de provas
          </h1>
        </div>

        {historico.length === 0 ? (
          <div className="rounded-xl bg-yas-ink/5 border border-yas-ink/10 p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-body text-sm text-yas-ink/50">
              Nenhuma prova realizada ainda.
            </p>
            <p className="font-body text-xs text-yas-ink/40 mt-1">
              Faça um simulado para ver seu histórico aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {historico.map((h) => {
              const medalha =
                h.pct >= 90 ? "🥇" : h.pct >= 70 ? "🥈" : h.pct >= 50 ? "🥉" : "📚";
              const cor =
                h.pct >= 70
                  ? "text-green-600"
                  : h.pct >= 50
                  ? "text-yas-plum"
                  : "text-yas-terracotta";
              const dataFmt = new Date(h.data).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={h.id}
                  className="rounded-xl bg-white/60 border border-yas-ink/10 p-4 flex items-center gap-4"
                >
                  <span className="text-2xl shrink-0">{medalha}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-yas-ink truncate">
                      {labelTema(h.tema)}
                    </p>
                    <p className="font-body text-xs text-yas-ink/50 mt-0.5">
                      {h.totalQuestoes} questão{h.totalQuestoes !== 1 ? "ões" : ""} ·{" "}
                      {dataFmt}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-display text-xl font-bold ${cor}`}>
                      {h.pct}%
                    </p>
                    <p className="font-body text-[10px] text-yas-ink/40">
                      {h.acertos}/{h.totalQuestoes}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---- TELA TEMAS ----
  if (tela === "temas") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTela("menu")}
            className="font-body text-xs text-yas-ink/50"
          >
            ← Voltar
          </button>
          <h1 className="font-display text-xl text-yas-burgundy font-semibold">
            Escolha o tema
          </h1>
        </div>
        {temas.length === 0 ? (
          <div className="rounded-xl bg-yas-ink/5 border border-yas-ink/10 p-6 text-center">
            <p className="font-body text-sm text-yas-ink/50">
              Nenhuma questão cadastrada ainda.
            </p>
            <p className="font-body text-xs text-yas-ink/40 mt-1">
              Importe questões pelo admin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {temas.map((t) => (
              <button
                key={t}
                onClick={() => iniciarBloco(t)}
                className="w-full text-left rounded-xl bg-white/60 border border-yas-ink/10 p-4 active:scale-95 transition-transform"
              >
                <p className="font-body text-sm font-semibold text-yas-ink">
                  {labelTema(t)}
                </p>
                <p className="font-body text-xs text-yas-plum mt-0.5">
                  10 questões
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- TELA PROVA ----
  if (tela === "prova") {
    if (questoes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <p className="font-body text-yas-ink/50">Nenhuma questão disponível.</p>
          <button
            onClick={() => setTela("menu")}
            className="font-body text-sm text-yas-burgundy underline"
          >
            Voltar
          </button>
        </div>
      );
    }

    const q = questoes[indice];
    const respondeu = Boolean(respostas[q.id]);
    const respostaUser = respostas[q.id];
    const acertou = respostaUser === q.gabarito;

    return (
      <div className="flex flex-col gap-5 pb-4">
        {/* header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setTela("menu")}
            className="font-body text-xs text-yas-ink/50"
          >
            ✕ Sair
          </button>
          <p className="font-body text-xs text-yas-ink/50">
            {indice + 1} / {questoes.length}
          </p>
          <p className="font-body text-[10px] text-yas-plum font-semibold uppercase tracking-wide">
            {labelTema(q.tema)}
          </p>
        </div>

        <ProgressBar value={indice} max={questoes.length} colorClass="bg-yas-burgundy" />

        {/* enunciado */}
        <div className="rounded-xl bg-white/60 border border-yas-ink/10 p-4">
          <p className="font-body text-sm text-yas-ink leading-relaxed">
            {q.enunciado}
          </p>
        </div>

        {/* alternativas */}
        <div className="flex flex-col gap-2">
          {q.alternativas.map(({ letra, texto }) => {
            let estilo = "bg-white/60 border-yas-ink/15 text-yas-ink";
            if (respondeu) {
              if (letra === q.gabarito)
                estilo = "bg-green-100 border-green-500 text-green-800 font-semibold";
              else if (letra === respostaUser)
                estilo = "bg-red-100 border-red-400 text-red-800";
              else
                estilo = "bg-white/30 border-yas-ink/10 text-yas-ink/40";
            }
            return (
              <button
                key={letra}
                onClick={() => responder(letra)}
                disabled={respondeu}
                className={`w-full text-left rounded-xl border p-3.5 transition-colors ${estilo}`}
              >
                <span className="font-body text-xs font-bold mr-2 opacity-60">
                  {letra})
                </span>
                <span className="font-body text-sm">{texto}</span>
              </button>
            );
          })}
        </div>

        {/* justificativa */}
        {respondeu && (
          <div
            className={`rounded-xl p-4 border ${
              acertou ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <p
              className={`font-body text-xs font-bold uppercase tracking-wide mb-2 ${
                acertou ? "text-green-700" : "text-red-600"
              }`}
            >
              {acertou ? "✓ Correto!" : "✗ Incorreto"}
            </p>
            <p className="font-body text-sm text-yas-ink leading-relaxed mb-3">
              <strong>Gabarito {q.gabarito}:</strong> {q.justificativa}
            </p>
            {q.explicacoes && Object.entries(q.explicacoes).length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-yas-ink/10 pt-3 mt-2">
                <p className="font-body text-[10px] font-semibold text-yas-ink/50 uppercase tracking-wide">
                  Por que as outras estão erradas
                </p>
                {Object.entries(q.explicacoes)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([l, exp]) => (
                    <p key={l} className="font-body text-xs text-yas-ink/70">
                      <strong>{l})</strong> {exp}
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}

        {respondeu && (
          <button
            onClick={avancar}
            className="w-full py-3 rounded-xl bg-yas-burgundy text-white font-body font-semibold text-sm active:scale-95 transition-transform"
          >
            {indice + 1 >= questoes.length ? "Ver resultado →" : "Próxima →"}
          </button>
        )}
      </div>
    );
  }

  // ---- TELA RESULTADO ----
  const totalRespondidas = Object.keys(respostas).length;
  const totalAcertos = questoes.filter(
    (q) => respostas[q.id] === q.gabarito
  ).length;
  const pct =
    totalRespondidas > 0
      ? Math.round((totalAcertos / totalRespondidas) * 100)
      : 0;
  const erradas = questoes.filter(
    (q) => respostas[q.id] && respostas[q.id] !== q.gabarito
  );

  const medalha =
    pct >= 90 ? "🥇" : pct >= 70 ? "🥈" : pct >= 50 ? "🥉" : "📚";
  const mensagem =
    pct >= 90
      ? "Excelente! Você está dominando o conteúdo."
      : pct >= 70
      ? "Muito bem! Continue praticando."
      : pct >= 50
      ? "Bom esforço! Revise os temas com erros."
      : "Não desanime! Revise e tente novamente.";

  const porTema: Record<string, { acertos: number; total: number }> = {};
  if (modoCompleto) {
    questoes.forEach((q) => {
      if (!porTema[q.tema]) porTema[q.tema] = { acertos: 0, total: 0 };
      porTema[q.tema].total++;
      if (respostas[q.id] === q.gabarito) porTema[q.tema].acertos++;
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="text-center">
        <p className="text-6xl mb-2">{medalha}</p>
        <p className="font-display text-3xl text-yas-burgundy font-semibold">
          {pct}%
        </p>
        <p className="font-body text-sm text-yas-ink/60 mt-1">
          {totalAcertos} de {totalRespondidas} acertos
        </p>
        <p className="font-body text-xs text-yas-ink/50 mt-2">{mensagem}</p>
      </div>

      <ProgressBar
        value={totalAcertos}
        max={totalRespondidas}
        label="Taxa de acerto"
        colorClass="bg-yas-burgundy"
      />

      {modoCompleto && Object.keys(porTema).length > 0 && (
        <div>
          <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide mb-3">
            Por tema
          </p>
          <div className="flex flex-col gap-2">
            {Object.entries(porTema).map(([tema, { acertos, total }]) => {
              const p = Math.round((acertos / total) * 100);
              return (
                <div
                  key={tema}
                  className="rounded-xl bg-white/60 border border-yas-ink/10 p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-body text-xs font-medium text-yas-ink">
                      {labelTema(tema)}
                    </p>
                    <p
                      className={`font-body text-xs font-bold ${
                        p >= 70
                          ? "text-green-600"
                          : p >= 50
                          ? "text-yas-plum"
                          : "text-yas-terracotta"
                      }`}
                    >
                      {acertos}/{total} ({p}%)
                    </p>
                  </div>
                  <ProgressBar
                    value={acertos}
                    max={total}
                    colorClass={
                      p >= 70
                        ? "bg-green-500"
                        : p >= 50
                        ? "bg-yas-plum"
                        : "bg-yas-terracotta"
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {erradas.length > 0 && (
          <button
            onClick={reiniciarErradas}
            className="w-full py-3 rounded-xl bg-yas-plum text-white font-body font-semibold text-sm active:scale-95 transition-transform"
          >
            Repetir {erradas.length} questão
            {erradas.length !== 1 ? "ões" : ""} errada
            {erradas.length !== 1 ? "s" : ""}
          </button>
        )}
        <button
          onClick={() => setTela("menu")}
          className="w-full py-3 rounded-xl border border-yas-burgundy text-yas-burgundy font-body font-semibold text-sm active:scale-95 transition-transform"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
