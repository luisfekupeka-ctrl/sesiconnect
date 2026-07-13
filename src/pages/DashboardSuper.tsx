import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight,
  TrendingUp, BarChart2, PieChart, Activity, Filter, RefreshCw, Award, 
  BookOpen, Clock, FileText, UserCheck, ChevronRight, Zap, Target, 
  Flame, Bell, Search, LayoutDashboard, Columns
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
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, 
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
type ContextoAnalise = 'Geral' | 'Aluno' | 'Turma' | 'Funcionário' | 'Tipo de Ocorrência';
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
      turnos: ['Todos', 'Manhã', 'Tarde', 'Noite'], // estático se n existir
      unidades: ['Todos', 'Sede Principal'] // estático
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
      
      return true;
    });
  };

  const perA = useMemo(() => getPeriodoDatas(filtrosA.tipoPeriodo, filtrosA.dataInicio, filtrosA.dataFim), [filtrosA]);
  const perAPrev = useMemo(() => getPeriodoAnterior(filtrosA.tipoPeriodo, perA.inicio, perA.fim), [filtrosA, perA]);
  const perB = useMemo(() => getPeriodoDatas(filtrosB.tipoPeriodo, filtrosB.dataInicio, filtrosB.dataFim), [filtrosB]);

  const regA = useMemo(() => aplicarFiltro(filtrosA, perA), [registros, filtrosA, perA, alunosMap]);
  const regAPrev = useMemo(() => aplicarFiltro(filtrosA, perAPrev), [registros, filtrosA, perAPrev, alunosMap]);
  const regB = useMemo(() => comparacaoAtiva ? aplicarFiltro(filtrosB, perB) : [], [registros, filtrosB, perB, alunosMap, comparacaoAtiva]);

  // --- MOTOR DE DADOS (KPIs) ---
  const calcularKPIs = (atuais: OcorrenciaRegistro[], passados: OcorrenciaRegistro[], diasDiff: number) => {
    const total = atuais.length;
    const prevTotal = passados.length;
    const varTotal = calculaVariacao(total, prevTotal);
    
    const alunosSet = new Set(atuais.map(r => r.student_name.toLowerCase()));
    const prevAlunos = new Set(passados.map(r => r.student_name.toLowerCase()));
    const varAlunos = calculaVariacao(alunosSet.size, prevAlunos.size);

    const funcSet = new Set(atuais.filter(r => r.created_by).map(r => r.created_by!.toLowerCase()));
    const turmasSet = new Set(atuais.map(r => alunosMap.get(r.student_name.toLowerCase())?.turma || 'Sem Turma'));
    
    const resolvidas = atuais.filter(r => r.tratada).length;
    const varResolvidas = calculaVariacao(resolvidas, passados.filter(r => r.tratada).length);

    const reincidenciasCount = atuais.reduce((acc, r) => {
      const nome = r.student_name.toLowerCase();
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const reincidentes = Object.values(reincidenciasCount).filter(v => v > 1).length;

    const mediaDia = total / Math.max(diasDiff, 1);
    const mediaSemana = mediaDia * 7;

    return { 
      total, varTotal, alunosEnvolvidos: alunosSet.size, varAlunos,
      funcEnvolvidos: funcSet.size, turmas: turmasSet.size,
      resolvidas, varResolvidas, reincidentes, mediaDia, mediaSemana
    };
  };

  const diasA = Math.max(differenceInDays(perA.fim, perA.inicio), 1);
  const kpisA = useMemo(() => calcularKPIs(regA, regAPrev, diasA), [regA, regAPrev, diasA]);
  
  const diasB = Math.max(differenceInDays(perB.fim, perB.inicio), 1);
  const kpisB = useMemo(() => calcularKPIs(regB, [], diasB), [regB, diasB]);

  // --- COMPUTAÇÃO GRÁFICA ---
  const graficoEvolucao = useMemo(() => {
    // Agrupa dados temporalmente para o gráfico principal
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
    
    // Média Geral do Período para A
    const totalA = arr.reduce((sum, pt) => sum + pt.A, 0);
    const mediaGeralA = arr.length > 0 ? Number((totalA / arr.length).toFixed(1)) : 0;
    
    arr.forEach(pt => {
      (pt as any).MovelA = mediaGeralA;
    });
    return arr;
  }, [regA, regB, comparacaoAtiva, perA, perB]);

  const gerarRosca = (regs: OcorrenciaRegistro[], keyFn: (r: OcorrenciaRegistro)=>string) => {
    const cont: Record<string, number> = {};
    regs.forEach(r => { const k = keyFn(r); cont[k] = (cont[k] || 0) + 1; });
    return Object.entries(cont).map(([name, value]) => ({name, value})).sort((a,b)=>b.value - a.value).slice(0, 5);
  };
  
  const roscaTipos = useMemo(() => gerarRosca(regA, r => r.occurrence_type || 'N/A'), [regA]);
  const roscaSeries = useMemo(() => gerarRosca(regA, r => alunosMap.get(r.student_name.toLowerCase())?.ano || r.school_year || 'N/A'), [regA, alunosMap]);
  
  // Heatmap: Dia da Semana x Turno (Manhã 6-12, Tarde 12-18, Noite 18-23)
  const heatmapData = useMemo(() => {
    const matrix = Array(7).fill(0).map(() => [0, 0, 0]); // 7 dias, 3 turnos
    regA.forEach(r => {
      const d = new Date(r.created_at);
      const dia = getDay(d);
      const hr = getHours(d);
      let turno = hr < 12 ? 0 : hr < 18 ? 1 : 2;
      matrix[dia][turno]++;
    });
    return matrix;
  }, [regA]);

  // --- INSIGHTS ---
  const insights = useMemo(() => {
    const msgs: { tipo: 'success'|'danger'|'warning'|'info', text: string }[] = [];
    if (kpisA.varTotal > 20) msgs.push({ tipo: 'danger', text: `Crescimento alarmante de ${kpisA.varTotal.toFixed(0)}% no volume de ocorrências em relação ao período anterior.` });
    if (kpisA.varTotal < -10) msgs.push({ tipo: 'success', text: `Excelente redução de ${Math.abs(kpisA.varTotal).toFixed(0)}% nas ocorrências no período atual.` });
    
    if (kpisA.reincidentes > (kpisA.alunosEnvolvidos * 0.3)) msgs.push({ tipo: 'warning', text: `Atenção: Mais de 30% dos alunos envolvidos são reincidentes.` });
    
    if (roscaTipos.length > 0) msgs.push({ tipo: 'info', text: `A ocorrência mais comum é '${roscaTipos[0].name}', representando a maior parte dos registros.` });
    
    return msgs;
  }, [kpisA, roscaTipos]);

  // --- RENDER HELPERS ---
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

  const renderKPI = (title: string, valA: number, varA: number, valB: number|null, icon: any, color: string) => {
    const isPos = varA >= 0;
    const isGood = color === 'green' ? isPos : !isPos; // depende da métrica
    
    return (
      <div className="bg-[#111827] border border-[#2D3748] p-5 rounded-2xl hover:bg-[#1F2937] transition-all shadow-lg flex flex-col justify-between group">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[#9CA3AF] text-[11px] font-bold uppercase tracking-wider">{title}</p>
          <div className="p-2 bg-[#1F2937] rounded-lg text-white group-hover:scale-110 transition-transform">{icon}</div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-3xl font-black text-white">{valA.toLocaleString('pt-BR')}</h3>
            {valB !== null && (
              <span className="text-xs text-[#8B5CF6] font-bold mt-1 block">vs {valB.toLocaleString()} (B)</span>
            )}
          </div>
          {!comparacaoAtiva && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isPos ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
              {Math.abs(varA).toFixed(1)}%
            </div>
          )}
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
      <header className="border-b border-[#2D3748] bg-[#111827]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Business Intelligence</h1>
              <p className="text-xs text-[#9CA3AF]">Motor de Análise Avançada</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#111827] p-1.5 rounded-xl border border-[#2D3748]">
            {['Geral', 'Turma', 'Aluno', 'Funcionário', 'Tipo de Ocorrência'].map(ctx => (
              <button 
                key={ctx} 
                onClick={() => setContextoAnalise(ctx as ContextoAnalise)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${contextoAnalise === ctx ? 'bg-blue-600 text-white shadow-md' : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]'}`}
              >
                {ctx}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        
        {/* GLOBAL FILTERS PANEL */}
        <section className="bg-[#111827] border border-[#2D3748] rounded-3xl p-5 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-[#E5E7EB]"><Filter size={16}/> Filtros Globais</h2>
            <div className="flex gap-3">
              <button onClick={() => setComparacaoAtiva(!comparacaoAtiva)} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors ${comparacaoAtiva ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#C4B5FD]' : 'bg-[#1F2937] border-[#2D3748] text-[#9CA3AF] hover:text-white'}`}>
                {comparacaoAtiva ? <Columns size={14}/> : <LayoutDashboard size={14}/>} 
                Modo Comparação
              </button>
              <button onClick={() => {setFiltrosA(filtroInicial); setFiltrosB(filtroInicial);}} className="text-[#9CA3AF] hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#1F2937] transition-all">Limpar</button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative">
            {comparacaoAtiva && <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#2D3748] hidden xl:block -translate-x-1/2" />}
            
            {/* LADO A */}
            <div className="space-y-4">
              {comparacaoAtiva && <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 inline-block px-3 py-1 rounded-lg">Filtro A (Principal)</h3>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InputFilter label="Período" val={filtrosA.tipoPeriodo} setFn={(v:any)=>setFiltrosA({...filtrosA, tipoPeriodo: v})} options={['hoje','semana','mes','ano','tudo']}/>
                <InputFilter label="Ano Let." val={filtrosA.anoLetivo} setFn={(v:any)=>setFiltrosA({...filtrosA, anoLetivo: v})} options={listas.anosLetivos}/>
                <InputFilter label="Série/Ano" val={filtrosA.serieAno} setFn={(v:any)=>setFiltrosA({...filtrosA, serieAno: v})} options={listas.series}/>
                <InputFilter label="Turma" val={filtrosA.turma} setFn={(v:any)=>setFiltrosA({...filtrosA, turma: v})} options={listas.turmas}/>
                <InputFilter label="Aluno" val={filtrosA.aluno} setFn={(v:any)=>setFiltrosA({...filtrosA, aluno: v})} options={listas.alunos}/>
                <InputFilter label="Funcionário" val={filtrosA.funcionario} setFn={(v:any)=>setFiltrosA({...filtrosA, funcionario: v})} options={listas.funcionarios}/>
                <InputFilter label="Tipo Ocorrência" val={filtrosA.tipoOcorrencia} setFn={(v:any)=>setFiltrosA({...filtrosA, tipoOcorrencia: v})} options={listas.tipos}/>
                <InputFilter label="Turno" val={filtrosA.turno} setFn={(v:any)=>setFiltrosA({...filtrosA, turno: v})} options={listas.turnos}/>
              </div>
            </div>

            {/* LADO B */}
            {comparacaoAtiva && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#8B5CF6] uppercase tracking-widest bg-[#8B5CF6]/10 inline-block px-3 py-1 rounded-lg">Filtro B (Comparação)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InputFilter label="Período" val={filtrosB.tipoPeriodo} setFn={(v:any)=>setFiltrosB({...filtrosB, tipoPeriodo: v})} options={['hoje','semana','mes','ano','tudo']}/>
                  <InputFilter label="Ano Let." val={filtrosB.anoLetivo} setFn={(v:any)=>setFiltrosB({...filtrosB, anoLetivo: v})} options={listas.anosLetivos}/>
                  <InputFilter label="Série/Ano" val={filtrosB.serieAno} setFn={(v:any)=>setFiltrosB({...filtrosB, serieAno: v})} options={listas.series}/>
                  <InputFilter label="Turma" val={filtrosB.turma} setFn={(v:any)=>setFiltrosB({...filtrosB, turma: v})} options={listas.turmas}/>
                  <InputFilter label="Aluno" val={filtrosB.aluno} setFn={(v:any)=>setFiltrosB({...filtrosB, aluno: v})} options={listas.alunos}/>
                  <InputFilter label="Funcionário" val={filtrosB.funcionario} setFn={(v:any)=>setFiltrosB({...filtrosB, funcionario: v})} options={listas.funcionarios}/>
                  <InputFilter label="Tipo Ocorrência" val={filtrosB.tipoOcorrencia} setFn={(v:any)=>setFiltrosB({...filtrosB, tipoOcorrencia: v})} options={listas.tipos}/>
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
              <div key={i} className={`flex-1 flex items-start gap-3 p-4 rounded-2xl border ${
                ins.tipo === 'danger' ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' :
                ins.tipo === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' :
                ins.tipo === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
                'bg-blue-500/5 border-blue-500/20 text-blue-300'
              }`}>
                {ins.tipo === 'danger' && <Flame size={18} className="mt-0.5" />}
                {ins.tipo === 'success' && <Target size={18} className="mt-0.5" />}
                {ins.tipo === 'warning' && <AlertTriangle size={18} className="mt-0.5" />}
                {ins.tipo === 'info' && <Zap size={18} className="mt-0.5" />}
                <p className="text-sm font-medium leading-relaxed">{ins.text}</p>
              </div>
            ))}
          </section>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {renderKPI("Total Ocorrências", kpisA.total, kpisA.varTotal, comparacaoAtiva ? kpisB.total : null, <FileText size={18}/>, "red")}
          {renderKPI("Alunos Envolvidos", kpisA.alunosEnvolvidos, kpisA.varAlunos, comparacaoAtiva ? kpisB.alunosEnvolvidos : null, <Users size={18}/>, "red")}
          {renderKPI("Reincidências", kpisA.reincidentes, 0, comparacaoAtiva ? kpisB.reincidentes : null, <TrendingUp size={18}/>, "orange")}
          {renderKPI("Ocorr. Resolvidas", kpisA.resolvidas, kpisA.varResolvidas, comparacaoAtiva ? kpisB.resolvidas : null, <Shield size={18}/>, "green")}
        </section>

        {/* CHARTS GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* EVOLUTION CHART */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Evolução e Média</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">Análise temporal das ocorrências comparadas com a média do período filtrado.</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
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

          {/* DONUT CHART */}
          <div className="bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><PieChart size={16} className="text-emerald-500"/> Distribuição</h3>
            <p className="text-xs text-[#9CA3AF] mb-6">Proporção por Tipos de Ocorrência (Filtro A).</p>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={roscaTipos} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {roscaTipos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#2D3748', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HEATMAP */}
          <div className="lg:col-span-3 bg-[#111827] border border-[#2D3748] rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar size={16} className="text-rose-500"/> Mapa de Calor (Dia x Turno)</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">Concentração de eventos por dia da semana e período do dia (Filtro A).</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-[10px] font-bold text-[#9CA3AF] text-right pr-4 pt-8 space-y-4">
                {['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'].map(d=><div key={d} className="h-10 flex items-center justify-end">{d}</div>)}
              </div>
              <div className="col-span-3">
                <div className="grid grid-cols-3 gap-2 mb-2 text-center text-[10px] font-bold text-[#9CA3AF]">
                  <div>Manhã (06-12)</div><div>Tarde (12-18)</div><div>Noite (18-23)</div>
                </div>
                <div className="grid gap-2">
                  {heatmapData.map((dia, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 h-10">
                      {dia.map((val, jdx) => {
                        const intensity = Math.min(100, val * 15);
                        return (
                          <div key={jdx} className="rounded-lg relative group flex items-center justify-center border border-[#2D3748]/50 transition-all hover:border-rose-500" style={{ backgroundColor: `rgba(244, 63, 94, ${intensity/100 || 0.02})` }}>
                            <span className={`text-xs font-bold ${intensity > 40 ? 'text-white' : 'text-[#9CA3AF]'}`}>{val > 0 ? val : ''}</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 bg-[#111827] border border-[#2D3748] text-white text-[10px] py-1 px-2 rounded-md -top-8 whitespace-nowrap z-10 transition-opacity">
                              {val} registros
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
