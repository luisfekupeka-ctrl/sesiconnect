import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, Calendar, AlertTriangle, ArrowUpRight, 
  TrendingUp, BarChart2, PieChart, Activity, Filter, 
  RefreshCw, Award, BookOpen, Clock, AlertCircle
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

export default function DashboardSuper() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estados dos Dados
  const [registros, setRegistros] = useState<OcorrenciaRegistro[]>([]);
  const [alunosMap, setAlunosMap] = useState<Map<string, AlunoCMS>>(new Map());
  const [perfis, setPerfis] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Estados dos Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroAnoLetivo, setFiltroAnoLetivo] = useState('Todos');
  const [filtroSerieAno, setFiltroSerieAno] = useState('Todos');
  const [filtroTurma, setFiltroTurma] = useState('Todos');
  const [filtroFuncionario, setFiltroFuncionario] = useState('Todos');

  // Controle de Visualização Temporal
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
      
      // 1. Carregar Ocorrências (Registros Diários)
      const { data: dataOcorrencias, error: errOcorrencias } = await supabase
        .from('daily_occurrence_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (errOcorrencias) throw errOcorrencias;
      setRegistros(dataOcorrencias || []);

      // 2. Carregar Lista de Alunos (para mapear turmas)
      const { data: dataAlunos, error: errAlunos } = await supabase
        .from('alunos_cms')
        .select('nome, turma, ano');

      if (errAlunos) throw errAlunos;

      const map = new Map<string, AlunoCMS>();
      (dataAlunos || []).forEach(aluno => {
        map.set(aluno.nome.trim().toLowerCase(), aluno);
      });
      setAlunosMap(map);

      // 3. Carregar todos os perfis (usuários/funcionários)
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
  // LISTAS PARA FILTROS
  // ============================================================
  const listFuncionarios = useMemo(() => {
    const funcs = new Set<string>();
    registros.forEach(r => {
      if (r.created_by) funcs.add(r.created_by.trim());
    });
    return Array.from(funcs).sort();
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

  // ============================================================
  // FILTRAGEM DOS REGISTROS
  // ============================================================
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      // Filtro Período
      if (filtroDataInicio) {
        const dInicio = new Date(filtroDataInicio + 'T00:00:00');
        if (new Date(r.created_at) < dInicio) return false;
      }
      if (filtroDataFim) {
        const dFim = new Date(filtroDataFim + 'T23:59:59');
        if (new Date(r.created_at) > dFim) return false;
      }

      // Resolvendo Turma / Ano do Aluno
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const turmaAluno = alunoInfo?.turma || 'Sem Turma';
      const anoAluno = alunoInfo?.ano || r.school_year || 'Sem Ano';

      // Filtro Série/Ano
      if (filtroSerieAno !== 'Todos' && anoAluno !== filtroSerieAno) return false;

      // Filtro Turma
      if (filtroTurma !== 'Todos' && turmaAluno !== filtroTurma) return false;

      // Filtro Funcionário
      if (filtroFuncionario !== 'Todos' && r.created_by?.trim() !== filtroFuncionario) return false;

      // Filtro Ano Letivo (Mapeado pelo Ano/Série do Aluno)
      if (filtroAnoLetivo !== 'Todos') {
        const anoMatch = anoAluno.toLowerCase().includes(filtroAnoLetivo.toLowerCase());
        if (!anoMatch) return false;
      }

      return true;
    });
  }, [registros, alunosMap, filtroDataInicio, filtroDataFim, filtroAnoLetivo, filtroSerieAno, filtroTurma, filtroFuncionario]);

  // ============================================================
  // MENSURAÇÃO DE INDICADORES PRINCIPAIS
  // ============================================================
  const stats = useMemo(() => {
    const total = registrosFiltrados.length;
    
    // Hoje
    const hojeStr = new Date().toISOString().split('T')[0];
    const hoje = registrosFiltrados.filter(r => r.created_at.startsWith(hojeStr)).length;

    // Este Mês
    const mesAtual = new Date().toISOString().substring(0, 7); // YYYY-MM
    const esteMes = registrosFiltrados.filter(r => r.created_at.startsWith(mesAtual)).length;

    // Total alunos únicos
    const alunosUnicos = new Set(registrosFiltrados.map(r => r.student_name.trim().toLowerCase())).size;

    // Total funcionários únicos
    const funcionariosUnicos = new Set(
      registrosFiltrados.filter(r => r.created_by).map(r => r.created_by!.trim().toLowerCase())
    ).size;

    return { total, hoje, esteMes, alunosUnicos, funcionariosUnicos };
  }, [registrosFiltrados]);

  // ============================================================
  // RANKING ALUNOS (Top 10)
  // ============================================================
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
        // Encontrar nome correto original
        const original = registrosFiltrados.find(r => r.student_name.trim().toLowerCase() === chave)?.student_name || info.school_year;
        return { nome: original, ...info };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [registrosFiltrados, alunosMap]);

  // ============================================================
  // RANKING TURMAS (Top 10)
  // ============================================================
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

  // ============================================================
  // RANKING SÉRIES/ANOS
  // ============================================================
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

  // ============================================================
  // RANKING FUNCIONÁRIOS (Top 10)
  // ============================================================
  const rankingFuncionarios = useMemo(() => {
    const contagem: { [nome: string]: number } = {};
    
    // Inicializa todos os perfis com cargo de funcionário e status de aprovados
    perfis.forEach(p => {
      const eCargoFuncionario = ['professor', 'monitor', 'admin', 'super_admin'].includes(p.role);
      if (eCargoFuncionario && p.full_name) {
        contagem[p.full_name.trim()] = 0;
      }
    });

    // Contabiliza registros filtrados
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

  // ============================================================
  // TIPOS DE REGISTRO (Top 10 Utilizados)
  // ============================================================
  const tiposRegistroStats = useMemo(() => {
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

  // ============================================================
  // EVOLUÇÃO TEMPORAL (Estatísticas Agrupadas)
  // ============================================================
  const dadosEvolucaoTemporal = useMemo(() => {
    const contagem: { [periodo: string]: number } = {};

    registrosFiltrados.forEach(r => {
      const dataObj = new Date(r.created_at);
      let chave = '';

      if (escalaTemporal === 'dia') {
        chave = dataObj.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (escalaTemporal === 'semana') {
        // Encontrar o domingo anterior
        const dia = dataObj.getDay();
        const diff = dataObj.getDate() - dia;
        const dom = new Date(dataObj.setDate(diff));
        chave = `Sem. ${dom.getDate().toString().padStart(2, '0')}/${(dom.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (escalaTemporal === 'mes') {
        chave = `${dataObj.toLocaleString('pt-BR', { month: 'short' })}/${dataObj.getFullYear().toString().substring(2)}`;
      }

      contagem[chave] = (contagem[chave] || 0) + 1;
    });

    // Ordenar períodos
    return Object.entries(contagem)
      .map(([periodo, count]) => ({ periodo, count }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .slice(-12); // Pega no máximo os últimos 12 pontos
  }, [registrosFiltrados, escalaTemporal]);

  // ============================================================
  // ALERTAS: Crescimento de Alunos, Turmas e Funcionários
  // ============================================================
  const alertasCrescimento = useMemo(() => {
    // Alunos com aumento significativo (compara últimos 15 dias com 15 dias anteriores)
    const ms15Dias = 15 * 24 * 60 * 60 * 1000;
    const agora = new Date().getTime();
    const dLimite1 = new Date(agora - ms15Dias);
    const dLimite2 = new Date(agora - 2 * ms15Dias);

    const contagemAtual: { [aluno: string]: number } = {};
    const contagemAnterior: { [aluno: string]: number } = {};

    registrosFiltrados.forEach(r => {
      const dataReg = new Date(r.created_at).getTime();
      const nome = r.student_name.trim();

      if (dataReg >= dLimite1.getTime()) {
        contagemAtual[nome] = (contagemAtual[nome] || 0) + 1;
      } else if (dataReg >= dLimite2.getTime()) {
        contagemAnterior[nome] = (contagemAnterior[nome] || 0) + 1;
      }
    });

    const alertasAlunos = Object.entries(contagemAtual)
      .map(([nome, atual]) => {
        const anterior = contagemAnterior[nome] || 0;
        const crescimento = atual - anterior;
        return { nome, atual, anterior, crescimento };
      })
      .filter(a => a.crescimento >= 2) // aumento de no mínimo 2 registros
      .sort((a, b) => b.crescimento - a.crescimento)
      .slice(0, 5);

    // Turma com maior crescimento
    const contTurmaAtual: { [turma: string]: number } = {};
    const contTurmaAnterior: { [turma: string]: number } = {};

    registrosFiltrados.forEach(r => {
      const dataReg = new Date(r.created_at).getTime();
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      const turma = alunoInfo?.turma || 'Sem Turma';

      if (dataReg >= dLimite1.getTime()) {
        contTurmaAtual[turma] = (contTurmaAtual[turma] || 0) + 1;
      } else if (dataReg >= dLimite2.getTime()) {
        contTurmaAnterior[turma] = (contTurmaAnterior[turma] || 0) + 1;
      }
    });

    const alertasTurmas = Object.entries(contTurmaAtual)
      .map(([turma, atual]) => {
        const anterior = contTurmaAnterior[turma] || 0;
        const crescimento = atual - anterior;
        return { turma, atual, anterior, crescimento };
      })
      .filter(t => t.crescimento >= 3)
      .sort((a, b) => b.crescimento - a.crescimento)
      .slice(0, 3);

    return { alunos: alertasAlunos, turmas: alertasTurmas };
  }, [registrosFiltrados, alunosMap]);

  // ============================================================
  // LIMPAR FILTROS
  // ============================================================
  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroAnoLetivo('Todos');
    setFiltroSerieAno('Todos');
    setFiltroTurma('Todos');
    setFiltroFuncionario('Todos');
  };

  // Se estiver carregando auth ou não for super_admin, exibe splash de carregamento
  if (authLoading || carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-on-surface-variant text-sm font-semibold tracking-wider uppercase">Carregando painel...</p>
      </div>
    );
  }

  // Prevenir exibição se não for super_admin
  if (profile?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-1">
            <Shield size={14} /> Painel Administrativo Geral
          </div>
          <h1 className="text-3xl font-black text-on-surface-bright tracking-tight">Super Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">Análise em tempo real de registros de ocorrências escolares.</p>
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
          PAINEL DE FILTROS APLICADOS
          ============================================================ */}
      <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
        <h2 className="text-md font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Filter size={16} className="text-[#f1d86f]" /> Filtros Consolidados
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Data Inicial */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Início</label>
            <input 
              type="date" 
              value={filtroDataInicio}
              onChange={e => setFiltroDataInicio(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary"
            />
          </div>

          {/* Data Final */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Fim</label>
            <input 
              type="date" 
              value={filtroDataFim}
              onChange={e => setFiltroDataFim(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary"
            />
          </div>

          {/* Ano Letivo */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Ano Letivo</label>
            <select 
              value={filtroAnoLetivo}
              onChange={e => setFiltroAnoLetivo(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              <option value="6º Ano">6º Ano</option>
              <option value="7º Ano">7º Ano</option>
              <option value="8º Ano">8º Ano</option>
              <option value="9º Ano">9º Ano</option>
              <option value="EM">Ensino Médio</option>
            </select>
          </div>

          {/* Série / Ano */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Série/Ano</label>
            <select 
              value={filtroSerieAno}
              onChange={e => setFiltroSerieAno(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listSeriesAnos.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Turma */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Turma</label>
            <select 
              value={filtroTurma}
              onChange={e => setFiltroTurma(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listTurmas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Funcionário */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Funcionário</label>
            <select 
              value={filtroFuncionario}
              onChange={e => setFiltroFuncionario(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos</option>
              {listFuncionarios.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={limparFiltros}
            className="px-4 py-2 border border-white/10 hover:border-red-500/30 text-xs font-bold text-on-surface-variant hover:text-red-400 bg-surface rounded-xl active:scale-95 transition-all"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* ============================================================
          CARDS DE METRICAS PRINCIPAIS
          ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registros */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Registros</span>
            <Activity size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{stats.total}</h3>
            <p className="text-[10px] text-on-surface-variant mt-1">no período filtrado</p>
          </div>
        </div>

        {/* Hoje */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-black uppercase tracking-widest">Registros Hoje</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{stats.hoje}</h3>
            <p className="text-[10px] text-on-surface-variant mt-1">nas últimas 24h</p>
          </div>
        </div>

        {/* Este Mês */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-black uppercase tracking-widest">Este Mês</span>
            <Calendar size={18} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{stats.esteMes}</h3>
            <p className="text-[10px] text-on-surface-variant mt-1">acumulado do mês corrente</p>
          </div>
        </div>

        {/* Alunos Registrados */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-black uppercase tracking-widest">Alunos com Registro</span>
            <Users size={18} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{stats.alunosUnicos}</h3>
            <p className="text-[10px] text-on-surface-variant mt-1">alunos únicos registrados</p>
          </div>
        </div>

        {/* Funcionários que Registraram */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-black uppercase tracking-widest">Funcionários Ativos</span>
            <Award size={18} className="text-purple-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{stats.funcionariosUnicos}</h3>
            <p className="text-[10px] text-on-surface-variant mt-1">colaboradores que registraram</p>
          </div>
        </div>
      </div>

      {/* ============================================================
          ALERTAS E INSIGHTS EM DESTAQUE
          ============================================================ */}
      {(alertasCrescimento.alunos.length > 0 || alertasCrescimento.turmas.length > 0) && (
        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-[2rem] space-y-4">
          <h2 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={16} /> Alertas de Aumento Significativo (Últimos 15 dias)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alunos com pico */}
            {alertasCrescimento.alunos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Aumento de registros por aluno</h3>
                <div className="space-y-2">
                  {alertasCrescimento.alunos.map(a => (
                    <div key={a.nome} className="bg-surface/50 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{a.nome}</span>
                        <span className="block text-[10px] text-on-surface-variant">Registrou {a.atual} vezes recentes (antes {a.anterior})</span>
                      </div>
                      <span className="px-2.5 py-1 bg-red-500/20 text-red-400 font-bold rounded-lg text-[10px] flex items-center gap-1">
                        +{a.crescimento} <TrendingUp size={12} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Turmas com crescimento */}
            {alertasCrescimento.turmas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Crescimento por Turma</h3>
                <div className="space-y-2">
                  {alertasCrescimento.turmas.map(t => (
                    <div key={t.turma} className="bg-surface/50 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{t.turma}</span>
                        <span className="block text-[10px] text-on-surface-variant">{t.atual} registros recentes (antes {t.anterior})</span>
                      </div>
                      <span className="px-2.5 py-1 bg-red-500/20 text-red-400 font-bold rounded-lg text-[10px] flex items-center gap-1">
                        +{t.crescimento} <TrendingUp size={12} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          GRAFICOS E ANALISES TEMPORAIS
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Evolução Temporal (Line Chart) */}
        <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Evolução de Registros
            </h2>
            
            <div className="flex gap-1.5 bg-surface p-1 rounded-xl border border-white/5">
              {(['dia', 'semana', 'mes'] as const).map(e => (
                <button
                  key={e}
                  onClick={() => setEscalaTemporal(e)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                    escalaTemporal === e 
                      ? "bg-primary text-black" 
                      : "text-on-surface-variant hover:text-white"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Gráfico de Linha SVG */}
          {dadosEvolucaoTemporal.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-on-surface-variant">
              Sem dados históricos no período.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full h-56 pt-6">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f1d86f" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f1d86f" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="0" x2="500" y2="0" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1="200" x2="500" y2="200" stroke="rgba(255,255,255,0.08)" />

                  {/* Pontos calculados */}
                  {(() => {
                    const maxVal = Math.max(...dadosEvolucaoTemporal.map(d => d.count), 1);
                    const totalPoints = dadosEvolucaoTemporal.length;

                    // Gerar pontos (x, y)
                    const pontos = dadosEvolucaoTemporal.map((d, index) => {
                      const x = totalPoints > 1 ? (index / (totalPoints - 1)) * 500 : 250;
                      const y = 200 - (d.count / maxVal) * 170; // reserva margem de 30px no topo
                      return { x, y, val: d.count };
                    });

                    // Gerar string Path
                    const pathD = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaD = `${pathD} L 500 200 L 0 200 Z`;

                    return (
                      <>
                        {/* Gradiente por baixo da linha */}
                        {pontos.length > 0 && (
                          <path d={areaD} fill="url(#area-grad)" />
                        )}
                        {/* Linha principal */}
                        {pontos.length > 0 && (
                          <path d={pathD} fill="none" stroke="#f1d86f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        )}
                        {/* Pontos com tooltip invisível e círculo */}
                        {pontos.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r={4} fill="#f1d86f" stroke="#121214" strokeWidth={1.5} />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" className="opacity-0 hover:opacity-100 transition-opacity bg-black">
                              {p.val}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
              
              {/* Eixo X labels */}
              <div className="flex justify-between text-[9px] font-black uppercase text-on-surface-variant tracking-wider pt-2 px-1">
                {dadosEvolucaoTemporal.map((d, i) => (
                  <span key={i}>{d.periodo}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tipos de Registro Mais Utilizados (Donut/Pie Chart) */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-md font-black text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart size={16} className="text-primary" /> Tipos de Ocorrência
            </h2>
            <p className="text-[10px] text-on-surface-variant mt-1">Percentual dos 10 tipos mais frequentes</p>
          </div>

          {tiposRegistroStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-on-surface-variant">
              Nenhum tipo de registro foi utilizado ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-4">
              
              {/* Donut Chart SVG */}
              <div className="relative w-36 h-36 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                  {(() => {
                    const totalPercent = tiposRegistroStats.reduce((acc, t) => acc + t.percentual, 0);
                    let offset = 0;
                    const cores = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#D946EF'];

                    return tiposRegistroStats.map((t, index) => {
                      const r = 40;
                      const circ = 2 * Math.PI * r; // ~251.3
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
                          strokeWidth="10"
                          strokeDasharray={`${strokeDash} ${circ}`}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest leading-none">Total</span>
                  <span className="text-lg font-black text-white mt-1">{stats.total}</span>
                </div>
              </div>

              {/* Legenda de Tipos */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {(() => {
                  const cores = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#D946EF'];
                  return tiposRegistroStats.map((t, index) => (
                    <div key={t.tipo} className="flex items-center justify-between gap-2 text-[10px] text-on-surface-variant font-medium">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cores[index % cores.length] }} />
                        <span className="truncate text-white" title={t.tipo}>{t.tipo}</span>
                      </div>
                      <span className="font-bold shrink-0">{t.percentual}%</span>
                    </div>
                  ));
                })()}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          RANKINGS: ALUNOS, TURMAS, ANOS/SÉRIES E FUNCIONÁRIOS
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RANKING: ALUNOS */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
            <Users size={16} className="text-primary" /> Top 10 Alunos com Mais Ocorrências
          </h2>

          {rankingAlunos.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-6">Sem registros de alunos no período.</p>
          ) : (
            <div className="space-y-3">
              {rankingAlunos.map((aluno, index) => {
                const max = rankingAlunos[0]?.count || 1;
                const perc = (aluno.count / max) * 100;
                return (
                  <div key={aluno.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-black text-on-surface-variant">#{index + 1}</span>
                        <span className="text-white truncate">{aluno.nome}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-surface rounded-md text-on-surface-variant font-bold uppercase">{aluno.turma}</span>
                      </div>
                      <span className="font-black text-primary">{aluno.count} regs</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all" 
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RANKING: TURMAS */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
            <BookOpen size={16} className="text-primary" /> Top 10 Turmas
          </h2>

          {rankingTurmas.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-6">Sem registros por turmas no período.</p>
          ) : (
            <div className="space-y-3">
              {rankingTurmas.map((turma, index) => {
                const max = rankingTurmas[0]?.count || 1;
                const perc = (turma.count / max) * 100;
                return (
                  <div key={turma.turma} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-black text-on-surface-variant">#{index + 1}</span>
                        <span className="text-white truncate">{turma.turma}</span>
                      </div>
                      <span className="font-black text-primary">{turma.count} ocorrências</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all" 
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RANKING: SÉRIES / ANOS */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
            <BarChart2 size={16} className="text-primary" /> Séries e Anos Escolares
          </h2>

          {rankingSeriesAnos.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-6">Sem registros por séries no período.</p>
          ) : (
            <div className="space-y-3">
              {rankingSeriesAnos.map((serie, index) => {
                const max = rankingSeriesAnos[0]?.count || 1;
                const perc = (serie.count / max) * 100;
                return (
                  <div key={serie.serie} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-black text-on-surface-variant">#{index + 1}</span>
                        <span className="text-white truncate">{serie.serie}</span>
                      </div>
                      <span className="font-black text-primary">{serie.count} regs</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all" 
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RANKING: FUNCIONÁRIOS */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] border border-white/5 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
            <Award size={16} className="text-primary" /> Funcionários que Mais Registraram
          </h2>

          {rankingFuncionarios.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-6">Sem registros criados por funcionários no período.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {rankingFuncionarios.map((func, index) => {
                const max = rankingFuncionarios[0]?.count || 1;
                const perc = (func.count / max) * 100;
                return (
                  <div key={func.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-black text-on-surface-variant">#{index + 1}</span>
                        <span className="text-white truncate">{func.nome}</span>
                      </div>
                      <span className="font-black text-primary">{func.count} regs</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-full transition-all" 
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
