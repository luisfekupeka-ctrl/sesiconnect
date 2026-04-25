import { supabase } from '../lib/supabase';
import { 
  ProfessorConfig, 
  EventoEscola, 
  ResultadoRealocacao, 
  EntradaGradeSala 
} from '../types';

// ==========================================
// DETECÇÃO DE BLOCOS E PROFESSORES LIVRES
// ==========================================

export function detectarBlocos(professor: string, dia: string, grade: EntradaGradeSala[]): string[][] {
  const aulasDoDia = grade
    .filter(a => a.nomeProfessor === professor && a.diaSemana === dia)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const blocos: string[][] = [];
  let blocoAtual: string[] = [];

  for (let i = 0; i < aulasDoDia.length; i++) {
    const aula = aulasDoDia[i];
    
    if (blocoAtual.length === 0) {
      blocoAtual.push(aula.horario);
    } else {
      const ultimaAulaFim = blocoAtual[blocoAtual.length - 1].split(' - ')[1];
      const aulaAtualInicio = aula.horario.split(' - ')[0];

      // Se os horários são contínuos (ex: 13:45 == 13:45)
      if (ultimaAulaFim === aulaAtualInicio) {
        blocoAtual.push(aula.horario);
      } else {
        blocos.push([...blocoAtual]);
        blocoAtual = [aula.horario];
      }
    }
  }

  if (blocoAtual.length > 0) {
    blocos.push(blocoAtual);
  }

  return blocos;
}

export function encontrarProfessoresLivres(
  horario: string, 
  dia: string, 
  grade: EntradaGradeSala[],
  professoresConfig: ProfessorConfig[]
): ProfessorConfig[] {
  // Pegar todos os professores que TÊM aula nesse horário e dia
  const ocupados = new Set(
    grade
      .filter(a => a.diaSemana === dia && a.horario === horario)
      .map(a => a.nomeProfessor)
  );

  // Filtrar os que não estão ocupados
  return professoresConfig.filter(p => !ocupados.has(p.nome));
}

// ==========================================
// CENÁRIO 1: PROVA (Liberar Professor)
// ==========================================

export function calcularCenarioProva(
  evento: EventoEscola,
  grade: EntradaGradeSala[],
  professoresConfig: ProfessorConfig[]
): ResultadoRealocacao[] {
  if (!evento.professor) return [];

  const resultados: ResultadoRealocacao[] = [];
  const horariosAlvo = [...evento.horarios].sort(); // Garantir ordem
  const dia = evento.dia;

  // PASSO 2/3: Buscar professores com um bloco EXATAMENTE igual
  const candidatosTrocaCompleta: string[] = [];

  for (const p of professoresConfig) {
    if (p.nome === evento.professor) continue;

    const blocosDoProfessor = detectarBlocos(p.nome, dia, grade);
    
    // Verifica se algum bloco bate exatamente com os horariosAlvo
    const temBlocoIgual = blocosDoProfessor.some(bloco => 
      bloco.length === horariosAlvo.length && 
      bloco.every((horario, index) => horario === horariosAlvo[index])
    );

    if (temBlocoIgual) {
      candidatosTrocaCompleta.push(p.nome);
    }
  }

  // PRIORIDADE 1: Se houver alguém para troca completa
  if (candidatosTrocaCompleta.length > 0) {
    const substituto = candidatosTrocaCompleta[0]; // Pega o primeiro por simplicidade

    // Para cada horário, gera um resultado de "Troca Completa"
    for (const horario of horariosAlvo) {
      // Descobre de qual turma era a aula original do professor naquele horário
      const aulaOriginal = grade.find(a => a.nomeProfessor === evento.professor && a.diaSemana === dia && a.horario === horario);
      
      if (aulaOriginal) {
        resultados.push({
          id: Math.random().toString(36).substr(2, 9),
          eventoId: evento.id,
          tipo: 'PROVA',
          professorOriginal: evento.professor,
          professorSubstituto: substituto,
          turma: aulaOriginal.turma,
          horario,
          acao: 'Troca Completa'
        });
      }
    }

    return resultados;
  }

  // PRIORIDADE 2: Se não houver bloco completo, buscar livres por horário
  for (const horario of horariosAlvo) {
    const aulaOriginal = grade.find(a => a.nomeProfessor === evento.professor && a.diaSemana === dia && a.horario === horario);
    
    if (!aulaOriginal) continue;

    const livres = encontrarProfessoresLivres(horario, dia, grade, professoresConfig);
    
    if (livres.length > 0) {
      // Pega o primeiro livre (idealmente priorizando por área/carga, mas faremos simples)
      const substituto = livres[0];

      resultados.push({
        id: Math.random().toString(36).substr(2, 9),
        eventoId: evento.id,
        tipo: 'PROVA',
        professorOriginal: evento.professor,
        professorSubstituto: substituto.nome,
        turma: aulaOriginal.turma,
        horario,
        acao: 'Substituição' // Substituição por horário
      });
    } else {
      // Sem professor livre! Fica pendente.
    }
  }

  return resultados;
}

// ==========================================
// CENÁRIO 2: FALTA DE PROFESSOR
// ==========================================

export function calcularCenarioFalta(
  evento: EventoEscola,
  grade: EntradaGradeSala[],
  professoresConfig: ProfessorConfig[]
): ResultadoRealocacao[] {
  const resultados: ResultadoRealocacao[] = [];
  
  if (!evento.turma || evento.horarios.length === 0) return resultados;

  const dia = evento.dia;
  const horario = evento.horarios[0]; // Assumindo uma falta por horário, ou processar iterativamente se for array
  
  // Pegar a aula que será afetada
  const aulaAfetada = grade.find(a => 
    a.turma === evento.turma && 
    a.diaSemana === dia && 
    a.horario === horario
  );

  if (!aulaAfetada) return resultados;

  const professorFaltante = aulaAfetada.nomeProfessor;
  const configFaltante = professoresConfig.find(p => p.nome === professorFaltante);

  // Professores livres neste horário
  let livres = encontrarProfessoresLivres(horario, dia, grade, professoresConfig);

  // Ordenar livres por prioridade:
  // 1. Mesma disciplina
  // 2. Mesma área
  // 3. Qualquer outro
  livres.sort((a, b) => {
    // 1. Disciplina
    if (configFaltante && a.disciplina === configFaltante.disciplina && b.disciplina !== configFaltante.disciplina) return -1;
    if (configFaltante && a.disciplina !== configFaltante.disciplina && b.disciplina === configFaltante.disciplina) return 1;

    // 2. Área
    if (configFaltante && a.area === configFaltante.area && b.area !== configFaltante.area) return -1;
    if (configFaltante && a.area !== configFaltante.area && b.area === configFaltante.area) return 1;

    return 0;
  });

  // Também precisamos verificar a carga máxima (neste MVP simples não estamos somando as aulas totais deles, mas fica o placeholder da lógica)
  // const livresRespeitandoCarga = livres.filter(p => countAulas(p, dia) < p.cargaMaximaDia);
  const substituto = livres.length > 0 ? livres[0] : null;

  if (substituto) {
    resultados.push({
      id: Math.random().toString(36).substr(2, 9),
      eventoId: evento.id,
      tipo: 'FALTA',
      professorOriginal: professorFaltante,
      professorSubstituto: substituto.nome,
      turma: aulaAfetada.turma,
      horario,
      acao: 'Substituição'
    });
  }

  return resultados;
}

// ==========================================
// FUNÇÕES DE PERSISTÊNCIA (SUPABASE)
// ==========================================

export async function buscarProfessoresConfig(): Promise<ProfessorConfig[]> {
  const { data, error } = await supabase.from('professores_config').select('*');
  if (error || !data) return [];
  
  return data.map(item => ({
    id: item.id,
    nome: item.nome,
    disciplina: item.disciplina,
    cargaMaximaDia: item.carga_maxima_dia,
    area: item.area as AreaConhecimento
  }));
}

export async function salvarProfessorConfig(config: Partial<ProfessorConfig>): Promise<boolean> {
  const payload = {
    id: config.id !== 'novo' ? config.id : undefined,
    nome: config.nome,
    disciplina: config.disciplina,
    carga_maxima_dia: config.cargaMaximaDia,
    area: config.area
  };

  const { error } = await supabase.from('professores_config').upsert([payload], { onConflict: 'nome' });
  return !error;
}

export async function salvarEventoEscola(evento: Partial<EventoEscola>): Promise<string | null> {
  const payload = {
    tipo: evento.tipo,
    professor: evento.professor,
    turma: evento.turma,
    dia: evento.dia,
    horarios: evento.horarios
  };

  const { data, error } = await supabase.from('eventos_escola').insert([payload]).select().single();
  if (error || !data) {
    console.error(error);
    return null;
  }
  return data.id;
}

export async function salvarRealocacoes(realocacoes: ResultadoRealocacao[]): Promise<boolean> {
  const payload = realocacoes.map(r => ({
    evento_id: r.eventoId,
    tipo: r.tipo,
    professor_original: r.professorOriginal,
    professor_substituto: r.professorSubstituto,
    turma: r.turma,
    horario: r.horario,
    acao: r.acao
  }));

  const { error } = await supabase.from('realocacoes').insert(payload);
  return !error;
}

export async function buscarRealocacoes(): Promise<ResultadoRealocacao[]> {
  const { data, error } = await supabase.from('realocacoes').select('*').order('criado_em', { ascending: false });
  if (error || !data) return [];

  return data.map(item => ({
    id: item.id,
    eventoId: item.evento_id,
    tipo: item.tipo as TipoEventoEscola,
    professorOriginal: item.professor_original,
    professorSubstituto: item.professor_substituto,
    turma: item.turma,
    horario: item.horario,
    acao: item.acao as AcaoRealocacao
  }));
}
