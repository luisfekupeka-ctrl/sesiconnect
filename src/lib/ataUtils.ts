/**
 * Utilitários de formatação e transcrição para o novo modelo de ATA (Ocorrência Oficial)
 * Colégio Sesi Internacional - Padrão ABNT (Arial 12, espaçamento 1,5, texto justificado)
 */

const DIAS_EXTENSO: Record<number, string> = {
  1: 'primeiro',
  2: 'dois',
  3: 'três',
  4: 'quatro',
  5: 'cinco',
  6: 'seis',
  7: 'sete',
  8: 'oito',
  9: 'nove',
  10: 'dez',
  11: 'onze',
  12: 'doze',
  13: 'treze',
  14: 'quatorze',
  15: 'quinze',
  16: 'dezesseis',
  17: 'dezessete',
  18: 'dezoito',
  19: 'dezenove',
  20: 'vinte',
  21: 'vinte e um',
  22: 'vinte e dois',
  23: 'vinte e três',
  24: 'vinte e quatro',
  25: 'vinte e cinco',
  26: 'vinte e seis',
  27: 'vinte e sete',
  28: 'vinte e oito',
  29: 'vinte e nove',
  30: 'trinta',
  31: 'trinta e um'
};

const MESES_EXTENSO = [
  '',
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
];

const UNIDADES_EXTENSO = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DEZ_A_DEZENOVE = [
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze',
  'dezesseis', 'dezessete', 'dezoito', 'dezenove'
];
const DEZENAS_EXTENSO = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];

export function diaPorExtenso(dia: number): string {
  return DIAS_EXTENSO[dia] || String(dia);
}

export function mesPorExtenso(mes: number): string {
  if (mes >= 1 && mes <= 12) return MESES_EXTENSO[mes];
  return 'janeiro';
}

export function anoPorExtenso(ano: number): string {
  if (ano === 2026) return 'dois mil e vinte e seis';
  if (ano === 2024) return 'dois mil e vinte e quatro';
  if (ano === 2025) return 'dois mil e vinte e cinco';
  if (ano === 2027) return 'dois mil e vinte e sete';
  if (ano === 2028) return 'dois mil e vinte e oito';
  if (ano === 2029) return 'dois mil e vinte e nove';
  if (ano === 2030) return 'dois mil e trinta';

  if (ano >= 2000 && ano < 2100) {
    const resto = ano - 2000;
    if (resto === 0) return 'dois mil';
    if (resto < 10) return `dois mil e ${UNIDADES_EXTENSO[resto]}`;
    if (resto >= 10 && resto < 20) return `dois mil e ${DEZ_A_DEZENOVE[resto - 10]}`;
    const dezena = Math.floor(resto / 10);
    const unidade = resto % 10;
    if (unidade === 0) return `dois mil e ${DEZENAS_EXTENSO[dezena]}`;
    return `dois mil e ${DEZENAS_EXTENSO[dezena]} e ${UNIDADES_EXTENSO[unidade]}`;
  }

  return String(ano);
}

export function formatarHorarioAta(horarioStr?: string, dataObj?: Date): string {
  if (horarioStr && typeof horarioStr === 'string' && horarioStr.trim()) {
    const limpo = horarioStr.trim().toLowerCase();
    if (limpo.includes('h')) {
      return limpo.startsWith('às ') ? limpo.replace('às ', '') : (limpo.startsWith('por volta das ') ? limpo.replace('por volta das ', '') : limpo);
    }
    const match = limpo.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (m === 0) return `${h}h`;
      return `${h}h${String(m).padStart(2, '0')}`;
    }
    return limpo;
  }

  if (dataObj && !isNaN(dataObj.getTime())) {
    const h = dataObj.getHours();
    const m = dataObj.getMinutes();
    if (h > 0 || m > 0) {
      if (m === 0) return `${h}h`;
      return `${h}h${String(m).padStart(2, '0')}`;
    }
  }

  return '10h';
}

export interface DataAtaExtenso {
  dia: number;
  mes: number;
  ano: number;
  diaExtenso: string;
  mesExtenso: string;
  anoExtenso: string;
  horario: string;
  fraseDataExtenso: string;
  dataFormatada: string;
}

export function parseDataEHorarioAta(dataStr?: string, horarioStr?: string): DataAtaExtenso {
  let dia = 28;
  let mes = 9;
  let ano = 2026;
  let dateObj: Date | null = null;

  if (dataStr) {
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dataStr.split('-');
      ano = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10);
      dia = parseInt(parts[2], 10);
    } else if (dataStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = dataStr.split('/');
      dia = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10);
      ano = parseInt(parts[2], 10);
    } else {
      try {
        const d = new Date(dataStr);
        if (!isNaN(d.getTime())) {
          dateObj = d;
          dia = d.getDate();
          mes = d.getMonth() + 1;
          ano = d.getFullYear();
        }
      } catch (e) {
        // fallback
      }
    }
  } else {
    const now = new Date();
    dia = now.getDate();
    mes = now.getMonth() + 1;
    ano = now.getFullYear();
    dateObj = now;
  }

  const diaExt = diaPorExtenso(dia);
  const mesExt = mesPorExtenso(mes);
  const anoExt = anoPorExtenso(ano);
  const horExt = formatarHorarioAta(horarioStr, dateObj || undefined);
  const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;

  // Se dia for 1: "Ao 1º dia" ou "Ao primeiro dia", para os demais: "Aos X dias"
  const prefixoDia = dia === 1 ? 'Ao primeiro dia' : `Aos ${diaExt} dias`;
  const fraseDataExtenso = `${prefixoDia} do mês de ${mesExt} do ano de ${anoExt}, por volta das ${horExt}`;

  return {
    dia,
    mes,
    ano,
    diaExtenso: diaExt,
    mesExtenso: mesExt,
    anoExtenso: anoExt,
    horario: horExt,
    fraseDataExtenso,
    dataFormatada
  };
}

export const ENDERECO_PADRAO_SESI_ABNT =
  'nas dependências do Colégio SESI Internacional, localizado na Marginal Comendador Franco, Avenida, nº 1341, Jardim Botânico, Curitiba – PR';

export const ENCAMINHAMENTOS_PADRAO_ATA =
  'Diante do ocorrido, foram realizados os encaminhamentos e/ou orientações necessários, conforme as normas e procedimentos da instituição.';

export const FECHAMENTO_PADRAO_ATA_ABNT =
  'Nada mais havendo a registrar, lavra-se o presente relato para fins de acompanhamento e registro escolar.';

export interface EstruturaAtaCompleta {
  tituloAta: string;
  tipoDocumento: 'ata' | 'diario';
  numeroAta: string;
  anoAta: string;
  dataFormatada: string;
  paragrafoAbertura: string;
  paragrafoRelato: string;
  paragrafoEncaminhamentos: string;
  paragrafoFechamento: string;
  paragrafos: string[];
  textoCorridoCompleto: string;
  assinaturas: { nome: string; papel: string }[];
}

export function montarEstruturaAta(params: {
  tipoDocumento?: 'ata' | 'diario';
  numeroAta?: string;
  anoAta?: string | number;
  dataStr?: string;
  horarioStr?: string;
  alunos?: string[];
  nomeAluno?: string;
  turmaAluno?: string;
  tipoOcorrencia?: string;
  nomeEmissor?: string;
  cargoEmissor?: string;
  relato?: string;
  endereco?: string;
  mostrarAluno?: boolean;
  mostrarResponsavel?: boolean;
  nomeResponsavel?: string;
  mostrarEmissor?: boolean;
  assinaturasExtras?: { nome: string; papel: string }[];
}): EstruturaAtaCompleta {
  const dataExt = parseDataEHorarioAta(params.dataStr, params.horarioStr);
  
  // Trata ano e número da ATA
  let anoAtaStr = params.anoAta ? String(params.anoAta) : String(dataExt.ano);
  let numAtaStr = (params.numeroAta || '').trim();

  if (numAtaStr.includes('/')) {
    const parts = numAtaStr.split('/');
    numAtaStr = parts[0].trim();
    if (parts[1]) anoAtaStr = parts[1].trim();
  }

  // Determina tipo de documento (ATA oficial vs Registro Diário)
  let tipoDocumento: 'ata' | 'diario' = params.tipoDocumento || 'diario';
  if (!params.tipoDocumento) {
    if (numAtaStr && numAtaStr !== 'diario' && numAtaStr !== '0') {
      tipoDocumento = 'ata';
    } else {
      tipoDocumento = 'diario';
    }
  }

  // Define o Título do cabeçalho com base no tipo de documento
  let tituloAta = '';
  if (tipoDocumento === 'diario') {
    tituloAta = `REGISTRO DIÁRIO - ${dataExt.dataFormatada}`;
  } else {
    tituloAta = numAtaStr ? `ATA ${numAtaStr}/${anoAtaStr}` : `ATA ${anoAtaStr}`;
  }

  // Processa lista de alunos
  let listaAlunos: string[] = [];
  if (params.alunos && params.alunos.length > 0) {
    listaAlunos = params.alunos.map(a => a.trim()).filter(Boolean);
  } else if (params.nomeAluno) {
    if (params.nomeAluno.includes(' e ') || params.nomeAluno.includes(',')) {
      listaAlunos = params.nomeAluno
        .split(/,|\se\s/)
        .map(s => s.trim())
        .filter(Boolean);
    } else {
      listaAlunos = [params.nomeAluno.trim()];
    }
  }

  // Formata nomes dos estudantes
  let textoEstudantes = '';
  if (listaAlunos.length === 0) {
    textoEstudantes = 'o(a) aluno(a) ______________________________________________';
  } else if (listaAlunos.length === 1) {
    textoEstudantes = `o(a) aluno(a) ${listaAlunos[0]}`;
  } else if (listaAlunos.length === 2) {
    textoEstudantes = `os(as) alunos(as) ${listaAlunos[0]} e ${listaAlunos[1]}`;
  } else {
    const ult = listaAlunos[listaAlunos.length - 1];
    const rest = listaAlunos.slice(0, -1).join(', ');
    textoEstudantes = `os(as) alunos(as) ${rest} e ${ult}`;
  }

  // Turma / Série
  const turmaFormatada = (params.turmaAluno || '__________').trim();
  const endereco = (params.endereco || ENDERECO_PADRAO_SESI_ABNT).trim();

  // Verbo de envolvimento (singular ou plural)
  const verboEnvolvido = listaAlunos.length > 1 ? 'estiveram envolvidos(as)' : 'esteve envolvido(a)';

  // 1. Parágrafo de Abertura Oficial Padrão ABNT
  const paragrafoAbertura = `${dataExt.fraseDataExtenso}, ${endereco}, ${textoEstudantes}, da turma ${turmaFormatada}, ${verboEnvolvido} em uma situação/ocorrência, conforme descrito a seguir:`;

  // 2. Parágrafo de Relato dos Fatos
  let relatoLimpo = (params.relato || '').trim();
  // Remove menções duplicadas de fechamento se o usuário colou texto anterior
  relatoLimpo = relatoLimpo
    .replace(/diante do ocorrido, foram realizados[^\.]*\.?/i, '')
    .replace(/nada mais havendo a registrar[^\.]*\.?/i, '')
    .replace(/nada mais havendo a tratar[^\.]*\.?/i, '')
    .trim();

  const paragrafoRelato = relatoLimpo || '[Descreva detalhadamente o ocorrido...]';

  // 3. Parágrafo de Encaminhamentos e Orientações
  const paragrafoEncaminhamentos = ENCAMINHAMENTOS_PADRAO_ATA;

  // 4. Parágrafo de Fechamento Padrão
  const paragrafoFechamento = FECHAMENTO_PADRAO_ATA_ABNT;

  const paragrafos = [
    paragrafoAbertura,
    paragrafoRelato,
    paragrafoEncaminhamentos,
    paragrafoFechamento
  ];

  const textoCorridoCompleto = paragrafos.join('\n\n');

  // Montagem das Assinaturas Oficiais
  const assinaturas: { nome: string; papel: string }[] = [];

  // 1. Assinatura(s) do(s) Aluno(s)
  if (params.mostrarAluno !== false) {
    if (listaAlunos.length > 0) {
      listaAlunos.forEach(a => {
        assinaturas.push({ nome: a, papel: 'Aluno(a)' });
      });
    } else {
      assinaturas.push({ nome: 'Aluno(a)', papel: 'Aluno(a)' });
    }
  }

  // 2. Assinatura do Responsável Legal (Pais ou Responsável) - Padronizado e ativo por padrão
  if (params.mostrarResponsavel !== false) {
    const nomeResp = (params.nomeResponsavel || '').trim();
    assinaturas.push({
      nome: nomeResp || 'Pais / Responsável Legal',
      papel: 'Responsável Legal'
    });
  }

  // 3. Assinatura do Profissional Emissor / Colégio Sesi
  if (params.mostrarEmissor !== false) {
    const emissorNome = (params.nomeEmissor || 'Responsável pelo Registro').trim();
    const cargoLimpo = (params.cargoEmissor || 'Responsável pelo Registro').trim();
    if (emissorNome && emissorNome !== 'Administração') {
      assinaturas.push({ nome: emissorNome, papel: cargoLimpo });
    } else {
      assinaturas.push({ nome: 'Coordenação Pedagógica', papel: 'Colégio SESI Internacional' });
    }
  }

  // 4. Assinaturas Adicionais / Extras
  if (params.assinaturasExtras && params.assinaturasExtras.length > 0) {
    params.assinaturasExtras.forEach(extra => {
      if (extra.nome && !assinaturas.some(a => a.nome.toLowerCase() === extra.nome.toLowerCase())) {
        assinaturas.push(extra);
      }
    });
  }

  return {
    tituloAta,
    tipoDocumento,
    numeroAta: numAtaStr,
    anoAta: anoAtaStr,
    dataFormatada: dataExt.dataFormatada,
    paragrafoAbertura,
    paragrafoRelato,
    paragrafoEncaminhamentos,
    paragrafoFechamento,
    paragrafos,
    textoCorridoCompleto,
    assinaturas
  };
}

/**
 * Identifica o gênero aparente do estudante para concordância natural no cabeçalho
 */
export function formatarIdentificacaoEstudante(nomeAluno: string, turmaAluno?: string): string {
  const turmaFormatada = (turmaAluno || '__________').trim();
  const nomeLimpo = (nomeAluno || '').trim();

  if (!nomeLimpo) {
    return `o(a) aluno(a) ____________________, da turma ${turmaFormatada}, esteve envolvido(a)`;
  }

  // Múltiplos alunos
  if (nomeLimpo.includes(' e ') || nomeLimpo.includes(',')) {
    return `os(as) alunos(as) ${nomeLimpo}, da turma ${turmaFormatada}, estiveram envolvidos(as)`;
  }

  const primeiroNome = nomeLimpo.split(' ')[0].toLowerCase();
  const nomesFemininos = [
    'alice', 'maria', 'ana', 'laura', 'beatriz', 'isabella', 'isabel', 'isabela',
    'julia', 'júlia', 'sophia', 'sofia', 'leticia', 'letícia', 'larissa', 'eduarda',
    'giovanna', 'giovana', 'clara', 'mariana', 'gabriela', 'heloisa', 'heloísa',
    'valentina', 'luiza', 'luísa', 'manuela', 'emanuelly', 'yasmin', 'camila',
    'fernanda', 'carolina', 'amanda', 'helena', 'marina', 'bianca', 'rafaela',
    'rebeca', 'livia', 'lívia', 'nicole', 'sarah', 'sara', 'vitoria', 'vitória',
    'stella', 'estela', 'bruna', 'lorena', 'melissa', 'cecilia', 'cecília'
  ];

  if (nomesFemininos.includes(primeiroNome) || (primeiroNome.endsWith('a') && !['lucas', 'luca', 'joshua'].includes(primeiroNome))) {
    return `a aluna ${nomeLimpo}, da turma ${turmaFormatada}, esteve envolvida`;
  }

  const nomesMasculinos = [
    'pedro', 'lucas', 'gabriel', 'arthur', 'artur', 'matheus', 'mateus', 'felipe',
    'guilherme', 'bruno', 'bernardo', 'gustavo', 'henrique', 'joao', 'joão',
    'enzo', 'leonardo', 'felipe', 'rafael', 'miguel', 'davi', 'david', 'samuel',
    'caio', 'rodrigo', 'thiago', 'tiago', 'vitor', 'victor', 'daniel', 'igor',
    'otavio', 'otávio', 'andre', 'andré', 'luciano', 'marcos', 'marcelo', 'alexandre'
  ];

  if (nomesMasculinos.includes(primeiroNome) || primeiroNome.endsWith('o') || primeiroNome.endsWith('el')) {
    return `o aluno ${nomeLimpo}, da turma ${turmaFormatada}, esteve envolvido`;
  }

  return `o(a) aluno(a) ${nomeLimpo}, da turma ${turmaFormatada}, esteve envolvido(a)`;
}

/**
 * Gera o cabeçalho oficial do Colégio SESI Internacional conforme padrão regimental
 */
export function gerarCabecalhoOficialSesi(params: {
  dataStr?: string;
  horarioStr?: string;
  nomeAluno: string;
  turmaAluno?: string;
  endereco?: string;
}): { cabecalho: string; dataFormatada: string; horarioFormatado: string } {
  const dataExt = parseDataEHorarioAta(params.dataStr, params.horarioStr);
  const endereco = (params.endereco || ENDERECO_PADRAO_SESI_ABNT).trim();
  const identificacao = formatarIdentificacaoEstudante(params.nomeAluno, params.turmaAluno);

  const prefixoDia = dataExt.dia === 1 ? 'Ao primeiro dia' : `Aos ${dataExt.diaExtenso} dias`;
  const cabecalho = `${prefixoDia} do mês de ${dataExt.mesExtenso} do ano de ${dataExt.anoExtenso}, por volta das ${dataExt.horario}, ${endereco}, ${identificacao} em uma ocorrência, conforme descrito a seguir:`;

  return {
    cabecalho,
    dataFormatada: dataExt.dataFormatada,
    horarioFormatado: dataExt.horario
  };
}

/**
 * Extrai e normaliza o relato para torná-lo curto, sucinto e sem repetições do cabeçalho
 */
export function extrairRelatoSucinto(rawReport: string, occurrenceType?: string): string {
  if (!rawReport || !rawReport.trim()) {
    return 'Ocorrência registrada para acompanhamento pedagógico e institucional.';
  }

  const texto = rawReport.trim();

  // Caso 1: Atraso com texto longo pré-definido antigo
  if (texto.includes('apresentou atraso às') || (occurrenceType && occurrenceType.toLowerCase().includes('atraso') && texto.includes('Na presente data'))) {
    let timeStr = '';
    const timeMatch1 = texto.match(/apresentou atraso às\s*([^\s,]+)/i);
    const timeMatch2 = texto.match(/\[Horário de Chegada:\s*([^\]]+)\]/i);
    const timeMatch3 = texto.match(/\b\d{1,2}:\d{2}\b/);
    if (timeMatch1) timeStr = timeMatch1[1].trim();
    else if (timeMatch2) timeStr = timeMatch2[1].trim();
    else if (timeMatch3) timeStr = timeMatch3[0].trim();

    let momentoStr = 'Chegada ao Colégio';
    const momentoMatch = texto.match(/no momento de\s*([^.,\n]+)/i);
    if (momentoMatch) momentoStr = momentoMatch[1].trim();

    let motivoStr = '';
    const motiveMatch1 = texto.match(/apresentou a seguinte justificativa:\s*([^.\n]+)/i);
    const motiveMatch2 = texto.match(/Como justificativa, relatou:\s*([^.\n]+)/i);
    const motiveMatch3 = texto.match(/\[Motivo:\s*([^\]]+)\]/i);
    if (motiveMatch1) motivoStr = motiveMatch1[1].trim();
    else if (motiveMatch2) motivoStr = motiveMatch2[1].trim();
    else if (motiveMatch3) motiveStr = motiveMatch3[1].trim();

    const horaParte = timeStr ? ` às ${timeStr}` : '';
    const momentoParte = momentoStr ? ` (${momentoStr})` : '';
    const motivoParte = motivoStr && motivoStr !== '________________________________' ? ` Justificativa: ${motivoStr}.` : '';

    return `Atraso registrado${horaParte}${momentoParte}.${motivoParte} Estudante orientado(a) sobre pontualidade.`;
  }

  // Caso 2: Celular com texto longo pré-definido antigo
  if (texto.includes('uso indevido de celular') && texto.includes('Lei Federal nº 15.100')) {
    let justStr = '';
    const justMatch = texto.match(/apresentou a seguinte justificativa:\s*([^.\n]+)/i);
    if (justMatch && justMatch[1] && !justMatch[1].includes('______')) {
      justStr = justMatch[1].trim();
    }

    const justParte = justStr ? ` Justificativa: ${justStr}.` : '';
    return `Uso não autorizado de celular.${justParte} Estudante orientado(a) e dispositivo guardado.`;
  }

  // Caso 3: Uniforme com texto longo pré-definido antigo
  if (texto.includes('desacordo com as normas estabelecidas para o uso do uniforme') || texto.includes('apresentou-se na instituição')) {
    let pecaStr = '';
    const pecaMatch1 = texto.match(/apresentou-se na instituição\s*([^,]+)/i);
    const pecaMatch2 = texto.match(/\[Peça Faltando \/ Inadequada[^\]]*:\s*([^\]]+)\]/i);
    if (pecaMatch2 && pecaMatch2[1]) pecaStr = pecaMatch2[1].trim();
    else if (pecaMatch1 && pecaMatch1[1] && !pecaMatch1[1].includes('desacordo')) pecaStr = pecaMatch1[1].trim();

    const pecaParte = pecaStr ? ` (${pecaStr})` : '';
    return `Uso inadequado de uniforme${pecaParte}. Estudante orientado(a) sobre a norma.`;
  }

  // Caso 4: Se o texto contém tags do tipo [Campo: Valor], limpa suavemente
  let limpo = texto;

  // Simplifica as tags [Campo]: Valor para "Campo: Valor"
  limpo = limpo.replace(/\[(.*?)\]:\s*/g, '$1: ');

  // Remove menções de encerramento repetitivas se já estavam no texto
  limpo = limpo
    .replace(/diante do ocorrido, foram realizados[^\.]*\.?/gi, '')
    .replace(/nada mais havendo a registrar[^\.]*\.?/gi, '')
    .replace(/nada mais havendo a tratar[^\.]*\.?/gi, '')
    .trim();

  return limpo;
}

/**
 * Gera o texto oficial completo para copiar e colar diretamente no SGE (Sistema Oficial)
 */
export function gerarTextoCompletoSGE(params: {
  dataStr?: string;
  horarioStr?: string;
  nomeAluno: string;
  turmaAluno?: string;
  tipoOcorrencia?: string;
  relato: string;
}): string {
  const { cabecalho } = gerarCabecalhoOficialSesi({
    dataStr: params.dataStr,
    horarioStr: params.horarioStr,
    nomeAluno: params.nomeAluno,
    turmaAluno: params.turmaAluno
  });

  const relatoSucinto = extrairRelatoSucinto(params.relato, params.tipoOcorrencia);

  return `${cabecalho}

${relatoSucinto}

${ENCAMINHAMENTOS_PADRAO_ATA}
${FECHAMENTO_PADRAO_ATA_ABNT}`;
}

/**
 * Gera a mensagem concisa para os responsáveis (WhatsApp / E-mail)
 */
export function gerarMensagemResponsaveis(params: {
  nomeAluno: string;
  turmaAluno?: string;
  tipoOcorrencia: string;
  relato: string;
  emissor?: string;
  dataStr?: string;
}): string {
  const dataExt = parseDataEHorarioAta(params.dataStr);
  const relatoSucinto = extrairRelatoSucinto(params.relato, params.tipoOcorrencia);
  const emissorNome = params.emissor || 'Coordenação Pedagógica';

  return `Prezados(as) responsáveis pelo(a) estudante ${params.nomeAluno}, esperamos que estejam bem.

Informamos que, na data de ${dataExt.dataFormatada}, foi realizado o seguinte registro pedagógico no Colégio SESI Internacional:
• Ocorrência: ${params.tipoOcorrencia}
• Detalhes: ${relatoSucinto}

O(a) estudante recebeu as devidas orientações da equipe escolar. Solicitamos o apoio da família no acompanhamento da conduta e cumprimento das normas escolares.

Atenciosamente,
${emissorNome}
Colégio SESI Internacional`;
}
