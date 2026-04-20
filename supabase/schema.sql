-- YAS Estudos — Schema Supabase
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- 1. Flashcards (conteúdo dos cards — populado pelo seed)
create table if not exists flashcards (
  id     uuid primary key default gen_random_uuid(),
  fonte  text not null default 'Enfermeiro I — São Miguel do Iguaçu 2026',
  bloco  text not null,
  frente text not null,
  verso  text not null
);

-- Migration: adicionar coluna fonte se a tabela já existia
alter table flashcards add column if not exists fonte text not null default 'Enfermeiro I — São Miguel do Iguaçu 2026';
update flashcards set fonte = 'Enfermeiro I — São Miguel do Iguaçu 2026' where fonte is null or fonte = '';

-- 2. Progresso do usuário por card (SM-2)
create table if not exists card_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  card_id          uuid references flashcards(id) on delete cascade,
  intervalo        integer default 1,
  repeticoes       integer default 0,
  fator_facilidade decimal default 2.5,
  proxima_revisao  date default current_date,
  ultima_avaliacao text,
  updated_at       timestamptz default now(),
  unique(user_id, card_id)
);

create index if not exists card_progress_user_data
  on card_progress(user_id, proxima_revisao);

-- 3. Sessões de estudo por dia
create table if not exists sessoes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  data            date default current_date,
  cards_estudados integer default 0,
  cards_acertados integer default 0,
  unique(user_id, data)
);

create index if not exists sessoes_user_data
  on sessoes(user_id, data);

-- 4. Tarefas do plano de estudos (populado pelo seed)
create table if not exists tarefas (
  id        text primary key,
  semana    text not null,
  descricao text not null,
  ordem     integer not null
);

-- 5. Status das tarefas por usuário
create table if not exists tarefas_usuario (
  user_id      uuid not null,
  tarefa_id    text references tarefas(id) on delete cascade,
  concluida    boolean default false,
  concluida_em timestamptz,
  primary key(user_id, tarefa_id)
);

-- Sem RLS — app pessoal, 1 usuário, sem auth
-- Se quiser habilitar RLS no futuro, use:
-- alter table card_progress enable row level security;
-- create policy "usuario fixo" on card_progress using (true);
