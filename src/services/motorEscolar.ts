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
  Sala
} from '../types';

// --- Grade fixa de horários (blocos de 45 min) ---

const BLOCOS_HORARIO: BlocoHorario[] = [
  { indice: 1, inicio: '08:00', fim: '08:45' },
  { indice: 2, inicio: '08:45', fim: '09:30' },
  // Intervalo: 09:30 → 09:50
  { indice: 3, inicio: '09:50', fim: '10:35' },
  { indice: 4, inicio: '10:35', fim: '11:20' },
  { indice: 5, inicio: '11:20', fim: '12:05' },
  // Almoço: 12:05 → 13:05
  { indice: 6, inicio: '13:05', fim: '13:50' },
  { indice: 7, inicio: '13:50', fim: '14:35' },
  { indice: 8, inicio: '14:35', fim: '15:20' },
  { indice: 9, inicio: '15:20', fim: '15:35' },
];

const INTERVALO = { inicio: '09:30', fim: '09:50', rotulo: 'Intervalo' };
const ALMOCO = { inicio: '12:05', fim: '13:05', rotulo: 'Almoço' };
const INICIO_AULAS = '08:00';
const FIM_AULAS = '15:35';

// --- Funções auxiliares ---

function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function minutosParaHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function obterHoraAtualString(data: Date): string {
  return `${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
}

// --- Funções públicas ---

export function obterBlocosDeHorario(): BlocoHorario[] {
  return [...BLOCOS_HORARIO];
}

export function obterDiaSemana(data: Date): number {
  const dia = data.getDay(); // 0=Dom, 1=Seg...
  return dia;
}

export function obterPeriodoEscolar(horaAtual: string): PeriodoEscolar {
  const minAtual = horaParaMinutos(horaAtual);
  const minInicio = horaParaMinutos(INICIO_AULAS);
  const minFim = horaParaMinutos(FIM_AULAS);
  const minIntervaloInicio = horaParaMinutos(INTERVALO.inicio);
  const minIntervaloFim = horaParaMinutos(INTERVALO.fim);
  const minAlmocoInicio = horaParaMinutos(ALMOCO.inicio);
  const minAlmocoFim = horaParaMinutos(ALMOCO.fim);

  if (minAtual < minInicio) return 'fora';
  if (minAtual >= minIntervaloInicio && minAtual < minIntervaloFim) return 'intervalo';
  if (minAtual >= minAlmocoInicio && minAtual < minAlmocoFim) return 'almoco';
  if (minAtual >= minFim) return 'after';
  return 'aula';
}

export function obterIndiceBlocoAtual(horaAtual: string): number {
  const minAtual = horaParaMinutos(horaAtual);

  for (const bloco of BLOCOS_HORARIO) {
    const minInicio = horaParaMinutos(bloco.inicio);
    const minFim = horaParaMinutos(bloco.fim);
    if (minAtual >= minInicio && minAtual < minFim) {
      return bloco.indice;
    }
  }
  return -1; // Fora de qualquer bloco (intervalo/almoço/after)
}

export function obterProximaTransicao(horaAtual: string): { horario: string; rotulo: string } {
  const minAtual = horaParaMinutos(horaAtual);
  const periodo = obterPeriodoEscolar(horaAtual);

  if (periodo === 'fora') {
    return { horario: INICIO_AULAS, rotulo: 'Início das aulas' };
  }

  if (periodo === 'intervalo') {
    return { horario: INTERVALO.fim, rotulo: 'Fim do intervalo' };
  }

  if (periodo === 'almoco') {
    return { horario: ALMOCO.fim, rotulo: 'Fim do almoço' };
  }

  if (periodo === 'after') {
    return { horario: '--:--', rotulo: 'Período after' };
  }

  // Durante aula — encontrar fim do bloco atual
  const indiceAtual = obterIndiceBlocoAtual(horaAtual);
  if (indiceAtual > 0) {
    const blocoAtual = BLOCOS_HORARIO.find(b => b.indice === indiceAtual);
    if (blocoAtual) {
      const minFimBloco = horaParaMinutos(blocoAtual.fim);

      // Verificar se após este bloco vem intervalo ou almoço
      if (blocoAtual.fim === INTERVALO.inicio) {
        return { horario: blocoAtual.fim, rotulo: 'Intervalo' };
      }
      if (blocoAtual.fim === ALMOCO.inicio) {
        return { horario: blocoAtual.fim, rotulo: 'Almoço' };
      }
      if (blocoAtual.fim === FIM_AULAS) {
        return { horario: blocoAtual.fim, rotulo: 'Fim das aulas' };
      }

      return { horario: blocoAtual.fim, rotulo: 'Próxima aula' };
    }
  }

  return { horario: FIM_AULAS, rotulo: 'Fim das aulas' };
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

// --- FUNÇÃO PRINCIPAL ---

export function obterEstadoAtualDaEscola(
  horarioAtual: Date,
  salas: Sala[],
  gradeCompleta: EntradaGradeSala[]
): EstadoEscola {
  const horaAtual = obterHoraAtualString(horarioAtual);
  const diaSemana = obterDiaSemana(horarioAtual);
  const periodo = obterPeriodoEscolar(horaAtual);
  const indiceBlocoAtual = obterIndiceBlocoAtual(horaAtual);
  const blocoAtual = BLOCOS_HORARIO.find(b => b.indice === indiceBlocoAtual) || null;
  const transicao = obterProximaTransicao(horaAtual);

  // Construir estado ao vivo de cada sala
  const estadoSalas: EstadoSalaAoVivo[] = salas.map(sala => {
    // Buscar entrada da grade para esta sala, este dia, este bloco
    const entrada = gradeCompleta.find(
      e => e.numeroSala === sala.numero &&
           e.diaSemana === diaSemana &&
           e.indiceBlocoHorario === indiceBlocoAtual
    );

    if (entrada && periodo === 'aula') {
      return {
        numeroSala: sala.numero,
        estaOcupada: true,
        professorAtual: entrada.nomeProfessor,
        materiaAtual: entrada.materia,
        turmaAtual: entrada.turma,
        horarioFim: blocoAtual?.fim,
        tipoBlocoAtual: entrada.tipo,
      };
    }

    return {
      numeroSala: sala.numero,
      estaOcupada: false,
    };
  });

  return {
    periodo,
    blocoAtual,
    indiceBlocoAtual,
    proximaTransicao: transicao.horario,
    rotuloProximaTransicao: transicao.rotulo,
    salas: estadoSalas,
  };
}

// Função para extrair professores únicos da grade (professores são DERIVADOS das salas)
export function extrairProfessores(gradeCompleta: EntradaGradeSala[]): string[] {
  const nomes = new Set<string>();
  gradeCompleta.forEach(e => {
    if (e.nomeProfessor) nomes.add(e.nomeProfessor);
  });
  return Array.from(nomes).sort();
}

// Obter agenda do dia de um professor
export function obterAgendaProfessor(
  nomeProfessor: string,
  diaSemana: number,
  gradeCompleta: EntradaGradeSala[]
): EntradaGradeSala[] {
  return gradeCompleta
    .filter(e => e.nomeProfessor === nomeProfessor && e.diaSemana === diaSemana)
    .sort((a, b) => a.indiceBlocoHorario - b.indiceBlocoHorario);
}

// Obter onde o professor está agora
export function obterLocalizacaoProfessor(
  nomeProfessor: string,
  horarioAtual: Date,
  gradeCompleta: EntradaGradeSala[]
): EntradaGradeSala | null {
  const horaAtual = obterHoraAtualString(horarioAtual);
  const diaSemana = obterDiaSemana(horarioAtual);
  const indiceBlocoAtual = obterIndiceBlocoAtual(horaAtual);

  return gradeCompleta.find(
    e => e.nomeProfessor === nomeProfessor &&
         e.diaSemana === diaSemana &&
         e.indiceBlocoHorario === indiceBlocoAtual
  ) || null;
}
