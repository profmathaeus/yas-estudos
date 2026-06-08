"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Passo {
  text: string;
  detail: string;
}

interface Pratica {
  id: string;
  nome: string;
  icon: string;
  cor: string;
  bg: string;
  textCor: string;
  tempo: string;
  chakra: string;
  objetivo: string;
  passos: Passo[];
}

interface Dia {
  id: number;
  curto: string;
  nome: string;
  praticas: string[];
  tema: string;
}

// ─── Dados ────────────────────────────────────────────────────────────────────
const PRATICAS: Record<string, Pratica> = {
  expressao: {
    id: "expressao",
    nome: "Expressão diária",
    icon: "✏️",
    cor: "#0F6E56",
    bg: "#E1F5EE",
    textCor: "#085041",
    tempo: "10 min",
    chakra: "Vishuddha — garganta",
    objetivo:
      "Ativar a missão 3 — a Imperatriz precisa criar regularmente para se realizar. O canal de expressão resseca quando não é usado.",
    passos: [
      {
        text: "Escolha qualquer forma: escrever, desenhar, gravar áudio, cantar",
        detail: "O meio não importa — o que importa é criar algo.",
      },
      {
        text: "Crie sem objetivo de mostrar ou publicar",
        detail: "Não é para ninguém ver. É para soltar o que está dentro.",
      },
      {
        text: "Quando terminar, não avalie",
        detail: "Feche e siga. O valor está no ato, não no resultado.",
      },
    ],
  },
  coracao: {
    id: "coracao",
    nome: "Âncora do coração",
    icon: "🫀",
    cor: "#993556",
    bg: "#FBEAF0",
    textCor: "#4B1528",
    tempo: "3 min",
    chakra: "Anahata — coração",
    objetivo:
      "Usar o GPS mais preciso da Yasmine — o Anahata é o chakra mais forte dela. As decisões mais verdadeiras vêm daqui.",
    passos: [
      {
        text: "Identifique uma decisão ou situação que está pendente",
        detail: "Pode ser pequena ou grande.",
      },
      {
        text: "Coloque a mão no peito, respire fundo e pergunte:",
        detail: "\"O que meu coração sabe sobre isso que minha cabeça ainda não admitiu?\"",
      },
      {
        text: "Escreva a primeira resposta que vier — sem filtrar",
        detail: "A primeira resposta é sempre a mais verdadeira.",
      },
    ],
  },
  completude: {
    id: "completude",
    nome: "Registro de completude",
    icon: "🌕",
    cor: "#BA7517",
    bg: "#FAEEDA",
    textCor: "#633806",
    tempo: "5 min",
    chakra: "Ajna — interior",
    objetivo:
      "Ativar o 21 interior — o estado natural de inteireza que já existe nela, mas que precisa ser reconhecido conscientemente para ser habitado com mais frequência.",
    passos: [
      {
        text: "Complete a frase por escrito:",
        detail: "\"Esta semana me senti inteira quando...\"",
      },
      {
        text: "Escreva pelo menos duas situações",
        detail: "Momentos de clareza, conexão, alegria, fluxo — quando tudo parecia fazer sentido.",
      },
      {
        text: "Leia o que escreveu e respire",
        detail: "Esse estado não é exceção. É quem você é quando está alinhada.",
      },
    ],
  },
  poder: {
    id: "poder",
    nome: "Presença corporal",
    icon: "🔥",
    cor: "#185FA5",
    bg: "#E6F1FB",
    textCor: "#042C53",
    tempo: "10 min",
    chakra: "Manipura — poder pessoal",
    objetivo:
      "Fortalecer o Manipura — o coração da Yasmine é dominante e poderoso, mas o corpo precisa acompanhar para que a autoridade pessoal se manifeste completamente.",
    passos: [
      {
        text: "Escolha uma prática corporal simples:",
        detail: "Caminhada com intenção, yoga, dança livre, alongamento consciente.",
      },
      {
        text: "Durante a prática, repita internamente:",
        detail: "\"Minha presença aqui é suficiente. Meu corpo é minha força.\"",
      },
      {
        text: "Termine em pé, ereta, respirando fundo por 30 segundos",
        detail: "Essa postura ativa o Manipura de forma concreta e imediata.",
      },
    ],
  },
};

const DIAS: Dia[] = [
  { id: 0, curto: "Seg", nome: "Segunda",  praticas: ["expressao", "coracao"],   tema: "Expressar e sentir" },
  { id: 1, curto: "Ter", nome: "Terça",    praticas: ["poder", "completude"],    tema: "Corpo e inteireza" },
  { id: 2, curto: "Qua", nome: "Quarta",   praticas: ["expressao", "coracao"],   tema: "Expressar e sentir" },
  { id: 3, curto: "Qui", nome: "Quinta",   praticas: ["poder"],                  tema: "Presença e força" },
  { id: 4, curto: "Sex", nome: "Sexta",    praticas: ["expressao", "coracao"],   tema: "Criar e conectar" },
  { id: 5, curto: "Sáb", nome: "Sábado",  praticas: ["completude", "poder"],    tema: "Reflexão semanal" },
  { id: 6, curto: "Dom", nome: "Domingo", praticas: ["expressao"],              tema: "Expressão livre" },
];

function getTodayIdx() {
  return (new Date().getDay() + 6) % 7; // 0=Seg … 6=Dom
}

function getChecksKey() {
  return "yas_esp_checks_" + new Date().toDateString();
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EspiritualPage() {
  type Aba = "semana" | "praticas" | "hoje";

  const [aba, setAba]                     = useState<Aba>("hoje");
  const [diaSel, setDiaSel]               = useState<number | null>(null);
  const [praticaSel, setPraticaSel]       = useState<string | null>(null);
  const [checks, setChecks]               = useState<Record<string, boolean>>({});

  // Carrega checks do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(getChecksKey());
    if (saved) setChecks(JSON.parse(saved));
  }, []);

  function toggleCheck(pid: string) {
    setChecks((prev) => {
      const next = { ...prev, [pid]: !prev[pid] };
      localStorage.setItem(getChecksKey(), JSON.stringify(next));
      return next;
    });
  }

  function irParaPratica(pid: string) {
    setPraticaSel(pid);
    setAba("praticas");
  }

  const todayIdx = getTodayIdx();
  const diaHoje  = DIAS[todayIdx];
  const pracIds  = Object.keys(PRATICAS);

  // ── Aba Hoje ───────────────────────────────────────────────────────────────
  function AbaHoje() {
    const total = diaHoje.praticas.length;
    const feitas = diaHoje.praticas.filter((p) => checks[p]).length;
    const pct = total > 0 ? Math.round((feitas / total) * 100) : 0;

    return (
      <div className="flex flex-col gap-4">
        {/* cabeçalho */}
        <div>
          <h2 className="font-display text-2xl text-yas-ink font-semibold">{diaHoje.nome}</h2>
          <p className="font-body text-sm text-yas-ink/50 mt-0.5">{diaHoje.tema}</p>
        </div>

        {/* barra de progresso */}
        <div>
          <div className="h-1.5 bg-yas-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "#0F6E56" }}
            />
          </div>
          <p className="font-body text-xs text-yas-ink/40 mt-1.5 text-right">
            {feitas} de {total} feita{total !== 1 ? "s" : ""} hoje
          </p>
        </div>

        {/* checklist */}
        <div className="rounded-2xl bg-white border border-yas-ink/8 overflow-hidden">
          {diaHoje.praticas.map((pid, i) => {
            const p = PRATICAS[pid];
            const feita = !!checks[pid];
            return (
              <button
                key={pid}
                onClick={() => toggleCheck(pid)}
                className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors active:bg-yas-ink/5 ${
                  i < diaHoje.praticas.length - 1 ? "border-b border-yas-ink/8" : ""
                }`}
              >
                {/* checkbox */}
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: feita ? "#0F6E56" : "transparent",
                    borderColor: feita ? "#0F6E56" : "rgba(0,0,0,0.2)",
                  }}
                >
                  {feita && <span className="text-white text-xs">✓</span>}
                </div>
                {/* ícone */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: p.bg }}
                >
                  {p.icon}
                </div>
                {/* texto */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-body text-sm font-medium transition-colors ${
                      feita ? "text-yas-ink/30 line-through" : "text-yas-ink"
                    }`}
                  >
                    {p.nome}
                  </p>
                  <p className="font-body text-xs text-yas-ink/40">{p.tempo}</p>
                </div>
                {/* seta */}
                <button
                  onClick={(e) => { e.stopPropagation(); irParaPratica(pid); }}
                  className="text-yas-ink/20 text-sm px-1 py-1"
                  aria-label="Ver prática"
                >
                  →
                </button>
              </button>
            );
          })}
        </div>

        {feitas === total && total > 0 && (
          <div
            className="rounded-xl px-4 py-3 text-center font-body text-sm font-medium"
            style={{ background: "#E1F5EE", color: "#085041" }}
          >
            Práticas de hoje concluídas ✓
          </div>
        )}
      </div>
    );
  }

  // ── Aba Semana ─────────────────────────────────────────────────────────────
  function AbaSemana() {
    return (
      <div className="flex flex-col gap-4">
        {/* grid de dias */}
        <div className="grid grid-cols-2 gap-2.5">
          {DIAS.map((dia) => {
            const p = PRATICAS[dia.praticas[0]];
            const isHoje = dia.id === todayIdx;
            return (
              <button
                key={dia.id}
                onClick={() => setDiaSel(diaSel === dia.id ? null : dia.id)}
                className={`text-left rounded-2xl bg-white border p-3.5 transition-all active:scale-95 ${
                  diaSel === dia.id
                    ? "border-2"
                    : isHoje
                    ? "border border-yas-ink/20"
                    : "border-yas-ink/8"
                }`}
                style={{
                  borderColor: diaSel === dia.id ? p.cor : undefined,
                  borderLeftWidth: "3px",
                  borderLeftColor: p.cor,
                }}
              >
                <p className="font-body text-[10px] font-medium text-yas-ink/40 uppercase tracking-wide mb-1">
                  {dia.curto}{isHoje ? " · hoje" : ""}
                </p>
                <p className="font-display text-base text-yas-ink font-semibold mb-1">{dia.nome}</p>
                <p className="font-body text-xs text-yas-ink/50 mb-2">{dia.tema}</p>
                <span
                  className="inline-block font-body text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: p.bg, color: p.textCor }}
                >
                  {dia.praticas.length} prática{dia.praticas.length > 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* detalhe do dia selecionado */}
        {diaSel !== null && (
          <div className="rounded-2xl bg-white border border-yas-ink/8 p-4">
            <p className="font-display text-lg text-yas-ink font-semibold mb-0.5">
              {DIAS[diaSel].nome}
            </p>
            <p className="font-body text-sm text-yas-ink/50 mb-4">{DIAS[diaSel].tema}</p>
            <p className="font-body text-[10px] uppercase tracking-wide text-yas-ink/30 font-medium mb-3">
              Práticas do dia
            </p>
            <div className="flex flex-col gap-0">
              {DIAS[diaSel].praticas.map((pid, i) => {
                const p = PRATICAS[pid];
                return (
                  <button
                    key={pid}
                    onClick={() => irParaPratica(pid)}
                    className={`flex items-center gap-3 py-3 text-left active:bg-yas-ink/5 rounded-lg -mx-1 px-1 ${
                      i < DIAS[diaSel].praticas.length - 1 ? "border-b border-yas-ink/8" : ""
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: p.bg }}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm font-medium text-yas-ink">{p.nome}</p>
                      <p className="font-body text-xs text-yas-ink/40">{p.tempo} · {p.chakra}</p>
                    </div>
                    <span className="text-yas-ink/20 text-sm">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Aba Práticas ───────────────────────────────────────────────────────────
  function AbaPraticas() {
    if (praticaSel) {
      const p = PRATICAS[praticaSel];
      const idx = pracIds.indexOf(praticaSel);
      const prev = idx > 0 ? pracIds[idx - 1] : null;
      const next = idx < pracIds.length - 1 ? pracIds[idx + 1] : null;
      const qtdDias = DIAS.filter((d) => d.praticas.includes(praticaSel)).length;

      return (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setPraticaSel(null)}
            className="flex items-center gap-2 font-body text-xs text-yas-ink/40 self-start"
          >
            ← Todas as práticas
          </button>

          <div className="rounded-2xl bg-white border border-yas-ink/8 p-4">
            {/* cabeçalho */}
            <div className="flex items-start gap-3 pb-4 mb-4 border-b border-yas-ink/8">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: p.bg }}
              >
                {p.icon}
              </div>
              <div>
                <p className="font-display text-lg text-yas-ink font-semibold">{p.nome}</p>
                <p className="font-body text-sm text-yas-ink/50">
                  {p.tempo} · aparece {qtdDias} dias na semana
                </p>
              </div>
            </div>

            {/* objetivo */}
            <div className="mb-4">
              <p className="font-body text-[10px] uppercase tracking-wide text-yas-ink/30 font-medium mb-2">
                Objetivo
              </p>
              <p className="font-body text-sm text-yas-ink/80 leading-relaxed">{p.objetivo}</p>
              <span
                className="inline-flex items-center gap-1 font-body text-xs font-medium px-2.5 py-1 rounded-full mt-3"
                style={{ background: p.bg, color: p.textCor }}
              >
                ⚡ {p.chakra}
              </span>
            </div>

            {/* passos */}
            <div>
              <p className="font-body text-[10px] uppercase tracking-wide text-yas-ink/30 font-medium mb-3">
                Como fazer
              </p>
              <div className="flex flex-col gap-3">
                {p.passos.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
                      style={{ background: p.bg, color: p.textCor }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-body text-sm text-yas-ink leading-snug">{s.text}</p>
                      <p className="font-body text-xs text-yas-ink/50 mt-1 italic">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* navegação */}
            <div className="flex justify-between mt-4 pt-4 border-t border-yas-ink/8">
              {prev ? (
                <button
                  onClick={() => setPraticaSel(prev)}
                  className="flex items-center gap-1.5 font-body text-xs text-yas-ink/50 border border-yas-ink/15 rounded-lg px-3 py-1.5"
                >
                  ← {PRATICAS[prev].nome}
                </button>
              ) : <span />}
              {next ? (
                <button
                  onClick={() => setPraticaSel(next)}
                  className="flex items-center gap-1.5 font-body text-xs text-yas-ink/50 border border-yas-ink/15 rounded-lg px-3 py-1.5"
                >
                  {PRATICAS[next].nome} →
                </button>
              ) : <span />}
            </div>
          </div>
        </div>
      );
    }

    // lista de práticas
    return (
      <div className="flex flex-col gap-3">
        <p className="font-body text-xs text-yas-ink/40">
          {pracIds.length} práticas · toque para ver os detalhes
        </p>
        {pracIds.map((pid) => {
          const p = PRATICAS[pid];
          const qtdDias = DIAS.filter((d) => d.praticas.includes(pid)).length;
          return (
            <button
              key={pid}
              onClick={() => setPraticaSel(pid)}
              className="w-full flex items-center gap-3 bg-white border border-yas-ink/8 rounded-2xl px-4 py-3.5 text-left active:scale-95 transition-transform"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: p.bg }}
              >
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-yas-ink">{p.nome}</p>
                <p className="font-body text-xs text-yas-ink/50 mt-0.5">
                  {p.tempo} · {qtdDias}× por semana · {p.chakra}
                </p>
              </div>
              <span className="text-yas-ink/20 text-sm flex-shrink-0">→</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Render principal ───────────────────────────────────────────────────────
  const ABAS: { id: Aba; label: string }[] = [
    { id: "hoje",    label: "Hoje" },
    { id: "semana",  label: "Semana" },
    { id: "praticas",label: "Práticas" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* header */}
      <div>
        <h1 className="font-display text-2xl text-yas-burgundy font-semibold">Fluxo semanal</h1>
        <p className="font-body text-xs text-yas-ink/50 mt-0.5">
          Práticas espirituais · Matriz Kármica
        </p>
      </div>

      {/* tabs */}
      <div className="flex gap-1.5 bg-white border border-yas-ink/8 rounded-xl p-1">
        {ABAS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setAba(id); if (id !== "praticas") setPraticaSel(null); }}
            className={`flex-1 font-body text-xs font-medium py-2 rounded-lg transition-colors ${
              aba === id
                ? "text-white"
                : "text-yas-ink/50"
            }`}
            style={aba === id ? { background: "#0F6E56" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {/* conteúdo */}
      {aba === "hoje"     && <AbaHoje />}
      {aba === "semana"   && <AbaSemana />}
      {aba === "praticas" && <AbaPraticas />}
    </div>
  );
}
