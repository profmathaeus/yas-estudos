export type Avaliacao = "errou" | "dificil" | "facil";

export interface Flashcard {
  id: string;
  bloco: string;
  frente: string;
  verso: string;
  fonte: string;
}

export const FONTE_PADRAO = "Enfermeiro I — São Miguel do Iguaçu 2026";

export interface CardProgress {
  id: string;
  user_id: string;
  card_id: string;
  intervalo: number;
  repeticoes: number;
  fator_facilidade: number;
  proxima_revisao: string;
  ultima_avaliacao: Avaliacao | null;
  updated_at: string;
}

export interface CardComProgresso extends Flashcard {
  progresso: CardProgress | null;
}

export interface Sessao {
  id: string;
  user_id: string;
  data: string;
  cards_estudados: number;
  cards_acertados: number;
}

export interface Tarefa {
  id: string;
  semana: string;
  descricao: string;
  ordem: number;
}

export interface TarefaUsuario {
  user_id: string;
  tarefa_id: string;
  concluida: boolean;
  concluida_em: string | null;
}

export interface TarefaComStatus extends Tarefa {
  concluida: boolean;
  concluida_em: string | null;
}

export type BlocoKey =
  | "sus"
  | "tecnicas"
  | "doencas"
  | "emergencias"
  | "mulher"
  | "bio"
  | "farma"
  | "mental"
  | "idoso";

export const BLOCO_LABELS: Record<BlocoKey, string> = {
  sus:        "SUS & Legislação",
  tecnicas:   "Técnicas de Enfermagem",
  doencas:    "Doenças & Epidemiologia",
  emergencias:"Emergências",
  mulher:     "Saúde da Mulher & Criança",
  bio:        "Biossegurança & Infecção",
  farma:      "Farmacologia & PNI",
  mental:     "Saúde Mental & CAPS",
  idoso:      "Idoso & Geriátrico",
};

export const BLOCO_COLORS: Record<BlocoKey, string> = {
  sus:        "bg-bloco-sus text-white",
  tecnicas:   "bg-bloco-tecnicas text-yas-ink",
  doencas:    "bg-bloco-doencas text-white",
  emergencias:"bg-bloco-emergencias text-white",
  mulher:     "bg-bloco-mulher text-yas-ink",
  bio:        "bg-bloco-bio text-white",
  farma:      "bg-bloco-farma text-white",
  mental:     "bg-bloco-mental text-white",
  idoso:      "bg-bloco-idoso text-white",
};
