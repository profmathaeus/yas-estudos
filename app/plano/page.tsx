"use client";

import { useState, useEffect } from "react";
import { format, addDays, parseISO, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient, STUDY_USER_ID } from "@/lib/supabase";

const INICIO = new Date("2026-04-12");
const PROVA  = new Date("2026-05-10");

interface DiaPlano {
  data: Date;
  semana: number;
  bloco: string;
  blocoColor: string;
  objetivo: string;
  conteudo: string;
}

const DIAS_PLANO: DiaPlano[] = [
  // Semana 1
  { data: addDays(INICIO, 0),  semana: 1, bloco: "sus",        blocoColor: "#5B4A7E", objetivo: "Base do SUS", conteudo: "Princípios doutrinários, diretrizes organizativas, Leis 8.080/90 e 8.142/90" },
  { data: addDays(INICIO, 1),  semana: 1, bloco: "sus",        blocoColor: "#5B4A7E", objetivo: "Legislação profissional", conteudo: "Lei 7.498/86, Decreto 94.406/87, ESF, PNAB, equidade vs igualdade" },
  { data: addDays(INICIO, 2),  semana: 1, bloco: "tecnicas",   blocoColor: "#B89FD4", objetivo: "Sinais vitais", conteudo: "Temperatura, FC, FR, PA — valores normais e alterações" },
  { data: addDays(INICIO, 3),  semana: 1, bloco: "tecnicas",   blocoColor: "#B89FD4", objetivo: "Técnicas de administração", conteudo: "9 certos, vias de adm. (IM/SC/IV/ID), ângulos e volumes" },
  { data: addDays(INICIO, 4),  semana: 1, bloco: "tecnicas",   blocoColor: "#B89FD4", objetivo: "Cálculos e procedimentos", conteudo: "Gotejamento, microgotas, sonda nasogástrica, balanço hídrico" },
  { data: addDays(INICIO, 5),  semana: 1, bloco: "tecnicas",   blocoColor: "#B89FD4", objetivo: "Higiene e assepsia", conteudo: "5 momentos da higiene das mãos, posições terapêuticas (Fowler)" },
  { data: addDays(INICIO, 6),  semana: 1, bloco: "sus",        blocoColor: "#5B4A7E", objetivo: "Revisão S1", conteudo: "Todos os cards SUS + Técnicas. Simulado 10 questões." },

  // Semana 2
  { data: addDays(INICIO, 7),  semana: 2, bloco: "doencas",    blocoColor: "#C8876A", objetivo: "ISTs", conteudo: "HIV (janela imunológica, transmissão), sífilis (estágios, tratamento)" },
  { data: addDays(INICIO, 8),  semana: 2, bloco: "doencas",    blocoColor: "#C8876A", objetivo: "Hepatites & arboviroses", conteudo: "Hepatites A/B/C, dengue (sinais de alarme), Aedes aegypti" },
  { data: addDays(INICIO, 9),  semana: 2, bloco: "doencas",    blocoColor: "#C8876A", objetivo: "Epidemiologia", conteudo: "Incidência vs prevalência, doenças de notificação, TB bacilífera" },
  { data: addDays(INICIO, 10), semana: 2, bloco: "emergencias", blocoColor: "#8B1D3A", objetivo: "BLS e RCP", conteudo: "Sequência C-A-B, frequência/profundidade das compressões, DEA" },
  { data: addDays(INICIO, 11), semana: 2, bloco: "emergencias", blocoColor: "#8B1D3A", objetivo: "Trauma e queimaduras", conteudo: "Classificação de queimaduras, Regra dos 9, primeiros cuidados" },
  { data: addDays(INICIO, 12), semana: 2, bloco: "mulher",     blocoColor: "#F5F5A0", objetivo: "Saúde da mulher", conteudo: "Pré-natal (6 consultas), pré-eclâmpsia, eclâmpsia, períodos do parto" },
  { data: addDays(INICIO, 13), semana: 2, bloco: "mulher",     blocoColor: "#F5F5A0", objetivo: "Saúde da criança + Revisão S2", conteudo: "Aleitamento, teste do pézinho, marcos do desenvolvimento, desidratação. Simulado 20q." },

  // Semana 3
  { data: addDays(INICIO, 14), semana: 3, bloco: "bio",        blocoColor: "#5B8A7E", objetivo: "Precauções e EPI", conteudo: "Aerossol/gotícula/contato, ordem colocar/retirar EPI" },
  { data: addDays(INICIO, 15), semana: 3, bloco: "bio",        blocoColor: "#5B8A7E", objetivo: "Esterilização e infecção", conteudo: "Esterilização vs desinfecção, artigos críticos/semi/não-críticos" },
  { data: addDays(INICIO, 16), semana: 3, bloco: "farma",      blocoColor: "#9B84C4", objetivo: "Farmacologia básica", conteudo: "Interações medicamentosas, polifarmácia, anticoncepção de emergência" },
  { data: addDays(INICIO, 17), semana: 3, bloco: "farma",      blocoColor: "#9B84C4", objetivo: "PNI — Calendário vacinal", conteudo: "BCG, Hepatite B, Febre Amarela, via intradérmica, fórmula microgotas" },
  { data: addDays(INICIO, 18), semana: 3, bloco: "mental",     blocoColor: "#7B6A9E", objetivo: "Saúde mental — legislação", conteudo: "Lei 10.216/01, tipos de CAPS (I, II, III, AD, IJ)" },
  { data: addDays(INICIO, 19), semana: 3, bloco: "mental",     blocoColor: "#7B6A9E", objetivo: "Transtornos e saúde do trabalho", conteudo: "Depressão maior, esquizofrenia, delirium vs demência, DORT/LER" },
  { data: addDays(INICIO, 20), semana: 3, bloco: "idoso",      blocoColor: "#D4A08A", objetivo: "Saúde do idoso + Revisão S3", conteudo: "Polifarmácia, quedas, AGA, hipotensão ortostática, abuso de idoso. Revisão geral." },

  // Semana 4
  { data: addDays(INICIO, 21), semana: 4, bloco: "sus",        blocoColor: "#5B4A7E", objetivo: "Simulado 40 questões", conteudo: "Todos os blocos — identificar pontos fracos" },
  { data: addDays(INICIO, 22), semana: 4, bloco: "tecnicas",   blocoColor: "#B89FD4", objetivo: "Revisão intensiva — erros", conteudo: "Focar nos cards com última avaliação 'errou' e nos blocos com menor % acerto" },
  { data: addDays(INICIO, 23), semana: 4, bloco: "doencas",    blocoColor: "#C8876A", objetivo: "Revisão — Doenças & Bio", conteudo: "ISTs, epidemiologia, precauções, EPI" },
  { data: addDays(INICIO, 24), semana: 4, bloco: "emergencias", blocoColor: "#8B1D3A", objetivo: "Revisão — Emergências & Técnicas", conteudo: "BLS, queimaduras, cálculos, sinais vitais" },
  { data: addDays(INICIO, 25), semana: 4, bloco: "mulher",     blocoColor: "#F5F5A0", objetivo: "Revisão — Mulher, Farma, Mental", conteudo: "Pré-natal, parto, PNI, CAPS" },
  { data: addDays(INICIO, 26), semana: 4, bloco: "idoso",      blocoColor: "#D4A08A", objetivo: "Simulado final 50 questões", conteudo: "Simulado cronometrado — todos os temas" },
  { data: addDays(INICIO, 27), semana: 4, bloco: "sus",        blocoColor: "#5B4A7E", objetivo: "Véspera da prova", conteudo: "Revisão leve dos cards mais difíceis. Dormir cedo. Você está preparada! 💜" },
];

export default function PlanoPage() {
  const [semana, setSemana]         = useState(1);
  const [tarefasFeitas, setTarefas] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    supabase.from("tarefas_usuario")
      .select("tarefa_id")
      .eq("user_id", STUDY_USER_ID)
      .eq("concluida", true)
      .then(({ data }) => {
        if (data) setTarefas(new Set(data.map((d) => d.tarefa_id)));
      });
  }, [supabase]);

  const diasDaSemana = DIAS_PLANO.filter((d) => d.semana === semana);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasRestantes = Math.max(
    0,
    Math.ceil((PROVA.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-yas-burgundy font-semibold">Plano 28 dias</h1>
          <p className="font-body text-xs text-yas-ink/50 mt-0.5">12/04 → 10/05/2026</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-yas-burgundy font-semibold leading-none">
            {diasRestantes}
          </p>
          <p className="font-body text-xs text-yas-ink/50">dias para a prova</p>
        </div>
      </div>

      {/* abas de semana */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSemana(s)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-body font-semibold border transition-colors ${
              semana === s
                ? "bg-yas-burgundy text-white border-yas-burgundy"
                : "bg-transparent text-yas-ink/50 border-yas-ink/20"
            }`}
          >
            S{s}
          </button>
        ))}
      </div>

      {/* grade de dias */}
      <div className="flex flex-col gap-3">
        {diasDaSemana.map((dia) => {
          const diaHoje    = isToday(dia.data);
          const diaPassed  = isPast(dia.data) && !diaHoje;
          const dataStr    = format(dia.data, "yyyy-MM-dd");
          const dataLabel  = format(dia.data, "EEE d/MM", { locale: ptBR });

          return (
            <div
              key={dataStr}
              className={`rounded-xl border p-4 transition-all ${
                diaHoje
                  ? "border-yas-burgundy bg-yas-burgundy/5 ring-1 ring-yas-burgundy/30"
                  : diaPassed
                  ? "border-yas-ink/10 bg-white/40 opacity-70"
                  : "border-yas-ink/10 bg-white/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* cor do bloco */}
                  <span
                    className="shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                    style={{ backgroundColor: dia.blocoColor }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-body text-xs text-yas-ink/50 capitalize">
                        {dataLabel}
                      </p>
                      {diaHoje && (
                        <span className="text-[10px] font-body font-semibold uppercase tracking-wide text-yas-burgundy bg-yas-burgundy/10 px-1.5 py-0.5 rounded-full">
                          hoje
                        </span>
                      )}
                    </div>
                    <p className="font-body font-semibold text-sm text-yas-ink mt-0.5">
                      {dia.objetivo}
                    </p>
                    <p className="font-body text-xs text-yas-ink/60 mt-0.5 leading-relaxed">
                      {dia.conteudo}
                    </p>
                  </div>
                </div>
                {diaPassed && (
                  <span className="shrink-0 text-lg">✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
