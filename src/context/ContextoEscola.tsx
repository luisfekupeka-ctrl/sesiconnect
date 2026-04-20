// ============================================================
// SESI Connect — Contexto Global da Escola
// Provedor de dados para todas as abas
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  EstadoEscola,
  Sala,
  EntradaGradeSala,
  Aluno,
  NivelIdioma,
  AtividadeAfter,
  Monitor,
  ModeloFormulario,
  RegistroOcorrencia,
  Professor,
  PeriodoEscolar,
} from '../types';
import {
  obterEstadoAtualDaEscola,
  obterBlocosDeHorario,
  obterDiaSemana,
  extrairProfessores,
  obterAgendaProfessor,
  obterLocalizacaoProfessor,
  obterPeriodoEscolar,
} from '../services/motorEscolar';
import {
  salas as salasMock,
  gradeCompleta as gradeMock,
  alunos as alunosMock,
  laboratorioIdiomas as labMock,
  atividadesAfter as afterMock,
  monitores as monitoresMock,
  modelosFormulario as modelosMock,
  ocorrenciasMock,
} from '../services/dataService';

interface ContextoEscolaType {
  // Estado em tempo real
  estadoEscola: EstadoEscola;
  horaAtual: Date;

  // Dados base
  salas: Sala[];
  gradeCompleta: EntradaGradeSala[];
  alunos: Aluno[];
  laboratorioIdiomas: NivelIdioma[];
  atividadesAfter: AtividadeAfter[];
  monitores: Monitor[];

  // Dados derivados
  professores: Professor[];

  // Formulários
  modelosFormulario: ModeloFormulario[];
  ocorrencias: RegistroOcorrencia[];
  adicionarOcorrencia: (ocorrencia: RegistroOcorrencia) => void;

  // Controle
  carregando: boolean;
  atualizar: () => void;
}

const Contexto = createContext<ContextoEscolaType | null>(null);

export function ProvedorEscola({ children }: { children: ReactNode }) {
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [salas] = useState<Sala[]>(salasMock);
  const [gradeCompleta] = useState<EntradaGradeSala[]>(gradeMock);
  const [alunos] = useState<Aluno[]>(alunosMock);
  const [laboratorioIdiomas] = useState<NivelIdioma[]>(labMock);
  const [atividadesAfter] = useState<AtividadeAfter[]>(afterMock);
  const [monitores] = useState<Monitor[]>(monitoresMock);
  const [modelosFormulario] = useState<ModeloFormulario[]>(modelosMock);
  const [ocorrencias, setOcorrencias] = useState<RegistroOcorrencia[]>(ocorrenciasMock);
  const [carregando] = useState(false);

  // Atualizar relógio a cada 30 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraAtual(new Date());
    }, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Calcular estado da escola
  const estadoEscola = obterEstadoAtualDaEscola(horaAtual, salas, gradeCompleta);

  // Derivar professores da grade
  const professores: Professor[] = (() => {
    const nomes = extrairProfessores(gradeCompleta);
    const diaSemana = obterDiaSemana(horaAtual);

    return nomes.map((nome, i) => {
      const localizacao = obterLocalizacaoProfessor(nome, horaAtual, gradeCompleta);
      const agenda = obterAgendaProfessor(nome, diaSemana, gradeCompleta);
      const horaStr = `${horaAtual.getHours().toString().padStart(2, '0')}:${horaAtual.getMinutes().toString().padStart(2, '0')}`;
      const periodo = obterPeriodoEscolar(horaStr);

      let status: Professor['status'] = 'presente';
      if (localizacao && periodo === 'aula') {
        status = 'em_aula';
      }

      // Encontrar a próxima aula
      const blocoAtual = estadoEscola.indiceBlocoAtual;
      const proximaAula = agenda.find(e => e.indiceBlocoHorario > blocoAtual);
      const blocosHorario = obterBlocosDeHorario();
      const blocoProximo = proximaAula ? blocosHorario.find(b => b.indice === proximaAula.indiceBlocoHorario) : null;

      // Encontrar a matéria principal (mais frequente na agenda)
      const materias = agenda.map(e => e.materia);
      const matContador: Record<string, number> = {};
      materias.forEach(m => { matContador[m] = (matContador[m] || 0) + 1; });
      const materiaPrincipal = Object.entries(matContador).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      return {
        id: `prof-${i + 1}`,
        nome,
        materia: materiaPrincipal,
        status,
        salaAtual: localizacao ? `Sala ${localizacao.numeroSala.toString().padStart(2, '0')}` : undefined,
        proximaAula: proximaAula?.materia,
        horarioProximaAula: blocoProximo?.inicio,
        agendaDoDia: agenda,
      };
    });
  })();

  const adicionarOcorrencia = useCallback((ocorrencia: RegistroOcorrencia) => {
    setOcorrencias(prev => [ocorrencia, ...prev]);
  }, []);

  const atualizar = useCallback(() => {
    setHoraAtual(new Date());
  }, []);

  return (
    <Contexto.Provider value={{
      estadoEscola,
      horaAtual,
      salas,
      gradeCompleta,
      alunos,
      laboratorioIdiomas,
      atividadesAfter,
      monitores,
      professores,
      modelosFormulario,
      ocorrencias,
      adicionarOcorrencia,
      carregando,
      atualizar,
    }}>
      {children}
    </Contexto.Provider>
  );
}

export function useEscola() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useEscola deve ser usado dentro de ProvedorEscola');
  return ctx;
}
