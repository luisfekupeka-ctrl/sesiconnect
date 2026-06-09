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
  const [salas, setSalas] = useState<Sala[]>(() => {
    try {
      const cached = localStorage.getItem('sesiconnect_cache_salas');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [gradeCompleta, setGradeCompleta] = useState<EntradaGradeSala[]>(() => {
    try {
      const cached = localStorage.getItem('sesiconnect_cache_gradeCompleta');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    try {
      const cached = localStorage.getItem('sesiconnect_cache_alunos');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [languageLab, setLanguageLab] = useState<LanguageLabRecord[]>([]);
  const [atividadesAfter, setAtividadesAfter] = useState<AtividadeAfter[]>([]);
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [professoresCMS, setProfessoresCMS] = useState<ProfessorCMS[]>(() => {
    try {
      const cached = localStorage.getItem('sesiconnect_cache_professoresCMS');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [locaisCMS, setLocaisCMS] = useState<LocalCMS[]>(() => {
    try {
      const cached = localStorage.getItem('sesiconnect_cache_locaisCMS');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [modelosFormulario, setModelosFormulario] = useState<ModeloFormulario[]>([]);
  const [ocorrencias, setOcorrencias] = useState<RegistroOcorrencia[]>([]);
  const [gradeMonitores, setGradeMonitores] = useState<GradeMonitor[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoConfig[]>(() => {
    try {
      const cached = localStorage.getItem('sesiconnect_cache_periodos');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [realocacoes, setRealocacoes] = useState<ResultadoRealocacao[]>([]);
  const [carregando, setCarregando] = useState(() => {
    try {
      const cachedSalas = localStorage.getItem('sesiconnect_cache_salas');
      const cachedGrade = localStorage.getItem('sesiconnect_cache_gradeCompleta');
      return !(cachedSalas && cachedGrade);
    } catch { return true; }
  });

  const carregarDados = useCallback(async () => {
    // Sincronização assíncrona progressiva (SWR) com o Supabase
    const syncTasks = [
      buscarSalas().then(data => {
        if (data) {
          setSalas(data);
          localStorage.setItem('sesiconnect_cache_salas', JSON.stringify(data));
        }
      }),
      buscarMapaSalas().then(data => {
        if (data) {
          setGradeCompleta(data);
          localStorage.setItem('sesiconnect_cache_gradeCompleta', JSON.stringify(data));
        }
      }),
      buscarAlunos().then(data => {
        if (data) {
          setAlunos(data);
          localStorage.setItem('sesiconnect_cache_alunos', JSON.stringify(data));
        }
      }),
      buscarLanguageLab().then(setLanguageLab),
      buscarAtividadesAfter().then(setAtividadesAfter),
      buscarMonitores().then(setMonitores),
      buscarModelosFormulario().then(mf => {
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
                { id: 'f-prof', rotulo: 'Responsável', tipo: 'texto', obrigatorio: false },
              ],
              criadoEm: new Date().toISOString(),
            },
          ]);
        }
      }),
      buscarOcorrencias().then(setOcorrencias),
      buscarProfessoresCMS().then(data => {
        if (data) {
          setProfessoresCMS(data);
          localStorage.setItem('sesiconnect_cache_professoresCMS', JSON.stringify(data));
        }
      }),
      buscarLocaisCMS().then(data => {
        if (data) {
          setLocaisCMS(data);
          localStorage.setItem('sesiconnect_cache_locaisCMS', JSON.stringify(data));
        }
      }),
      buscarGradeMonitores().then(setGradeMonitores),
      buscarPeriodos().then(data => {
        if (data && data.length > 0) {
          setPeriodos(data);
          localStorage.setItem('sesiconnect_cache_periodos', JSON.stringify(data));
        }
      }),
      buscarRealocacoes().then(setRealocacoes),
    ];

    try {
      await Promise.all(syncTasks);
    } catch (error) {
      console.error('Erro ao sincronizar dados do Supabase:', error);
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

    const matchedAfterIds = new Set<string>();
    const matchedLabIds = new Set<string>();

    const slotsProcessados = gradeCompleta.map(slot => {
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
      const salaStr = String(slot.numeroSala || '');
      const nomeSalaStr = slot.nomeSala || '';

      // Tenta encontrar por vínculo direto (ID) primeiro
      let labMatch = null;
      let afterMatch = null;

      if (slot.vinculado_id) {
        labMatch = languageLab.find(l => l.id === slot.vinculado_id);
        afterMatch = atividadesAfter.find(a => a.id === slot.vinculado_id);
      }

      if (!labMatch && !afterMatch) {
        // 1. Cruzamento prioritário de dados com o Language Lab (para qualquer slot)
        labMatch = languageLab.find(lab => {
          return lab.diaSemana === slot.diaSemana &&
                 ((lab.sala || '').includes(salaStr) || (lab.sala || '').includes(nomeSalaStr)) &&
                 (lab.horarioInicio?.slice(0, 5) || '') <= slotInicio && (lab.horarioFim?.slice(0, 5) || '') > slotInicio;
        });
      }

      if (labMatch) {
        matchedLabIds.add(labMatch.id);
        return { 
          ...slotComProfNormalizado, 
          materia: `Lab: ${labMatch.nivel}`, 
          nomeProfessor: labMatch.professor, 
          listaAlunos: labMatch.listaAlunos || [], 
          tipo: 'language_lab',
          vinculado_id: labMatch.id
        };
      }

      if (!afterMatch) {
        // 2. Cruzamento prioritário de dados com o After School (para qualquer slot)
        afterMatch = atividadesAfter.find(after => {
          if (!(after.dias || []).includes(slot.diaSemana)) return false;

          let localEspecifico = '';
          if (after.local) {
            try {
              const obj = JSON.parse(after.local);
              if (obj && typeof obj === 'object') {
                localEspecifico = obj[slot.diaSemana] || '';
              } else {
                localEspecifico = after.local;
              }
            } catch (e) {
              localEspecifico = after.local;
            }
          }

          const localMatch = localEspecifico && (
            localEspecifico.includes(salaStr) || 
            localEspecifico.includes(nomeSalaStr) || 
            salaStr.includes(localEspecifico) || 
            nomeSalaStr.includes(localEspecifico)
          );

          return localMatch && (after.horarioInicio?.slice(0, 5) || '') <= slotInicio && (after.horarioFim?.slice(0, 5) || '') > slotInicio;
        });
      }

      if (afterMatch) {
        matchedAfterIds.add(afterMatch.id);
        return { 
          ...slotComProfNormalizado, 
          materia: `After: ${afterMatch.nome}`, 
          nomeProfessor: afterMatch.nomeProfessor, 
          listaAlunos: afterMatch.listaAlunos || [], 
          tipo: 'after_school',
          vinculado_id: afterMatch.id
        };
      }

      // 3. Fallbacks se o slot for explicitamente de um tipo no banco mas sem cruzamento ativo
      if (tipoAtividade === 'language_lab') {
        return {
          ...slotComProfNormalizado,
          materia: 'Language Lab (Não Agendado)',
          nomeProfessor: 'A DEFINIR',
          listaAlunos: [],
          tipo: 'language_lab'
        };
      }

      if (tipoAtividade === 'after_school') {
        return {
          ...slotComProfNormalizado,
          materia: 'After School (Não Agendado)',
          nomeProfessor: 'A DEFINIR',
          listaAlunos: [],
          tipo: 'after_school'
        };
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

    const virtualSlots: EntradaGradeSala[] = [];

    // Sintetizar slots virtuais para Language Lab
    languageLab.forEach(lab => {
      if (matchedLabIds.has(lab.id)) return;
      
      const salaMatch = salas.find(s => {
        const salaStr = lab.sala || '';
        return salaStr.includes(String(s.numero)) || salaStr.toLowerCase().includes(s.nome.toLowerCase());
      });

      if (salaMatch) {
        virtualSlots.push({
          id: `lab-virtual-${lab.id}`,
          numeroSala: salaMatch.numero,
          nomeSala: salaMatch.nome,
          anoTurma: lab.turma || 'Language Lab',
          diaSemana: lab.diaSemana.toUpperCase().trim(),
          horario: `${lab.horarioInicio} - ${lab.horarioFim}`,
          nomeProfessor: lab.professor,
          turma: lab.turma || 'Language Lab',
          materia: `Lab: ${lab.nivel}`,
          tipo: 'language_lab',
          listaAlunos: lab.listaAlunos || [],
          segmento: 'Language Lab'
        });
      }
    });

    // Sintetizar slots virtuais para After School
    atividadesAfter.forEach(after => {
      if (matchedAfterIds.has(after.id)) return;

      (after.dias || []).forEach(dia => {
        let localEspecifico = '';
        if (after.local) {
          try {
            const obj = JSON.parse(after.local);
            if (obj && typeof obj === 'object') {
              localEspecifico = obj[dia] || '';
            } else {
              localEspecifico = after.local;
            }
          } catch (e) {
            localEspecifico = after.local;
          }
        }

        if (!localEspecifico) return;

        const salaMatch = salas.find(s => {
          return localEspecifico.includes(String(s.numero)) || localEspecifico.toLowerCase().includes(s.nome.toLowerCase());
        });

        if (salaMatch) {
          virtualSlots.push({
            id: `after-virtual-${after.id}-${dia}`,
            numeroSala: salaMatch.numero,
            nomeSala: salaMatch.nome,
            anoTurma: 'After School',
            diaSemana: dia.toUpperCase().trim(),
            horario: `${after.horarioInicio} - ${after.horarioFim}`,
            nomeProfessor: after.nomeProfessor,
            turma: 'After School',
            materia: `After: ${after.nome}`,
            tipo: 'after_school',
            listaAlunos: after.listaAlunos || [],
            segmento: 'After School'
          });
        }
      });
    });

    return [...slotsProcessados, ...virtualSlots];
  }, [gradeCompleta, languageLab, atividadesAfter, alunos, locaisCMS, professoresCMS, realocacoes, horaAtual, salas]);

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
