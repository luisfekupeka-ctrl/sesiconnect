// ============================================================
// SESI Connect — Contexto Global da Escola
// Provedor de dados em tempo real (Supabase)
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { normalizarNomeComum } from '../lib/utils';
import {
  EstadoEscola,
  Sala,
  EntradaGradeSala,
  Aluno,
  LanguageLabRecord,
  AtividadeAfter,
  Monitor,
  GradeMonitor,
  ModeloFormulario,
  RegistroOcorrencia,
  Professor,
  ProfessorCMS,
  LocalCMS,
  PeriodoConfig,
} from '../types';
import {
  obterEstadoAtualDaEscola,
  obterDiaSemana,
  extrairProfessores,
  obterAgendaProfessor,
  obterLocalizacaoProfessor,
} from '../services/motorEscolar';
import { buscarRealocacoes } from '../services/motorRealocacao';
import {
  buscarSalas,
  buscarMapaSalas,
  buscarAlunos,
  buscarLanguageLab,
  buscarAtividadesAfter,
  buscarMonitores,
  buscarModelosFormulario,
  buscarOcorrencias,
  buscarProfessoresCMS,
  buscarLocaisCMS,
  buscarGradeMonitores,
  buscarPeriodos,
} from '../services/dataService';
import { ResultadoRealocacao } from '../types';

interface ContextoEscolaType {
  estadoEscola: EstadoEscola;
  horaAtual: Date;
  salas: Sala[];
  gradeCompleta: EntradaGradeSala[];
  gradeBase: EntradaGradeSala[];
  alunos: Aluno[];
  languageLab: LanguageLabRecord[];
  atividadesAfter: AtividadeAfter[];
  monitores: Monitor[];
  professores: Professor[];
  professoresCMS: ProfessorCMS[];
  locaisCMS: LocalCMS[];
  modelosFormulario: ModeloFormulario[];
  ocorrencias: RegistroOcorrencia[];
  gradeMonitores: GradeMonitor[];
  periodos: PeriodoConfig[];
  adicionarOcorrencia: (ocorrencia: RegistroOcorrencia) => void;
  carregando: boolean;
  atualizar: () => void;
}

const Contexto = createContext<ContextoEscolaType | null>(null);

export function ProvedorEscola({ children }: { children: ReactNode }) {
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [salas, setSalas] = useState<Sala[]>([]);
  const [gradeCompleta, setGradeCompleta] = useState<EntradaGradeSala[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [languageLab, setLanguageLab] = useState<LanguageLabRecord[]>([]);
  const [atividadesAfter, setAtividadesAfter] = useState<AtividadeAfter[]>([]);
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [professoresCMS, setProfessoresCMS] = useState<ProfessorCMS[]>([]);
  const [locaisCMS, setLocaisCMS] = useState<LocalCMS[]>([]);
  const [modelosFormulario, setModelosFormulario] = useState<ModeloFormulario[]>([]);
  const [ocorrencias, setOcorrencias] = useState<RegistroOcorrencia[]>([]);
  const [gradeMonitores, setGradeMonitores] = useState<GradeMonitor[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoConfig[]>([]);
  const [realocacoes, setRealocacoes] = useState<ResultadoRealocacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [s, g, a, li, aa, m, mf, oc, pCms, lCms, gm, periodosDB, realocDB] = await Promise.all([
        buscarSalas(),
        buscarMapaSalas(),
        buscarAlunos(),
        buscarLanguageLab(),
        buscarAtividadesAfter(),
        buscarMonitores(),
        buscarModelosFormulario(),
        buscarOcorrencias(),
        buscarProfessoresCMS(),
        buscarLocaisCMS(),
        buscarGradeMonitores(),
        buscarPeriodos(),
        buscarRealocacoes(),
      ]);

      setProfessoresCMS(pCms || []);
      setAlunos(a || []);
      setGradeCompleta(g || []);
      setSalas(s || []);
      setAtividadesAfter(aa);
      setLocaisCMS(lCms);
      setOcorrencias(oc);
      setLanguageLab(li || []);
      setGradeMonitores(gm || []);
      setMonitores(m || []);
      setRealocacoes(realocDB || []);

      if (mf && mf.length > 0) {
        setModelosFormulario(mf);
      } else {
        setModelosFormulario([
          {
            id: '11111111-1111-1111-1111-111111111111',
            nome: 'Ocorrência Disciplinar',
            descricao: 'Registre ocorrências disciplinares de alunos com categoria e descrição detalhada.',
            campos: [
              { id: 'f-aluno', rotulo: 'Aluno', tipo: 'autocomplete_aluno', obrigatorio: true },
              { id: 'f-tipo', rotulo: 'Tipo de Ocorrência', tipo: 'selecao', obrigatorio: true, opcoes: ['Atraso', 'Indisciplina', 'Falta', 'Elogio', 'Outro'] },
              { id: 'f-desc', rotulo: 'Descrição', tipo: 'area_texto', obrigatorio: true },
              { id: 'f-prof', rotulo: 'Professor Responsável', tipo: 'texto', obrigatorio: false },
            ],
            criadoEm: new Date().toISOString(),
          },
        ]);
      }

      if (periodosDB && periodosDB.length > 0) {
        setPeriodos(periodosDB as PeriodoConfig[]);
      } else {
        console.warn('[AVISO] Nenhum período encontrado no banco. Verifique a tabela periodos_escolares.');
        setPeriodos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraAtual(new Date());
    }, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // ============================================================
  // MOTOR DE CRUZAMENTO INTELIGENTE (HERANÇA DE DADOS)
  // ============================================================
  const gradeProcessada = useMemo(() => {
    const listCanonNames = (professoresCMS || []).map(p => p.nome);
    const dataAtualString = horaAtual.toISOString().split('T')[0];
    const diaSemanaStr = obterDiaSemana(horaAtual);

    const realocacoesHoje = realocacoes.filter(
      r => r.dia === dataAtualString && r.status === 'EFETIVADO'
    );

    return gradeCompleta.map(slot => {
      let nomeProf = slot.nomeProfessor;
      if (nomeProf && listCanonNames.length > 0) {
        nomeProf = normalizarNomeComum(nomeProf, listCanonNames);
      }
      const slotComProfNormalizado = { ...slot, nomeProfessor: nomeProf };

      // Apply Realocation/Substitution Overrides if matched
      if (slot.diaSemana === diaSemanaStr) {
        const realoc = realocacoesHoje.find(r => {
          if (r.horario !== slot.horario) return false;

          const matchSala = 
            r.turma === slot.turma ||
            r.turma.includes(slot.turma) ||
            r.turma.includes(slot.nomeSala) ||
            r.turma.includes(`Sala ${slot.numeroSala}`);
          
          return matchSala;
        });

        if (realoc) {
          if (realoc.tipo === 'PROVA') {
            return {
              ...slotComProfNormalizado,
              materia: 'APLICAÇÃO DE PROVA',
              nomeProfessor: realoc.professorSubstituto,
              tipo: 'regular',
            };
          } else if (realoc.tipo === 'FALTA' || realoc.tipo === 'SUBSTITUICAO') {
            if (realoc.professorOriginal?.trim().toLowerCase() === slot.nomeProfessor?.trim().toLowerCase()) {
              return {
                ...slotComProfNormalizado,
                nomeProfessor: realoc.professorSubstituto,
                tipo: 'regular',
              };
            }
          }
        }
      }

      const tipoAtividade = slot.tipo || 'regular';
      const slotInicio = slot.horario?.split('-')[0]?.trim() || '';

      // 1. Matriz Language Lab
      if (tipoAtividade === 'language_lab') {
        const labMatch = languageLab.find(lab => {
          const salaStr = String(slot.numeroSala || '');
          const nomeSalaStr = slot.nomeSala || '';
          return lab.diaSemana === slot.diaSemana &&
                 ((lab.sala || '').includes(salaStr) || (lab.sala || '').includes(nomeSalaStr)) &&
                 lab.horarioInicio <= slotInicio && lab.horarioFim > slotInicio;
        });
        if (labMatch) {
          return { 
            ...slotComProfNormalizado, 
            materia: `Lab: ${labMatch.nivel}`, 
            nomeProfessor: labMatch.professor, 
            listaAlunos: labMatch.listaAlunos || [], 
            tipo: 'language_lab' 
          };
        } else {
          return {
            ...slotComProfNormalizado,
            materia: 'Language Lab (Não Agendado)',
            nomeProfessor: 'A DEFINIR',
            listaAlunos: [],
            tipo: 'language_lab'
          };
        }
      }

      // 2. Matriz After School
      if (tipoAtividade === 'after_school') {
        const afterMatch = atividadesAfter.find(after => {
          const salaStr = String(slot.numeroSala || '');
          const nomeSalaStr = slot.nomeSala || '';
          return (after.dias || []).includes(slot.diaSemana) &&
                 ((after.local || '').includes(salaStr) || (after.local || '').includes(nomeSalaStr)) &&
                 after.horarioInicio <= slotInicio && after.horarioFim > slotInicio;
        });
        if (afterMatch) {
          return { 
            ...slotComProfNormalizado, 
            materia: `After: ${afterMatch.nome}`, 
            nomeProfessor: afterMatch.nomeProfessor, 
            listaAlunos: afterMatch.listaAlunos || [], 
            tipo: 'after_school' 
          };
        } else {
          return {
            ...slotComProfNormalizado,
            materia: 'After School (Não Agendado)',
            nomeProfessor: 'A DEFINIR',
            listaAlunos: [],
            tipo: 'after_school'
          };
        }
      }

      // 3. Matriz de Sala (Aula Regular) - Busca nos locais cadastrados no CMS
      const localCmsMatch = locaisCMS.find(l => 
        (slot.numeroSala && l.numero === slot.numeroSala) || 
        (slot.nomeSala && l.nome === slot.nomeSala)
      );
      if (localCmsMatch && localCmsMatch.lista_alunos && localCmsMatch.lista_alunos.length > 0) {
        if (!slot.listaAlunos || slot.listaAlunos.length === 0) {
          return { ...slotComProfNormalizado, listaAlunos: localCmsMatch.lista_alunos, tipo: 'regular' };
        }
      }

      // Fallback: Turma Base (Se não houver matriz de sala nem alunos na grade)
      if (!slot.listaAlunos || slot.listaAlunos.length === 0) {
        const alunosDaTurma = (alunos || []).filter(a => a.turma === slot.turma).map(a => a.nome);
        return { ...slotComProfNormalizado, listaAlunos: alunosDaTurma, tipo: 'regular' };
      }

      return slotComProfNormalizado;
    });
  }, [gradeCompleta, languageLab, atividadesAfter, alunos, locaisCMS, professoresCMS, realocacoes, horaAtual]);

  let estadoEscola: EstadoEscola;
  try {
    estadoEscola = obterEstadoAtualDaEscola(horaAtual, salas || [], gradeProcessada || []);
  } catch (err) {
    console.error('Erro crítico no motor escolar:', err);
    estadoEscola = {
      periodo: 'fora',
      blocoAtual: null,
      indiceBlocoAtual: -1,
      proximaTransicao: '--:--',
      rotuloProximaTransicao: 'Erro no Sistema',
      salas: [],
    };
  }

  const professores: Professor[] = useMemo(() => {
    const nomes = extrairProfessores(gradeProcessada);
    const diaSemana = obterDiaSemana(horaAtual);

    return nomes.map((nome, i) => {
      const localizacao = obterLocalizacaoProfessor(nome, horaAtual, gradeProcessada);
      const agenda = obterAgendaProfessor(nome, diaSemana, gradeProcessada);
      const horaStr = `${horaAtual.getHours().toString().padStart(2, '0')}:${horaAtual.getMinutes().toString().padStart(2, '0')}`;
      let status: Professor['status'] = 'presente';
      if (localizacao) {
        status = 'em_aula';
      }

      // Encontrar a próxima aula (aquela que começa após o horário atual)
      const proximaAula = agenda.find(e => {
        const horaInicioAula = e.horario.split('-')[0].trim();
        const [h, m] = horaStr.split(':').map(Number);
        const [ah, am] = horaInicioAula.split(':').map(Number);
        return (ah > h) || (ah === h && am > m);
      });

      // Encontrar a matéria principal
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
        horarioProximaAula: proximaAula?.horario.split('-')[0].trim(),
        agendaDoDia: agenda,
      };
    });
  }, [gradeProcessada, horaAtual]);

  const adicionarOcorrencia = useCallback((ocorrencia: RegistroOcorrencia) => {
    setOcorrencias(prev => [ocorrencia, ...prev]);
  }, []);

  const atualizar = carregarDados;

  return (
    <Contexto.Provider value={{
      estadoEscola,
      horaAtual,
      salas,
      gradeCompleta: gradeProcessada,
      gradeBase: gradeCompleta,
      alunos,
      languageLab,
      atividadesAfter,
      monitores,
      professores,
      professoresCMS,
      locaisCMS,
      modelosFormulario,
      ocorrencias,
      gradeMonitores,
      periodos,
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
