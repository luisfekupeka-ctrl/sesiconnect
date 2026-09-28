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
    fraseDataExtenso
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
  numeroAta: string;
  anoAta: string;
  paragrafoAbertura: string;
  paragrafoRelato: string;
  paragrafoEncaminhamentos: string;
  paragrafoFechamento: string;
  paragrafos: string[];
  textoCorridoCompleto: string;
  assinaturas: { nome: string; papel: string }[];
}

export function montarEstruturaAta(params: {
  numeroAta?: string;
  anoAta?: string | number;
  dataStr?: string;
  horarioStr?: string;
  alunos?: string[];
  nomeAluno?: string;
  turmaAluno?: string;
  nomeEmissor?: string;
  cargoEmissor?: string;
  relato?: string;
  endereco?: string;
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

  const tituloAta = numAtaStr ? `ATA ${numAtaStr}/${anoAtaStr}` : `ATA ${anoAtaStr}`;

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

  // 1. Parágrafo de Abertura Oficial Padrão ABNT
  const paragrafoAbertura = `${dataExt.fraseDataExtenso}, ${endereco}, ${textoEstudantes}, da turma ${turmaFormatada}, esteve envolvido(a) em uma situação/ocorrência, conforme descrito a seguir:`;

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

  // Assinaturas
  const assinaturas: { nome: string; papel: string }[] = [];
  listaAlunos.forEach(a => {
    assinaturas.push({ nome: a, papel: 'Aluno(a)' });
  });

  const emissorNome = (params.nomeEmissor || 'Responsável pelo Registro').trim();
  const cargoLimpo = (params.cargoEmissor || 'Responsável pelo Registro').trim();
  if (emissorNome && emissorNome !== 'Administração') {
    assinaturas.push({ nome: emissorNome, papel: cargoLimpo });
  }

  if (params.assinaturasExtras && params.assinaturasExtras.length > 0) {
    params.assinaturasExtras.forEach(extra => {
      if (extra.nome && !assinaturas.some(a => a.nome.toLowerCase() === extra.nome.toLowerCase())) {
        assinaturas.push(extra);
      }
    });
  }

  return {
    tituloAta,
    numeroAta: numAtaStr,
    anoAta: anoAtaStr,
    paragrafoAbertura,
    paragrafoRelato,
    paragrafoEncaminhamentos,
    paragrafoFechamento,
    paragrafos,
    textoCorridoCompleto,
    assinaturas
  };
}
