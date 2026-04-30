"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { FONTE_PADRAO } from "@/types";
import type { Flashcard, Questao } from "@/types";

interface FonteInfo {
  fonte: string;
  total: number;
}

interface CardImport {
  fonte: string;
  bloco: string;
  frente: string;
  verso: string;
}

interface QuestaoImport {
  tema: string;
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  gabarito: string;
  justificativa: string;
  explicacoes?: Record<string, string>;
  fonte?: string;
  dificuldade?: string;
}

interface QuestaoEdit {
  id: string;
  tema: string;
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  gabarito: string;
  justificativa: string;
  explicacoes: Record<string, string>;
  fonte: string;
  dificuldade: string;
}

const TEMA_LABELS: Record<string, string> = {
  sus: "SUS & Legislação", tecnicas: "Técnicas", doencas: "Doenças",
  emergencias: "Urgência", mulher: "Saúde da Mulher", pediatria: "Saúde da Criança",
  bio: "Biossegurança", farma: "Farmacologia", mental: "Saúde Mental",
  idoso: "Saúde do Idoso", gestao: "Gestão & Auditoria",
};

const PAGE_SIZE = 20;

export default function AdminPage() {
  const [fontes, setFontes]         = useState<FonteInfo[]>([]);
  const [blocos, setBlocos]         = useState<string[]>([]);
  const [recentes, setRecentes]     = useState<Flashcard[]>([]);
  const [loading, setLoading]       = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [sucesso, setSucesso]       = useState(false);

  const [fonte, setFonte]   = useState(FONTE_PADRAO);
  const [bloco, setBloco]   = useState("");
  const [frente, setFrente] = useState("");
  const [verso, setVerso]   = useState("");

  // importação JSON — cards
  const [importCards, setImportCards]       = useState<CardImport[]>([]);
  const [importArquivos, setImportArquivos] = useState<{nome: string; total: number}[]>([]);
  const [importErro, setImportErro]         = useState("");
  const [importSalvando, setImportSalvando] = useState(false);
  const [importSucesso, setImportSucesso]   = useState(0);

  // importação JSON — questões
  const [importQuestoes, setImportQuestoes]   = useState<QuestaoImport[]>([]);
  const [importQArquivos, setImportQArquivos] = useState<{nome: string; total: number}[]>([]);
  const [importQErro, setImportQErro]         = useState("");
  const [importQSalvando, setImportQSalvando] = useState(false);
  const [importQSucesso, setImportQSucesso]   = useState(0);

  // questões viewer/editor
  const [questoesList, setQuestoesList]       = useState<Questao[]>([]);
  const [questoesTotal, setQuestoesTotal]     = useState(0);
  const [questoesTotalPorTema, setQuestoesTotalPorTema] = useState<Record<string, number>>({});
  const [questoesTema, setQuestoesTema]       = useState("todos");
  const [questoesPage, setQuestoesPage]       = useState(0);
  const [questoesLoading, setQuestoesLoading] = useState(false);
  const [questoesBusca, setQuestoesBusca]     = useState("");
  const [editandoId, setEditandoId]           = useState<string | null>(null);
  const [editForm, setEditForm]               = useState<QuestaoEdit | null>(null);
  const [editSalvando, setEditSalvando]       = useState(false);
  const [editSucesso, setEditSucesso]         = useState(false);
  const [deletandoId, setDeletandoId]         = useState<string | null>(null);
  const [abaSelecionada, setAbaSelecionada]   = useState<"cards" | "questoes">("cards");

  const supabase = createClient();

  async function carregar() {
    const { data: cards } = await supabase
      .from("flashcards").select("*").order("id", { ascending: false }).limit(10);
    if (cards) {
      setRecentes(cards);
      const fontesMap = new Map<string, number>();
      const blocosSet = new Set<string>();
      const { data: todos } = await supabase.from("flashcards").select("fonte, bloco");
      (todos ?? []).forEach((c) => {
        fontesMap.set(c.fonte, (fontesMap.get(c.fonte) ?? 0) + 1);
        blocosSet.add(c.bloco);
      });
      setFontes(
        Array.from(fontesMap.entries()).map(([f, t]) => ({ fonte: f, total: t }))
          .sort((a, b) => b.total - a.total)
      );
      setBlocos(Array.from(blocosSet).sort());
    }
    setLoading(false);
  }

  const carregarQuestoes = useCallback(async () => {
    setQuestoesLoading(true);
    const from = questoesPage * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    let q = supabase.from("questoes").select("*", { count: "exact" });
    if (questoesTema !== "todos") q = q.eq("tema", questoesTema);
    if (questoesBusca.trim()) q = q.ilike("enunciado", `%${questoesBusca.trim()}%`);

    const { data, count } = await q.order("tema").range(from, to);
    setQuestoesList((data as Questao[]) ?? []);
    setQuestoesTotal(count ?? 0);
    setQuestoesLoading(false);
  }, [supabase, questoesTema, questoesPage, questoesBusca]);

  const carregarTotaisPorTema = useCallback(async () => {
    const { data } = await supabase.from("questoes").select("tema");
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((r) => { map[r.tema] = (map[r.tema] ?? 0) + 1; });
      setQuestoesTotalPorTema(map);
    }
  }, [supabase]);

  useEffect(() => { carregar(); }, []);
  useEffect(() => {
    if (abaSelecionada === "questoes") {
      carregarQuestoes();
      carregarTotaisPorTema();
    }
  }, [abaSelecionada, carregarQuestoes, carregarTotaisPorTema]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fonte.trim() || !bloco.trim() || !frente.trim() || !verso.trim()) return;
    setSalvando(true);
    const { error } = await supabase.from("flashcards").insert({
      fonte: fonte.trim(),
      bloco: bloco.trim().toLowerCase().replace(/\s+/g, "_"),
      frente: frente.trim(),
      verso: verso.trim(),
    });
    if (!error) {
      setFrente(""); setVerso("");
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2000);
      await carregar();
    }
    setSalvando(false);
  }

  async function handleDeletar(id: string) {
    await supabase.from("flashcards").delete().eq("id", id);
    await carregar();
  }

  function handleArquivoJSON(e: React.ChangeEvent<HTMLInputElement>) {
    setImportErro(""); setImportCards([]); setImportArquivos([]); setImportSucesso(0);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const todos: CardImport[] = [];
    const resumo: {nome: string; total: number}[] = [];
    let lidos = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (!Array.isArray(parsed)) throw new Error(`${file.name}: deve ser um array JSON.`);
          const validos = parsed.filter((c) => typeof c.frente === "string" && typeof c.verso === "string");
          todos.push(...validos);
          resumo.push({ nome: file.name, total: validos.length });
        } catch (err) { setImportErro((err as Error).message); }
        lidos++;
        if (lidos === files.length) { setImportCards([...todos]); setImportArquivos([...resumo]); }
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  }

  async function handleImportar() {
    if (importCards.length === 0) return;
    setImportSalvando(true);
    const { error } = await supabase.from("flashcards").insert(
      importCards.map((c) => ({
        fonte: (c.fonte ?? FONTE_PADRAO).trim(),
        bloco: (c.bloco ?? "geral").trim().toLowerCase().replace(/\s+/g, "_"),
        frente: c.frente.trim(),
        verso:  c.verso.trim(),
      }))
    );
    if (!error) {
      setImportSucesso(importCards.length); setImportCards([]);
      await carregar();
    } else {
      setImportErro(`Erro ao salvar: ${error.message}`);
    }
    setImportSalvando(false);
  }

  function handleArquivoQuestoes(e: React.ChangeEvent<HTMLInputElement>) {
    setImportQErro(""); setImportQuestoes([]); setImportQArquivos([]); setImportQSucesso(0);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const todas: QuestaoImport[] = [];
    const resumo: {nome: string; total: number}[] = [];
    let lidos = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (!Array.isArray(parsed)) throw new Error(`${file.name}: deve ser um array JSON.`);
          const validas = parsed.filter(
            (q) => typeof q.tema === "string" && typeof q.enunciado === "string" &&
                   Array.isArray(q.alternativas) && q.alternativas.length >= 2 &&
                   typeof q.gabarito === "string" && typeof q.justificativa === "string"
          );
          todas.push(...validas);
          resumo.push({ nome: file.name, total: validas.length });
        } catch (err) { setImportQErro((err as Error).message); }
        lidos++;
        if (lidos === files.length) { setImportQuestoes([...todas]); setImportQArquivos([...resumo]); }
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  }

  async function handleImportarQuestoes() {
    if (importQuestoes.length === 0) return;
    setImportQSalvando(true);
    const { error } = await supabase.from("questoes").insert(
      importQuestoes.map((q) => ({
        tema: q.tema.trim(), enunciado: q.enunciado.trim(),
        alternativas: q.alternativas, gabarito: q.gabarito.trim().toUpperCase(),
        justificativa: q.justificativa.trim(), explicacoes: q.explicacoes ?? {},
        fonte: q.fonte?.trim() ?? null, dificuldade: q.dificuldade ?? "media",
      }))
    );
    if (!error) {
      setImportQSucesso(importQuestoes.length); setImportQuestoes([]);
      carregarTotaisPorTema();
    } else {
      setImportQErro(`Erro ao salvar: ${error.message}`);
    }
    setImportQSalvando(false);
  }

  function abrirEdicao(q: Questao) {
    setEditandoId(q.id);
    setEditForm({
      id:           q.id,
      tema:         q.tema,
      enunciado:    q.enunciado,
      alternativas: q.alternativas.map((a) => ({ ...a })),
      gabarito:     q.gabarito,
      justificativa: q.justificativa,
      explicacoes:  { ...(q.explicacoes ?? {}) },
      fonte:        q.fonte ?? "",
      dificuldade:  q.dificuldade ?? "media",
    });
  }

  async function salvarEdicao() {
    if (!editForm) return;
    setEditSalvando(true);
    const { error } = await supabase.from("questoes").update({
      tema:          editForm.tema.trim(),
      enunciado:     editForm.enunciado.trim(),
      alternativas:  editForm.alternativas,
      gabarito:      editForm.gabarito.trim().toUpperCase(),
      justificativa: editForm.justificativa.trim(),
      explicacoes:   editForm.explicacoes,
      fonte:         editForm.fonte.trim() || null,
      dificuldade:   editForm.dificuldade,
    }).eq("id", editForm.id);
    if (!error) {
      setEditSucesso(true);
      setTimeout(() => { setEditSucesso(false); setEditandoId(null); setEditForm(null); }, 1500);
      await carregarQuestoes();
    }
    setEditSalvando(false);
  }

  async function deletarQuestao(id: string) {
    setDeletandoId(id);
    await supabase.from("questoes").delete().eq("id", id);
    setDeletandoId(null);
    setEditandoId(null);
    await carregarQuestoes();
    await carregarTotaisPorTema();
  }

  function mudarFiltro(tema: string) {
    setQuestoesTema(tema);
    setQuestoesPage(0);
    setQuestoesBusca("");
  }

  const totalPages = Math.ceil(questoesTotal / PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-yas-burgundy border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="font-display text-2xl text-yas-burgundy font-semibold">Base de conhecimento</h1>
        <p className="font-body text-xs text-yas-ink/50 mt-0.5">gerencie cards e questões</p>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 border-b border-yas-ink/10">
        {(["cards", "questoes"] as const).map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaSelecionada(aba)}
            className={`pb-2 px-1 font-body text-sm font-semibold transition-colors border-b-2 ${
              abaSelecionada === aba
                ? "border-yas-burgundy text-yas-burgundy"
                : "border-transparent text-yas-ink/40"
            }`}
          >
            {aba === "cards" ? "📚 Flashcards" : "📝 Questões"}
          </button>
        ))}
      </div>

      {/* ══════════════ ABA CARDS ══════════════ */}
      {abaSelecionada === "cards" && (
        <>
          {/* fontes existentes */}
          <div className="rounded-xl bg-yas-ink/5 border border-yas-ink/10 p-4">
            <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide mb-3">
              Fontes ({fontes.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {fontes.map((f) => (
                <div key={f.fonte} className="flex items-center justify-between">
                  <span className="font-body text-sm text-yas-ink truncate pr-2">{f.fonte}</span>
                  <span className="shrink-0 font-body text-xs font-semibold text-yas-plum">
                    {f.total} card{f.total !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* importar JSON — cards */}
          <div className="rounded-xl border border-yas-plum/30 bg-yas-plum/5 p-4 flex flex-col gap-3">
            <div>
              <p className="font-body text-sm font-semibold text-yas-plum">Importar cards de arquivo JSON</p>
              <p className="font-body text-xs text-yas-ink/50 mt-0.5">
                Formato: array com fonte, bloco, frente, verso.
              </p>
            </div>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-yas-plum/40 hover:border-yas-plum/70 cursor-pointer transition-colors bg-white/40">
              <span className="text-lg">📂</span>
              <span className="font-body text-sm text-yas-plum font-medium">Escolher arquivos .json</span>
              <input type="file" accept=".json" multiple className="hidden" onChange={handleArquivoJSON} />
            </label>
            {importErro && <p className="font-body text-xs text-yas-terracotta font-semibold">{importErro}</p>}
            {importSucesso > 0 && (
              <p className="font-body text-xs text-green-700 font-semibold">
                ✓ {importSucesso} card{importSucesso !== 1 ? "s" : ""} importado{importSucesso !== 1 ? "s" : ""} com sucesso!
              </p>
            )}
            {importCards.length > 0 && (
              <div className="flex flex-col gap-2">
                {importArquivos.length > 1 && (
                  <div className="flex flex-col gap-1">
                    {importArquivos.map((a) => (
                      <div key={a.nome} className="flex justify-between items-center">
                        <span className="font-body text-xs text-yas-ink/60 truncate pr-2">{a.nome}</span>
                        <span className="font-body text-xs font-semibold text-yas-plum shrink-0">{a.total} cards</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide">
                  Preview — {importCards.length} card{importCards.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {importCards.slice(0, 20).map((c, i) => (
                    <div key={i} className="rounded-lg bg-white border border-yas-ink/10 p-2.5">
                      <p className="font-body text-[10px] text-yas-plum font-semibold uppercase tracking-wide">{c.fonte ?? "—"} · {c.bloco ?? "—"}</p>
                      <p className="font-body text-xs text-yas-ink mt-0.5 font-medium">{c.frente}</p>
                      <p className="font-body text-xs text-yas-ink/50 mt-0.5 line-clamp-1">{c.verso}</p>
                    </div>
                  ))}
                  {importCards.length > 20 && (
                    <p className="font-body text-xs text-yas-ink/40 text-center py-1">+ {importCards.length - 20} cards não exibidos</p>
                  )}
                </div>
                <button onClick={handleImportar} disabled={importSalvando}
                  className="w-full py-2.5 rounded-xl bg-yas-plum text-white font-body font-semibold text-sm active:scale-95 transition-all disabled:opacity-60">
                  {importSalvando ? "Salvando..." : `Salvar ${importCards.length} cards`}
                </button>
              </div>
            )}
          </div>

          {/* formulário adicionar card */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="font-body text-sm font-semibold text-yas-ink">Adicionar card</p>
            <div>
              <label className="font-body text-xs text-yas-ink/60 mb-1 block">Fonte</label>
              <input list="fontes-list" value={fonte} onChange={(e) => setFonte(e.target.value)}
                placeholder="Ex: Livro Fundamentos de Enfermagem Cap. 3"
                className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy" required />
              <datalist id="fontes-list">{fontes.map((f) => <option key={f.fonte} value={f.fonte} />)}</datalist>
            </div>
            <div>
              <label className="font-body text-xs text-yas-ink/60 mb-1 block">Bloco / tema</label>
              <input list="blocos-list" value={bloco} onChange={(e) => setBloco(e.target.value)}
                placeholder="Ex: anatomia, farmacologia, sus"
                className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy" required />
              <datalist id="blocos-list">{blocos.map((b) => <option key={b} value={b} />)}</datalist>
            </div>
            <div>
              <label className="font-body text-xs text-yas-ink/60 mb-1 block">Pergunta (frente)</label>
              <textarea value={frente} onChange={(e) => setFrente(e.target.value)}
                placeholder="O que é...? Qual a diferença entre...?" rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy resize-none" required />
            </div>
            <div>
              <label className="font-body text-xs text-yas-ink/60 mb-1 block">Resposta (verso)</label>
              <textarea value={verso} onChange={(e) => setVerso(e.target.value)}
                placeholder="Resposta completa e objetiva..." rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy resize-none" required />
            </div>
            <button type="submit" disabled={salvando}
              className="w-full py-3 rounded-xl bg-yas-burgundy text-white font-body font-semibold text-sm active:scale-95 transition-all disabled:opacity-60">
              {salvando ? "Salvando..." : sucesso ? "✓ Salvo!" : "Adicionar card"}
            </button>
          </form>

          {/* recentes */}
          {recentes.length > 0 && (
            <div>
              <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide mb-3">Últimos adicionados</p>
              <div className="flex flex-col gap-2">
                {recentes.map((c) => (
                  <div key={c.id} className="rounded-xl bg-white/60 border border-yas-ink/10 p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[10px] text-yas-plum font-semibold uppercase tracking-wide">{c.fonte} · {c.bloco}</p>
                      <p className="font-body text-sm text-yas-ink mt-0.5 truncate">{c.frente}</p>
                      <p className="font-body text-xs text-yas-ink/50 mt-0.5 line-clamp-2">{c.verso}</p>
                    </div>
                    <button onClick={() => handleDeletar(c.id)}
                      className="shrink-0 text-yas-terracotta/60 hover:text-yas-terracotta text-lg leading-none" aria-label="Deletar card">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════ ABA QUESTÕES ══════════════ */}
      {abaSelecionada === "questoes" && (
        <div className="flex flex-col gap-4">

          {/* importar questões JSON */}
          <div className="rounded-xl border border-yas-burgundy/30 bg-yas-burgundy/5 p-4 flex flex-col gap-3">
            <div>
              <p className="font-body text-sm font-semibold text-yas-burgundy">Importar questões (JSON)</p>
              <p className="font-body text-xs text-yas-ink/50 mt-0.5">
                Formato: array com tema, enunciado, alternativas, gabarito, justificativa.
              </p>
            </div>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-yas-burgundy/40 hover:border-yas-burgundy/70 cursor-pointer transition-colors bg-white/40">
              <span className="text-lg">📝</span>
              <span className="font-body text-sm text-yas-burgundy font-medium">Escolher arquivos .json</span>
              <input type="file" accept=".json" multiple className="hidden" onChange={handleArquivoQuestoes} />
            </label>
            {importQErro && <p className="font-body text-xs text-yas-terracotta font-semibold">{importQErro}</p>}
            {importQSucesso > 0 && (
              <p className="font-body text-xs text-green-700 font-semibold">
                ✓ {importQSucesso} questão{importQSucesso !== 1 ? "ões" : ""} importada{importQSucesso !== 1 ? "s" : ""}!
              </p>
            )}
            {importQuestoes.length > 0 && (
              <div className="flex flex-col gap-2">
                {importQArquivos.length > 1 && (
                  <div className="flex flex-col gap-1">
                    {importQArquivos.map((a) => (
                      <div key={a.nome} className="flex justify-between items-center">
                        <span className="font-body text-xs text-yas-ink/60 truncate pr-2">{a.nome}</span>
                        <span className="font-body text-xs font-semibold text-yas-burgundy shrink-0">{a.total} questões</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {importQuestoes.slice(0, 15).map((q, i) => (
                    <div key={i} className="rounded-lg bg-white border border-yas-ink/10 p-2.5">
                      <p className="font-body text-[10px] text-yas-burgundy font-semibold uppercase tracking-wide">{q.tema} · {q.gabarito}</p>
                      <p className="font-body text-xs text-yas-ink mt-0.5 line-clamp-1">{q.enunciado}</p>
                    </div>
                  ))}
                  {importQuestoes.length > 15 && (
                    <p className="font-body text-xs text-yas-ink/40 text-center py-1">+ {importQuestoes.length - 15} não exibidas</p>
                  )}
                </div>
                <button onClick={handleImportarQuestoes} disabled={importQSalvando}
                  className="w-full py-2.5 rounded-xl bg-yas-burgundy text-white font-body font-semibold text-sm active:scale-95 transition-all disabled:opacity-60">
                  {importQSalvando ? "Salvando..." : `Salvar ${importQuestoes.length} questões`}
                </button>
              </div>
            )}
          </div>

          {/* totais por tema */}
          <div className="rounded-xl bg-yas-ink/5 border border-yas-ink/10 p-4">
            <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide mb-2">
              Questões no banco — {Object.values(questoesTotalPorTema).reduce((a, b) => a + b, 0)} total
            </p>
            <div className="flex flex-col gap-1">
              {Object.entries(questoesTotalPorTema).sort((a, b) => b[1] - a[1]).map(([tema, n]) => (
                <div key={tema} className="flex items-center justify-between">
                  <span className="font-body text-xs text-yas-ink/70">{TEMA_LABELS[tema] ?? tema}</span>
                  <span className="font-body text-xs font-semibold text-yas-burgundy">{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* filtros e busca */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => mudarFiltro("todos")}
                className={`shrink-0 px-3 py-1.5 rounded-full font-body text-xs font-semibold transition-colors ${
                  questoesTema === "todos" ? "bg-yas-burgundy text-white" : "bg-yas-ink/10 text-yas-ink/60"}`}>
                Todos
              </button>
              {Object.keys(questoesTotalPorTema).sort().map((t) => (
                <button key={t} onClick={() => mudarFiltro(t)}
                  className={`shrink-0 px-3 py-1.5 rounded-full font-body text-xs font-semibold transition-colors ${
                    questoesTema === t ? "bg-yas-burgundy text-white" : "bg-yas-ink/10 text-yas-ink/60"}`}>
                  {TEMA_LABELS[t] ?? t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={questoesBusca}
                onChange={(e) => { setQuestoesBusca(e.target.value); setQuestoesPage(0); }}
                placeholder="Buscar no enunciado..."
                className="flex-1 px-3 py-2 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy"
              />
              <button onClick={carregarQuestoes}
                className="px-4 py-2 rounded-xl bg-yas-burgundy text-white font-body text-sm font-semibold active:scale-95">
                🔍
              </button>
            </div>
          </div>

          {/* lista de questões */}
          {questoesLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-yas-burgundy border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-body text-xs text-yas-ink/40">
                {questoesTotal} questão{questoesTotal !== 1 ? "ões" : ""} · página {questoesPage + 1}/{Math.max(1, totalPages)}
              </p>

              {questoesList.map((q) => {
                const editando = editandoId === q.id;
                return (
                  <div key={q.id}
                    className={`rounded-xl border overflow-hidden ${editando ? "border-yas-burgundy" : "border-yas-ink/10"}`}>

                    {/* header da questão */}
                    <div className="bg-white/60 p-3 flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body text-[10px] text-yas-burgundy font-semibold uppercase tracking-wide">
                            {TEMA_LABELS[q.tema] ?? q.tema}
                          </span>
                          <span className="font-body text-[10px] text-green-700 font-semibold">Gabarito: {q.gabarito}</span>
                          {q.fonte && <span className="font-body text-[10px] text-yas-ink/40 truncate">{q.fonte}</span>}
                        </div>
                        <p className="font-body text-sm text-yas-ink mt-1 leading-snug line-clamp-2">{q.enunciado}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => { if (editando) { setEditandoId(null); setEditForm(null); } else { abrirEdicao(q); } }}
                          className={`px-2.5 py-1 rounded-lg font-body text-xs font-semibold transition-colors ${
                            editando ? "bg-yas-ink/10 text-yas-ink/60" : "bg-yas-plum/10 text-yas-plum"}`}>
                          {editando ? "Fechar" : "Editar"}
                        </button>
                        <button
                          onClick={() => { if (confirm("Deletar esta questão?")) deletarQuestao(q.id); }}
                          disabled={deletandoId === q.id}
                          className="px-2.5 py-1 rounded-lg font-body text-xs font-semibold text-red-500 bg-red-50 transition-colors disabled:opacity-50">
                          {deletandoId === q.id ? "..." : "Deletar"}
                        </button>
                      </div>
                    </div>

                    {/* painel de edição */}
                    {editando && editForm && (
                      <div className="p-4 bg-yas-burgundy/5 border-t border-yas-burgundy/20 flex flex-col gap-4">
                        {editSucesso && (
                          <p className="font-body text-xs text-green-700 font-semibold">✓ Salvo com sucesso!</p>
                        )}

                        {/* tema + gabarito + dificuldade em linha */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="font-body text-[10px] text-yas-ink/60 mb-1 block uppercase tracking-wide">Tema</label>
                            <select
                              value={editForm.tema}
                              onChange={(e) => setEditForm({ ...editForm, tema: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg border border-yas-ink/20 bg-white font-body text-xs focus:outline-none focus:border-yas-burgundy">
                              {Object.entries(TEMA_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="font-body text-[10px] text-yas-ink/60 mb-1 block uppercase tracking-wide">Gabarito</label>
                            <select
                              value={editForm.gabarito}
                              onChange={(e) => setEditForm({ ...editForm, gabarito: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg border border-yas-ink/20 bg-white font-body text-xs focus:outline-none focus:border-yas-burgundy">
                              {["A","B","C","D","E"].map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="font-body text-[10px] text-yas-ink/60 mb-1 block uppercase tracking-wide">Dificuldade</label>
                            <select
                              value={editForm.dificuldade}
                              onChange={(e) => setEditForm({ ...editForm, dificuldade: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg border border-yas-ink/20 bg-white font-body text-xs focus:outline-none focus:border-yas-burgundy">
                              <option value="facil">Fácil</option>
                              <option value="media">Média</option>
                              <option value="dificil">Difícil</option>
                            </select>
                          </div>
                        </div>

                        {/* enunciado */}
                        <div>
                          <label className="font-body text-[10px] text-yas-ink/60 mb-1 block uppercase tracking-wide">Enunciado</label>
                          <textarea
                            value={editForm.enunciado}
                            onChange={(e) => setEditForm({ ...editForm, enunciado: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy resize-none"
                          />
                        </div>

                        {/* alternativas */}
                        <div>
                          <label className="font-body text-[10px] text-yas-ink/60 mb-1 block uppercase tracking-wide">Alternativas</label>
                          <div className="flex flex-col gap-2">
                            {editForm.alternativas.map((alt, idx) => (
                              <div key={alt.letra} className="flex items-start gap-2">
                                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1 ${
                                  alt.letra === editForm.gabarito ? "bg-green-500 text-white" : "bg-yas-ink/10 text-yas-ink/60"}`}>
                                  {alt.letra}
                                </span>
                                <textarea
                                  value={alt.texto}
                                  onChange={(e) => {
                                    const novas = [...editForm.alternativas];
                                    novas[idx] = { ...alt, texto: e.target.value };
                                    setEditForm({ ...editForm, alternativas: novas });
                                  }}
                                  rows={2}
                                  className="flex-1 px-2 py-1.5 rounded-lg border border-yas-ink/20 bg-white font-body text-xs focus:outline-none focus:border-yas-burgundy resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* justificativa */}
                        <div>
                          <label className="font-body text-[10px] text-yas-ink/60 mb-1 block uppercase tracking-wide">Justificativa (gabarito correto)</label>
                          <textarea
                            value={editForm.justificativa}
                            onChange={(e) => setEditForm({ ...editForm, justificativa: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy resize-none"
                          />
                        </div>

                        {/* fonte */}
                        <div>
                          <label className="font-body text-[10px] text-yas-ink/60 mb-1 block uppercase tracking-wide">Fonte</label>
                          <input
                            value={editForm.fonte}
                            onChange={(e) => setEditForm({ ...editForm, fonte: e.target.value })}
                            placeholder="Ex: Edital 001/2026 — UNIOESTE"
                            className="w-full px-3 py-2 rounded-lg border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={salvarEdicao}
                            disabled={editSalvando}
                            className="flex-1 py-2.5 rounded-xl bg-yas-burgundy text-white font-body font-semibold text-sm active:scale-95 transition-all disabled:opacity-60">
                            {editSalvando ? "Salvando..." : "Salvar alterações"}
                          </button>
                          <button
                            onClick={() => { setEditandoId(null); setEditForm(null); }}
                            className="px-4 py-2.5 rounded-xl border border-yas-ink/20 text-yas-ink/60 font-body text-sm font-semibold active:scale-95 transition-all">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setQuestoesPage((p) => Math.max(0, p - 1))}
                    disabled={questoesPage === 0}
                    className="px-4 py-2 rounded-xl border border-yas-ink/20 font-body text-sm text-yas-ink/60 disabled:opacity-30 active:scale-95">
                    ← Anterior
                  </button>
                  <span className="font-body text-xs text-yas-ink/40">
                    {questoesPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setQuestoesPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={questoesPage >= totalPages - 1}
                    className="px-4 py-2 rounded-xl border border-yas-ink/20 font-body text-sm text-yas-ink/60 disabled:opacity-30 active:scale-95">
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
