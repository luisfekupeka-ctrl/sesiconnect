import { EntradaGradeSala, PeriodoConfig } from '../types';

export interface RecomendacaoProfessor {
  nome: string;
  pontuacao: number;
  expediente: { inicio: string; fim: string } | null;
  aulasLivres: number;
  motivos: string[];
  conflito: boolean;
}

/**
 * Calcula os melhores professores para cobrir uma falta.
 */
export function buscarMelhoresSubstitutos(
  diaSemana: string,
  horariosFalta: string[], // Ex: ["08:00 - 08:50", "08:50 - 09:40"]
  turmaAlvo: string,
  todosProfessores: string[],
  gradeCompleta: EntradaGradeSala[],
  periodosDoDia: PeriodoConfig[] // Para saber total de bloques possíveis
): RecomendacaoProfessor[] {
  
  const recomendacoes: RecomendacaoProfessor[] = [];
  
  const gradeDoDia = gradeCompleta.filter(g => g.diaSemana === diaSemana);
  
  // Lista de todos os blocos de aula no dia
  const todosHorariosDia = periodosDoDia.filter(p => p.tipo !== 'intervalo' && p.tipo !== 'almoco').map(p => `${p.horarioInicio.slice(0,5)} - ${p.horarioFim.slice(0,5)}`);

  for (const prof of todosProfessores) {
    const aulasProfHoje = gradeDoDia.filter(g => g.nomeProfessor === prof);
    
    // 1. Verificar conflito direto (O professor já está dando aula em algum dos horários da falta?)
    const temConflito = horariosFalta.some(hFalta => aulasProfHoje.some(a => a.horario === hFalta));
    
    if (temConflito) {
      continue; // Ignora professores que já estão ocupados nesses horários
    }

    let pontuacao = 0;
    const motivos: string[] = [];

    // Se o professor não dá aula no dia, ele tá livre, mas fora do expediente.
    let expediente = null;
    let aulasLivres = todosHorariosDia.length;

    if (aulasProfHoje.length > 0) {
      // Ordenar aulas para achar o expediente
      const horariosOrdenados = aulasProfHoje.map(a => a.horario.split(' - ')[0]).sort();
      const horariosFimOrdenados = aulasProfHoje.map(a => a.horario.split(' - ')[1]).sort();
      
      const inicioExpediente = horariosOrdenados[0];
      const fimExpediente = horariosFimOrdenados[horariosFimOrdenados.length - 1];
      
      expediente = { inicio: inicioExpediente, fim: fimExpediente };
      
      // Aulas Livres DENTRO do expediente (janelas)
      // O total de blocos no expediente:
      const blocosNoExpediente = todosHorariosDia.filter(h => {
        const hInicio = h.split(' - ')[0];
        const hFim = h.split(' - ')[1];
        return hInicio >= inicioExpediente && hFim <= fimExpediente;
      });
      
      aulasLivres = blocosNoExpediente.length - aulasProfHoje.length;

      // 2. Está dentro do expediente?
      // A falta está dentro do horário de trabalho atual do professor?
      const faltaDentroDoExpediente = horariosFalta.every(hFalta => {
        const hInicio = hFalta.split(' - ')[0];
        const hFim = hFalta.split(' - ')[1];
        return hInicio >= inicioExpediente && hFim <= fimExpediente;
      });

      if (faltaDentroDoExpediente) {
        pontuacao += 50;
        motivos.push("Dentro do expediente atual");
      } else {
        // Se a falta for adjacente ao expediente (ex: ele sai as 10h, a falta é as 10h)
        const faltaExtendeExpediente = horariosFalta.some(hFalta => {
          const hInicio = hFalta.split(' - ')[0];
          const hFim = hFalta.split(' - ')[1];
          return hInicio === fimExpediente || hFim === inicioExpediente;
        });

        if (faltaExtendeExpediente) {
          pontuacao += 30;
          motivos.push("Pode emendar no expediente atual");
        } else {
          motivos.push("Teria que vir fora do horário");
        }
      }

      // 3. Dá aula pra mesma turma hoje?
      const daAulaParaTurma = aulasProfHoje.some(a => a.turma === turmaAlvo);
      if (daAulaParaTurma) {
        pontuacao += 20;
        motivos.push(`Já dá aula para o ${turmaAlvo} hoje`);
      }
      
    } else {
      motivos.push("Dia de folga (Nenhuma aula marcada)");
      pontuacao += 10; // Vale um pouco, mas menos que alguém que já tá no prédio
    }

    // 4. Critério de desempate: quem tem mais aulas livres ganha mais pontos
    pontuacao += aulasLivres * 2;
    if (aulasLivres > 0) motivos.push(`${aulasLivres} blocos livres hoje`);

    recomendacoes.push({
      nome: prof,
      pontuacao,
      expediente,
      aulasLivres,
      motivos,
      conflito: false
    });
  }

  // Ordenar por maior pontuação
  return recomendacoes.sort((a, b) => b.pontuacao - a.pontuacao);
}
