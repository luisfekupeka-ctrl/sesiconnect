import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, Calendar, AlertTriangle, ArrowUpRight, 
  TrendingUp, BarChart2, PieChart, Activity, Filter, 
  RefreshCw, Award, BookOpen, Clock, AlertCircle, FileText,
  UserCheck, ChevronRight, BarChart3, HelpCircle, Columns, ToggleLeft, ToggleRight,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

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

interface FiltroSet {
  tipoPeriodo: 'dia' | 'semana' | 'mes' | 'ano' | 'personalizado' | 'tudo';
  dataDia: string;            
  dataSemana: string;         
  dataMes: string;            
  dataAno: string;            
  dataInicio: string;         
  dataFim: string;            
  serieAno: string;           
  turma: string;              
  funcionario: string;        
  aluno: string;              
  tipoOcorrencia: string;     
  anoLetivo: string;          
}

const filtroInicial: FiltroSet = {
  tipoPeriodo: 'tudo',
  dataDia: new Date().toISOString().split('T')[0],
  dataSemana: new Date().toISOString().split('T')[0],
  dataMes: new Date().toISOString().slice(0, 7),
  dataAno: new Date().getFullYear().toString(),
  dataInicio: '',
  dataFim: '',
  serieAno: 'Todos',
  turma: 'Todos',
  funcionario: 'Todos',
  aluno: 'Todos',
  tipoOcorrencia: 'Todos',
  anoLetivo: 'Todos',
};

function obterDatasFiltro(filtro: FiltroSet) {
  let inicio = '';
  let fim = '';

  const formatarData = (d: Date) => {
    const ano = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  switch (filtro.tipoPeriodo) {
    case 'dia':
      if (filtro.dataDia) {
        inicio = filtro.dataDia;
        fim = filtro.dataDia;
      }
      break;
    case 'semana':
      if (filtro.dataSemana) {
        const ref = new Date(filtro.dataSemana + 'T12:00:00');
        const diaSemana = ref.getDay();
        const dom = new Date(ref);
        dom.setDate(ref.getDate() - diaSemana);
        const sab = new Date(ref);
        sab.setDate(ref.getDate() + (6 - diaSemana));
        inicio = formatarData(dom);
        fim = formatarData(sab);
      }
      break;
    case 'mes':
      if (filtro.dataMes) {
        const [ano, mes] = filtro.dataMes.split('-').map(Number);
        if (ano && mes) {
          const pDia = new Date(ano, mes - 1, 1);
          const uDia = new Date(ano, mes, 0);
          inicio = formatarData(pDia);
          fim = formatarData(uDia);
        }
      }
      break;
    case 'ano':
      if (filtro.dataAno) {
        const ano = Number(filtro.dataAno);
        if (ano) {
          inicio = `${ano}-01-01`;
          fim = `${ano}-12-31`;
        }
      }
      break;
    case 'personalizado':
      inicio = filtro.dataInicio;
      fim = filtro.dataFim;
      break;
    case 'tudo':
    default:
      inicio = '';
      fim = '';
      break;
  }

  return { inicio, fim };
}

function filtrarRegistros(registrosList: OcorrenciaRegistro[], alunosMap: Map<string, AlunoCMS>, filtro: FiltroSet) {
  const { inicio, fim } = obterDatasFiltro(filtro);

  return registrosList.filter(r => {
    const dataStr = r.created_at ? r.created_at.split(/[\sT]/)[0] : '';
    if (inicio && dataStr < inicio) return false;
    if (fim && dataStr > fim) return false;

    const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
    const turmaAluno = alunoInfo?.turma || 'Sem Turma';
    const anoAluno = alunoInfo?.ano || r.school_year || 'Sem Ano';

    if (filtro.serieAno !== 'Todos' && anoAluno !== filtro.serieAno) return false;
    if (filtro.turma !== 'Todos' && turmaAluno !== filtro.turma) return false;
    if (filtro.funcionario !== 'Todos' && r.created_by?.trim() !== filtro.funcionario) return false;
    if (filtro.aluno !== 'Todos' && r.student_name.trim() !== filtro.aluno) return false;
    if (filtro.tipoOcorrencia !== 'Todos' && r.occurrence_type?.trim() !== filtro.tipoOcorrencia) return false;
    
    if (filtro.anoLetivo !== 'Todos') {
      const anoMatch = anoAluno.toLowerCase().includes(filtro.anoLetivo.toLowerCase());
      if (!anoMatch) return false;
    }

    return true;
  });
}

function calcularStatsParaConjunto(registrosFiltrados: OcorrenciaRegistro[], alunosMap: Map<string, AlunoCMS>) {
  const total = registrosFiltrados.length;
  
  const alunosUnicos = new Set(
    registrosFiltrados.map(r => r.student_name.trim().toLowerCase())
  ).size;
  
  const funcionariosUnicos = new Set(
    registrosFiltrados.filter(r => r.created_by).map(r => r.created_by!.trim().toLowerCase())
  ).size;

  const turmasEnvolvidas = new Set(
    registrosFiltrados.map(r => {
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      return alunoInfo?.turma || 'Sem Turma';
    })
  ).size;

  const contagemTipos: { [tipo: string]: number } = {};
  registrosFiltrados.forEach(r => {
    if (r.occurrence_type) {
      const t = r.occurrence_type.trim();
      contagemTipos[t] = (contagemTipos[t] || 0) + 1;
    }
  });
  const tiposBreakdown = Object.entries(contagemTipos)
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const contagemAlunos: { [aluno: string]: number } = {};
  registrosFiltrados.forEach(r => {
    const a = r.student_name.trim();
    contagemAlunos[a] = (contagemAlunos[a] || 0) + 1;
  });
  const alunosBreakdown = Object.entries(contagemAlunos)
    .map(([nome, count]) => ({ nome, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const contagemFuncionarios: { [func: string]: number } = {};
  registrosFiltrados.forEach(r => {
    if (r.created_by) {
      const f = r.created_by.trim();
      contagemFuncionarios[f] = (contagemFuncionarios[f] || 0) + 1;
    }
  });
  const funcionariosBreakdown = Object.entries(contagemFuncionarios)
    .map(([nome, count]) => ({ nome, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const contagemTurmas: { [turma: string]: number } = {};
  registrosFiltrados.forEach(r => {
    const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
    const t = alunoInfo?.turma || 'Sem Turma';
    contagemTurmas[t] = (contagemTurmas[t] || 0) + 1;
  });
  const turmasBreakdown = Object.entries(contagemTurmas)
    .map(([turma, count]) => ({ turma, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const contagemSeries: { [serie: string]: number } = {};
  registrosFiltrados.forEach(r => {
    const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
    const s = alunoInfo?.ano || r.school_year || 'Sem Série';
    contagemSeries[s] = (contagemSeries[s] || 0) + 1;
  });
  const seriesBreakdown = Object.entries(contagemSeries)
    .map(([serie, count]) => ({ serie, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentRecords = [...registrosFiltrados]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  return {
    total,
    alunosUnicos,
    funcionariosUnicos,
    turmasEnvolvidas,
    tiposBreakdown,
    alunosBreakdown,
    funcionariosBreakdown,
    turmasBreakdown,
    seriesBreakdown,
    recentRecords
  };
}

function obterPontosEvolucao(registrosFiltrados: OcorrenciaRegistro[], filtro: FiltroSet) {
  const contagem: { [chave: string]: number } = {};

  let formato: 'dia_mes' | 'dia_semana' | 'mes_ano' | 'data' | 'mes_ano_absoluto' = 'data';

  if (filtro.tipoPeriodo === 'mes') {
    formato = 'dia_mes'; 
  } else if (filtro.tipoPeriodo === 'semana') {
    formato = 'dia_semana'; 
  } else if (filtro.tipoPeriodo === 'ano') {
    formato = 'mes_ano'; 
  } else if (filtro.tipoPeriodo === 'tudo') {
    formato = 'mes_ano_absoluto';
  }

  registrosFiltrados.forEach(r => {
    const dataObj = new Date(r.created_at);
    let chave = '';

    if (formato === 'dia_mes') {
      chave = dataObj.getDate().toString().padStart(2, '0');
    } else if (formato === 'dia_semana') {
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      chave = dias[dataObj.getDay()];
    } else if (formato === 'mes_ano') {
      chave = (dataObj.getMonth() + 1).toString().padStart(2, '0');
    } else if (formato === 'mes_ano_absoluto') {
      chave = `${dataObj.getFullYear()}-${(dataObj.getMonth() + 1).toString().padStart(2, '0')}`;
    } else {
      chave = dataObj.toISOString().split('T')[0];
    }

    contagem[chave] = (contagem[chave] || 0) + 1;
  });

  return Object.entries(contagem)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default function DashboardSuper() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [registros, setRegistros] = useState<OcorrenciaRegistro[]>([]);
  const [alunosMap, setAlunosMap] = useState<Map<string, AlunoCMS>>(new Map());
  const [perfis, setPerfis] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [comparacaoAtiva, setComparacaoAtiva] = useState(false);
  const [filtrosA, setFiltrosA] = useState<FiltroSet>(filtroInicial);
  const [filtrosB, setFiltrosB] = useState<FiltroSet>(filtroInicial);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'super_admin') {
        navigate('/');
      } else {
        carregarDados();
      }
    }
  }, [profile, authLoading, navigate]);

  const carregarDados = async () => {
    try {
      setAtualizando(true);

      const { data: recs, error: errRecs } = await supabase
        .from('daily_occurrence_records')
        .select('*');
      if (errRecs) throw errRecs;
      setRegistros(recs || []);

      const { data: profs, error: errProfs } = await supabase
        .from('profiles')
        .select('*');
      if (errProfs) throw errProfs;
      setPerfis(profs || []);

      const { data: alunosData, error: errAlunos } = await supabase
        .from('alunos_cms')
        .select('nome, turma, ano');
      if (errAlunos) throw errAlunos;

      const map = new Map<string, AlunoCMS>();
      (alunosData || []).forEach(a => {
        if (a.nome) map.set(a.nome.trim().toLowerCase(), a);
      });
      setAlunosMap(map);

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  const listas = useMemo(() => {
    const listAlunos = Array.from(new Set(registros.map(r => r.student_name.trim()))).sort();
    
    const listTurmasSet = new Set<string>();
    const listSeriesAnosSet = new Set<string>();
    const listAnoLetivoSet = new Set<string>();
    
    registros.forEach(r => {
      const alunoInfo = alunosMap.get(r.student_name.trim().toLowerCase());
      listTurmasSet.add(alunoInfo?.turma || 'Sem Turma');
      const ano = alunoInfo?.ano || r.school_year || 'Sem Série';
      listSeriesAnosSet.add(ano);
      
      const anoMatch = ano.match(/20\d{2}/);
      if (anoMatch) {
        listAnoLetivoSet.add(anoMatch[0]);
      } else {
        listAnoLetivoSet.add('Outros');
      }
    });

    const listFuncionariosSet = new Set<string>();
    perfis.forEach(p => {
      const isFunc = ['professor', 'monitor', 'admin', 'super_admin'].includes(p.role);
      if (isFunc && p.full_name) {
        listFuncionariosSet.add(p.full_name.trim());
      }
    });
    registros.forEach(r => {
      if (r.created_by) listFuncionariosSet.add(r.created_by.trim());
    });

    const listTiposRegistro = Array.from(new Set(registros.filter(r => r.occurrence_type).map(r => r.occurrence_type.trim()))).sort();

    return {
      alunos: ['Todos', ...listAlunos],
      turmas: ['Todos', ...Array.from(listTurmasSet).sort()],
      seriesAnos: ['Todos', ...Array.from(listSeriesAnosSet).sort()],
      anoLetivo: ['Todos', ...Array.from(listAnoLetivoSet).sort()],
      funcionarios: ['Todos', ...Array.from(listFuncionariosSet).sort()],
      tiposRegistro: ['Todos', ...listTiposRegistro],
    };
  }, [registros, alunosMap, perfis]);

  const registrosFiltradosA = useMemo(() => filtrarRegistros(registros, alunosMap, filtrosA), [registros, alunosMap, filtrosA]);
  const registrosFiltradosB = useMemo(() => comparacaoAtiva ? filtrarRegistros(registros, alunosMap, filtrosB) : [], [registros, alunosMap, filtrosB, comparacaoAtiva]);

  const statsA = useMemo(() => calcularStatsParaConjunto(registrosFiltradosA, alunosMap), [registrosFiltradosA, alunosMap]);
  const statsB = useMemo(() => calcularStatsParaConjunto(registrosFiltradosB, alunosMap), [registrosFiltradosB, alunosMap]);

  const dadosGraficoComparativo = useMemo(() => {
    const pontosA = obterPontosEvolucao(registrosFiltradosA, filtrosA);
    const pontosB = comparacaoAtiva ? obterPontosEvolucao(registrosFiltradosB, filtrosB) : [];

    const chavesSet = new Set<string>();
    pontosA.forEach(p => chavesSet.add(p.label));
    pontosB.forEach(p => chavesSet.add(p.label));
    
    const labelsOrdenados = Array.from(chavesSet).sort((a, b) => {
      if (!isNaN(Number(a)) && !isNaN(Number(b))) {
        return Number(a) - Number(b);
      }
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const idxA = dias.indexOf(a);
      const idxB = dias.indexOf(b);
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      return a.localeCompare(b);
    });

    return labelsOrdenados.map(label => {
      const countA = pontosA.find(p => p.label === label)?.count || 0;
      const countB = pontosB.find(p => p.label === label)?.count || 0;
      return { label, countA, countB };
    });
  }, [registrosFiltradosA, registrosFiltradosB, filtrosA, filtrosB, comparacaoAtiva]);

  const updateFiltro = (setFunc: React.Dispatch<React.SetStateAction<FiltroSet>>, key: keyof FiltroSet, value: any) => {
    setFunc(prev => ({ ...prev, [key]: value }));
  };

  const renderFiltrosColuna = (filtro: FiltroSet, setFiltro: React.Dispatch<React.SetStateAction<FiltroSet>>, titulo: string, corLabel: string) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className={`text-sm font-black uppercase tracking-widest ${corLabel} flex items-center gap-2`}>
          <Filter size={14} /> {titulo}
        </div>
        <button 
          onClick={() => setFiltro(filtroInicial)}
          className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg active:scale-95"
        >
          <RefreshCw size={10} /> Limpar
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Período</label>
          <select 
            value={filtro.tipoPeriodo} 
            onChange={(e) => updateFiltro(setFiltro, 'tipoPeriodo', e.target.value)}
            className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
          >
            <option value="tudo">Todo o Período</option>
            <option value="dia">Um Único Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mês</option>
            <option value="ano">Ano</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        {filtro.tipoPeriodo === 'dia' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Data</label>
            <input 
              type="date" 
              value={filtro.dataDia} 
              onChange={(e) => updateFiltro(setFiltro, 'dataDia', e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all [color-scheme:dark]"
            />
          </div>
        )}
        {filtro.tipoPeriodo === 'semana' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Qualquer dia da Semana</label>
            <input 
              type="date" 
              value={filtro.dataSemana} 
              onChange={(e) => updateFiltro(setFiltro, 'dataSemana', e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all [color-scheme:dark]"
            />
          </div>
        )}
        {filtro.tipoPeriodo === 'mes' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Mês</label>
            <input 
              type="month" 
              value={filtro.dataMes} 
              onChange={(e) => updateFiltro(setFiltro, 'dataMes', e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all [color-scheme:dark]"
            />
          </div>
        )}
        {filtro.tipoPeriodo === 'ano' && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ano</label>
            <input 
              type="number" 
              min="2000" max="2100"
              value={filtro.dataAno} 
              onChange={(e) => updateFiltro(setFiltro, 'dataAno', e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
            />
          </div>
        )}
        {filtro.tipoPeriodo === 'personalizado' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Início</label>
              <input 
                type="date" 
                value={filtro.dataInicio} 
                onChange={(e) => updateFiltro(setFiltro, 'dataInicio', e.target.value)}
                className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Fim</label>
              <input 
                type="date" 
                value={filtro.dataFim} 
                onChange={(e) => updateFiltro(setFiltro, 'dataFim', e.target.value)}
                className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </>
        )}

        {/* Demais Filtros */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ano Letivo</label>
          <select value={filtro.anoLetivo} onChange={(e) => updateFiltro(setFiltro, 'anoLetivo', e.target.value)} className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
            {listas.anoLetivo.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Série / Ano</label>
          <select value={filtro.serieAno} onChange={(e) => updateFiltro(setFiltro, 'serieAno', e.target.value)} className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
            {listas.seriesAnos.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Turma</label>
          <select value={filtro.turma} onChange={(e) => updateFiltro(setFiltro, 'turma', e.target.value)} className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
            {listas.turmas.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Funcionário</label>
          <select value={filtro.funcionario} onChange={(e) => updateFiltro(setFiltro, 'funcionario', e.target.value)} className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
            {listas.funcionarios.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Aluno</label>
          <select value={filtro.aluno} onChange={(e) => updateFiltro(setFiltro, 'aluno', e.target.value)} className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
            {listas.alunos.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tipo de Ocorrência</label>
          <select value={filtro.tipoOcorrencia} onChange={(e) => updateFiltro(setFiltro, 'tipoOcorrencia', e.target.value)} className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
            {listas.tiposRegistro.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderMetricCard = (icon: React.ReactNode, label: string, valA: number, valB: number | null, colorClass: string) => {
    const bgClass = colorClass.replace('text-', 'bg-');
    return (
      <div className={`bg-surface-container-low p-6 rounded-[2rem] border border-white/5 hover:border-${colorClass.split('-')[1]}-500/30 transition-all relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.05] rounded-full blur-3xl group-hover:opacity-15 transition-opacity ${bgClass}`} />
        <div className={`absolute -bottom-4 -left-4 w-24 h-24 opacity-[0.03] rounded-full blur-2xl group-hover:opacity-10 transition-opacity ${bgClass}`} />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={`p-3.5 rounded-2xl ${bgClass.replace('400', '500/10')} text-white shadow-lg shadow-black/20`}>
            {icon}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-end gap-3 mt-1">
            <h3 className={`text-4xl font-black ${colorClass}`}>{valA.toLocaleString('pt-BR')}</h3>
            {valB !== null && (
              <div className="flex items-center gap-2 mb-1.5 bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                <span className="text-xs font-bold text-on-surface-variant">vs</span>
                <span className="text-lg font-bold text-amber-400">{valB.toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBreakdownList = (title: string, dataA: any[], dataB: any[] | null, labelKey: string, baseColor: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose' = 'cyan') => {
    const colorMap = {
      cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', borderHover: 'hover:border-cyan-500/30' },
      purple: { text: 'text-purple-400', bg: 'bg-purple-400/10', borderHover: 'hover:border-purple-500/30' },
      amber: { text: 'text-amber-400', bg: 'bg-amber-400/10', borderHover: 'hover:border-amber-500/30' },
      emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', borderHover: 'hover:border-emerald-500/30' },
      rose: { text: 'text-rose-400', bg: 'bg-rose-400/10', borderHover: 'hover:border-rose-500/30' }
    };
    const theme = colorMap[baseColor];

    return (
      <div className={`bg-surface-container-low p-5 rounded-[2rem] border border-white/5 ${theme.borderHover} transition-colors space-y-4 flex flex-col h-full relative overflow-hidden group`}>
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.02] rounded-full blur-3xl group-hover:opacity-10 transition-opacity ${theme.bg.replace('/10', '')}`} />
        <h3 className={`text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 relative z-10`}>
          {title}
        </h3>
        {comparacaoAtiva ? (
          <div className="flex gap-4 flex-1 relative z-10">
            <div className="flex-1 space-y-3">
              <div className={`text-[10px] font-bold ${theme.text} uppercase tracking-widest mb-2`}>Filtros A</div>
              {dataA.length === 0 ? <p className="text-xs text-on-surface-variant">Sem dados</p> : dataA.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-white truncate pr-2 max-w-[120px]" title={item[labelKey]}>{item[labelKey]}</span>
                  <span className={`font-bold ${theme.text} ${theme.bg} px-2 py-0.5 rounded-full`}>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="w-px bg-white/5" />
            <div className="flex-1 space-y-3">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Filtros B</div>
              {dataB?.length === 0 ? <p className="text-xs text-on-surface-variant">Sem dados</p> : dataB?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-white truncate pr-2 max-w-[120px]" title={item[labelKey]}>{item[labelKey]}</span>
                  <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 flex-1 relative z-10">
            {dataA.length === 0 ? <p className="text-xs text-on-surface-variant">Nenhum dado encontrado</p> : dataA.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-xl bg-surface-container/50 hover:bg-surface-container transition-colors">
                <span className="text-white font-medium truncate pr-2">{item[labelKey]}</span>
                <span className={`font-bold ${theme.text} ${theme.bg} px-3 py-1 rounded-full`}>{item.count} registros</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-cyan-400 uppercase tracking-widest animate-pulse">Carregando Inteligência...</p>
        </div>
      </div>
    );
  }

  const maxCountGrafico = Math.max(...dadosGraficoComparativo.map(d => Math.max(d.countA, d.countB)), 1);

  const formatLabel = (label: string) => {
    if (label.match(/^\d{4}-\d{2}$/)) {
      const [y, m] = label.split('-');
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${meses[parseInt(m) - 1]} ${y.slice(2)}`;
    }
    return label;
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-6 relative overflow-x-hidden">
      
      {/* Header */}
      <div className="relative pt-12 pb-6 px-6 md:px-12 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-cyan-500/5 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[120%] bg-purple-500/5 blur-[120px] rounded-full" />
        </div>
        
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Activity size={12} /> Exclusivo Super Admin
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Dashboard de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Inteligência</span>
            </h1>
            <p className="text-on-surface-variant mt-2 max-w-2xl text-sm leading-relaxed">
              Análise avançada, unificada e comparativa de todos os registros da instituição.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={carregarDados}
              disabled={atualizando}
              className="px-5 py-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-white/5 text-white text-sm font-bold flex items-center gap-2 transition-all active:scale-95 group"
            >
              <RefreshCw size={16} className={cn("text-cyan-400 group-hover:rotate-180 transition-transform duration-500", atualizando && "animate-spin")} />
              {atualizando ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-8">
        
        {/* Painel de Filtros Unificado */}
        <div className="bg-surface-container-low/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-6 border-b border-white/5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-3">
                <Filter className="text-cyan-400" size={20} /> Painel de Filtros
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">Refine a busca ou ative a comparação de períodos e entidades.</p>
            </div>
            
            <button 
              onClick={() => setComparacaoAtiva(!comparacaoAtiva)}
              className={cn(
                "px-6 py-3 rounded-2xl border text-sm font-bold flex items-center gap-3 transition-all",
                comparacaoAtiva 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]" 
                  : "bg-surface-container border-white/10 text-on-surface-variant hover:bg-white/5"
              )}
            >
              {comparacaoAtiva ? <ToggleRight size={20} className="animate-pulse" /> : <ToggleLeft size={20} />}
              {comparacaoAtiva ? 'Comparação Ativada' : 'Ativar Comparação (A × B)'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 transition-all">
            {/* Lado A */}
            <div className="space-y-4">
              {renderFiltrosColuna(filtrosA, setFiltrosA, 'Análise Principal (A)', 'text-cyan-400')}
            </div>

            {/* Lado B */}
            {comparacaoAtiva && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                {renderFiltrosColuna(filtrosB, setFiltrosB, 'Comparação (B)', 'text-amber-400')}
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas Consolidadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricCard(<FileText size={20} />, "Total de Registros", statsA.total, comparacaoAtiva ? statsB.total : null, "text-cyan-400")}
          {renderMetricCard(<Users size={20} />, "Alunos Envolvidos", statsA.alunosUnicos, comparacaoAtiva ? statsB.alunosUnicos : null, "text-purple-400")}
          {renderMetricCard(<UserCheck size={20} />, "Colaboradores", statsA.funcionariosUnicos, comparacaoAtiva ? statsB.funcionariosUnicos : null, "text-emerald-400")}
          {renderMetricCard(<BookOpen size={20} />, "Turmas", statsA.turmasEnvolvidas, comparacaoAtiva ? statsB.turmasEnvolvidas : null, "text-rose-400")}
        </div>

        {/* Gráfico Temporal */}
        <div className="bg-surface-container-low p-6 md:p-8 rounded-[2rem] border border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" /> Evolução Temporal
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">Acompanhamento de registros com base no período selecionado.</p>
            </div>
            {comparacaoAtiva && (
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest bg-surface-container px-4 py-2 rounded-full border border-white/5">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-400"></div> Filtros A</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Filtros B</span>
              </div>
            )}
          </div>

          <div className="w-full h-[300px] md:h-[400px] relative">
            {dadosGraficoComparativo.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant font-medium">
                Nenhum dado encontrado para gerar o gráfico.
              </div>
            ) : (
              <svg viewBox="0 0 1000 300" className="w-full h-auto overflow-visible drop-shadow-xl">
                <defs>
                  <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Eixo Y */}
                <line x1="60" y1="20" x2="60" y2="260" stroke="currentColor" className="text-white/10" strokeWidth="2" />
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const y = 20 + (pct * 240);
                  return (
                    <g key={pct}>
                      <line x1="60" y1={y} x2="960" y2={y} stroke="currentColor" className="text-white/10" strokeDasharray="6 6" />
                      <text x="50" y={y} fill="currentColor" className="text-on-surface-variant text-[12px] font-medium" textAnchor="end" dominantBaseline="middle">
                        {Math.round((1 - pct) * maxCountGrafico)}
                      </text>
                    </g>
                  );
                })}

                {/* Linhas de Dados */}
                {(() => {
                  const numPoints = Math.max(dadosGraficoComparativo.length - 1, 1);
                  
                  const ptsA = dadosGraficoComparativo.map((d, i) => {
                    const x = 60 + (i / numPoints) * 900;
                    const y = 20 + (1 - (d.countA / maxCountGrafico)) * 240;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  const ptsB = comparacaoAtiva ? dadosGraficoComparativo.map((d, i) => {
                    const x = 60 + (i / numPoints) * 900;
                    const y = 20 + (1 - (d.countB / maxCountGrafico)) * 240;
                    return `${x},${y}`;
                  }).join(' ') : '';

                  return (
                    <>
                      {/* Área e Linha A */}
                      <polyline points={ptsA} fill="none" stroke="#22d3ee" strokeWidth="4" className="drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" strokeLinejoin="round" />
                      <polygon points={`60,260 ${ptsA} 960,260`} fill="url(#gradA)" />
                      
                      {/* Pontos A */}
                      {dadosGraficoComparativo.map((d, i) => {
                        const cx = 60 + (i / numPoints) * 900;
                        const cy = 20 + (1 - (d.countA / maxCountGrafico)) * 240;
                        return (
                          <g key={`pt-a-${i}`} className="group/pt cursor-pointer">
                            <circle cx={cx} cy={cy} r="6" fill="#22d3ee" stroke="#121214" strokeWidth="3" className="transition-all group-hover/pt:r-8 hover:fill-white" />
                            <text x={cx} y={cy - 20} fill="#22d3ee" className="text-[14px] font-black opacity-0 group-hover/pt:opacity-100 transition-opacity" textAnchor="middle">{d.countA}</text>
                            {/* Rótulo Eixo X */}
                            <text x={cx} y={285} fill="currentColor" className="text-on-surface-variant text-[12px] font-bold" textAnchor="middle">{formatLabel(d.label)}</text>
                          </g>
                        );
                      })}

                      {/* Área e Linha B */}
                      {comparacaoAtiva && (
                        <>
                          <polyline points={ptsB} fill="none" stroke="#fbbf24" strokeWidth="4" className="drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" strokeLinejoin="round" />
                          <polygon points={`60,260 ${ptsB} 960,260`} fill="url(#gradB)" />
                          {/* Pontos B */}
                          {dadosGraficoComparativo.map((d, i) => {
                            const cx = 60 + (i / numPoints) * 900;
                            const cy = 20 + (1 - (d.countB / maxCountGrafico)) * 240;
                            return (
                              <g key={`pt-b-${i}`} className="group/pt cursor-pointer">
                                <circle cx={cx} cy={cy} r="6" fill="#fbbf24" stroke="#121214" strokeWidth="3" className="transition-all group-hover/pt:r-8 hover:fill-white" />
                                <text x={cx} y={cy - 20} fill="#fbbf24" className="text-[14px] font-black opacity-0 group-hover/pt:opacity-100 transition-opacity" textAnchor="middle">{d.countB}</text>
                              </g>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* Breakdowns e Rankings Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderBreakdownList('Top Tipos de Ocorrência', statsA.tiposBreakdown, comparacaoAtiva ? statsB.tiposBreakdown : null, 'tipo', 'cyan')}
          {renderBreakdownList('Top Alunos', statsA.alunosBreakdown, comparacaoAtiva ? statsB.alunosBreakdown : null, 'nome', 'purple')}
          {renderBreakdownList('Top Funcionários', statsA.funcionariosBreakdown, comparacaoAtiva ? statsB.funcionariosBreakdown : null, 'nome', 'amber')}
          {renderBreakdownList('Top Turmas', statsA.turmasBreakdown, comparacaoAtiva ? statsB.turmasBreakdown : null, 'turma', 'emerald')}
          {renderBreakdownList('Top Séries/Anos', statsA.seriesBreakdown, comparacaoAtiva ? statsB.seriesBreakdown : null, 'serie', 'rose')}
          
          {/* Ocorrências Recentes */}
          <div className="bg-surface-container-low p-5 rounded-[2rem] border border-white/5 space-y-4 flex flex-col h-full">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" /> Recentes (Filtro A)
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
              {statsA.recentRecords.length === 0 ? <p className="text-xs text-on-surface-variant">Sem ocorrências recentes</p> : statsA.recentRecords.map(r => (
                <div key={r.id} className="p-3 bg-surface-container rounded-xl space-y-2 border border-white/5 hover:border-cyan-500/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white line-clamp-1">{r.student_name}</span>
                    <span className="text-[9px] text-on-surface-variant shrink-0">{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface text-[10px] text-cyan-400">
                    <AlertTriangle size={10} /> {r.occurrence_type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
