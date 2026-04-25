// ============================================================
// SESI Connect — Contexto Global da Escola
// Provedor de dados em tempo real (Supabase)
// ============================================================
import { useMemo } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
  PeriodoConfig,
  ProfessorCMS,
  LocalCMS,
} from '../types';
import {
  obterEstadoAtualDaEscola,
  obterDiaSemana,
  extrairProfessores,
  obterAgendaProfessor,
  obterLocalizacaoProfessor,
  obterPeriodoEscolar,
  estaNoHorario,
} from '../services/motorEscolar';
import {
  buscarSalas,
  buscarMapaSalas,
  buscarAlunos,
  buscarLanguageLab,
  buscarAtividadesAfter,
  buscarMonitores,
  buscarModelosFormulario,
  buscarOcorrencias,
  buscarPeriodosEscolares,
  buscarProfessoresCMS,
  buscarLocaisCMS,
  buscarGradeMonitores,
} from '../services/dataService';

interface ContextoEscolaType {
  estadoEscola: EstadoEscola;
  horaAtual: Date;
  salas: Sala[];
  gradeCompleta: EntradaGradeSala[];
  alunos: Aluno[];
  languageLab: LanguageLabRecord[];
  atividadesAfter: AtividadeAfter[];
  monitores: Monitor[];
  professores: Professor[];
  professoresCMS: ProfessorCMS[];
  locaisCMS: LocalCMS[];
  modelosFormulario: ModeloFormulario[];
  ocorrencias: RegistroOcorrencia[];
  periodos: PeriodoConfig[];
  gradeMonitores: GradeMonitor[];
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
  const [periodos, setPeriodos] = useState<PeriodoConfig[]>([
    // 6º e 7º Anos
    { id: '67-1', nome: '1ª Aula', horarioInicio: '07:30', horarioFim: '08:20', tipo: 'aula', segmento: '6e7' },
    { id: '67-2', nome: '2ª Aula', horarioInicio: '08:20', horarioFim: '09:10', tipo: 'aula', segmento: '6e7' },
    { id: '67-int', nome: 'Intervalo', horarioInicio: '09:10', horarioFim: '09:30', tipo: 'intervalo', segmento: '6e7' },
    { id: '67-3', nome: '3ª Aula', horarioInicio: '09:30', horarioFim: '10:20', tipo: 'aula', segmento: '6e7' },
    { id: '67-4', nome: '4ª Aula', horarioInicio: '10:20', horarioFim: '11:10', tipo: 'aula', segmento: '6e7' },
    { id: '67-5', nome: '5ª Aula', horarioInicio: '11:10', horarioFim: '12:00', tipo: 'aula', segmento: '6e7' },

    // 8º, 9º e Médio
    { id: '89m-1', nome: '1ª Aula', horarioInicio: '07:30', horarioFim: '08:20', tipo: 'aula', segmento: '8e9' },
    { id: '89m-2', nome: '2ª Aula', horarioInicio: '08:20', horarioFim: '09:10', tipo: 'aula', segmento: '8e9' },
    { id: '89m-3', nome: '3ª Aula', horarioInicio: '09:10', horarioFim: '10:00', tipo: 'aula', segmento: '8e9' },
    { id: '89m-int', nome: 'Intervalo', horarioInicio: '10:00', horarioFim: '10:20', tipo: 'intervalo', segmento: '8e9' },
    { id: '89m-4', nome: '4ª Aula', horarioInicio: '10:20', horarioFim: '11:10', tipo: 'aula', segmento: '8e9' },
    { id: '89m-5', nome: '5ª Aula', horarioInicio: '11:10', horarioFim: '12:00', tipo: 'aula', segmento: '8e9' },

    // Médio (com extras se necessário)
    { id: 'med-1', nome: '1ª Aula', horarioInicio: '07:30', horarioFim: '08:20', tipo: 'aula', segmento: 'medio' },
    { id: 'med-int', nome: 'Intervalo', horarioInicio: '10:00', horarioFim: '10:20', tipo: 'intervalo', segmento: 'medio' },
    { id: 'med-6', nome: '6ª Aula', horarioInicio: '12:00', horarioFim: '12:50', tipo: 'aula', segmento: 'medio' },
  ]);
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [s, g, a, li, aa, m, mf, oc, p, pCms, lCms, gm] = await Promise.all([
        buscarSalas(),
        buscarMapaSalas(),
        buscarAlunos(),
        buscarLanguageLab(),
        buscarAtividadesAfter(),
        buscarMonitores(),
        buscarModelosFormulario(),
        buscarOcorrencias(),
        buscarPeriodosEscolares(),
        buscarProfessoresCMS(),
        buscarLocaisCMS(),
        buscarGradeMonitores(),
      ]);

      // === DADOS DEMO: PROFESSORES ===
      if (pCms && pCms.length > 0) {
        setProfessoresCMS(pCms);
      } else {
        setProfessoresCMS([
          { id: 'p1', nome: 'Luis Kim', cor: '#3B82F6', especialidade: 'Matemática' },
          { id: 'p2', nome: 'Patricia Santos', cor: '#EF4444', especialidade: 'Português' },
          { id: 'p3', nome: 'Carlos Edu', cor: '#10B981', especialidade: 'Ciências' },
          { id: 'p4', nome: 'Ana Beatriz', cor: '#F59E0B', especialidade: 'História' },
        ]);
      }

      // === DADOS DEMO: ALUNOS ===
      if (a && a.length > 0) {
        setAlunos(a);
      } else {
        setAlunos([
          { id: 'a1', nome: 'Arthur Silva', turma: '6º Ano A', ano: '6º Ano', numeroSala: 1 },
          { id: 'a2', nome: 'Beatriz Oliveira', turma: '6º Ano A', ano: '6º Ano', numeroSala: 1 },
          { id: 'a3', nome: 'Caio Castro', turma: '7º Ano B', ano: '7º Ano', numeroSala: 2 },
          { id: 'a4', nome: 'Daniela Lima', turma: '7º Ano B', ano: '7º Ano', numeroSala: 2 },
          { id: 'a5', nome: 'Eduardo Costa', turma: '8º Ano C', ano: '8º Ano', numeroSala: 3 },
        ]);
      }

      // === DADOS DEMO: GRADE COMPLETA ===
      if (g && g.length > 0) {
        setGradeCompleta(g);
      } else {
        const demoGrade: EntradaGradeSala[] = [];
        const dias = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
        const profs = ['Luis Kim', 'Patricia Santos', 'Carlos Edu', 'Ana Beatriz'];
        const materias = ['Matemática', 'Português', 'Ciências', 'História'];

        dias.forEach(dia => {
          // Criar 3 aulas para cada dia para teste
          demoGrade.push({
            id: `g-${dia}-1`,
            numeroSala: 1,
            nomeSala: 'Sala 01',
            anoTurma: '6º Ano A',
            diaSemana: dia,
            horario: '07:30 - 08:20',
            nomeProfessor: profs[0],
            turma: '6º Ano A',
            materia: materias[0],
            tipo: 'regular',
            listaAlunos: ['a1', 'a2']
          });
          demoGrade.push({
            id: `g-${dia}-2`,
            numeroSala: 2,
            nomeSala: 'Sala 02',
            anoTurma: '7º Ano B',
            diaSemana: dia,
            horario: '08:20 - 09:10',
            nomeProfessor: profs[1],
            turma: '7º Ano B',
            materia: materias[1],
            tipo: 'regular',
            listaAlunos: ['a3', 'a4']
          });
        });
        setGradeCompleta(demoGrade);
      }

      // === DADOS DEMO: SALAS ===
      if (s && s.length > 0) {
        setSalas(s);
      } else {
        setSalas([
          { id: 's1', numero: 1, nome: 'Sala 01', segmento: '6º e 7º', ano: '6º Ano A', grade: [] },
          { id: 's2', numero: 2, nome: 'Sala 02', segmento: '6º e 7º', ano: '7º Ano B', grade: [] },
          { id: 's3', numero: 3, nome: 'Sala 03', segmento: '8º e 9º', ano: '8º Ano C', grade: [] },
          { id: 's4', numero: 4, nome: 'Sala 04', segmento: '8º e 9º', ano: '9º Ano A', grade: [] },
          { id: 's5', numero: 5, nome: 'Sala 05', segmento: 'Ensino Médio', ano: '1º EM', grade: [] },
        ]);
      }

      setAtividadesAfter(aa);
      setLocaisCMS(lCms);
      setOcorrencias(oc);
      if (p && p.length > 0) setPeriodos(p);

      // === LANGUAGE LAB DEMO ===
      if (li && li.length > 0) {
        setLanguageLab(li);
      } else {
        setLanguageLab([
          { id: 'lab-1', turma: '9º Ano A', nivel: 'B1 Intermediate', professor: 'Teacher Sarah', sala: 'Lab Inglês 01', horarioInicio: '08:20', horarioFim: '10:00', diaSemana: 'SEGUNDA' },
          { id: 'lab-2', turma: '9º Ano B', nivel: 'A2 Elementary', professor: 'Teacher John', sala: 'Lab Inglês 02', horarioInicio: '08:20', horarioFim: '10:00', diaSemana: 'SEGUNDA' },
          { id: 'lab-3', turma: '2º EM A', nivel: 'C1 Advanced', professor: 'Teacher Mike', sala: 'Lab Inglês 01', horarioInicio: '10:20', horarioFim: '12:00', diaSemana: 'TERÇA' },
          { id: 'lab-4', turma: '7º Ano A', nivel: 'A1 Beginner', professor: 'Teacher Anna', sala: 'Lab Inglês 03', horarioInicio: '07:30', horarioFim: '09:10', diaSemana: 'QUARTA' },
          { id: 'lab-5', turma: '8º Ano C', nivel: 'B2 Upper Inter', professor: 'Teacher Paul', sala: 'Lab Inglês 02', horarioInicio: '10:00', horarioFim: '11:40', diaSemana: 'QUINTA' },
        ]);
      }

      // === GRADE MONITORES DEMO ===
      if (gm && gm.length > 0) {
        setGradeMonitores(gm);
      } else {
        setGradeMonitores([
          { id: 'gm-1', monitorNome: 'Maria Silva', diaSemana: 'SEGUNDA', horarioInicio: '07:30', horarioFim: '09:10', posto: 'Pátio Central', corEtiqueta: '#3B82F6' },
          { id: 'gm-2', monitorNome: 'Maria Silva', diaSemana: 'SEGUNDA', horarioInicio: '09:30', horarioFim: '11:10', posto: 'Corredor 1º Andar', corEtiqueta: '#10B981' },
          { id: 'gm-3', monitorNome: 'João Pedro', diaSemana: 'SEGUNDA', horarioInicio: '07:30', horarioFim: '12:00', posto: 'Entrada Principal', corEtiqueta: '#EF4444' },
          { id: 'gm-4', monitorNome: 'Ana Santos', diaSemana: 'TERÇA', horarioInicio: '13:00', horarioFim: '15:20', posto: 'Refeitório', corEtiqueta: '#F59E0B' },
          { id: 'gm-5', monitorNome: 'Ana Santos', diaSemana: 'TERÇA', horarioInicio: '16:00', horarioFim: '18:00', posto: 'Pátio Esportivo', corEtiqueta: '#8B5CF6' },
          { id: 'gm-6', monitorNome: 'Lucas Oliveira', diaSemana: 'QUARTA', horarioInicio: '13:00', horarioFim: '17:00', posto: 'Biblioteca', corEtiqueta: '#EC4899' },
        ]);
      }

      // === MONITORES DE TESTE (se vazio) ===
      if (m && m.length > 0) {
        setMonitores(m);
      } else {
        setMonitores([
          { id: 'mock-1', nome: 'Maria Silva', materia: 'Matemática', diaSemana: 'SEGUNDA', turno: 'manha', horarioInicio: '08:00', horarioFim: '12:00', localPermanencia: 'Sala 15', localAlmoco: 'Refeitório A', tipo: 'fixo', status: 'ativo' },
          { id: 'mock-2', nome: 'João Pedro', materia: 'Português', diaSemana: 'SEGUNDA', turno: 'manha', horarioInicio: '08:00', horarioFim: '12:00', localPermanencia: '', localAlmoco: 'Refeitório B', tipo: 'volante', status: 'ativo' },
          { id: 'mock-3', nome: 'Ana Santos', materia: 'Ciências', diaSemana: 'TERÇA', turno: 'tarde', horarioInicio: '13:00', horarioFim: '17:00', localPermanencia: 'Sala 08', localAlmoco: 'Refeitório A', tipo: 'fixo', status: 'ativo' },
          { id: 'mock-4', nome: 'Lucas Oliveira', materia: 'História', diaSemana: 'QUARTA', turno: 'tarde', horarioInicio: '13:00', horarioFim: '17:00', localPermanencia: '', localAlmoco: 'Refeitório B', tipo: 'volante', status: 'ativo' },
          { id: 'mock-5', nome: 'Camila Costa', materia: 'Inglês', diaSemana: 'QUINTA', turno: 'manha', horarioInicio: '09:00', horarioFim: '12:00', localPermanencia: 'Lab Idiomas', localAlmoco: 'Refeitório A', tipo: 'fixo', status: 'ativo' },
          { id: 'mock-6', nome: 'Pedro Almeida', materia: 'Ed. Física', diaSemana: 'SEXTA', turno: 'tarde', horarioInicio: '14:00', horarioFim: '18:00', localPermanencia: '', localAlmoco: 'Refeitório B', tipo: 'volante', status: 'inativo' },
        ]);
      }

      // === FORMULÁRIO DE TESTE (se vazio) ===
      if (mf && mf.length > 0) {
        setModelosFormulario(mf);
      } else {
        setModelosFormulario([
          {
            id: 'mock-form-1',
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

  let estadoEscola: EstadoEscola;
  try {
    estadoEscola = obterEstadoAtualDaEscola(horaAtual, salas || [], gradeCompleta || [], periodos || []);
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
    const nomes = extrairProfessores(gradeCompleta);
    const diaSemana = obterDiaSemana(horaAtual);

    return nomes.map((nome, i) => {
      const localizacao = obterLocalizacaoProfessor(nome, horaAtual, gradeCompleta);
      const agenda = obterAgendaProfessor(nome, diaSemana, gradeCompleta);
      const horaStr = `${horaAtual.getHours().toString().padStart(2, '0')}:${horaAtual.getMinutes().toString().padStart(2, '0')}`;
      const periodoLabel = obterPeriodoEscolar(horaStr, periodos);

      let status: Professor['status'] = 'presente';
      if (localizacao && periodoLabel === 'aula') {
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
  }, [gradeCompleta, horaAtual, periodos]);

  const adicionarOcorrencia = useCallback((ocorrencia: RegistroOcorrencia) => {
    setOcorrencias(prev => [ocorrencia, ...prev]);
  }, []);

  const atualizar = carregarDados;

  return (
    <Contexto.Provider value={{
      estadoEscola,
      horaAtual,
      salas,
      gradeCompleta,
      alunos,
      languageLab,
      atividadesAfter,
      monitores,
      professores,
      professoresCMS,
      locaisCMS,
      modelosFormulario,
      ocorrencias,
      periodos,
      gradeMonitores,
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
