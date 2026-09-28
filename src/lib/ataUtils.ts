/**
 * Utilitários de formatação e transcrição para o novo modelo de ATA (Ocorrência Oficial)
 * Colégio Sesi Internacional
 */

const DIAS_ORDINAIS: Record<number, string> = {
  1: 'primeiro',
  2: 'segundo',
  3: 'terceiro',
  4: 'quarto',
  5: 'quinto',
  6: 'sexto',
  7: 'sétimo',
  8: 'oitavo',
  9: 'nono',
  10: 'décimo',
  11: 'décimo primeiro',
  12: 'décimo segundo',
  13: 'décimo terceiro',
  14: 'décimo quarto',
  15: 'décimo quinto',
  16: 'décimo sexto',
  17: 'décimo sétimo',
  18: 'décimo oitavo',
  19: 'décimo nono',
  20: 'vigésimo',
  21: 'vigésimo primeiro',
  22: 'vigésimo segundo',
  23: 'vigésimo terceiro',
  24: 'vigésimo quarto',
  25: 'vigésimo quinto',
  26: 'vigésimo sexto',
  27: 'vigésimo sétimo',
  28: 'vigésimo oitavo',
  29: 'vigésimo nono',
  30: 'trigésimo',
  31: 'trigésimo primeiro'
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
  return DIAS_ORDINAIS[dia] || `${dia}º`;
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
      return limpo.startsWith('às ') ? limpo.replace('às ', '') : limpo;
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
  let dia = 23;
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

  const fraseDataExtenso = `Ao ${diaExt} dia do mês de ${mesExt} do ano de ${anoExt}, às ${horExt}`;

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

export const ENDERECO_PADRAO_SESI =
  'nas dependências do Colégio Sesi Internacional, localizado na rua Marginal Comendador Franco | Avenida, 1341 - Jardim Botânico, Curitiba - PR, 80215-090.';

export const FECHAMENTO_PADRAO_ATA = 'Nada mais havendo a tratar, encerra-se o presente registro.';

export function formatarParticipantesAta(
  alunos: string[],
  nomeEmissor?: string,
  cargoEmissor?: string
): { textoParticipantes: string; listaAssinaturas: { nome: string; papel: string }[] } {
  const alunosLimpos = alunos.map(a => a.trim()).filter(Boolean);
  let textoEstudantes = '';

  if (alunosLimpos.length === 0) {
    textoEstudantes = 'o(a) estudante';
  } else if (alunosLimpos.length === 1) {
    textoEstudantes = `o(a) estudante ${alunosLimpos[0]}`;
  } else if (alunosLimpos.length === 2) {
    textoEstudantes = `as estudantes ${alunosLimpos[0]} e ${alunosLimpos[1]}`;
  } else {
    const ult = alunosLimpos[alunosLimpos.length - 1];
    const rest = alunosLimpos.slice(0, -1).join(', ');
    textoEstudantes = `os(as) estudantes ${rest} e ${ult}`;
  }

  const emissorNome = (nomeEmissor || 'Responsável pelo Registro').trim();
  const cargoLimpo = (cargoEmissor || 'Psicólogo Escolar').trim();
  
  // Decide artigo do profissional
  let artigo = 'o';
  const cLower = cargoLimpo.toLowerCase();
  if (cLower.startsWith('professora') || cLower.startsWith('orientadora') || cLower.startsWith('psicóloga') || cLower.startsWith('coordenadora') || cLower.startsWith('pedagoga')) {
    artigo = 'a';
  } else if (cLower.startsWith('o ') || cLower.startsWith('a ') || cLower.startsWith('o(a) ')) {
    artigo = '';
  }

  const textoProfissional = artigo ? `${artigo} ${cargoLimpo} ${emissorNome}` : `${cargoLimpo} ${emissorNome}`;
  const textoParticipantes = `realizou-se atendimento com ${textoEstudantes} e ${textoProfissional}`;

  const listaAssinaturas: { nome: string; papel: string }[] = [];

  alunosLimpos.forEach(a => {
    listaAssinaturas.push({ nome: a, papel: 'Estudante' });
  });

  if (emissorNome && emissorNome !== 'Administração') {
    listaAssinaturas.push({ nome: emissorNome, papel: cargoLimpo });
  }

  return {
    textoParticipantes,
    listaAssinaturas
  };
}

export interface EstruturaAtaCompleta {
  tituloAta: string;
  numeroAta: string;
  anoAta: string;
  textoAbertura: string;
  textoRelato: string;
  textoFechamento: string;
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

  // Se o número da ata já contiver a barra (ex: 1040/2026), extrai
  if (numAtaStr.includes('/')) {
    const parts = numAtaStr.split('/');
    numAtaStr = parts[0].trim();
    if (parts[1]) anoAtaStr = parts[1].trim();
  }

  const tituloAta = numAtaStr ? `ATA ${numAtaStr}/${anoAtaStr}` : `ATA ${anoAtaStr}`;

  // Processa lista de alunos
  let listaAlunos: string[] = [];
  if (params.alunos && params.alunos.length > 0) {
    listaAlunos = params.alunos;
  } else if (params.nomeAluno) {
    // Pode conter múltiplos nomes separados por ' e ' ou ','
    if (params.nomeAluno.includes(' e ') || params.nomeAluno.includes(',')) {
      listaAlunos = params.nomeAluno
        .split(/,|\se\s/)
        .map(s => s.trim())
        .filter(Boolean);
    } else {
      listaAlunos = [params.nomeAluno.trim()];
    }
  }

  const { textoParticipantes, listaAssinaturas } = formatarParticipantesAta(
    listaAlunos,
    params.nomeEmissor,
    params.cargoEmissor
  );

  const endereco = (params.endereco || ENDERECO_PADRAO_SESI).trim();

  // Abertura formal padrão
  const textoAbertura = `${dataExt.fraseDataExtenso}, ${textoParticipantes}, ${endereco}`;

  // Relato
  let relatoLimpo = (params.relato || '').trim();
  
  // Remove fechamento duplicado se já estiver no relato
  const fechamentoFrase = FECHAMENTO_PADRAO_ATA;
  if (relatoLimpo.toLowerCase().includes('nada mais havendo a tratar')) {
    // Garante pontuação
    relatoLimpo = relatoLimpo.replace(/nada mais havendo a tratar[^\.]*\.?/i, '').trim();
  }

  // Junta o texto corrido completo
  let textoCorridoCompleto = '';
  if (relatoLimpo) {
    textoCorridoCompleto = `${textoAbertura} ${relatoLimpo} ${fechamentoFrase}`;
  } else {
    textoCorridoCompleto = `${textoAbertura} ${fechamentoFrase}`;
  }

  // Assinaturas finais
  const assinaturas = [...listaAssinaturas];
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
    textoAbertura,
    textoRelato: relatoLimpo,
    textoFechamento: fechamentoFrase,
    textoCorridoCompleto,
    assinaturas
  };
}
