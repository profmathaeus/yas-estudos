# YAS Estudos — Design Spec
**Data:** 2026-04-17  
**Prova:** 10/05/2026 (Enfermeiro I — Prefeitura de São Miguel do Iguaçu/PR)  
**Stack:** Next.js 14 (App Router) · Supabase · Tailwind CSS · Shadcn/ui · Vercel

---

## 1. Contexto

Aplicativo web pessoal de estudos para concurso público de Enfermagem. Uso exclusivo de 1 usuário (Yasmine). Sem autenticação — `FIXED_USER_ID` hardcoded via variável de ambiente. Dados sincronizados via Supabase para acesso em celular e computador.

O coração do app é o algoritmo SM-2 de repetição espaçada — flashcards que aparecem na frequência certa para maximizar retenção.

---

## 2. Arquitetura

### Approach escolhido
Next.js 14 App Router + Supabase client-side (`createBrowserClient`). UUID fixo em `NEXT_PUBLIC_STUDY_USER_ID`. Sem RLS, sem auth.

### Estrutura de pastas

```
/app
  layout.tsx            — fontes YAS, providers, seed na primeira visita
  page.tsx              — redirect → /flashcards
  /flashcards/page.tsx  — sessão SM-2 (prioridade máxima)
  /plano/page.tsx       — calendário 28 dias
  /checklist/page.tsx   — tarefas com progresso
  /stats/page.tsx       — dashboard de desempenho

/components
  FlashCard.tsx         — flip 3D, frente/verso, 3 botões de avaliação
  Timer.tsx             — Pomodoro 25min, widget flutuante em /flashcards
  CalendarGrid.tsx      — grade 28 dias com cores por bloco
  ProgressBar.tsx       — barra de progresso reutilizável
  BottomNav.tsx         — navegação mobile (Cards, Plano, Checklist, Stats)

/lib
  supabase.ts           — createBrowserClient + FIXED_USER_ID
  sm2.ts                — algoritmo SM-2 puro (função sem I/O)
  seed.ts               — 76 cards + 36 tarefas, roda 1x se banco vazio

/types/index.ts
```

### Navegação
Bottom nav mobile com 4 abas fixas. Sem sidebar. Pomodoro como widget flutuante dentro de `/flashcards`, não em rota separada.

---

## 3. Funcionalidade principal — Flashcards SM-2

### Fluxo da sessão

1. Ao montar `/flashcards`: busca `card_progress` onde `proxima_revisao <= hoje` para o `FIXED_USER_ID`
2. Cards sem progresso (nunca estudados) também entram na fila com valores default
3. Exibe frente do card (pergunta)
4. Usuário toca → flip 3D (CSS `rotateY(180deg)`, 500ms)
5. Exibe verso + 3 botões de avaliação
6. `sm2(card, avaliação)` → retorna `CardState` atualizado
7. Upsert assíncrono no Supabase (não bloqueia UI)
8. "Não lembrei" → card reinserido no final da `sessionQueue`
9. Sessão encerra quando `sessionQueue` está vazia

### Algoritmo SM-2 (`lib/sm2.ts`)

```typescript
interface CardState {
  intervalo: number        // dias
  repeticoes: number
  fatorFacilidade: number  // 1.3 – 2.5, default 2.5
  proximaRevisao: string   // ISO date
}

type Avaliacao = 'errou' | 'dificil' | 'facil'

function calcularProximaRevisao(card: CardState, av: Avaliacao): CardState
```

**Regras (pseudocódigo explícito):**

```
errou:
  repeticoes = 0
  intervalo = 0  (reaparece na mesma sessão — não avança proxima_revisao)
  EF = max(1.3, EF - 0.2)
  proxima_revisao = hoje  (volta à fila imediatamente)

dificil:
  novoIntervalo = rep==0 ? 1 : rep==1 ? 3 : round(intervalo * EF)
  EF = max(1.3, EF - 0.15)
  repeticoes += 1
  intervalo = novoIntervalo
  proxima_revisao = hoje + novoIntervalo dias

facil:
  novoIntervalo = rep==0 ? 1 : rep==1 ? 3 : round(intervalo * EF)
  EF = min(2.5, EF + 0.1)
  repeticoes += 1
  intervalo = novoIntervalo
  proxima_revisao = hoje + novoIntervalo dias
```

`EF` é sempre clamped para [1.3, 2.5] dentro da função. `intervalo` nunca fica negativo.

**Nota:** `dificil` e `facil` usam a mesma fórmula de intervalo — a diferença é intencional. O que os distingue é o efeito sobre `EF`: dificil penaliza (-0.15) enquanto facil recompensa (+0.1), impactando todos os intervalos futuros. A progressão 1d→3d→EF×intervalo é igual para ambos.

**Validação interna do SM-2:** A função `calcularProximaRevisao` é responsável por clampar `EF` em [1.3, 2.5] e garantir `intervalo >= 1` (exceto em `errou` onde intervalo = 0). Dados de entrada já vêm do Supabase ou dos defaults — sem validação extra necessária para um app pessoal com conteúdo 100% seedado.

`ultima_avaliacao`: armazena a string `'errou' | 'dificil' | 'facil'` da última avaliação — usado somente para exibir no stats (cor do card na grade de histórico).

### Offline fallback
`sessionQueue` vive em memória React durante a sessão. Se upsert Supabase falhar, o card avança na UI — erro silenciado, retentado na próxima navegação.

---

## 4. Design System YAS

### Paleta (extraída do brand book)

```js
yas: {
  burgundy:   '#8B1D3A',  // primária — botões, nav ativo, header verso do card
  lavender:   '#B89FD4',  // secundária — cards de bloco, badges, botão "Difícil"
  plum:       '#5B4A7E',  // terciária — headers de seção, ícones
  yellow:     '#F5F5A0',  // acento — "Lembrei fácil", streak, conquistas
  terracotta: '#C8876A',  // "Não lembrei", erros, alertas quentes
  cream:      '#FAFFF0',  // fundo principal (modo claro)
  ink:        '#1A1525',  // texto principal, fundo BottomNav
}
```

### Tipografia
- **Display:** Cormorant Garamond (serif de alto contraste) — nome do bloco, títulos
- **Body:** Inter (sans-serif) — perguntas, respostas, labels, botões

### FlashCard visual
- **Frente:** fundo `yas-cream`, borda `yas-lavender/30`, label bloco em `yas-plum` uppercase
- **Verso:** fundo `yas-burgundy`, texto branco — sinaliza resposta revelada
- **Flip:** `transform-style: preserve-3d`, `backface-visibility: hidden`, 500ms ease

### Botões de avaliação
| Botão | Cor |
|---|---|
| Não lembrei | `yas-terracotta` |
| Difícil | `yas-lavender` |
| Lembrei | `yas-yellow` com texto `yas-ink` |

### Cores por bloco (calendário e badges)
| Bloco | Cor |
|---|---|
| SUS & Legislação | `yas-plum` |
| Técnicas de Enfermagem | `yas-lavender` |
| Doenças & Epidemiologia | `yas-terracotta` |
| Emergências | `yas-burgundy` |
| Saúde da Mulher & Criança | `yas-yellow` |
| Biossegurança | `#5B8A7E` |
| Farmacologia & PNI | `yas-lavender/70` |
| Saúde Mental & CAPS | `yas-plum/70` |
| Idoso & Geriátrico | `yas-terracotta/70` |

### BottomNav
Fundo `yas-ink`, ícone ativo `yas-lavender`, inativos `white/40`

---

## 5. Schema do banco de dados

```sql
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  bloco text not null,
  frente text not null,
  verso text not null
);

create table card_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id uuid references flashcards(id) on delete cascade,
  intervalo integer default 1,
  repeticoes integer default 0,
  fator_facilidade decimal default 2.5,
  proxima_revisao date default current_date,
  ultima_avaliacao text,
  updated_at timestamptz default now(),
  unique(user_id, card_id)
);

create table sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  data date default current_date,
  cards_estudados integer default 0,
  cards_acertados integer default 0
);

create table tarefas (
  id text primary key,
  semana text not null,
  descricao text not null,
  ordem integer not null
);

create table tarefas_usuario (
  user_id uuid not null,
  tarefa_id text references tarefas(id) on delete cascade,
  concluida boolean default false,
  concluida_em timestamptz,
  primary key(user_id, tarefa_id)
);
```

### Seed (`lib/seed.ts`)
Verifica `count(*) from flashcards` — se 0, insere 76 cards e 36 tarefas via `upsert` com `onConflict: 'id'` (idempotente). Roda no `useEffect` do `layout.tsx`. Se falhar parcialmente, na próxima visita o count ainda será < 76 e o seed rodará novamente — sem risco de duplicatas graças ao upsert. Erros são logados no console mas não bloqueiam o app.

---

## 6. Fluxo de dados por tela

| Tela | Lê | Escreve |
|---|---|---|
| /flashcards | `flashcards` + `card_progress` | `card_progress`, `sessoes` |
| /plano | estático (conteúdo inline) + `tarefas_usuario` | — |
| /checklist | `tarefas` + `tarefas_usuario` | `tarefas_usuario` |
| /stats | `card_progress` + `sessoes` | — |

### Regras de sessão (`sessoes`)
- Ao iniciar `/flashcards`, cria ou reutiliza registro `sessoes` do dia atual (upsert por `user_id + data`)
- `cards_estudados`: incrementa +1 para cada avaliação (errou, dificil ou facil)
- `cards_acertados`: incrementa +1 apenas para `dificil` e `facil` (não `errou`)
- Atualizado assincronamente após cada avaliação, sem bloquear UI

### Pomodoro (Timer widget)
- Widget independente dentro de `/flashcards` — não conecta com métricas de sessão
- Usuário inicia/pausa/reseta manualmente
- Não pausa automaticamente no flip do card
- Toca um beep via Web Audio API ao atingir 0:00
- Alterna automaticamente entre 25min (foco) e 5min (pausa) após cada ciclo

---

## 7. Prioridade de implementação

1. `lib/sm2.ts` — algoritmo puro, testável
2. `FlashCard.tsx` — flip 3D + 3 botões
3. `lib/seed.ts` — 76 cards no banco
4. `/flashcards/page.tsx` — sessão completa com SM-2
5. `lib/supabase.ts` + schema SQL
6. `/checklist/page.tsx`
7. `/plano/page.tsx`
8. Timer Pomodoro (widget em /flashcards)
9. `/stats/page.tsx`

---

## 8. Conteúdo dos flashcards (76 cards)

### Blocos
- SUS & Legislação (10 cards)
- Técnicas de Enfermagem (12 cards)
- Doenças & Epidemiologia (8 cards)
- Emergências (8 cards)
- Saúde da Mulher & Criança (8 cards)
- Biossegurança & Infecção (6 cards)
- Farmacologia & PNI (6 cards)
- Saúde Mental & CAPS (6 cards)
- Idoso & Geriátrico (6 cards)

*Conteúdo completo de cada card documentado no prompt original do projeto.*

---

## 9. Deploy

- **Desenvolvimento:** `next dev` local
- **Produção:** Vercel (automático via push para main)
- **Variáveis de ambiente:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_STUDY_USER_ID` (UUID gerado uma vez)
