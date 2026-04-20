"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { FONTE_PADRAO } from "@/types";
import type { Flashcard } from "@/types";

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

  // importação JSON
  const [importCards, setImportCards]       = useState<CardImport[]>([]);
  const [importErro, setImportErro]         = useState("");
  const [importSalvando, setImportSalvando] = useState(false);
  const [importSucesso, setImportSucesso]   = useState(0);

  const supabase = createClient();

  async function carregar() {
    const { data: cards } = await supabase
      .from("flashcards")
      .select("*")
      .order("id", { ascending: false })
      .limit(10);

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

  useEffect(() => { carregar(); }, []);

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
      setFrente("");
      setVerso("");
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
    setImportErro("");
    setImportCards([]);
    setImportSucesso(0);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("O arquivo deve conter um array JSON.");
        const validos = parsed.filter(
          (c) => typeof c.frente === "string" && typeof c.verso === "string"
        );
        if (validos.length === 0) throw new Error("Nenhum card válido encontrado. Verifique o formato.");
        setImportCards(validos);
      } catch (err) {
        setImportErro((err as Error).message);
      }
    };
    reader.readAsText(file);
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
      setImportSucesso(importCards.length);
      setImportCards([]);
      await carregar();
    } else {
      setImportErro(`Erro ao salvar: ${error.message}`);
    }
    setImportSalvando(false);
  }

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
        <p className="font-body text-xs text-yas-ink/50 mt-0.5">adicione cards de qualquer fonte</p>
      </div>

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

      {/* importar JSON */}
      <div className="rounded-xl border border-yas-plum/30 bg-yas-plum/5 p-4 flex flex-col gap-3">
        <div>
          <p className="font-body text-sm font-semibold text-yas-plum">Importar cards de arquivo JSON</p>
          <p className="font-body text-xs text-yas-ink/50 mt-0.5">
            Envie um arquivo gerado pelo Claude. Formato: array com fonte, bloco, frente, verso.
          </p>
        </div>

        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-yas-plum/40 hover:border-yas-plum/70 cursor-pointer transition-colors bg-white/40">
          <span className="text-lg">📂</span>
          <span className="font-body text-sm text-yas-plum font-medium">Escolher arquivo .json</span>
          <input type="file" accept=".json" className="hidden" onChange={handleArquivoJSON} />
        </label>

        {importErro && (
          <p className="font-body text-xs text-yas-terracotta font-semibold">{importErro}</p>
        )}

        {importSucesso > 0 && (
          <p className="font-body text-xs text-green-700 font-semibold">
            ✓ {importSucesso} card{importSucesso !== 1 ? "s" : ""} importado{importSucesso !== 1 ? "s" : ""} com sucesso!
          </p>
        )}

        {importCards.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide">
              Preview — {importCards.length} card{importCards.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
              {importCards.map((c, i) => (
                <div key={i} className="rounded-lg bg-white border border-yas-ink/10 p-2.5">
                  <p className="font-body text-[10px] text-yas-plum font-semibold uppercase tracking-wide">
                    {c.fonte ?? "—"} · {c.bloco ?? "—"}
                  </p>
                  <p className="font-body text-xs text-yas-ink mt-0.5 font-medium">{c.frente}</p>
                  <p className="font-body text-xs text-yas-ink/50 mt-0.5 line-clamp-2">{c.verso}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleImportar}
              disabled={importSalvando}
              className="w-full py-2.5 rounded-xl bg-yas-plum text-white font-body font-semibold text-sm active:scale-95 transition-all disabled:opacity-60"
            >
              {importSalvando ? "Salvando..." : `Salvar ${importCards.length} cards`}
            </button>
          </div>
        )}
      </div>

      {/* formulário */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="font-body text-sm font-semibold text-yas-ink">Adicionar card</p>

        {/* fonte */}
        <div>
          <label className="font-body text-xs text-yas-ink/60 mb-1 block">Fonte</label>
          <input
            list="fontes-list"
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            placeholder="Ex: Livro Fundamentos de Enfermagem Cap. 3"
            className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy"
            required
          />
          <datalist id="fontes-list">
            {fontes.map((f) => <option key={f.fonte} value={f.fonte} />)}
          </datalist>
        </div>

        {/* bloco */}
        <div>
          <label className="font-body text-xs text-yas-ink/60 mb-1 block">
            Bloco / tema <span className="opacity-50">(use snake_case sem espaços)</span>
          </label>
          <input
            list="blocos-list"
            value={bloco}
            onChange={(e) => setBloco(e.target.value)}
            placeholder="Ex: anatomia, farmacologia, sus"
            className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy"
            required
          />
          <datalist id="blocos-list">
            {blocos.map((b) => <option key={b} value={b} />)}
          </datalist>
        </div>

        {/* frente */}
        <div>
          <label className="font-body text-xs text-yas-ink/60 mb-1 block">Pergunta (frente)</label>
          <textarea
            value={frente}
            onChange={(e) => setFrente(e.target.value)}
            placeholder="O que é...? Qual a diferença entre...?"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy resize-none"
            required
          />
        </div>

        {/* verso */}
        <div>
          <label className="font-body text-xs text-yas-ink/60 mb-1 block">Resposta (verso)</label>
          <textarea
            value={verso}
            onChange={(e) => setVerso(e.target.value)}
            placeholder="Resposta completa e objetiva..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-yas-ink/20 bg-white font-body text-sm focus:outline-none focus:border-yas-burgundy resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="w-full py-3 rounded-xl bg-yas-burgundy text-white font-body font-semibold text-sm active:scale-95 transition-all disabled:opacity-60"
        >
          {salvando ? "Salvando..." : sucesso ? "✓ Salvo!" : "Adicionar card"}
        </button>
      </form>

      {/* recentes */}
      {recentes.length > 0 && (
        <div>
          <p className="font-body text-xs font-semibold text-yas-ink/60 uppercase tracking-wide mb-3">
            Últimos adicionados
          </p>
          <div className="flex flex-col gap-2">
            {recentes.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-white/60 border border-yas-ink/10 p-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[10px] text-yas-plum font-semibold uppercase tracking-wide">
                    {c.fonte} · {c.bloco}
                  </p>
                  <p className="font-body text-sm text-yas-ink mt-0.5 truncate">{c.frente}</p>
                  <p className="font-body text-xs text-yas-ink/50 mt-0.5 line-clamp-2">{c.verso}</p>
                </div>
                <button
                  onClick={() => handleDeletar(c.id)}
                  className="shrink-0 text-yas-terracotta/60 hover:text-yas-terracotta text-lg leading-none"
                  aria-label="Deletar card"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
