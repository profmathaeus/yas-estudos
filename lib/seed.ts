import { createClient } from "@/lib/supabase";

const FLASHCARDS = [
  // SUS & Legislação
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "Quais são os 3 princípios doutrinários do SUS?", verso: "Universalidade (todos têm direito), Equidade (tratar desigualmente os desiguais) e Integralidade (atenção completa: promoção, prevenção, tratamento e reabilitação)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "Quais são as 3 diretrizes organizativas do SUS?", verso: "Descentralização (comando único em cada esfera), Hierarquização (atenção básica, média e alta complexidade) e Participação Social — Conselhos e Conferências de Saúde." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "O que estabelece a Lei 8.080/90?", verso: "Organiza o SUS, define competências e atribuições de cada esfera, dispõe sobre financiamento, recursos humanos e vedações." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "O que estabelece a Lei 8.142/90?", verso: "Participação da comunidade: Conselho de Saúde (permanente, deliberativo) e Conferências de Saúde (a cada 4 anos). Transferências intergovernamentais de recursos." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "O que é equidade — como difere de igualdade?", verso: "Igualdade = dar o mesmo a todos. Equidade = dar mais a quem tem maior necessidade, reduzindo desigualdades." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "Composição mínima de uma Equipe de Saúde da Família?", verso: "Médico, Enfermeiro, Técnico de Enfermagem e pelo menos 1 ACS. Responsável por até 4.000 pessoas." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "O que é a PNAB (Portaria 2436/2017)?", verso: "Política Nacional de Atenção Básica. Define a ESF como estratégia prioritária e regulamenta ACS, NASF e cobertura territorial." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "O que regula o exercício profissional da enfermagem?", verso: "Lei 7.498/86, regulamentada pelo Decreto 94.406/87." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "O que o enfermeiro pode fazer que o técnico não pode?", verso: "Consulta de enfermagem, prescrição de enfermagem, supervisão de técnicos, cuidados de alta complexidade." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "sus", frente: "Diferença entre Conselho e Conferência de Saúde?", verso: "Conselho: permanente, deliberativo, paritário (50% usuários). Conferência: periódica (a cada 4 anos), propõe diretrizes." },

  // Técnicas de Enfermagem
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Temperatura axilar normal em adultos?", verso: "35,5°C a 37°C. Febrícula: 37,1–37,5°C. Febre: >37,5°C." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "FC normal em adulto em repouso?", verso: "60 a 100 bpm. Bradicardia: <60. Taquicardia: >100." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "FR normal em adulto?", verso: "12 a 20 mrpm. Bradipneia: <12. Taquipneia: >20." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Classificação da PA em adultos?", verso: "Normal: <120/80. Elevada: 120-129/<80. HAS 1: 130-139/80-89. HAS 2: ≥140/≥90." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Quais são os 5 momentos da higienização das mãos?", verso: "1) Antes do contato com paciente. 2) Antes do procedimento asséptico. 3) Após risco de exposição a fluidos. 4) Após contato com paciente. 5) Após contato com áreas ao redor." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Fórmula de gotejamento em macrogotas?", verso: "Gotas/min = Volume (ml) ÷ Tempo (h) ÷ 3. Ex: 500ml em 4h = 41,6 ≈ 42 gtas/min." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Ângulo de aplicação IM?", verso: "90°. Locais: ventro glúteo (mais seguro), deltoide (até 2ml), vasto lateral (crianças). Máx. ventro glúteo: 5ml." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Ângulo de aplicação SC?", verso: "45° (pele fina) ou 90° (obesos). Abdômen, coxa, braço. Máx.: 1-2ml." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Quais são os 9 certos na administração de medicamentos?", verso: "Paciente, medicamento, dose, via, hora, registro, ação, forma e validade certos." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Como confirmar posicionamento da sonda nasogástrica?", verso: "Padrão-ouro: radiografia. Beira do leito: injeção de ar + ausculta epigástrica ou aspiração + pH <5." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "Posição de Fowler — indicações?", verso: "Cabeceira 45-90°. Dispneia, insuficiência respiratória, pós-op abdominal, alimentação por sonda." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "tecnicas", frente: "O que é balanço hídrico e como interpretar?", verso: "Entradas − Saídas. Positivo: retendo líquido (risco edema). Negativo: perdendo líquido (risco desidratação)." },

  // Doenças & Epidemiologia
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "Como se transmite o HIV e qual a janela imunológica?", verso: "Sexual, sanguínea e vertical. Janela: ~30 dias. Não se transmite por saliva ou inseto." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "Estágios da sífilis e tratamento?", verso: "Primária (cancro duro). Secundária (roséola). Terciária (neurossífilis). Tratamento: penicilina G benzatina." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "Diferença de transmissão e vacina entre hepatites A, B e C?", verso: "A: fecal-oral, tem vacina. B: sexual/sangue, tem vacina. C: sangue, sem vacina, mas tem cura." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "Sinais de alarme da dengue?", verso: "Dor abdominal intensa, vômitos, acúmulo de líquidos, sangramento de mucosas, letargia, queda de plaquetas." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "Diferença entre incidência e prevalência?", verso: "Incidência = casos NOVOS (risco). Prevalência = todos os casos existentes (carga da doença)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "Doenças de notificação imediata (≤24h)?", verso: "Cólera, botulismo, raiva humana, febre amarela, paralisia flácida aguda, SRAG com suspeita pandêmica." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "O que é tuberculose bacilífera?", verso: "BK+ (baciloscopia positiva). Exige N95, quarto pressão negativa, DOTS por 6 meses (RIPE)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "doencas", frente: "Características do Aedes aegypti?", verso: "Urbano, diurno, criadouros em água limpa parada. Transmite dengue, zika e chikungunya." },

  // Emergências
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Sequência do BLS para adultos?", verso: "C-A-B: 30 compressões → 2 ventilações. Acione o DEA imediatamente." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Frequência e profundidade das compressões no BLS?", verso: "100-120/min, 5-6cm de profundidade, retorno total do tórax." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Classificação de queimaduras por profundidade?", verso: "1°: epiderme (vermelhidão). 2°: derme (bolha, dor). 3°: toda espessura (sem dor, couro)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Regra dos 9 para queimaduras em adulto?", verso: "Cabeça=9%, cada braço=9%, tronco ant=18%, post=18%, cada perna=18%, períneo=1%." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Primeiros cuidados para queimadura térmica?", verso: "Água corrente 10-15min, não estourar bolhas, curativo estéril úmido, não usar gelo." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Manobra de Heimlich em adulto consciente?", verso: "Atrás do paciente, mãos entre umbigo e xifoide, compressões para dentro e para cima." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Escore de Apgar — como interpretar?", verso: "7-10: bom. 4-6: moderado. 0-3: grave — reanimação imediata." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "emergencias", frente: "Sinais de choque hipovolêmico?", verso: "Taquicardia, hipotensão, pele fria/úmida, palidez, enchimento capilar >2s, oligúria." },

  // Saúde da Mulher & Criança
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "Mínimo de consultas de pré-natal?", verso: "6 consultas. Início antes das 12 semanas." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "O que é pré-eclâmpsia e eclâmpsia?", verso: "Pré-eclâmpsia: HAS + proteinúria após 20 semanas. Eclâmpsia: + convulsão/coma." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "Quais são os 4 períodos do parto?", verso: "1° dilatação, 2° expulsão, 3° dequitação (placenta), 4° Greenberg/hemostasia." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "Divisões do puerpério?", verso: "Imediato (1-10d), Tardio (11-42d), Remoto (>42d)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "Até quando manter aleitamento exclusivo?", verso: "6 meses exclusivo. Complementar a partir dos 6m. Manter até 2 anos ou mais." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "Teste do pézinho — quando e o que detecta?", verso: "3° a 5° dia. Fenilcetonúria, hipotireoidismo congênito, anemia falciforme, fibrose cística e mais." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "Marcos do desenvolvimento infantil?", verso: "2m sorriso social, 6m senta, 9m pinça, 12m anda, 18m palavras, 2a frases." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mulher", frente: "Como classificar desidratação em crianças?", verso: "Leve <5%, Moderada 5-10% (olhos fundos, sinal da prega), Grave >10% (letargia, pulso fraco)." },

  // Biossegurança & Infecção
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "bio", frente: "Quando usar N95 e quais doenças?", verso: "Aerossóis (<5μm): TB pulmonar, sarampo, varicela. Quarto pressão negativa." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "bio", frente: "Quando usar máscara cirúrgica (gotículas)?", verso: "Influenza, meningite meningocócica, coqueluche. Partículas >5μm, distância >1m." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "bio", frente: "Quando usar precaução por contato?", verso: "MRSA, VRE, C. difficile, escabiose. EPI: luvas + avental ao entrar." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "bio", frente: "Ordem de COLOCAR o EPI?", verso: "Avental → Máscara → Óculos → Luvas. Higienizar as mãos antes." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "bio", frente: "Ordem de RETIRAR o EPI?", verso: "Luvas → Óculos → Avental → Máscara. Higienizar após luvas e ao final." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "bio", frente: "Diferença entre esterilização e desinfecção?", verso: "Esterilização: elimina TUDO incluindo esporos (artigos críticos). Desinfecção: elimina maioria, não todos os esporos." },

  // Farmacologia & PNI
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "farma", frente: "Vacinas aplicadas ao nascer?", verso: "BCG (dose única, formas graves de TB) e Hepatite B (1ª dose)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "farma", frente: "Quando aplicar Febre Amarela?", verso: "A partir dos 9 meses, dose única. Contraindicada em imunocomprometidos e gestantes." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "farma", frente: "Via intradérmica — ângulo, volume e uso?", verso: "10-15°, bisel para cima, máx. 0,1ml, forma pápula. Usada para BCG e PPD." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "farma", frente: "Fórmula de microgotas?", verso: "Microgotas/min = Volume (ml) ÷ Tempo (horas). 1 macrogota = 3 microgotas." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "farma", frente: "O que é interação medicamentosa?", verso: "Sinérgica (potencializa) ou antagonista (reduz). Risco alto com polifarmácia (>5 medicamentos)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "farma", frente: "Qual o prazo máximo para anticoncepção de emergência?", verso: "Levonorgestrel até 72h após a relação. Eficácia reduz com o tempo." },

  // Saúde Mental & CAPS
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mental", frente: "O que estabelece a Lei 10.216/01?", verso: "Desinstitucionalização psiquiátrica — direitos dos portadores de transtornos mentais, prioridade ao tratamento comunitário." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mental", frente: "Tipos de CAPS e suas diferenças?", verso: "CAPS I (<70k hab.), II (70-200k, sem pernoite), III (>200k, 24h com leitos), AD (álcool/drogas), IJ (infanto-juvenil)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mental", frente: "Sinais de depressão maiores?", verso: "Tristeza persistente, anedonia (sem prazer), fadiga, alteração do sono e apetite, dificuldade de concentração, por ≥2 semanas." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mental", frente: "Sinais de esquizofrenia?", verso: "Delírios, alucinações auditivas, pensamento desorganizado, sintomas negativos (embotamento afetivo, isolamento)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mental", frente: "O que é saúde do trabalhador — principais agravos?", verso: "DORT/LER (movimentos repetitivos), acidentes de trabalho (CAT), doenças ocupacionais, NR-32 (saúde em serviços de saúde)." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "mental", frente: "O que é delirium e como difere de demência?", verso: "Delirium: agudo, reversível, flutuante, geralmente por causa identificável. Demência: crônica, progressiva, irreversível (ex: Alzheimer)." },

  // Idoso & Geriátrico
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "idoso", frente: "O que é polifarmácia e qual o risco?", verso: "Uso de >5 medicamentos. Risco: interações, reações adversas, quedas, intoxicações — muito comum em idosos." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "idoso", frente: "Principais fatores de risco para quedas em idosos?", verso: "Polifarmácia, tapetes soltos, iluminação ruim, hipotensão ortostática, redução de força muscular, déficit visual." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "idoso", frente: "O que é a Avaliação Geriátrica Ampla (AGA)?", verso: "Avaliação multidimensional: funcionalidade, cognição, humor, suporte social, polifarmácia, risco de queda." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "idoso", frente: "Diferença entre Alzheimer e demência vascular?", verso: "Alzheimer: início insidioso, memória recente primeiro. Vascular: início abrupto, piora escalonada após eventos vasculares." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "idoso", frente: "Sinais de alerta de abuso de idoso?", verso: "Hematomas inexplicados, medo do cuidador, desnutrição sem causa, isolamento, sinais de contenção." },
  { fonte: "Enfermeiro I — São Miguel do Iguaçu 2026", bloco: "idoso", frente: "O que é hipotensão ortostática?", verso: "Queda de PA ≥20mmHg sistólica ao levantar. Causa tontura e quedas. Comum em idosos, diabéticos e usuários de anti-hipertensivos." },
];

const TAREFAS = [
  // Semana 1
  { id: "t01", semana: "S1", descricao: "Ler resumo completo do SUS (princípios, diretrizes, leis 8.080 e 8.142)", ordem: 1 },
  { id: "t02", semana: "S1", descricao: "Estudar flashcards do bloco SUS & Legislação (10 cards)", ordem: 2 },
  { id: "t03", semana: "S1", descricao: "Revisar Lei 7.498/86 e Decreto 94.406/87 — exercício profissional", ordem: 3 },
  { id: "t04", semana: "S1", descricao: "Estudar flashcards Técnicas de Enfermagem — sinais vitais (4 cards)", ordem: 4 },
  { id: "t05", semana: "S1", descricao: "Praticar fórmulas de gotejamento com exercícios", ordem: 5 },
  { id: "t06", semana: "S1", descricao: "Estudar 5 momentos da higiene das mãos e 9 certos dos medicamentos", ordem: 6 },
  { id: "t07", semana: "S1", descricao: "Revisar todos os cards de Técnicas de Enfermagem (12 cards)", ordem: 7 },
  { id: "t08", semana: "S1", descricao: "Revisão geral S1 — rodar todos os cards vencidos", ordem: 8 },
  { id: "t09", semana: "S1", descricao: "Simulado 10 questões SUS + Técnicas", ordem: 9 },

  // Semana 2
  { id: "t10", semana: "S2", descricao: "Estudar flashcards Doenças & Epidemiologia (8 cards)", ordem: 1 },
  { id: "t11", semana: "S2", descricao: "Revisar ISTs: HIV, sífilis, hepatites A/B/C", ordem: 2 },
  { id: "t12", semana: "S2", descricao: "Estudar dengue, notificação compulsória e Aedes aegypti", ordem: 3 },
  { id: "t13", semana: "S2", descricao: "Estudar flashcards Emergências (8 cards)", ordem: 4 },
  { id: "t14", semana: "S2", descricao: "Praticar BLS: C-A-B, frequência, profundidade das compressões", ordem: 5 },
  { id: "t15", semana: "S2", descricao: "Revisar queimaduras: classificação, regra dos 9, primeiros cuidados", ordem: 6 },
  { id: "t16", semana: "S2", descricao: "Estudar flashcards Saúde da Mulher & Criança (8 cards)", ordem: 7 },
  { id: "t17", semana: "S2", descricao: "Revisão geral S2 — todos os cards vencidos", ordem: 8 },
  { id: "t18", semana: "S2", descricao: "Simulado 20 questões Doenças + Emergências + Mulher", ordem: 9 },

  // Semana 3
  { id: "t19", semana: "S3", descricao: "Estudar flashcards Biossegurança & Infecção (6 cards)", ordem: 1 },
  { id: "t20", semana: "S3", descricao: "Memorizar ordem de colocar e retirar EPI", ordem: 2 },
  { id: "t21", semana: "S3", descricao: "Revisar precauções por tipo: aerossol, gotícula, contato", ordem: 3 },
  { id: "t22", semana: "S3", descricao: "Estudar flashcards Farmacologia & PNI (6 cards)", ordem: 4 },
  { id: "t23", semana: "S3", descricao: "Revisar calendário vacinal completo (PNI)", ordem: 5 },
  { id: "t24", semana: "S3", descricao: "Estudar flashcards Saúde Mental & CAPS (6 cards)", ordem: 6 },
  { id: "t25", semana: "S3", descricao: "Revisar Lei 10.216/01 e tipos de CAPS", ordem: 7 },
  { id: "t26", semana: "S3", descricao: "Estudar flashcards Idoso & Geriátrico (6 cards)", ordem: 8 },
  { id: "t27", semana: "S3", descricao: "Revisão geral S3 — todos os cards vencidos", ordem: 9 },

  // Semana 4
  { id: "t28", semana: "S4", descricao: "Simulado completo 40 questões — todos os blocos", ordem: 1 },
  { id: "t29", semana: "S4", descricao: "Identificar blocos com menor % acerto e focar revisão", ordem: 2 },
  { id: "t30", semana: "S4", descricao: "Revisão intensiva cards com última avaliação 'errou'", ordem: 3 },
  { id: "t31", semana: "S4", descricao: "Revisar fórmulas e cálculos (gotejamento, microgotas, Regra dos 9)", ordem: 4 },
  { id: "t32", semana: "S4", descricao: "Revisar todos os valores normais de sinais vitais", ordem: 5 },
  { id: "t33", semana: "S4", descricao: "Simulado final 50 questões cronometrado", ordem: 6 },
  { id: "t34", semana: "S4", descricao: "Rodar todos os cards pendentes do SM-2", ordem: 7 },
  { id: "t35", semana: "S4", descricao: "Revisar pontos fracos identificados no simulado final", ordem: 8 },
  { id: "t36", semana: "S4", descricao: "Véspera da prova: revisão leve dos cards mais difíceis, dormir cedo", ordem: 9 },
];

export async function runSeedIfNeeded() {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[seed] erro ao verificar flashcards:", error.message);
      return;
    }

    if ((count ?? 0) > 0) return;

    const { error: cardError } = await supabase
      .from("flashcards")
      .upsert(FLASHCARDS, { onConflict: "id", ignoreDuplicates: true });

    if (cardError) {
      console.error("[seed] erro ao inserir flashcards:", cardError.message);
      return;
    }

    const { error: tarefaError } = await supabase
      .from("tarefas")
      .upsert(TAREFAS, { onConflict: "id", ignoreDuplicates: true });

    if (tarefaError) {
      console.error("[seed] erro ao inserir tarefas:", tarefaError.message);
      return;
    }

    console.log("[seed] 76 flashcards e 36 tarefas inseridos com sucesso.");
  } catch (e) {
    console.error("[seed] erro inesperado:", e);
  }
}
