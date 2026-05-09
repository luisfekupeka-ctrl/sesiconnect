import {
  EstadoEscola,
  EstadoSalaAoVivo,
  EntradaGradeSala,
  Sala
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

export function obterEstadoAtualDaEscola(
  horarioAtual: Date,
  salas: Sala[],
  gradeCompleta: EntradaGradeSala[]
): EstadoEscola {
  const listaSalas = Array.isArray(salas) ? salas : [];
  const listaGrade = Array.isArray(gradeCompleta) ? gradeCompleta : [];

  const horaAtualStr = obterHoraAtualString(horarioAtual);
  const diaSemanaStr = obterDiaSemana(horarioAtual);

  const estadoSalas: EstadoSalaAoVivo[] = listaSalas.map(sala => {
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
    periodo: 'aula', // Simplificado
    blocoAtual: null,
    indiceBlocoAtual: -1,
    proximaTransicao: '--:--',
    rotuloProximaTransicao: 'Em Tempo Real',
    salas: estadoSalas,
  };
}

export function obterBlocosDeHorario(gradeCompleta: EntradaGradeSala[]): { indice: number; inicio: string; fim: string }[] {
  if (!Array.isArray(gradeCompleta)) return [];
  
  const ranges = new Set<string>();
  gradeCompleta.forEach(e => {
    if (e.horario && e.horario.includes('-')) {
      ranges.add(e.horario);
    }
  });

  return Array.from(ranges)
    .sort((a, b) => horaParaMinutos(a.split('-')[0]) - horaParaMinutos(b.split('-')[0]))
    .map((range, idx) => {
      const parts = range.split('-');
      return {
        indice: idx,
        inicio: parts[0]?.trim(),
        fim: parts[1]?.trim()
      };
    });
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