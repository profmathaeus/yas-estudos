/**
 * Script de importação em lote de questões para o Supabase
 * Uso: node importar-questoes.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://upgzcafgtcjcfpwqjhxf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZ3pjYWZndGNqY2Zwd3FqaHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NDU2MDIsImV4cCI6MjA5MjIyMTYwMn0.V8tu3KVCKoyzsOhrJb1b8L4epDQ1q-g9MwJMvmj3DOE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Arquivos de questões a importar (na ordem de prioridade)
const ARQUIVOS = [
  "questoes-enfermeiro.json",
  "questoes-nacionais.json",
  "questoes-ibfc.json",
  "questoes-enare-final.json",
  "questoes-fafipa.json",
  "questoes-provas-antigas.json",
  "questoes-pediatria.json",
  "questoes-mental.json",
  "questoes-farma.json",
  "questoes-bio.json",
  "questoes-idoso.json",
  "questoes-gestao.json",
  // Conhecimentos gerais
  "questoes-portugues.json",
  "questoes-matematica.json",
  "questoes-informatica.json",
];

function validarQuestao(q, arquivo, idx) {
  const erros = [];
  if (!q.tema) erros.push("tema ausente");
  if (!q.enunciado) erros.push("enunciado ausente");
  if (!Array.isArray(q.alternativas) || q.alternativas.length < 2)
    erros.push("alternativas inválidas");
  if (!q.gabarito) erros.push("gabarito ausente");
  if (!q.justificativa) erros.push("justificativa ausente");
  if (erros.length > 0) {
    console.warn(`  ⚠️  Q${idx + 1} em ${arquivo}: ${erros.join(", ")}`);
    return false;
  }
  return true;
}

async function verificarTabelaExiste() {
  const { error } = await supabase.from("questoes").select("id").limit(1);
  if (error && error.code === "42P01") {
    console.error(
      "❌ Tabela 'questoes' não existe no Supabase. Rode o SQL de criação primeiro."
    );
    console.log(`
SQL para criar as tabelas:

create table if not exists questoes (
  id            uuid primary key default gen_random_uuid(),
  tema          text not null,
  enunciado     text not null,
  alternativas  jsonb not null,
  gabarito      text not null,
  justificativa text not null,
  explicacoes   jsonb,
  fonte         text,
  dificuldade   text default 'media'
);

create table if not exists questoes_usuario (
  user_id        uuid not null,
  questao_id     uuid references questoes(id) on delete cascade,
  resposta       text,
  acertou        boolean,
  respondido_em  timestamptz default now(),
  primary key (user_id, questao_id)
);
    `);
    return false;
  }
  return true;
}

async function buscarFontesExistentes() {
  const { data } = await supabase.from("questoes").select("fonte");
  if (!data) return new Set();
  return new Set(data.map((q) => q.fonte).filter(Boolean));
}

async function importarArquivo(arquivo, fontesExistentes) {
  const caminho = join(__dirname, arquivo);
  let questoes;

  try {
    const conteudo = readFileSync(caminho, "utf-8");
    questoes = JSON.parse(conteudo);
  } catch (e) {
    console.error(`  ❌ Erro ao ler ${arquivo}: ${e.message}`);
    return { importadas: 0, puladas: 0, erros: 0 };
  }

  const validas = questoes.filter((q, i) => validarQuestao(q, arquivo, i));
  console.log(`\n📂 ${arquivo}: ${validas.length} válidas de ${questoes.length} total`);

  let importadas = 0;
  let puladas = 0;
  let erros = 0;

  // Inserir em lotes de 50
  const LOTE = 50;
  for (let i = 0; i < validas.length; i += LOTE) {
    const lote = validas.slice(i, i + LOTE);
    const { data, error } = await supabase
      .from("questoes")
      .insert(lote)
      .select("id");

    if (error) {
      // Verificar se é erro de duplicata ou outro
      if (error.code === "23505") {
        puladas += lote.length;
        console.log(`  ⏭️  Lote ${Math.floor(i / LOTE) + 1}: ${lote.length} duplicatas ignoradas`);
      } else {
        erros += lote.length;
        console.error(`  ❌ Lote ${Math.floor(i / LOTE) + 1}: ${error.message}`);
      }
    } else {
      importadas += data?.length || lote.length;
      console.log(`  ✅ Lote ${Math.floor(i / LOTE) + 1}: ${data?.length || lote.length} inseridas`);
    }
  }

  return { importadas, puladas, erros };
}

async function main() {
  console.log("🚀 YAS Estudos — Importação de Questões");
  console.log("=========================================");

  const tabelaOk = await verificarTabelaExiste();
  if (!tabelaOk) process.exit(1);

  // Contar questões já existentes
  const { count: totalAntes } = await supabase
    .from("questoes")
    .select("*", { count: "exact", head: true });
  console.log(`\n📊 Questões já no banco: ${totalAntes || 0}`);

  const fontesExistentes = await buscarFontesExistentes();

  let totalImportadas = 0;
  let totalPuladas = 0;
  let totalErros = 0;

  for (const arquivo of ARQUIVOS) {
    const { importadas, puladas, erros } = await importarArquivo(
      arquivo,
      fontesExistentes
    );
    totalImportadas += importadas;
    totalPuladas += puladas;
    totalErros += erros;
  }

  // Contar total após importação
  const { count: totalDepois } = await supabase
    .from("questoes")
    .select("*", { count: "exact", head: true });

  console.log("\n=========================================");
  console.log(`✅ Importadas: ${totalImportadas}`);
  if (totalPuladas > 0) console.log(`⏭️  Puladas (duplicatas): ${totalPuladas}`);
  if (totalErros > 0) console.log(`❌ Erros: ${totalErros}`);
  console.log(`📊 Total no banco agora: ${totalDepois || 0}`);

  // Mostrar distribuição por tema
  const { data: porTema } = await supabase
    .from("questoes")
    .select("tema");

  if (porTema) {
    const contagem = {};
    porTema.forEach((q) => {
      contagem[q.tema] = (contagem[q.tema] || 0) + 1;
    });
    console.log("\n📈 Distribuição por tema:");
    Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tema, n]) => console.log(`   ${tema}: ${n}`));
  }
}

main().catch(console.error);
