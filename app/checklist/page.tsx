"use client";

import { useState, useEffect } from "react";
import { createClient, STUDY_USER_ID } from "@/lib/supabase";
import { ProgressBar } from "@/components/ProgressBar";
import type { TarefaComStatus } from "@/types";

const SEMANAS = ["S1", "S2", "S3", "S4"] as const;
const SEMANA_LABELS: Record<string, string> = {
  S1: "Semana 1 — SUS, Técnicas",
  S2: "Semana 2 — Doenças, Emergências, Mulher",
  S3: "Semana 3 — Bio, Farma, Mental, Idoso",
  S4: "Semana 4 — Revisão & Simulados",
};

export default function ChecklistPage() {
  const [tarefas, setTarefas]   = useState<TarefaComStatus[]>([]);
  const [loading, setLoading]   = useState(true);
  const [semana, setSemana]     = useState<string>("S1");
  const supabase = createClient();

  useEffect(() => {
    async function carregar() {
      const { data: ts } = await supabase.from("tarefas").select("*").order("ordem");
      const { data: us } = await supabase
        .from("tarefas_usuario")
        .select("*")
        .eq("user_id", STUDY_USER_ID);

      const mapa = new Map((us ?? []).map((u) => [u.tarefa_id, u]));
      const combinadas: TarefaComStatus[] = (ts ?? []).map((t) => ({
        ...t,
        concluida:    mapa.get(t.id)?.concluida ?? false,
        concluida_em: mapa.get(t.id)?.concluida_em ?? null,
      }));
      setTarefas(combinadas);
      setLoading(false);
    }
    carregar();
  }, [supabase]);

  async function toggleTarefa(id: string, atual: boolean) {
    const nova = !atual;
    setTarefas((ts) =>
      ts.map((t) => t.id === id ? { ...t, concluida: nova, concluida_em: nova ? new Date().toISOString() : null } : t)
    );
    await supabase.from("tarefas_usuario").upsert({
      user_id:      STUDY_USER_ID,
      tarefa_id:    id,
      concluida:    nova,
      concluida_em: nova ? new Date().toISOString() : null,
    }, { onConflict: "user_id,tarefa_id" });
  }

  const tarefasDaSemana = tarefas.filter((t) => t.semana === semana);
  const concluidasSemana = tarefasDaSemana.filter((t) => t.concluida).length;
  const totalGeral = tarefas.length;
  const concluidasGeral = tarefas.filter((t) => t.concluida).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-yas-burgundy border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl text-yas-burgundy font-semibold">Tarefas</h1>
        <p className="font-body text-xs text-yas-ink/50 mt-0.5">plano de 28 dias</p>
      </div>

      {/* progresso geral */}
      <ProgressBar
        value={concluidasGeral}
        max={totalGeral}
        label={`${concluidasGeral}/${totalGeral} tarefas concluídas`}
        colorClass="bg-yas-burgundy"
      />

      {/* abas de semana */}
      <div className="flex gap-2">
        {SEMANAS.map((s) => {
          const ts = tarefas.filter((t) => t.semana === s);
          const done = ts.filter((t) => t.concluida).length;
          return (
            <button
              key={s}
              onClick={() => setSemana(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-body font-semibold border transition-colors ${
                semana === s
                  ? "bg-yas-burgundy text-white border-yas-burgundy"
                  : "bg-transparent text-yas-ink/50 border-yas-ink/20"
              }`}
            >
              {s}
              <span className="block text-[10px] font-normal opacity-70">
                {done}/{ts.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* título da semana */}
      <div>
        <h2 className="font-display text-lg text-yas-plum font-semibold">
          {SEMANA_LABELS[semana]}
        </h2>
        <ProgressBar
          value={concluidasSemana}
          max={tarefasDaSemana.length}
          colorClass="bg-yas-plum"
        />
      </div>

      {/* lista de tarefas */}
      <ul className="flex flex-col gap-2">
        {tarefasDaSemana.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => toggleTarefa(t.id, t.concluida)}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${
                t.concluida
                  ? "bg-yas-yellow/20 border-yas-yellow/40"
                  : "bg-white/60 border-yas-ink/10"
              }`}
            >
              <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                t.concluida
                  ? "bg-yas-burgundy border-yas-burgundy text-white"
                  : "border-yas-ink/20"
              }`}>
                {t.concluida && "✓"}
              </span>
              <span className={`font-body text-sm leading-snug ${
                t.concluida ? "line-through text-yas-ink/40" : "text-yas-ink"
              }`}>
                {t.descricao}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
