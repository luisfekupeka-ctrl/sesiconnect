// ============================================================
// SESI Connect — Motor Escolar
// Função central: obterEstadoAtualDaEscola()
// Controla toda a lógica de tempo do sistema
// ============================================================

import {
  BlocoHorario,
  PeriodoEscolar,
  EstadoEscola,
  EstadoSalaAoVivo,
  EntradaGradeSala,
  Sala,
  PeriodoConfig
} from '../types';

// --- Funções auxiliares ---

function horaParaMinutos(hora: string): number {
  if (!hora || typeof hora !== 'string' || !hora.includes(':')) return 0;
  try {
    const parts = hora.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  } catch (err) {
    console.error('Erro ao processar horário:', hora, err);
    return 0;
  }
}

export function obterHoraAtualString(data: Date): string {
  return `${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
}

// --- Funções públicas ---

export function obterBlocosDeHorario(periodos: PeriodoConfig[]): BlocoHorario[] {
  return periodos
    .filter(p => p.tipo === 'aula')
    .map((p, index) => ({
      indice: index + 1,
      inicio: p.horarioInicio.slice(0, 5),
      fim: p.horarioFim.slice(0, 5),
      nome: p.nome,
      segmento: p.segmento
    }));
}

export function obterDiaSemana(data: Date): string {
  const dias = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
  return dias[data.getDay()];
}

export function estaNoHorario(horaAtual: string, horarioRange: string): boolean {
  if (!horaAtual || !horarioRange || typeof horarioRange !== 'string') return false;
  if (!horarioRange.includes('-')) return false;
  
  const parts = horarioRange.split('-');
  const inicio = parts[0]?.trim();
  const fim = parts[1]?.trim();
  if (!inicio || !fim) return false;

  const minAtual = horaParaMinutos(horaAtual);
  const minInicio = horaParaMinutos(inicio);
  const minFim = horaParaMinutos(fim);

  return minAtual >= minInicio && minAtual < minFim;
}

export function obterPeriodoEscolar(horaAtual: string, periodos: PeriodoConfig[], segmentoParaFiltrar?: string): PeriodoEscolar {
  const minAtual = horaParaMinutos(horaAtual);

  // Garantir que periodos é uma array
  const listaPeriodos = Array.isArray(periodos) ? periodos : [];

  // Filtrar períodos pelo segmento, se fornecido
  const periodosFiltrados = segmentoParaFiltrar
    ? listaPeriodos.filter(p => !p?.segmento || p.segmento === segmentoParaFiltrar)
    : listaPeriodos;

  // Encontrar o período que engloba o horário atual
  const periodoAtual = periodosFiltrados.find(p => {
    const minInicio = horaParaMinutos(p.horarioInicio);
    const minFim = horaParaMinutos(p.horarioFim);
    return minAtual >= minInicio && minAtual < minFim;
  });

  if (periodoAtual) return periodoAtual.tipo;

  // Verificar se é depois do último período (After) ou antes do primeiro (Fora)
  if (periodosFiltrados.length > 0) {
    const primeiro = periodosFiltrados[0];
    const ultimo = periodosFiltrados[periodosFiltrados.length - 1];
    if (minAtual < horaParaMinutos(primeiro.horarioInicio)) return 'fora';
    if (minAtual >= horaParaMinutos(ultimo.horarioFim)) return 'fora';
  }

  return 'fora';
}

export function obterIndiceBlocoAtual(horaAtual: string, periodos: PeriodoConfig[]): number {
  const minAtual = horaParaMinutos(horaAtual);
  const blocos = obterBlocosDeHorario(periodos);

  for (const bloco of blocos) {
    const minInicio = horaParaMinutos(bloco.inicio);
    const minFim = horaParaMinutos(bloco.fim);
    if (minAtual >= minInicio && minAtual < minFim) {
      return bloco.indice;
    }
  }
  return -1;
}

export function obterProximaTransicao(horaAtual: string, periodos: PeriodoConfig[], segmentoParaFiltrar?: string): { horario: string; rotulo: string } {
  const minAtual = horaParaMinutos(horaAtual);

  const periodosFiltrados = segmentoParaFiltrar
    ? periodos.filter(p => !p.segmento || p.segmento === segmentoParaFiltrar)
    : periodos;

  // Encontrar o próximo período que começa após o horário atual
  const proximo = periodosFiltrados.find(p => horaParaMinutos(p.horarioInicio) > minAtual);

  if (proximo) {
    return { horario: proximo.horarioInicio.slice(0, 5), rotulo: proximo.nome };
  }

  // Se não houver próximo período hoje
  if (periodosFiltrados.length > 0) {
    const ultimo = periodosFiltrados[periodosFiltrados.length - 1];
    if (minAtual < horaParaMinutos(ultimo.horarioFim)) {
      return { horario: ultimo.horarioFim.slice(0, 5), rotulo: 'Fim das atividades' };
    }
  }

  return { horario: '--:--', rotulo: 'Fim do expediente' };
}

export function obterRotuloPeriodo(periodo: PeriodoEscolar): string {
  const rotulos: Record<PeriodoEscolar, string> = {
    aula: '🟢 Aula em andamento',
    intervalo: '🔴 Intervalo',
    almoco: '🍽️ Almoço',
    after: '🟡 After School',
    fora: '⚪ Fora do expediente',
  };
  return rotulos[periodo];
}

export function obterCorPeriodo(periodo: PeriodoEscolar): string {
  const cores: Record<PeriodoEscolar, string> = {
    aula: '#10b981',
    intervalo: '#ef4444',
    almoco: '#f59e0b',
    after: '#8b5cf6',
    fora: '#6b7280',
  };
  return cores[periodo];
}

export function obterEstadoAtualDaEscola(
  horarioAtual: Date,
  salas: Sala[],
  gradeCompleta: EntradaGradeSala[],
  periodos: PeriodoConfig[]
): EstadoEscola {
  const listaSalas = Array.isArray(salas) ? salas : [];
  const listaGrade = Array.isArray(gradeCompleta) ? gradeCompleta : [];
  const listaPeriodos = Array.isArray(periodos) ? periodos : [];

  const horaAtualStr = obterHoraAtualString(horarioAtual);
  const diaSemanaStr = obterDiaSemana(horarioAtual);

  // Período global 
  const periodoGlobal = obterPeriodoEscolar(horaAtualStr, listaPeriodos);
  const transicaoGlobal = obterProximaTransicao(horaAtualStr, listaPeriodos);

  const indiceBlocoAtual = obterIndiceBlocoAtual(horaAtualStr, listaPeriodos);
  const blocoAtual = obterBlocosDeHorario(listaPeriodos).find(b => b.indice === indiceBlocoAtual) || null;

  const estadoSalas: EstadoSalaAoVivo[] = listaSalas.map(sala => {
    // Detectar o período Específico deste segmento
    const periodoSala = obterPeriodoEscolar(horaAtualStr, listaPeriodos, sala.segmento);

    // Busca o que está agendado na grade para esta sala agora
    const entrada = listaGrade.find(
      e => e.numeroSala === sala.numero &&
        e.diaSemana === diaSemanaStr &&
        estaNoHorario(horaAtualStr, e.horario)
    );

    if (entrada) {
      const ocupada = !['almoco', 'permanencia', 'vazio'].includes(entrada.tipo);
      return {
        numeroSala: sala.numero,
        nomeSala: sala.nome,
        anoTurma: sala.ano,
        estaOcupada: ocupada,
        professorAtual: entrada.nomeProfessor,
        materiaAtual: entrada.materia || (entrada.tipo === 'almoco' ? 'ALMOÇO' : 'LIVRE'),
        turmaAtual: entrada.turma,
        horarioFim: entrada.horario.split('-')[1]?.trim(),
        tipoBlocoAtual: entrada.tipo,
      };
    }

    return {
      numeroSala: sala.numero,
      nomeSala: sala.nome,
      anoTurma: sala.ano,
      estaOcupada: false,
    };
  });

  return {
    periodo: periodoGlobal,
    blocoAtual,
    indiceBlocoAtual,
    proximaTransicao: transicaoGlobal.horario,
    rotuloProximaTransicao: transicaoGlobal.rotulo,
    salas: estadoSalas,
  };
}

export function extrairProfessores(gradeCompleta: EntradaGradeSala[]): string[] {
  const nomes = new Set<string>();
  gradeCompleta.forEach(e => {
    if (e.nomeProfessor) nomes.add(e.nomeProfessor);
  });
  return Array.from(nomes).sort();
}

export function obterAgendaProfessor(
  nomeProfessor: string,
  diaSemana: string,
  gradeCompleta: EntradaGradeSala[]
): EntradaGradeSala[] {
  return gradeCompleta
    .filter(e => e.nomeProfessor === nomeProfessor && e.diaSemana === diaSemana)
    .sort((a, b) => horaParaMinutos(a.horario.split('-')[0]) - horaParaMinutos(b.horario.split('-')[0]));
}

export function obterLocalizacaoProfessor(
  nomeProfessor: string,
  horarioAtual: Date,
  gradeCompleta: EntradaGradeSala[]
): EntradaGradeSala | null {
  const horaAtual = obterHoraAtualString(horarioAtual);
  const diaSemana = obterDiaSemana(horarioAtual);

  return gradeCompleta.find(
    e => e.nomeProfessor === nomeProfessor &&
      e.diaSemana === diaSemana &&
      estaNoHorario(horaAtual, e.horario)
  ) || null;
}