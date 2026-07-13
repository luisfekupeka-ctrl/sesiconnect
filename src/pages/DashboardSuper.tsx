import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight,
  TrendingUp, BarChart2, PieChart, Activity, Filter, RefreshCw, Award, 
  BookOpen, Clock, FileText, UserCheck, ChevronRight, Zap, Target, 
  Flame, Bell, Search, LayoutDashboard, Columns, MousePointer2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RechartsPieChart, Pie, ComposedChart
} from 'recharts';
import { 
  parseISO, isSameDay, isWithinInterval, startOfDay, endOfDay,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, differenceInWeeks, differenceInMonths,
  subDays, subMonths, subYears, format, getDay, getHours, isValid, parse
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- TYPES ---
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
interface AlunoCMS { nome: string; turma: string; ano: string; }
type ContextoAnalise = 'Geral' | 'Ano Letivo' | 'Período' | 'Série' | 'Aluno' | 'Funcionário' | 'Tipo de Ocorrência';
interface FiltroSet {
  tipoPeriodo: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado' | 'tudo';
  dataInicio: string;
  dataFim: string;
  anoLetivo: string;
  serieAno: string;
  turma: string;
  aluno: string;
  funcionario: string;
  tipoOcorrencia: string;
  turno: string;
  unidade: string;
}

const filtroInicial: FiltroSet = {
  tipoPeriodo: 'mes',
  dataInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  dataFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  anoLetivo: 'Todos',
  serieAno: 'Todos',
  turma: 'Todos',
  aluno: 'Todos',
  funcionario: 'Todos',
  tipoOcorrencia: 'Todos',
  turno: 'Todos',
  unidade: 'Todos',
};

// --- ESTATÍSTICA (MATH ENGINE) ---
function calcStats(numbers: number[]) {
  if (numbers.length === 0) return { mean: 0, median: 0, mode: 0, variance: 0, stdDev: 0, min: 0, max: 0 };
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / numbers.length;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const counts: Record<number, number> = {};
  let mode = sorted[0];
  let maxCount = 0;
  for (const num of sorted) {
    counts[num] = (counts[num] || 0) + 1;
    if (counts[num] > maxCount) {
      maxCount = counts[num];
      mode = num;
    }
  }

  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  return { mean, median, mode, variance, stdDev, min: sorted[0], max: sorted[sorted.length - 1] };
}

// --- DATA HELPERS ---
const getPeriodoDatas = (tipo: string, inicioCustom: string, fimCustom: string) => {
  const hoje = new Date();
  let inicio = new Date(0);
  let fim = new Date();
  
  if (tipo === 'hoje') {
    inicio = startOfDay(hoje);
    fim = endOfDay(hoje);
  } else if (tipo === 'semana') {
    inicio = startOfWeek(hoje, { weekStartsOn: 0 });
    fim = endOfWeek(hoje, { weekStartsOn: 0 });
  } else if (tipo === 'mes') {
    inicio = startOfMonth(hoje);
    fim = endOfMonth(hoje);
  } else if (tipo === 'ano') {
    inicio = new Date(hoje.getFullYear(), 0, 1);
    fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59);
  } else if (tipo === 'personalizado' && inicioCustom && fimCustom) {
    inicio = startOfDay(parseISO(inicioCustom));
    fim = endOfDay(parseISO(fimCustom));
  } else if (tipo === 'tudo') {
    inicio = new Date(2000, 0, 1);
  }
  return { inicio, fim };
};

const getPeriodoAnterior = (tipo: string, inicioAtual: Date, fimAtual: Date) => {
  let prevInicio = new Date(inicioAtual);
  let prevFim = new Date(fimAtual);
  
  if (tipo === 'hoje') {
    prevInicio = subDays(inicioAtual, 1);
    prevFim = subDays(fimAtual, 1);
  } else if (tipo === 'semana') {
    prevInicio = subDays(inicioAtual, 7);
    prevFim = subDays(fimAtual, 7);
  } else if (tipo === 'mes') {
    prevInicio = subMonths(inicioAtual, 1);
    prevFim = subMonths(fimAtual, 1);
  } else if (tipo === 'ano') {
    prevInicio = subYears(inicioAtual, 1);
    prevFim = subYears(fimAtual, 1);
  } else {
    const diff = differenceInDays(fimAtual, inicioAtual);
    prevInicio = subDays(inicioAtual, diff + 1);
    prevFim = subDays(fimAtual, diff + 1);
  }
  return { prevInicio, prevFim };
};

const calculaVariacao = (atual: number, anterior: number) => {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
};

// --- COMPONENT ---
export default function DashboardSuperBI() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estados Base
  const [registros, setRegistros] = useState<OcorrenciaRegistro[]>([]);
  const [alunosMap, setAlunosMap] = useState<Map<string, AlunoCMS>>(new Map());
  const [perfis, setPerfis] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // UI States
  const [comparacaoAtiva, setComparacaoAtiva] = useState(false);
  const [contextoAnalise, setContextoAnalise] = useState<ContextoAnalise>('Geral');
  const [filtrosA, setFiltrosA] = useState<FiltroSet>(filtroInicial);
  const [filtrosB, setFiltrosB] = useState<FiltroSet>(filtroInicial);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'super_admin') navigate('/');
      else carregarDados();
    }
  }, [profile, authLoading, navigate]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [recs, profs, alunos] = await Promise.all([
        supabase.from('daily_occurrence_records').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('alunos_cms').select('nome, turma, ano')
      ]);
      setRegistros(recs.data || []);
      setPerfis(profs.data || []);
      
      const map = new Map<string, AlunoCMS>();
      (alunos.data || []).forEach(a => {
        if (a.nome) map.set(a.nome.trim().toLowerCase(), a);
      });
      setAlunosMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  // --- FILTRAGEM ---
  const listas = useMemo(() => {
    const sAlunos = new Set<string>();
    const sTurmas = new Set<string>();
    const sSeries = new Set<string>();
    const sAnosLet = new Set<string>();
    const sTipos = new Set<string>();
    
    registros.forEach(r => {
      sAlunos.add(r.student_name.trim());
      const inf = alunosMap.get(r.student_name.trim().toLowerCase());
      sTurmas.add(inf?.turma || 'Sem Turma');
      const ano = inf?.ano || r.school_year || 'Sem Série';
      sSeries.add(ano);
      const match = ano.match(/20\d{2}/);
      sAnosLet.add(match ? match[0] : 'Outros');
      if(r.occurrence_type) sTipos.add(r.occurrence_type.trim());
    });
    
    const sFunc = new Set<string>();
    perfis.forEach(p => p.full_name && sFunc.add(p.full_name.trim()));
    registros.forEach(r => r.created_by && sFunc.add(r.created_by.trim()));

    return {
      alunos: ['Todos', ...Array.from(sAlunos).sort()],
      turmas: ['Todos', ...Array.from(sTurmas).sort()],
      series: ['Todos', ...Array.from(sSeries).sort()],
      anosLetivos: ['Todos', ...Array.from(sAnosLet).sort()],
      funcionarios: ['Todos', ...Array.from(sFunc).sort()],
      tipos: ['Todos', ...Array.from(sTipos).sort()],
      turnos: ['Todos', 'Manhã', 'Tarde', 'Noite'],
      unidades: ['Todos', 'Sede Principal']
    };
  }, [registros, alunosMap, perfis]);

  const aplicarFiltro = (filtro: FiltroSet, targetPeriod: {inicio: Date, fim: Date}) => {
    return registros.filter(r => {
      const d = new Date(r.created_at);
      if (d < targetPeriod.inicio || d > targetPeriod.fim) return false;
      
      const inf = alunosMap.get(r.student_name.trim().toLowerCase());
      const turma = inf?.turma || 'Sem Turma';
      const serie = inf?.ano || r.school_year || 'Sem Ano';
      
      if (filtro.serieAno !== 'Todos' && serie !== filtro.serieAno) return false;
      if (filtro.turma !== 'Todos' && turma !== filtro.turma) return false;
      if (filtro.aluno !== 'Todos' && r.student_name.trim() !== filtro.aluno) return false;
      if (filtro.funcionario !== 'Todos' && r.created_by?.trim() !== filtro.funcionario) return false;
      if (filtro.tipoOcorrencia !== 'Todos' && r.occurrence_type?.trim() !== filtro.tipoOcorrencia) return false;
      if (filtro.anoLetivo !== 'Todos' && !serie.includes(filtro.anoLetivo)) return false;
      
      // Simulando turno por hora
      if (filtro.turno !== 'Todos') {
        const hr = getHours(d);
        const t = hr < 12 ? 'Manhã' : hr < 18 ? 'Tarde' : 'Noite';
        if (t !== filtro.turno) return false;
      }
      
      return true;
    });
  };

  const perA = useMemo(() => getPeriodoDatas(filtrosA.tipoPeriodo, filtrosA.dataInicio, filtrosA.dataFim), [filtrosA]);
  const perAPrev = useMemo(() => getPeriodoAnterior(filtrosA.tipoPeriodo, perA.inicio, perA.fim), [filtrosA, perA]);
  const perB = useMemo(() => getPeriodoDatas(filtrosB.tipoPeriodo, filtrosB.dataInicio, filtrosB.dataFim), [filtrosB]);

  const regA = useMemo(() => aplicarFiltro(filtrosA, perA), [registros, filtrosA, perA, alunosMap]);
  const regAPrev = useMemo(() => aplicarFiltro(filtrosA, perAPrev), [registros, filtrosA, perAPrev, alunosMap]);
  const regB = useMemo(() => comparacaoAtiva ? aplicarFiltro(filtrosB, perB) : [], [registros, filtrosB, perB, alunosMap, comparacaoAtiva]);

  // --- MATEMÁTICA ESTATÍSTICA AVANÇADA ---
  const estatisticasA = useMemo(() => {
    const total = regA.length;
    const prevTotal = regAPrev.length;
    const varTotal = calculaVariacao(total, prevTotal);
    
    // Contagens Diárias (Para cálculo de Variância e Desvio Padrão do volume por dia)
    const diasMap: Record<string, number> = {};
    const iterDate = new Date(perA.inicio);
    while (iterDate <= perA.fim) {
      diasMap[format(iterDate, 'yyyy-MM-dd')] = 0;
      iterDate.setDate(iterDate.getDate() + 1);
    }
    regA.forEach(r => {
      const k = format(new Date(r.created_at), 'yyyy-MM-dd');
      if(diasMap[k] !== undefined) diasMap[k]++;
    });
    
    const dailyCounts = Object.values(diasMap);
    const mathDaily = calcStats(dailyCounts);

    // Contexto Alunos
    const alunosSet = new Set(regA.map(r => r.student_name.toLowerCase()));
    const prevAlunos = new Set(regAPrev.map(r => r.student_name.toLowerCase()));
    const varAlunos = calculaVariacao(alunosSet.size, prevAlunos.size);
    const alunosCounts: Record<string, number> = {};
    regA.forEach(r => {
      const nome = r.student_name.toLowerCase();
      alunosCounts[nome] = (alunosCounts[nome] || 0) + 1;
    });
    const mathAlunos = calcStats(Object.values(alunosCounts));
    const reincidentes = Object.values(alunosCounts).filter(v => v > 1).length;
    const pctReincidencia = alunosSet.size > 0 ? (reincidentes / alunosSet.size) * 100 : 0;

    // Outros
    const funcSet = new Set(regA.filter(r => r.created_by).map(r => r.created_by!.toLowerCase()));
    const turmasSet = new Set(regA.map(r => alunosMap.get(r.student_name.toLowerCase())?.turma || 'Sem Turma'));
    const tiposSet = new Set(regA.map(r => r.occurrence_type || 'N/A'));
    
    const resolvidas = regA.filter(r => r.tratada).length;
    const pctResolvidas = total > 0 ? (resolvidas / total) * 100 : 0;
    const pendentes = total - resolvidas;
    const pctPendentes = total > 0 ? (pendentes / total) * 100 : 0;

    const semanasDiff = Math.max(differenceInWeeks(perA.fim, perA.inicio), 1);
    const mesesDiff = Math.max(differenceInMonths(perA.fim, perA.inicio), 1);

    return { 
      total, varTotal, 
      alunos: alunosSet.size, varAlunos, pctReincidencia,
      func: funcSet.size, 
      turmas: turmasSet.size,
      tipos: tiposSet.size,
      resolvidas, pctResolvidas, pendentes, pctPendentes,
      
      // Estatísticas Matemáticas Diárias
      mediaDia: mathDaily.mean, 
      medianaDia: mathDaily.median, 
      modaDia: mathDaily.mode, 
      varDia: mathDaily.variance, 
      dpDia: mathDaily.stdDev,
      
      // Outras Médias
      mediaSemana: total / semanasDiff,
      mediaMes: total / mesesDiff,
      
      // Estatísticas Aluno
      mediaAluno: mathAlunos.mean,
      maxAluno: mathAlunos.max
    };
  }, [regA, regAPrev, perA, alunosMap]);
  
  // Repete para o Lado B
  const estatisticasB = useMemo(() => {
    if (!comparacaoAtiva) return null;
    const total = regB.length;
    
    const diasMap: Record<string, number> = {};
    const iterDate = new Date(perB.inicio);
    while (iterDate <= perB.fim) {
      diasMap[format(iterDate, 'yyyy-MM-dd')] = 0;
      iterDate.setDate(iterDate.getDate() + 1);
    }
    regB.forEach(r => {
      const k = format(new Date(r.created_at), 'yyyy-MM-dd');
      if(diasMap[k] !== undefined) diasMap[k]++;
    });
    const mathDaily = calcStats(Object.values(diasMap));
    
    const alunosSet = new Set(regB.map(r => r.student_name.toLowerCase()));
    const funcSet = new Set(regB.filter(r => r.created_by).map(r => r.created_by!.toLowerCase()));
    
    const resolvidas = regB.filter(r => r.tratada).length;
    const pendentes = total - resolvidas;
    const pctResolvidas = total > 0 ? (resolvidas / total) * 100 : 0;
    const pctPendentes = total > 0 ? (pendentes / total) * 100 : 0;

    return { 
      total, alunos: alunosSet.size, func: funcSet.size, 
      resolvidas, pendentes, pctResolvidas, pctPendentes,
      mediaDia: mathDaily.mean, dpDia: mathDaily.stdDev 
    };
  }, [regB, perB, comparacaoAtiva]);

  // --- COMPUTAÇÃO GRÁFICA ---
  const graficoEvolucao = useMemo(() => {
    const mapa = new Map<string, { label: string, date: Date, A: number, B: number }>();
    
    const preenche = (regs: OcorrenciaRegistro[], field: 'A'|'B', refPer: {inicio: Date, fim: Date}) => {
      regs.forEach(r => {
        const d = new Date(r.created_at);
        let key = ''; let lbl = '';
        if (differenceInDays(refPer.fim, refPer.inicio) <= 31) {
          key = format(d, 'yyyy-MM-dd'); lbl = format(d, 'dd/MM');
        } else if (differenceInDays(refPer.fim, refPer.inicio) <= 90) {
          key = format(startOfWeek(d), 'yyyy-MM-dd'); lbl = 'Sem ' + format(startOfWeek(d), 'dd/MM');
        } else {
          key = format(d, 'yyyy-MM'); lbl = format(d, 'MMM/yy', {locale: ptBR});
        }
        if(!mapa.has(key)) mapa.set(key, { label: lbl, date: d, A: 0, B: 0 });
        mapa.get(key)![field]++;
      });
    };
    
    preenche(regA, 'A', perA);
    if(comparacaoAtiva) preenche(regB, 'B', perB);
    
    const arr = Array.from(mapa.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const totalA = arr.reduce((sum, pt) => sum + pt.A, 0);
    const mediaGeralA = arr.length > 0 ? Number((totalA / arr.length).toFixed(1)) : 0;
    
    arr.forEach(pt => { (pt as any).MovelA = mediaGeralA; });
    return arr;
  }, [regA, regB, comparacaoAtiva, perA, perB]);

  // Ranking Generator Genérico (usado para montar gráficos de Barras dependendo do contexto)
  const rankingAtual = useMemo(() => {
    const counts: Record<string, number> = {};
    let propFn = (r: OcorrenciaRegistro) => r.student_name;
    
    if (contextoAnalise === 'Turma') propFn = r => alunosMap.get(r.student_name.toLowerCase())?.turma || 'Sem Turma';
    else if (contextoAnalise === 'Série') propFn = r => alunosMap.get(r.student_name.toLowerCase())?.ano || r.school_year || 'N/A';
    else if (contextoAnalise === 'Funcionário') propFn = r => r.created_by || profile?.full_name || 'Administração';
    else if (contextoAnalise === 'Tipo de Ocorrência') propFn = r => r.occurrence_type || 'N/A';
    
    regA.forEach(r => {
      const k = propFn(r);
      counts[k] = (counts[k] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({name, value})).sort((a,b)=>b.value - a.value).slice(0, 10);
  }, [regA, contextoAnalise, alunosMap]);

  // Donut: Distribuição por Tipo de Ocorrência
  const roscaTipos = useMemo(() => {
    const cont: Record<string, number> = {};
    regA.forEach(r => { const k = r.occurrence_type || 'N/A'; cont[k] = (cont[k] || 0) + 1; });
    return Object.entries(cont).map(([name, value]) => ({name, value})).sort((a,b)=>b.value - a.value).slice(0, 6);
  }, [regA]);

  // Heatmap: Dia da Semana x Turno
  const heatmapData = useMemo(() => {
    const matrix = Array(7).fill(0).map(() => [0, 0, 0]);
    regA.forEach(r => {
      const d = new Date(r.created_at);
      const dia = getDay(d);
      const hr = getHours(d);
      const turno = hr < 12 ? 0 : hr < 18 ? 1 : 2;
      matrix[dia][turno]++;
    });
    return matrix;
  }, [regA]);

  const heatmapMax = useMemo(() => Math.max(...heatmapData.flat(), 1), [heatmapData]);

  // Registros Recentes
  const recentes = useMemo(() => {
    return [...regA].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
  }, [regA]);
  
  // --- INSIGHTS ---
  const insights = useMemo(() => {
    const msgs: { tipo: 'success'|'danger'|'warning'|'info', text: string }[] = [];
    if (estatisticasA.varTotal > 20) msgs.push({ tipo: 'danger', text: `Crescimento alarmante de ${estatisticasA.varTotal.toFixed(0)}% no volume de ocorrências em relação ao período anterior.` });
    if (estatisticasA.varTotal < -10) msgs.push({ tipo: 'success', text: `Excelente redução de ${Math.abs(estatisticasA.varTotal).toFixed(0)}% nas ocorrências no período atual.` });
    
    if (estatisticasA.pctReincidencia > 30) msgs.push({ tipo: 'warning', text: `Atenção: A reincidência atinge ${estatisticasA.pctReincidencia.toFixed(1)}%. Muitos alunos voltaram a cometer infrações.` });
    
    if (estatisticasA.dpDia > estatisticasA.mediaDia) msgs.push({ tipo: 'warning', text: `Desvio padrão diário alto (${estatisticasA.dpDia.toFixed(1)}). O comportamento está imprevisível com picos intensos.` });
    else msgs.push({ tipo: 'info', text: `Desvio padrão diário baixo (${estatisticasA.dpDia.toFixed(1)}). Volume de ocorrências estável e previsível.` });

    if (rankingAtual.length > 0) msgs.push({ tipo: 'info', text: `Em '${contextoAnalise}', o item líder é '${rankingAtual[0].name}' com ${rankingAtual[0].value} registros.` });
    
    return msgs;
  }, [estatisticasA, rankingAtual, contextoAnalise]);

  // --- RENDER HELPERS ---
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

  // Interatividade: Drill Down no clique do KPI
  const handleClickKPI = (alvoCtx: ContextoAnalise) => {
    setContextoAnalise(alvoCtx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderKPI = (title: string, valA: number|string, varA: number|null, valB: number|string|null, icon: any, color: string, contextoClick: ContextoAnalise) => {
    const isPos = typeof varA === 'number' ? varA >= 0 : false;
    const isGood = color === 'green' ? isPos : !isPos; 
    
    return (
      <div onClick={() => handleClickKPI(contextoClick)} className="bg-[#111827] border border-[#2D3748] p-5 rounded-2xl hover:bg-[#1F2937] hover:border-blue-500/30 transition-all shadow-lg flex flex-col justify-between group cursor-pointer relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
        
        <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-[#9CA3AF] text-[11px] font-bold uppercase tracking-wider">{title}</p>
          <div className="p-2 bg-[#1F2937] rounded-lg text-white group-hover:scale-110 group-hover:bg-blue-600 transition-all">{icon}</div>
        </div>
        <div className="flex items-end justify-between relative z-10">
          <div>
            <h3 className="text-3xl font-black text-white">{typeof valA === 'number' ? valA.toLocaleString('pt-BR') : valA}</h3>
            {valB !== null && (
              <span className="text-xs text-[#8B5CF6] font-bold mt-1 flex items-center gap-1">
                <Columns size={10}/> vs {typeof valB === 'number' ? valB.toLocaleString() : valB} (B)
              </span>
            )}
          </div>
          {!comparacaoAtiva && varA !== null && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isPos ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
              {Math.abs(varA).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-blue-400 flex items-center gap-1">
          <MousePointer2 size={10}/> Ver Análise
        </div>
      </div>
    );
  };

  const InputFilter = ({label, val, setFn, options}: any) => (
    <div className="space-y-1">
      <label className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">{label}</label>
      <select value={val} onChange={e => setFn(e.target.value)} className="w-full bg-[#111827] border border-[#2D3748] text-white text-xs px-3 py-2 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-20 font-sans selection:bg-blue-500/30">
      
      {/* HEADER & GLOBAL ACTIONS */}
      <header className="border-b border-[#2D3748] bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Painel de Ocorrências</h1>
              <p className="text-xs text-[#9CA3AF]">Dashboard Estatístico Escolar</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1 bg-[#0B0F14] p-1.5 rounded-xl border border-[#2D3748] shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[#9CA3AF] px-2">Analisar por:</span>
            {['Geral', 'Período', 'Ano Letivo', 'Série', 'Aluno', 'Funcionário', 'Tipo de Ocorrência'].map(ctx => (
              <button 
                key={ctx} 
                onClick={() => setContextoAnalise(ctx as ContextoAnalise)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${contextoAnalise === ctx ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]'}`}
              >
                {ctx}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        
        {/* GLOBAL FILTERS PANEL */}
        <section className="bg-[#111827] border border-[#2D3748] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h2 className="text-sm font-bold flex items-center gap-2 text-[#E5E7EB]"><Filter size={16}/> Filtros Globais</h2>
            <div className="flex gap-3">
              <button onClick={() => setComparacaoAtiva(!comparacaoAtiva)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${comparacaoAtiva ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#C4B5FD] shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-[#1F2937] border-[#2D3748] text-[#9CA3AF] hover:text-white'}`}>
                {comparacaoAtiva ? <Columns size={14}/> : <LayoutDashboard size={14}/>} 
                Modo Comparação Inteligente
              </button>
              <button onClick={() => {setFiltrosA(filtroInicial); setFiltrosB(filtroInicial);}} className="text-[#9CA3AF] hover:text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#1F2937] transition-all">Limpar</button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
            {comparacaoAtiva && <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#2D3748] hidden xl:block -translate-x-1/2" />}
            
            <div className="space-y-4">
              {comparacaoAtiva && <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 inline-block px-3 py-1 rounded-lg">Período A</h3>}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <InputFilter label="Período" val={filtrosA.tipoPeriodo} setFn={(v:any)=>setFiltrosA({...filtrosA, tipoPeriodo: v})} options={['hoje','semana','mes','ano','tudo']}/>
                <InputFilter label="Ano Let." val={filtrosA.anoLetivo} setFn={(v:any)=>setFiltrosA({...filtrosA, anoLetivo: v})} options={listas.anosLetivos}/>
                <InputFilter label="Série/Ano" val={filtrosA.serieAno} setFn={(v:any)=>setFiltrosA({...filtrosA, serieAno: v})} options={listas.series}/>
                <InputFilter label="Turma" val={filtrosA.turma} setFn={(v:any)=>setFiltrosA({...filtrosA, turma: v})} options={listas.turmas}/>
                <InputFilter label="Aluno" val={filtrosA.aluno} setFn={(v:any)=>setFiltrosA({...filtrosA, aluno: v})} options={listas.alunos}/>
                <InputFilter label="Funcionário" val={filtrosA.funcionario} setFn={(v:any)=>setFiltrosA({...filtrosA, funcionario: v})} options={listas.funcionarios}/>
                <InputFilter label="Tipo" val={filtrosA.tipoOcorrencia} setFn={(v:any)=>setFiltrosA({...filtrosA, tipoOcorrencia: v})} options={listas.tipos}/>
                <InputFilter label="Turno" val={filtrosA.turno} setFn={(v:any)=>setFiltrosA({...filtrosA, turno: v})} options={listas.turnos}/>
              </div>
            </div>

            {comparacaoAtiva && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#8B5CF6] uppercase tracking-widest bg-[#8B5CF6]/10 inline-block px-3 py-1 rounded-lg">Período B</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <InputFilter label="Período" val={filtrosB.tipoPeriodo} setFn={(v:any)=>setFiltrosB({...filtrosB, tipoPeriodo: v})} options={['hoje','semana','mes','ano','tudo']}/>
                  <InputFilter label="Ano Let." val={filtrosB.anoLetivo} setFn={(v:any)=>setFiltrosB({...filtrosB, anoLetivo: v})} options={listas.anosLetivos}/>
                  <InputFilter label="Série/Ano" val={filtrosB.serieAno} setFn={(v:any)=>setFiltrosB({...filtrosB, serieAno: v})} options={listas.series}/>
                  <InputFilter label="Turma" val={filtrosB.turma} setFn={(v:any)=>setFiltrosB({...filtrosB, turma: v})} options={listas.turmas}/>
                  <InputFilter label="Aluno" val={filtrosB.aluno} setFn={(v:any)=>setFiltrosB({...filtrosB, aluno: v})} options={listas.alunos}/>
                  <InputFilter label="Funcionário" val={filtrosB.funcionario} setFn={(v:any)=>setFiltrosB({...filtrosB, funcionario: v})} options={listas.funcionarios}/>
                  <InputFilter label="Tipo" val={filtrosB.tipoOcorrencia} setFn={(v:any)=>setFiltrosB({...filtrosB, tipoOcorrencia: v})} options={listas.tipos}/>
                  <InputFilter label="Turno" val={filtrosB.turno} setFn={(v:any)=>setFiltrosB({...filtrosB, turno: v})} options={listas.turnos}/>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INSIGHTS SMART PANEL */}
        {insights.length > 0 && (
          <section className="flex flex-col md:flex-row gap-4">
            {insights.map((ins, i) => (
              <div key={i} className={`flex-1 flex items-start gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.01] shadow-lg ${
                ins.tipo === 'danger' ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' :
                ins.tipo === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' :
                ins.tipo === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
                'bg-blue-500/5 border-blue-500/20 text-blue-300'
              }`}>
                {ins.tipo === 'danger' && <Flame size={18} className="mt-0.5 shrink-0" />}
                {ins.tipo === 'success' && <Target size={18} className="mt-0.5 shrink-0" />}
                {ins.tipo === 'warning' && <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
                {ins.tipo === 'info' && <Zap size={18} className="mt-0.5 shrink-0" />}
                <p className="text-sm font-medium leading-relaxed">{ins.text}</p>
              </div>
            ))}
          </section>
        )}

        {/* KPIs (Contextual Drill Down) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Sempre Visíveis */}
          {renderKPI("Total Ocorrências", estatisticasA.total, estatisticasA.varTotal, comparacaoAtiva ? estatisticasB?.total || 0 : null, <FileText size={16}/>, "red", "Geral")}
          {renderKPI("Média Diária", estatisticasA.mediaDia.toFixed(1), null, comparacaoAtiva ? estatisticasB?.mediaDia.toFixed(1) || 0 : null, <Activity size={16}/>, "yellow", "Período")}
          
          {/* Condicionais por Contexto GERAL */}
          {contextoAnalise === 'Geral' && (
            <>
              {renderKPI("Alunos Envolv.", estatisticasA.alunos, estatisticasA.varAlunos, comparacaoAtiva ? estatisticasB?.alunos || 0 : null, <Users size={16}/>, "red", "Aluno")}
              {renderKPI("Funcionários", estatisticasA.func, null, comparacaoAtiva ? estatisticasB?.func || 0 : null, <UserCheck size={16}/>, "blue", "Funcionário")}
              {renderKPI("Reincidência", `${estatisticasA.pctReincidencia.toFixed(0)}%`, null, null, <TrendingUp size={16}/>, "orange", "Aluno")}
              {renderKPI("Resolvidas", `${estatisticasA.pctResolvidas.toFixed(0)}%`, null, comparacaoAtiva ? `${estatisticasB?.pctResolvidas.toFixed(0)}%` : null, <Shield size={16}/>, "green", "Geral")}
            </>
          )}

          {/* Contexto: Estatística Pesada */}
          {(contextoAnalise === 'Período' || contextoAnalise === 'Ano Letivo') && (
            <>
              {renderKPI("Mediana (Dia)", estatisticasA.medianaDia, null, comparacaoAtiva ? estatisticasB?.medianaDia || 0 : null, <BarChart2 size={16}/>, "yellow", "Geral")}
              {renderKPI("Moda (Dia)", estatisticasA.modaDia, null, comparacaoAtiva ? estatisticasB?.modaDia || 0 : null, <Activity size={16}/>, "yellow", "Geral")}
              {renderKPI("Variância", estatisticasA.varDia.toFixed(1), null, comparacaoAtiva ? estatisticasB?.varDia.toFixed(1) || 0 : null, <Activity size={16}/>, "blue", "Geral")}
              {renderKPI("Desvio Padrão", estatisticasA.dpDia.toFixed(2), null, comparacaoAtiva ? estatisticasB?.dpDia.toFixed(2) || 0 : null, <Activity size={16}/>, "orange", "Geral")}
            </>
          )}

          {/* Contexto: Aluno */}
          {(contextoAnalise === 'Aluno' || contextoAnalise === 'Série') && (
            <>
              {renderKPI("Total Alunos", estatisticasA.alunos, estatisticasA.varAlunos, comparacaoAtiva ? estatisticasB?.alunos || 0 : null, <Users size={16}/>, "blue", "Aluno")}
              {renderKPI("Média por Aluno", estatisticasA.mediaAluno.toFixed(1), null, null, <Activity size={16}/>, "yellow", "Aluno")}
              {renderKPI("Máx em 1 Aluno", estatisticasA.maxAluno, null, null, <AlertTriangle size={16}/>, "red", "Aluno")}
              {renderKPI("Reincidência", `${estatisticasA.pctReincidencia.toFixed(0)}%`, null, null, <TrendingUp size={16}/>, "orange", "Aluno")}
            </>
          )}
          
          {/* Contexto: Tipo/Funcionario */}
          {(contextoAnalise === 'Tipo de Ocorrência' || contextoAnalise === 'Funcionário') && (
            <>
              {renderKPI("Tipos Distintos", estatisticasA.tipos, null, null, <PieChart size={16}/>, "blue", "Tipo de Ocorrência")}
              {renderKPI("Funcionários", estatisticasA.func, null, comparacaoAtiva ? estatisticasB?.func || 0 : null, <UserCheck size={16}/>, "blue", "Funcionário")}
              {renderKPI("Pendentes", `${estatisticasA.pctPendentes.toFixed(0)}%`, null, comparacaoAtiva ? `${estatisticasB?.pctPendentes.toFixed(0)}%` : null, <Clock size={16}/>, "orange", "Geral")}
              {renderKPI("Resolvidas", `${estatisticasA.pctResolvidas.toFixed(0)}%`, null, comparacaoAtiva ? `${estatisticasB?.pctResolvidas.toFixed(0)}%` : null, <Shield size={16}/>, "green", "Geral")}
            </>
          )}
        </section>

        {/* CHARTS GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MAIN CHART */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Evolução e Média Geral</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">Comparação temporal do volume de ocorrências com a média global do período.</p>
              </div>
            </div>
            <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graficoEvolucao} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="label" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#2D3748', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  
                  <Area type="monotone" dataKey="A" name="Volume (A)" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorA)" />
                  {!comparacaoAtiva && <Line type="monotone" dataKey="MovelA" name="Média do Período" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 4" />}
                  {comparacaoAtiva && <Area type="monotone" dataKey="B" name="Volume (B)" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorB)" />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DYNAMIC RANKING BARS */}
          <div className="bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2 relative z-10"><BarChart2 size={16} className="text-emerald-500"/> Ranking: {contextoAnalise}</h3>
            <p className="text-xs text-[#9CA3AF] mb-4 relative z-10">Top 10 itens no contexto de {contextoAnalise}.</p>
            <div className="flex-1 min-h-[250px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingAtual} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} width={80} tickFormatter={(v)=>v.length>10?v.substring(0,10)+'...':v} />
                  <RechartsTooltip cursor={{fill: '#1F2937'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#2D3748', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Registros" fill="#10B981" radius={[0, 4, 4, 0]}>
                    {rankingAtual.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* STATISTICS + DONUT ROW */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PAINEL ESTATÍSTICO DETALHADO */}
          <div className="lg:col-span-1 bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6 relative z-10"><BarChart2 size={16} className="text-amber-500"/> Estatísticas Avançadas</h3>
            <div className="space-y-4 relative z-10">
              {[
                { label: 'Média Diária', value: estatisticasA.mediaDia.toFixed(1), color: 'text-blue-400' },
                { label: 'Média Semanal', value: estatisticasA.mediaSemana.toFixed(1), color: 'text-blue-400' },
                { label: 'Média Mensal', value: estatisticasA.mediaMes.toFixed(1), color: 'text-blue-400' },
                { label: 'Mediana (Dia)', value: estatisticasA.medianaDia.toFixed(1), color: 'text-amber-400' },
                { label: 'Moda (Dia)', value: String(estatisticasA.modaDia), color: 'text-amber-400' },
                { label: 'Variância', value: estatisticasA.varDia.toFixed(2), color: 'text-purple-400' },
                { label: 'Desvio Padrão', value: estatisticasA.dpDia.toFixed(2), color: 'text-purple-400' },
                { label: 'Resolvidas', value: `${estatisticasA.pctResolvidas.toFixed(1)}%`, color: 'text-emerald-400' },
                { label: 'Pendentes', value: `${estatisticasA.pctPendentes.toFixed(1)}%`, color: 'text-rose-400' },
                { label: 'Reincidência', value: `${estatisticasA.pctReincidencia.toFixed(1)}%`, color: 'text-orange-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-[#2D3748]/50 last:border-0">
                  <span className="text-xs text-[#9CA3AF] font-medium">{item.label}</span>
                  <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DONUT CHART */}
          <div className="bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2 relative z-10"><PieChart size={16} className="text-pink-500"/> Distribuição por Tipo</h3>
            <p className="text-xs text-[#9CA3AF] mb-4 relative z-10">Proporção dos tipos de ocorrência no período.</p>
            <div className="flex-1 min-h-[280px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={roscaTipos} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none" label={({name, percent}) => `${name.length > 12 ? name.substring(0,12)+'…' : name} (${(percent*100).toFixed(0)}%)`} labelLine={false}>
                    {roscaTipos.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#2D3748', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HEATMAP */}
          <div className="bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2 relative z-10"><Calendar size={16} className="text-rose-500"/> Mapa de Calor</h3>
            <p className="text-xs text-[#9CA3AF] mb-6 relative z-10">Dia da Semana × Turno do dia.</p>
            <div className="relative z-10">
              {/* Header */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div />
                {['Manhã', 'Tarde', 'Noite'].map(t => (
                  <div key={t} className="text-center text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{t}</div>
                ))}
              </div>
              {/* Grid */}
              {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((dia, idx) => (
                <div key={dia} className="grid grid-cols-4 gap-2 mb-2">
                  <div className="text-[11px] font-bold text-[#9CA3AF] flex items-center justify-end pr-2">{dia}</div>
                  {heatmapData[idx].map((val, jdx) => {
                    const intensity = heatmapMax > 0 ? val / heatmapMax : 0;
                    return (
                      <div key={jdx} className="h-9 rounded-lg flex items-center justify-center border border-[#2D3748]/30 transition-all hover:scale-105 hover:border-rose-500/50 group relative" style={{ backgroundColor: `rgba(244, 63, 94, ${Math.max(intensity * 0.85, 0.03)})` }}>
                        <span className={`text-xs font-bold ${intensity > 0.4 ? 'text-white' : 'text-[#6B7280]'}`}>{val > 0 ? val : '—'}</span>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#0B0F14] border border-[#2D3748] text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20 transition-opacity pointer-events-none shadow-xl">
                          {val} registro{val !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TIMELINE - REGISTROS RECENTES */}
        <section className="bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6 relative z-10"><Clock size={16} className="text-cyan-500"/> Linha do Tempo — Registros Recentes</h3>
          {recentes.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] relative z-10">Nenhum registro encontrado com os filtros aplicados.</p>
          ) : (
            <div className="relative z-10 space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[#2D3748]" />
              {recentes.map((r, i) => (
                <div key={r.id} className="flex items-start gap-4 py-3 group">
                  <div className="relative z-10 mt-1 w-[9px] h-[9px] rounded-full bg-cyan-500 ring-4 ring-[#111827] shrink-0 group-hover:ring-cyan-500/20 transition-all" />
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-6 bg-[#0B0F14]/50 p-3 rounded-xl border border-[#2D3748]/50 hover:border-cyan-500/20 transition-colors">
                    <span className="text-[10px] text-[#9CA3AF] font-bold shrink-0 w-[100px]">{format(new Date(r.created_at), 'dd/MM/yy HH:mm')}</span>
                    <span className="text-xs text-white font-bold truncate max-w-[150px]" title={r.student_name}>{r.student_name}</span>
                    <span className="text-[10px] text-[#9CA3AF] truncate max-w-[100px]" title={alunosMap.get(r.student_name.toLowerCase())?.turma || '—'}>{alunosMap.get(r.student_name.toLowerCase())?.turma || '—'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold shrink-0">{r.occurrence_type || 'N/A'}</span>
                    <span className="text-[10px] text-[#6B7280] truncate max-w-[120px]" title={r.created_by || profile?.full_name || 'Administração'}>{r.created_by || profile?.full_name || 'Administração'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${r.tratada ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.tratada ? 'Resolvida' : 'Pendente'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
