import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, Calendar, AlertTriangle, ArrowUpRight, 
  TrendingUp, BarChart2, PieChart, Activity, Filter, 
  RefreshCw, Award, BookOpen, Clock, AlertCircle, FileText,
  UserCheck, ChevronRight, BarChart3, HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

// ============================================================
// INTERFACES
// ============================================================
interface OcorrenciaRegistro {
  id: string;
  student_name: string;
  school_year: string;
  occurrence_type: string;
  report: string;
  created_at: string;
  tratada: boolean;
  created_by: string | null;
}

interface AlunoCMS {
  nome: string;
  turma: string;
  ano: string;
}

type TabSuper = 'geral' | 'alunos' | 'funcionarios' | 'series' | 'tipos';

export default function DashboardSuper() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estados dos Dados
  const [registros, setRegistros] = useState<OcorrenciaRegistro[]>([]);
  const [alunosMap, setAlunosMap] = useState<Map<string, AlunoCMS>>(new Map());
  const [perfis, setPerfis] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Estados das Abas
  const [abaAtiva, setAbaAtiva] = useState<TabSuper>('geral');

  // Estados de Seleção Detalhada (Entidades)
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>('');
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>('');
  const [serieSelecionada, setSerieSelecionada] = useState<string>('');
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('');

  // Estados dos Filtros Globais
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [tempDataInicio, setTempDataInicio] = useState('');
  const [tempDataFim, setTempDataFim] = useState('');
  const [pesquisandoPeriodo, setPesquisandoPeriodo] = useState(false);
  const [pesquisaSucesso, setPesquisaSucesso] = useState(false);

  const aplicarFiltroPeriodo = async () => {
    setPesquisandoPeriodo(true);
    setFiltroDataInicio(tempDataInicio);
    setFiltroDataFim(tempDataFim);
    await carregarDados();
    setPesquisandoPeriodo(false);
    setPesquisaSucesso(true);
    setTimeout(() => setPesquisaSucesso(false), 1500);
  };

  const aplicarPresetPeriodo = (preset: 'hoje' | 'semana' | 'mes' | 'ano' | 'tudo') => {
    const hoje = new Date();
    let inicio = '';
    let fim = '';

    const formatarData = (d: Date) => {
      const ano = d.getFullYear();
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const dia = d.getDate().toString().padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };

    if (preset === 'hoje') {
      inicio = formatarData(hoje);
      fim = formatarData(hoje);
    } else if (preset === 'semana') {
      const diaSemana = hoje.getDay();
      const dom = new Date(hoje);
      dom.setDate(hoje.getDate() - diaSemana);
      const sab = new Date(hoje);
      sab.setDate(hoje.getDate() + (6 - diaSemana));
      inicio = formatarData(dom);
      fim = formatarData(sab);
    } else if (preset === 'mes') {
      const pDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const uDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      inicio = formatarData(pDia);
      fim = formatarData(uDia);
    } else if (preset === 'ano') {
      inicio = `${hoje.getFullYear()}-01-01`;
      fim = `${hoje.getFullYear()}-12-31`;
    }

    setTempDataInicio(inicio);
    setTempDataFim(fim);
    
    setFiltroDataInicio(inicio);
    setFiltroDataFim(fim);
    setPesquisaSucesso(true);
    setTimeout(() => setPesquisaSucesso(false), 1000);
  };

  const [filtroAnoLetivo, setFiltroAnoLetivo] = useState('Todos');
  const [filtroSerieAno, setFiltroSerieAno] = useState('Todos');
  const [filtroTurma, setFiltroTurma] = useState('Todos');
  const [filtroFuncionario, setFiltroFuncionario] = useState('Todos');
  const [filtroAluno, setFiltroAluno] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  // Controle de Visualização Temporal (Aba Geral)
  const [escalaTemporal, setEscalaTemporal] = useState<'dia' | 'semana' | 'mes'>('dia');

  // Segurança: Redirecionar se não for super_admin
  useEffect(() => {
    if (!authLoading) {
      if (!profile || profile.role !== 'super_admin') {
        alert('Acesso restrito: Esta página é exclusiva para o Super Administrador.');
        navigate('/');
      }
    }
  }, [profile, authLoading, navigate]);

  // Carregar Dados
  const carregarDados = async () => {
    try {
      setAtualizando(true);
      
      // 1. Carregar Ocorrências
      const { data: dataOcorrencias, error: errOcorrencias } = await supabase
        .from('daily_occurrence_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (errOcorrencias) throw errOcorrencias;
      setRegistros(dataOcorrencias || []);

      // 2. Carregar Lista de Alunos
      const { data: dataAlunos, error: errAlunos } = await supabase
        .from('alunos_cms')
        .select('nome, turma, ano');

      if (errAlunos) throw errAlunos;

      const map = new Map<string, AlunoCMS>();
      (dataAlunos || []).forEach(aluno => {
        map.set(aluno.nome.trim().toLowerCase(), aluno);
      });
      setAlunosMap(map);

      // 3. Carregar todos os perfis
      const { data: dataPerfis, error: errPerfis } = await supabase
        .from('profiles')
        .select('full_name, role, email');
      
      if (errPerfis) throw errPerfis;
      setPerfis(dataPerfis || []);

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      carregarDados();
    }
  }, [profile]);

  // ============================================================
  // SELECTORES PARA FILTROS DENTRO DO CONTEXTO DE REGISTROS
  // ============================================================
  const listFuncionarios = useMemo(() => {
    const funcs = new Set<string>();
    registros.forEach(r => {
      if (r.created_by) funcs.add(r.created_by.trim());
    });
    return Array.from(funcs).sort();
  }, [registros]);

  const listAlunos = useMemo(() => {
    const al = new Set<string>();
    registros.forEach(r => {
      if (r.student_name) al.add(r.student_name.trim());
    });
    return Array.from(al).sort();
  }, [registros]);

  const listSeriesAnos = useMemo(() => {
    const series = new Set<string>();
    registros.forEach(r => {
      if (r.school_year) series.add(r.school_year);
    });
    return Array.from(series).sort();
  }, [registros]);

  const listTurmas = useMemo(() => {
    const turmas = new Set<string>();
    alunosMap.forEach(aluno => {
      if (aluno.turma) turmas.add(aluno.turma);
    });
    return Array.from(turmas).sort();
  }, [alunosMap]);

  const listTiposRegistro = useMemo(() => {
    const tipos = new Set<string>();
    registros.forEach(r => {
      if (r.occurrence_type) tipos.add(r.occurrence_type.trim());
    });
    return Array.from(tipos).sort();
  }, [registros]);

  // Set Inicial para Detalhados ao Carregar
  useEffect(() => {
    if (listAlunos.length > 0 && !alunoSelecionado) setAlunoSelecionado(listAlunos[0]);
    if (listFuncionarios.length > 0 && !funcionarioSelecionado) setFuncionarioSelecionado(listFuncionarios[0]);
    if (listSeriesAnos.length > 0 && !serieSelecionada) setSerieSelecionada(listSeriesAnos[0]);
    if (listTiposRegistro.length > 0 && !tipoSelecionado) setTipoSelecionado(listTiposRegistro[0]);
  }, [listAlunos, listFuncionarios, listSeriesAnos, listTiposRegistro]);

  // ============================================================
  // FILTRAGEM GLOBAL (APLICA-SE A TODAS AS METRICAS)
  // ============================================================
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      // 1. Filtro Período
      const dataRegistroStr = r.created_at ? r.created_at.split(/[\sT]/)[0] : '';
      if (filtroDataInicio && dataRegistroStr < filtroDataInicio) return false;
      if (filtroDataFim && dataRegistroStr > filtroDataFim) return false;

      // Resolvendo Turma / Ano do Aluno
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const turmaAluno = alunoInfo?.turma || 'Sem Turma';
      const anoAluno = alunoInfo?.ano || r.school_year || 'Sem Ano';

      // 2. Filtro Série/Ano
      if (filtroSerieAno !== 'Todos' && anoAluno !== filtroSerieAno) return false;

      // 3. Filtro Turma
      if (filtroTurma !== 'Todos' && turmaAluno !== filtroTurma) return false;

      // 4. Filtro Funcionário
      if (filtroFuncionario !== 'Todos' && r.created_by?.trim() !== filtroFuncionario) return false;

      // 5. Filtro Aluno
      if (filtroAluno !== 'Todos' && r.student_name.trim() !== filtroAluno) return false;

      // 6. Filtro Tipo de Registro
      if (filtroTipo !== 'Todos' && r.occurrence_type?.trim() !== filtroTipo) return false;

      // 7. Filtro Ano Letivo
      if (filtroAnoLetivo !== 'Todos') {
        const anoMatch = anoAluno.toLowerCase().includes(filtroAnoLetivo.toLowerCase());
        if (!anoMatch) return false;
      }

      return true;
    });
  }, [registros, alunosMap, filtroDataInicio, filtroDataFim, filtroAnoLetivo, filtroSerieAno, filtroTurma, filtroFuncionario, filtroAluno, filtroTipo]);

  // ============================================================
  // ESTATISTICAS POR ABA
  // ============================================================

  // --- ABA: GERAL ---
  const statsGeral = useMemo(() => {
    const total = registrosFiltrados.length;
    const alunosUnicos = new Set(registrosFiltrados.map(r => r.student_name.trim().toLowerCase())).size;
    const funcionariosUnicos = new Set(
      registrosFiltrados.filter(r => r.created_by).map(r => r.created_by!.trim().toLowerCase())
    ).size;

    const turmasEnvolvidas = new Set(
      registrosFiltrados.map(r => {
        const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
        return alunoInfo?.turma || 'Sem Turma';
      })
    ).size;

    return { total, alunosUnicos, funcionariosUnicos, turmasEnvolvidas };
  }, [registrosFiltrados, alunosMap]);

  // Ranking Alunos Geral
  const rankingAlunos = useMemo(() => {
    const contagem: { [nome: string]: { count: number; school_year: string; turma: string } } = {};
    registrosFiltrados.forEach(r => {
      const nomeNormalizado = r.student_name.trim();
      const chave = nomeNormalizado.toLowerCase();
      const alunoInfo = alunosMap.get(chave);
      if (!contagem[chave]) {
        contagem[chave] = {
          count: 0,
          school_year: alunoInfo?.ano || r.school_year || 'Sem Ano',
          turma: alunoInfo?.turma || 'Sem Turma'
        };
      }
      contagem[chave].count++;
    });

    return Object.entries(contagem)
      .map(([chave, info]) => {
        const original = registrosFiltrados.find(r => r.student_name.trim().toLowerCase() === chave)?.student_name || info.school_year;
        return { nome: original, ...info };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [registrosFiltrados, alunosMap]);

  // Ranking Funcionários Geral (incluindo frequência zero)
  const rankingFuncionarios = useMemo(() => {
    const contagem: { [nome: string]: number } = {};
    
    // Inicializa todos com cargo de funcionário e aprovados
    perfis.forEach(p => {
      const eCargoFuncionario = ['professor', 'monitor', 'admin', 'super_admin'].includes(p.role);
      if (eCargoFuncionario && p.full_name) {
        contagem[p.full_name.trim()] = 0;
      }
    });

    registrosFiltrados.forEach(r => {
      if (r.created_by) {
        const nome = r.created_by.trim();
        contagem[nome] = (contagem[nome] || 0) + 1;
      }
    });

    return Object.entries(contagem)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);
  }, [registrosFiltrados, perfis]);

  // Ranking Séries Geral
  const rankingSeriesAnos = useMemo(() => {
    const contagem: { [serie: string]: number } = {};
    registrosFiltrados.forEach(r => {
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const serie = alunoInfo?.ano || r.school_year || 'Sem Série';
      contagem[serie] = (contagem[serie] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([serie, count]) => ({ serie, count }))
      .sort((a, b) => b.count - a.count);
  }, [registrosFiltrados, alunosMap]);

  // Ranking Turmas Geral
  const rankingTurmas = useMemo(() => {
    const contagem: { [turma: string]: number } = {};
    registrosFiltrados.forEach(r => {
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const turma = alunoInfo?.turma || 'Sem Turma';
      contagem[turma] = (contagem[turma] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([turma, count]) => ({ turma, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [registrosFiltrados, alunosMap]);

  // Tipos de Registro Geral (Top 10)
  const tiposRegistroGeral = useMemo(() => {
    const contagem: { [tipo: string]: number } = {};
    let total = 0;
    registrosFiltrados.forEach(r => {
      if (r.occurrence_type) {
        const tipo = r.occurrence_type.trim();
        contagem[tipo] = (contagem[tipo] || 0) + 1;
        total++;
      }
    });

    return Object.entries(contagem)
      .map(([tipo, count]) => ({
        tipo,
        count,
        percentual: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [registrosFiltrados]);

  // Evolução Temporal Geral
  const dadosEvolucaoTemporal = useMemo(() => {
    const contagem: { [periodo: string]: number } = {};
    registrosFiltrados.forEach(r => {
      const dataObj = new Date(r.created_at);
      let chave = '';
      if (escalaTemporal === 'dia') {
        chave = dataObj.toISOString().split('T')[0];
      } else if (escalaTemporal === 'semana') {
        const dia = dataObj.getDay();
        const diff = dataObj.getDate() - dia;
        const dom = new Date(dataObj.setDate(diff));
        chave = `Sem. ${dom.getDate().toString().padStart(2, '0')}/${(dom.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (escalaTemporal === 'mes') {
        chave = `${dataObj.toLocaleString('pt-BR', { month: 'short' })}/${dataObj.getFullYear().toString().substring(2)}`;
      }
      contagem[chave] = (contagem[chave] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([periodo, count]) => ({ periodo, count }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .slice(-12);
  }, [registrosFiltrados, escalaTemporal]);

  // --- ABA: ALUNOS (DETALHADO) ---
  const statsAluno = useMemo(() => {
    if (!alunoSelecionado) return null;
    
    // Filtrar registros específicos deste aluno dentro do escopo geral filtrado
    const regsAluno = registrosFiltrados.filter(r => r.student_name.trim().toLowerCase() === alunoSelecionado.toLowerCase());

    const total = regsAluno.length;
    
    // Histórico completo
    const historico = [...regsAluno].sort((a, b) => b.created_at.localeCompare(a.created_at));

    // Séries em que mais teve registros
    const seriesCont: { [serie: string]: number } = {};
    // Funcionários que mais registraram
    const funcsCont: { [func: string]: number } = {};
    // Tipos de ocorrência
    const tiposCont: { [tipo: string]: number } = {};
    // Dias da semana
    const diasCont: { [dia: string]: number } = {};
    // Horários
    const horasCont: { [hora: string]: number } = {};
    // Evolução temporal
    const evolucaoCont: { [periodo: string]: number } = {};

    regsAluno.forEach(r => {
      // Séries
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const serie = alunoInfo?.ano || r.school_year || 'Sem Série';
      seriesCont[serie] = (seriesCont[serie] || 0) + 1;

      // Funcionários
      if (r.created_by) {
        funcsCont[r.created_by.trim()] = (funcsCont[r.created_by.trim()] || 0) + 1;
      }

      // Tipos
      if (r.occurrence_type) {
        tiposCont[r.occurrence_type.trim()] = (tiposCont[r.occurrence_type.trim()] || 0) + 1;
      }

      // Dias da semana
      const diaSemanaIndex = new Date(r.created_at).getDay();
      const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diaNome = diasNomes[diaSemanaIndex];
      diasCont[diaNome] = (diasCont[diaNome] || 0) + 1;

      // Horários (bins de 2 horas)
      const hora = new Date(r.created_at).getHours();
      const bin = `${hora.toString().padStart(2, '0')}h - ${(hora + 1).toString().padStart(2, '0')}h`;
      horasCont[bin] = (horasCont[bin] || 0) + 1;

      // Evolução mensal
      const mesStr = new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      evolucaoCont[mesStr] = (evolucaoCont[mesStr] || 0) + 1;
    });

    const series = Object.entries(seriesCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const funcionarios = Object.entries(funcsCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const tipos = Object.entries(tiposCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const dias = Object.entries(diasCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const horas = Object.entries(horasCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const evolucao = Object.entries(evolucaoCont).map(([periodo, count]) => ({ periodo, count })).sort((a,b) => a.periodo.localeCompare(b.periodo));

    return { total, historico, series, funcionarios, tipos, dias, horas, evolucao };
  }, [registrosFiltrados, alunoSelecionado, alunosMap]);

  // --- ABA: FUNCIONÁRIOS (DETALHADO) ---
  const statsFuncionario = useMemo(() => {
    if (!funcionarioSelecionado) return null;

    const regsFunc = registrosFiltrados.filter(r => r.created_by?.trim().toLowerCase() === funcionarioSelecionado.toLowerCase());
    
    const total = regsFunc.length;

    // Alunos registrados
    const alunosCont: { [aluno: string]: number } = {};
    // Turmas onde mais registrou
    const turmasCont: { [turma: string]: number } = {};
    // Séries onde mais registrou
    const seriesCont: { [serie: string]: number } = {};
    // Tipos de registros
    const tiposCont: { [tipo: string]: number } = {};
    // Horários
    const horasCont: { [hora: string]: number } = {};
    // Dias da semana
    const diasCont: { [dia: string]: number } = {};
    // Evolução mensal
    const evolucaoCont: { [periodo: string]: number } = {};

    regsFunc.forEach(r => {
      // Aluno
      alunosCont[r.student_name] = (alunosCont[r.student_name] || 0) + 1;

      // Resolvendo turma/ano
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const turma = alunoInfo?.turma || 'Sem Turma';
      const serie = alunoInfo?.ano || r.school_year || 'Sem Série';

      turmasCont[turma] = (turmasCont[turma] || 0) + 1;
      seriesCont[serie] = (seriesCont[serie] || 0) + 1;

      // Tipos
      if (r.occurrence_type) {
        tiposCont[r.occurrence_type.trim()] = (tiposCont[r.occurrence_type.trim()] || 0) + 1;
      }

      // Horários
      const hora = new Date(r.created_at).getHours();
      const bin = `${hora.toString().padStart(2, '0')}h - ${(hora + 1).toString().padStart(2, '0')}h`;
      horasCont[bin] = (horasCont[bin] || 0) + 1;

      // Dias da semana
      const diaSemanaIndex = new Date(r.created_at).getDay();
      const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diaNome = diasNomes[diaSemanaIndex];
      diasCont[diaNome] = (diasCont[diaNome] || 0) + 1;

      // Evolução mensal
      const mesStr = new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      evolucaoCont[mesStr] = (evolucaoCont[mesStr] || 0) + 1;
    });

    const alunos = Object.entries(alunosCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const turmas = Object.entries(turmasCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const series = Object.entries(seriesCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const tipos = Object.entries(tiposCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const horas = Object.entries(horasCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const dias = Object.entries(diasCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const evolucao = Object.entries(evolucaoCont).map(([periodo, count]) => ({ periodo, count })).sort((a,b) => a.periodo.localeCompare(b.periodo));

    // Média de outros funcionários ativos (para comparação)
    const outrosFuncionariosRegs = registrosFiltrados.filter(r => r.created_by && r.created_by.trim().toLowerCase() !== funcionarioSelecionado.toLowerCase());
    const totalOutros = outrosFuncionariosRegs.length;
    const numOutros = Math.max(1, new Set(outrosFuncionariosRegs.map(r => r.created_by!.trim().toLowerCase())).size);
    const mediaOutros = parseFloat((totalOutros / numOutros).toFixed(1));

    return { total, alunos, turmas, series, tipos, horas, dias, evolucao, mediaOutros };
  }, [registrosFiltrados, funcionarioSelecionado, alunosMap]);

  // --- ABA: SÉRIES/ANOS (DETALHADO) ---
  const statsSerie = useMemo(() => {
    if (!serieSelecionada) return null;

    const regsSerie = registrosFiltrados.filter(r => {
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const ano = alunoInfo?.ano || r.school_year || 'Sem Ano';
      return ano.toLowerCase() === serieSelecionada.toLowerCase();
    });

    const total = regsSerie.length;

    // Alunos envolvidos únicos
    const alunosEnvolvidos = new Set(regsSerie.map(r => r.student_name.trim().toLowerCase())).size;

    // Tipos de ocorrências mais comuns
    const tiposCont: { [tipo: string]: number } = {};
    // Funcionários que mais registram
    const funcsCont: { [func: string]: number } = {};
    // Evolução mensal
    const evolucaoCont: { [periodo: string]: number } = {};

    regsSerie.forEach(r => {
      // Tipos
      if (r.occurrence_type) {
        tiposCont[r.occurrence_type.trim()] = (tiposCont[r.occurrence_type.trim()] || 0) + 1;
      }
      
      // Funcionários
      if (r.created_by) {
        funcsCont[r.created_by.trim()] = (funcsCont[r.created_by.trim()] || 0) + 1;
      }

      // Evolução
      const mesStr = new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      evolucaoCont[mesStr] = (evolucaoCont[mesStr] || 0) + 1;
    });

    const tipos = Object.entries(tiposCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const funcionarios = Object.entries(funcsCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const evolucao = Object.entries(evolucaoCont).map(([periodo, count]) => ({ periodo, count })).sort((a,b) => a.periodo.localeCompare(b.periodo));

    return { total, alunosEnvolvidos, tipos, funcionarios, evolucao };
  }, [registrosFiltrados, serieSelecionada, alunosMap]);

  // --- ABA: TIPOS DE REGISTRO (DETALHADO) ---
  const statsTipo = useMemo(() => {
    if (!tipoSelecionado) return null;

    const regsTipo = registrosFiltrados.filter(r => r.occurrence_type?.trim().toLowerCase() === tipoSelecionado.toLowerCase());

    const total = regsTipo.length;

    // Alunos com mais ocorrências desse tipo
    const alunosCont: { [aluno: string]: number } = {};
    // Funcionários que mais usam esse tipo
    const funcsCont: { [func: string]: number } = {};
    // Séries onde mais aparece
    const seriesCont: { [serie: string]: number } = {};
    // Evolução
    const evolucaoCont: { [periodo: string]: number } = {};

    regsTipo.forEach(r => {
      // Alunos
      alunosCont[r.student_name] = (alunosCont[r.student_name] || 0) + 1;

      // Funcionários
      if (r.created_by) {
        funcsCont[r.created_by.trim()] = (funcsCont[r.created_by.trim()] || 0) + 1;
      }

      // Séries
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const serie = alunoInfo?.ano || r.school_year || 'Sem Série';
      seriesCont[serie] = (seriesCont[serie] || 0) + 1;

      // Evolução
      const mesStr = new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      evolucaoCont[mesStr] = (evolucaoCont[mesStr] || 0) + 1;
    });

    const alunos = Object.entries(alunosCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 10);
    const funcionarios = Object.entries(funcsCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 10);
    const series = Object.entries(seriesCont).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const evolucao = Object.entries(evolucaoCont).map(([periodo, count]) => ({ periodo, count })).sort((a,b) => a.periodo.localeCompare(b.periodo));

    return { total, alunos, funcionarios, series, evolucao };
  }, [registrosFiltrados, tipoSelecionado, alunosMap]);

  // ============================================================
  // FILTRAGEM POR CLIQUE (INTERATIVIDADE CRUZADA)
  // ============================================================
  const navegarParaAluno = (nome: string) => {
    setAlunoSelecionado(nome);
    setAbaAtiva('alunos');
  };

  const navegarParaFuncionario = (nome: string) => {
    setFuncionarioSelecionado(nome);
    setAbaAtiva('funcionarios');
  };

  const navegarParaSerie = (nome: string) => {
    setSerieSelecionada(nome);
    setAbaAtiva('series');
  };

  const navegarParaTipo = (nome: string) => {
    setTipoSelecionado(nome);
    setAbaAtiva('tipos');
  };

  // Limpar Filtros Globais
  const limparFiltros = () => {
    setTempDataInicio('');
    setTempDataFim('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroAnoLetivo('Todos');
    setFiltroSerieAno('Todos');
    setFiltroTurma('Todos');
    setFiltroFuncionario('Todos');
    setFiltroAluno('Todos');
    setFiltroTipo('Todos');
  };

  if (authLoading || carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-on-surface-variant text-sm font-semibold tracking-wider uppercase">Carregando painel de inteligência...</p>
      </div>
    );
  }

  if (profile?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-1">
            <Shield size={14} /> Canal Super Administrador
          </div>
          <h1 className="text-3xl font-black text-on-surface-bright tracking-tight">Dashboard de Inteligência Escolar</h1>
          <p className="text-on-surface-variant text-sm mt-1">Análise multidimensional do Registro Diário de Ocorrências.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={carregarDados} 
            disabled={atualizando}
            className="p-3 bg-surface-container-low hover:bg-surface-container-high border border-white/5 rounded-2xl text-on-surface-variant hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn(atualizando && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ============================================================
          ABAS DE SELEÇÃO DO DASHBOARD
          ============================================================ */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-white/5 pb-4">
        {([
          { id: 'geral', label: 'Visão Geral', icon: Activity, activeClass: "bg-blue-500 text-black border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
          { id: 'alunos', label: 'Alunos', icon: Users, activeClass: "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
          { id: 'funcionarios', label: 'Funcionários', icon: Award, activeClass: "bg-purple-500 text-black border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]" },
          { id: 'series', label: 'Anos / Séries', icon: BookOpen, activeClass: "bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" },
          { id: 'tipos', label: 'Tipos de Ocorrência', icon: FileText, activeClass: "bg-rose-500 text-black border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" }
        ] as const).map(tab => {
          const Ativo = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id)}
              className={cn(
                "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 border shrink-0",
                Ativo 
                  ? tab.activeClass 
                  : "bg-surface-container-low text-on-surface-variant border-white/5 hover:border-primary/20 hover:text-white"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================
          PAINEL DE FILTROS GLOBAIS COMPILADOS
          ============================================================ */}
      <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Filter size={14} className="text-primary" /> Filtros Dinâmicos
        </h2>

        {/* Filtros de Tempo Rápidos */}
        <div className="flex flex-wrap items-center gap-2 bg-surface/30 p-3 rounded-2xl border border-white/5">
          <span className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest mr-2">Tempo Rápido:</span>
          {([
            { id: 'hoje', label: 'Hoje' },
            { id: 'semana', label: 'Esta Semana' },
            { id: 'mes', label: 'Este Mês' },
            { id: 'ano', label: 'Este Ano' },
            { id: 'tudo', label: 'Ver Tudo' }
          ] as const).map(p => (
            <button
              key={p.id}
              onClick={() => aplicarPresetPeriodo(p.id)}
              className="px-3 py-1.5 bg-surface hover:bg-surface-container-high border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider text-white hover:border-primary hover:text-primary transition-all active:scale-95 shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Início</label>
            <input 
              type="date" 
              value={tempDataInicio}
              onChange={e => {
                setTempDataInicio(e.target.value);
                setFiltroDataInicio(e.target.value);
              }}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Fim</label>
            <input 
              type="date" 
              value={tempDataFim}
              onChange={e => {
                setTempDataFim(e.target.value);
                setFiltroDataFim(e.target.value);
              }}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <button
              onClick={aplicarFiltroPeriodo}
              disabled={pesquisandoPeriodo}
              className={cn(
                "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                pesquisaSucesso 
                  ? "bg-emerald-500 text-black border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  : "bg-primary text-black border border-primary hover:bg-primary/80 active:scale-95"
              )}
            >
              {pesquisandoPeriodo ? "Rodando..." : pesquisaSucesso ? "Pesquisado!" : "Filtrar Período"}
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Ano Letivo</label>
            <select 
              value={filtroAnoLetivo}
              onChange={e => setFiltroAnoLetivo(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              <option value="6º Ano">6º Ano</option>
              <option value="7º Ano">7º Ano</option>
              <option value="8º Ano">8º Ano</option>
              <option value="9º Ano">9º Ano</option>
              <option value="EM">Ensino Médio</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Série/Ano</label>
            <select 
              value={filtroSerieAno}
              onChange={e => setFiltroSerieAno(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listSeriesAnos.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Turma</label>
            <select 
              value={filtroTurma}
              onChange={e => setFiltroTurma(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listTurmas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Funcionário</label>
            <select 
              value={filtroFuncionario}
              onChange={e => setFiltroFuncionario(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listFuncionarios.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Aluno</label>
            <select 
              value={filtroAluno}
              onChange={e => setFiltroAluno(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listAlunos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest block">Tipo Ocorrência</label>
            <select 
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listTiposRegistro.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={limparFiltros}
            className="px-4 py-2 border border-white/10 hover:border-red-500/30 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-red-400 bg-surface rounded-xl active:scale-95 transition-all"
          >
            Limpar Filtros
          </button>
          <button 
            onClick={carregarDados}
            disabled={atualizando}
            className="px-4 py-2 bg-surface-container-high hover:bg-hover border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={cn(atualizando && "animate-spin")} />
            {atualizando ? "Atualizando..." : "Atualizar Dados"}
          </button>
        </div>
      </div>

      {/* ============================================================
          RENDERIZACAO DAS ABAS INDIVIDUAIS
          ============================================================ */}

      {/* ------------------------------------------------------------
          1. ABA: GERAL
          ------------------------------------------------------------ */}
      {abaAtiva === 'geral' && (
        <div className="space-y-6">
          {/* Cards de Métrica Geral */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent p-6 rounded-[2rem] border border-blue-500/20 space-y-2 shadow-lg shadow-blue-500/5 hover:border-blue-500/30 transition-all">
              <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Total Registros (Período)</p>
              <h3 className="text-3xl font-black text-blue-300">{statsGeral.total}</h3>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent p-6 rounded-[2rem] border border-purple-500/20 space-y-2 shadow-lg shadow-purple-500/5 hover:border-purple-500/30 transition-all">
              <p className="text-[9px] font-black uppercase text-purple-400 tracking-widest">Total Registros Geral</p>
              <h3 className="text-3xl font-black text-purple-300">{registros.length}</h3>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-6 rounded-[2rem] border border-emerald-500/20 space-y-2 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/30 transition-all">
              <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Alunos Envolvidos</p>
              <h3 className="text-3xl font-black text-emerald-300">{statsGeral.alunosUnicos}</h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6 rounded-[2rem] border border-amber-500/20 space-y-2 shadow-lg shadow-amber-500/5 hover:border-amber-500/30 transition-all">
              <p className="text-[9px] font-black uppercase text-amber-400 tracking-widest">Funcionários Ativos</p>
              <h3 className="text-3xl font-black text-amber-300">{statsGeral.funcionariosUnicos}</h3>
            </div>
            <div className="bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent p-6 rounded-[2rem] border border-rose-500/20 space-y-2 shadow-lg shadow-rose-500/5 hover:border-rose-500/30 transition-all">
              <p className="text-[9px] font-black uppercase text-rose-400 tracking-widest">Turmas Alcançadas</p>
              <h3 className="text-3xl font-black text-rose-300">{statsGeral.turmasEnvolvidas}</h3>
            </div>
          </div>

          {/* Gráfico de Evolução e Tipos de Ocorrência */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Evolução Temporal (Line Chart) */}
            <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" /> Evolução de Ocorrências
                </h2>
                
                <div className="flex gap-1.5 bg-surface p-1 rounded-xl border border-white/5">
                  {(['dia', 'semana', 'mes'] as const).map(e => (
                    <button
                      key={e}
                      onClick={() => setEscalaTemporal(e)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                        escalaTemporal === e ? "bg-primary text-black" : "text-on-surface-variant hover:text-white"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {dadosEvolucaoTemporal.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-on-surface-variant">Sem dados no período.</div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full h-48 pt-4">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="stroke-grad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#A855F7" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="0" x2="500" y2="0" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                      <line x1="0" y1="200" x2="500" y2="200" stroke="rgba(255,255,255,0.05)" />
                      {(() => {
                        const maxVal = Math.max(...dadosEvolucaoTemporal.map(d => d.count), 1);
                        const totalPoints = dadosEvolucaoTemporal.length;
                        const pontos = dadosEvolucaoTemporal.map((d, idx) => {
                          const x = totalPoints > 1 ? (idx / (totalPoints - 1)) * 500 : 250;
                          const y = 200 - (d.count / maxVal) * 160;
                          return { x, y, count: d.count };
                        });
                        const pathD = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const areaD = `${pathD} L 500 200 L 0 200 Z`;

                        return (
                          <>
                            {pontos.length > 0 && <path d={areaD} fill="url(#area-grad)" />}
                            {pontos.length > 0 && <path d={pathD} fill="none" stroke="url(#stroke-grad)" strokeWidth={3} />}
                            {pontos.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r={4} fill="#3B82F6" stroke="#121214" strokeWidth={1.5} />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="flex justify-between text-[8px] font-black uppercase text-on-surface-variant tracking-wider pt-2">
                    {dadosEvolucaoTemporal.map((d, i) => <span key={i}>{d.periodo}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Donut Chart Tipos */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <PieChart size={14} className="text-primary" /> Distribuição de Tipos
                </h2>
              </div>

              {tiposRegistroGeral.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-on-surface-variant">Sem ocorrências.</div>
              ) : (
                <div className="space-y-4 pt-4 flex-1 flex flex-col justify-center">
                  <div className="relative w-28 h-28 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                      {(() => {
                        const totalPercent = tiposRegistroGeral.reduce((acc, t) => acc + t.percentual, 0);
                        let offset = 0;
                        const cores = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#D946EF'];
                        return tiposRegistroGeral.map((t, index) => {
                          const r = 40;
                          const circ = 2 * Math.PI * r;
                          const percent = totalPercent > 0 ? (t.percentual / totalPercent) * 100 : 0;
                          const strokeDash = (percent * circ) / 100;
                          const strokeOffset = circ - (offset * circ) / 100;
                          offset += percent;
                          return (
                            <circle
                              key={t.tipo}
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={cores[index % cores.length]}
                              strokeWidth="8"
                              strokeDasharray={`${strokeDash} ${circ}`}
                              strokeDashoffset={strokeOffset}
                              onClick={() => navegarParaTipo(t.tipo)}
                              className="transition-all hover:opacity-80 cursor-pointer"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-white">{statsGeral.total}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {tiposRegistroGeral.map((t, index) => {
                      const cores = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#D946EF'];
                      return (
                        <div key={t.tipo} onClick={() => navegarParaTipo(t.tipo)} className="flex items-center justify-between gap-2 text-[9px] text-on-surface-variant font-medium cursor-pointer hover:bg-white/5 p-0.5 rounded">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cores[index % cores.length] }} />
                            <span className="truncate text-white">{t.tipo}</span>
                          </div>
                          <span className="font-bold shrink-0">{t.percentual}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Rankings Grid (Alunos, Turmas, Séries, Funcionários) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Top 10 Alunos */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <Users size={14} className="text-primary" /> Alunos
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {rankingAlunos.map((aluno, idx) => {
                  const max = rankingAlunos[0]?.count || 1;
                  const pct = (aluno.count / max) * 100;
                  return (
                    <div key={aluno.nome} onClick={() => navegarParaAluno(aluno.nome)} className="space-y-1 cursor-pointer hover:bg-white/5 p-1 rounded-xl transition-all">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate text-white font-bold">#{idx+1} {aluno.nome}</span>
                        <span className="text-primary text-[10px] shrink-0 font-black">{aluno.count} reg</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 Funcionários */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <Award size={14} className="text-primary" /> Funcionários
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {rankingFuncionarios.map((func, idx) => {
                  const max = rankingFuncionarios[0]?.count || 1;
                  const pct = (func.count / max) * 100;
                  return (
                    <div key={func.nome} onClick={() => navegarParaFuncionario(func.nome)} className="space-y-1 cursor-pointer hover:bg-white/5 p-1 rounded-xl transition-all">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate text-white font-bold">#{idx+1} {func.nome}</span>
                        <span className="text-primary text-[10px] shrink-0 font-black">{func.count} reg</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ranking Séries */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <BookOpen size={14} className="text-primary" /> Séries e Anos
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {rankingSeriesAnos.map((s, idx) => {
                  const max = rankingSeriesAnos[0]?.count || 1;
                  const pct = (s.count / max) * 100;
                  return (
                    <div key={s.serie} onClick={() => navegarParaSerie(s.serie)} className="space-y-1 cursor-pointer hover:bg-white/5 p-1 rounded-xl transition-all">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate text-white font-bold">#{idx+1} {s.serie}</span>
                        <span className="text-primary text-[10px] shrink-0 font-black">{s.count} reg</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ranking Turmas */}
            <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <BarChart3 size={14} className="text-primary" /> Top Turmas
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {rankingTurmas.map((t, idx) => {
                  const max = rankingTurmas[0]?.count || 1;
                  const pct = (t.count / max) * 100;
                  return (
                    <div key={t.turma} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate text-white font-bold">#{idx+1} {t.turma}</span>
                        <span className="text-primary text-[10px] shrink-0 font-black">{t.count} reg</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------
          2. ABA: ALUNOS (DETALHADO)
          ------------------------------------------------------------ */}
      {abaAtiva === 'alunos' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-md font-black text-white uppercase tracking-wider">Análise Individual do Aluno</h2>
              <p className="text-xs text-on-surface-variant">Selecione um aluno para auditar o histórico detalhado.</p>
            </div>
            <div className="w-full md:w-80 space-y-1">
              <label className="text-[8px] font-black text-primary uppercase tracking-widest ml-1">Selecionar Aluno</label>
              <select
                value={alunoSelecionado}
                onChange={e => setAlunoSelecionado(e.target.value)}
                className="campo-input w-full text-white bg-surface"
              >
                {listAlunos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {statsAluno && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Resumos Lateral */}
              <div className="space-y-6">
                
                {/* Indicador Único */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Ocorrências do Aluno</p>
                  <h3 className="text-4xl font-black text-white mt-2">{statsAluno.total}</h3>
                  <p className="text-[10px] text-on-surface-variant mt-2 font-semibold">Nome do Aluno: <span className="text-white">{alunoSelecionado}</span></p>
                </div>

                {/* Séries e Frequência do Aluno */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Séries Envolvidas</h3>
                  <div className="space-y-2">
                    {statsAluno.series.map(s => (
                      <div key={s.name} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-semibold">{s.name}</span>
                        <span className="text-white font-bold">{s.count} regs</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dias da semana com maior frequência */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Frequência por Dia da Semana</h3>
                  <div className="space-y-2">
                    {statsAluno.dias.map(d => (
                      <div key={d.name} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-semibold">{d.name}</span>
                        <span className="text-primary font-bold">{d.count} regs</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Horários com maior frequência */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Frequência por Horário</h3>
                  <div className="space-y-2">
                    {statsAluno.horas.map(h => (
                      <div key={h.name} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-semibold">{h.name}</span>
                        <span className="text-primary font-bold">{h.count} regs</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Histórico Completo e Rankings Detalhados do Aluno */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Quem Registrou e Tipos Mais Frequentes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Tipos Ocorrências */}
                  <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">Tipos Mais Frequentes</h3>
                    <div className="space-y-3">
                      {statsAluno.tipos.map(t => (
                        <div key={t.name} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                          <span className="text-white truncate font-bold">{t.name}</span>
                          <span className="text-primary shrink-0 font-black ml-2">{t.count} reg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Funcionários que Registraram */}
                  <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">Quem Registrou</h3>
                    <div className="space-y-3">
                      {statsAluno.funcionarios.map(f => (
                        <div key={f.name} onClick={() => navegarParaFuncionario(f.name)} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 cursor-pointer hover:text-primary transition-all">
                          <span className="truncate font-bold">{f.name}</span>
                          <span className="text-primary shrink-0 font-black ml-2">{f.count} reg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Histórico Tabela */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Histórico Completo de Ocorrências</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-on-surface-variant font-bold uppercase tracking-wider">
                          <th className="pb-3 pr-2">Data</th>
                          <th className="pb-3 pr-2">Tipo</th>
                          <th className="pb-3 pr-2">Relator</th>
                          <th className="pb-3">Descrição / Relato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {statsAluno.historico.map(h => (
                          <tr key={h.id} className="hover:bg-white/5">
                            <td className="py-3 pr-2 font-mono whitespace-nowrap">{new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="py-3 pr-2 font-bold text-white">{h.occurrence_type}</td>
                            <td className="py-3 pr-2 font-semibold text-primary">{h.created_by || 'Sistema'}</td>
                            <td className="py-3 text-on-surface-variant max-w-xs truncate" title={h.report}>{h.report}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------
          3. ABA: FUNCIONÁRIOS (DETALHADO)
          ------------------------------------------------------------ */}
      {abaAtiva === 'funcionarios' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-md font-black text-white uppercase tracking-wider">Auditoria de Funcionário</h2>
              <p className="text-xs text-on-surface-variant">Selecione um funcionário para analisar seu histórico de inserções.</p>
            </div>
            <div className="w-full md:w-80 space-y-1">
              <label className="text-[8px] font-black text-primary uppercase tracking-widest ml-1">Selecionar Funcionário</label>
              <select
                value={funcionarioSelecionado}
                onChange={e => setFuncionarioSelecionado(e.target.value)}
                className="campo-input w-full text-white bg-surface"
              >
                {listFuncionarios.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {statsFuncionario && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Mídias de Auditoria */}
              <div className="space-y-6">
                
                {/* Total e Comparação Média */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Ocorrências Registradas</p>
                    <h3 className="text-4xl font-black text-white mt-2">{statsFuncionario.total}</h3>
                    <p className="text-[10px] text-on-surface-variant mt-2 font-semibold">Nome: <span className="text-white">{funcionarioSelecionado}</span></p>
                  </div>
                  
                  <div className="border-t border-white/5 pt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant">Média Geral de Outros:</span>
                      <span className="text-white font-bold">{statsFuncionario.mediaOutros} regs</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant">Desvio em relação à Média:</span>
                      <span className={cn(
                        "font-bold px-2 py-0.5 rounded text-[10px]",
                        statsFuncionario.total >= statsFuncionario.mediaOutros ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      )}>
                        {statsFuncionario.total >= statsFuncionario.mediaOutros ? '+' : ''}
                        {(statsFuncionario.total - statsFuncionario.mediaOutros).toFixed(1)} regs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Turmas Mais Envolvidas */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Turmas Mais Registradas</h3>
                  <div className="space-y-2">
                    {statsFuncionario.turmas.map(t => (
                      <div key={t.name} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-semibold">{t.name}</span>
                        <span className="text-white font-bold">{t.count} regs</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Horários Preferidos */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Horários com Maior Atividade</h3>
                  <div className="space-y-2">
                    {statsFuncionario.horas.map(h => (
                      <div key={h.name} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-semibold">{h.name}</span>
                        <span className="text-primary font-bold">{h.count} regs</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dias de Atividade */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Atividade por Dia da Semana</h3>
                  <div className="space-y-2">
                    {statsFuncionario.dias.map(d => (
                      <div key={d.name} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-semibold">{d.name}</span>
                        <span className="text-primary font-bold">{d.count} regs</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Tabelas de alunos e tipos deste funcionário */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Alunos mais auditados por ele */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Alunos Registrados por este Funcionário</h3>
                  <div className="space-y-3">
                    {statsFuncionario.alunos.map(a => (
                      <div key={a.name} onClick={() => navegarParaAluno(a.name)} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 cursor-pointer hover:text-primary transition-all">
                        <span className="font-bold">{a.name}</span>
                        <span className="text-primary font-black">{a.count} reg</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipos Ocorrência mais usados */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Tipos de Registro Mais Utilizados</h3>
                  <div className="space-y-3">
                    {statsFuncionario.tipos.map(t => (
                      <div key={t.name} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                        <span className="text-white font-bold">{t.name}</span>
                        <span className="text-primary font-black">{t.count} reg</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------
          4. ABA: ANOS / SÉRIES (DETALHADO)
          ------------------------------------------------------------ */}
      {abaAtiva === 'series' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-md font-black text-white uppercase tracking-wider">Análise por Anos / Séries</h2>
              <p className="text-xs text-on-surface-variant">Selecione uma série para filtrar o comportamento geral.</p>
            </div>
            <div className="w-full md:w-80 space-y-1">
              <label className="text-[8px] font-black text-primary uppercase tracking-widest ml-1">Selecionar Série/Ano</label>
              <select
                value={serieSelecionada}
                onChange={e => setSerieSelecionada(e.target.value)}
                className="campo-input w-full text-white bg-surface"
              >
                {listSeriesAnos.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {statsSerie && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Estatísticas Rápidas */}
              <div className="space-y-6">
                
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest font-bold">Total de Ocorrências</p>
                  <h3 className="text-4xl font-black text-white mt-1">{statsSerie.total}</h3>
                  <p className="text-[10px] text-on-surface-variant mt-2 font-semibold">Série selecionada: <span className="text-white">{serieSelecionada}</span></p>
                </div>

                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest font-bold font-bold">Alunos com Registro</p>
                  <h3 className="text-4xl font-black text-white mt-1">{statsSerie.alunosEnvolvidos}</h3>
                  <p className="text-[10px] text-on-surface-variant mt-2">alunos únicos desta série</p>
                </div>

              </div>

              {/* Gráficos e Tabelas */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Tipos Ocorrência na Série */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Tipos Mais Comuns nesta Série</h3>
                  <div className="space-y-3">
                    {statsSerie.tipos.map(t => (
                      <div key={t.name} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                        <span className="text-white font-bold">{t.name}</span>
                        <span className="text-primary font-black">{t.count} reg</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funcionários que mais registram nessa série */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Funcionários que Mais Registram nesta Série</h3>
                  <div className="space-y-3">
                    {statsSerie.funcionarios.map(f => (
                      <div key={f.name} onClick={() => navegarParaFuncionario(f.name)} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 cursor-pointer hover:text-primary transition-all">
                        <span className="font-bold">{f.name}</span>
                        <span className="text-primary font-black">{f.count} reg</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------
          5. ABA: TIPOS DE REGISTRO
          ------------------------------------------------------------ */}
      {abaAtiva === 'tipos' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-md font-black text-white uppercase tracking-wider">Análise por Tipo de Ocorrência</h2>
              <p className="text-xs text-on-surface-variant">Selecione um tipo de registro para analisar padrões e quem mais os comete.</p>
            </div>
            <div className="w-full md:w-80 space-y-1">
              <label className="text-[8px] font-black text-primary uppercase tracking-widest ml-1">Selecionar Tipo</label>
              <select
                value={tipoSelecionado}
                onChange={e => setTipoSelecionado(e.target.value)}
                className="campo-input w-full text-white bg-surface"
              >
                {listTiposRegistro.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {statsTipo && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KPIs Laterais */}
              <div className="space-y-6">
                
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest font-bold">Volume Total Registrado</p>
                  <h3 className="text-4xl font-black text-white mt-1">{statsTipo.total}</h3>
                  <p className="text-[10px] text-on-surface-variant mt-2 font-semibold">Tipo: <span className="text-white">{tipoSelecionado}</span></p>
                </div>

                {/* Séries onde mais aparece */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Frequência por Série/Ano</h3>
                  <div className="space-y-2">
                    {statsTipo.series.map(s => (
                      <div key={s.name} className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-semibold">{s.name}</span>
                        <span className="text-white font-bold">{s.count} regs</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Detalhes de Alunos e Funcionários vinculados */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Alunos que mais receberam esse tipo */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Top Alunos com este Tipo de Registro</h3>
                  <div className="space-y-3">
                    {statsTipo.alunos.map(a => (
                      <div key={a.name} onClick={() => navegarParaAluno(a.name)} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 cursor-pointer hover:text-primary transition-all">
                        <span className="font-bold">{a.name}</span>
                        <span className="text-primary font-black">{a.count} reg</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funcionários que mais aplicaram esse tipo */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Funcionários que Mais Registraram este Tipo</h3>
                  <div className="space-y-3">
                    {statsTipo.funcionarios.map(f => (
                      <div key={f.name} onClick={() => navegarParaFuncionario(f.name)} className="flex justify-between items-center text-xs border-b border-white/5 pb-1 cursor-pointer hover:text-primary transition-all">
                        <span className="font-bold">{f.name}</span>
                        <span className="text-primary font-black">{f.count} reg</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
