import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCircle, Search, Clock, MapPin, ChevronLeft, ChevronRight, 
  Users, Calendar, Shield, AlertTriangle, FileText, Printer, 
  Edit2, Trash2, Plus, Coffee, Save, X, Settings, RefreshCw, Eye 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { generateEscalaGeralPDF, generateEscalasIndividuaisPDF } from '../lib/reportGenerator';
import { useAuth } from '../context/AuthContext';
import { salvarGradeMonitores, limparGradeMonitorDia, salvarPeriodos, buscarPeriodos } from '../services/dataService';
import { LOCAIS_MONITORIA } from '../lib/locations';
import SeletorLocalPosto from '../components/SeletorLocalPosto';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

// Limites da timeline macro (07:00 às 19:00)
const HORA_INICIO_MINUTOS = 7 * 60; // 420 minutos
const HORA_FIM_MINUTOS = 19 * 60;   // 1140 minutos
const TOTAL_MINUTOS = HORA_FIM_MINUTOS - HORA_INICIO_MINUTOS; // 720 minutos

const MACRO_SETORES = [
  '🏫 Térreo',
  '🌳 Pátio Lateral',
  '🏢 1º Andar',
  '🏢 2º Andar',
  '🏢 3º Andar',
  '🚗 S1',
  '🚗 S2',
  '🛡️ Volante 1',
  '🛡️ Volante 2',
  '🛡️ Monitoria',
  '📚 Biblioteca',
  '🏥 Enfermaria',
  '🍽️ Almoço'
];

const CORES_MONITOR = [
  '#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6',
  '#EC4899','#06B6D4','#F97316','#14B8A6','#6366F1',
  '#D946EF','#0EA5E9','#84CC16','#E11D48','#7C3AED',
];

function horaParaMinutos(hora: string): number {
  if (!hora || typeof hora !== 'string' || !hora.includes(':')) return 0;
  const parts = hora.split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

function minutosParaHora(minutos: number): string {
  const h = Math.floor(minutos / 60).toString().padStart(2, '0');
  const m = (minutos % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function horariosSobrepoem(inicio1: string, fim1: string, inicio2: string, fim2: string): boolean {
  const s1 = horaParaMinutos(inicio1);
  const e1 = horaParaMinutos(fim1);
  const s2 = horaParaMinutos(inicio2);
  const e2 = horaParaMinutos(fim2);
  return s1 < e2 && s2 < e1;
}

function obterMacroSetor(posto: string): string {
  const p = (posto || '').trim().toLowerCase();
  
  if (p === 'almoço' || p === 'almoco' || p === 'almoçando' || p === 'refeitório' || p === 'refeitorio') return '🍽️ Almoço';
  if (p === 'volante 1') return '🛡️ Volante 1';
  if (p === 'volante 2') return '🛡️ Volante 2';
  if (p === 'térreo' || p === 'terreo') return '🏫 Térreo';
  if (p === 'pátio lateral' || p === 'patio lateral') return '🌳 Pátio Lateral';
  if (p === '1º andar' || p === '1 andar') return '🏢 1º Andar';
  if (p === '2º andar' || p === '2 andar') return '🏢 2º Andar';
  if (p === '3º andar' || p === '3 andar') return '🏢 3º Andar';
  if (p === 's1') return '🚗 S1';
  if (p === 's2') return '🚗 S2';
  if (p === 'monitoria') return '🛡️ Monitoria';
  if (p === 'biblioteca') return '📚 Biblioteca';
  if (p === 'enfermaria') return '🏥 Enfermaria';

  if (p.includes('almoça') || p.includes('almoço')) return '🍽️ Almoço';

  const candidates: { sector: string; index: number }[] = [];

  const addCandidate = (sector: string, keywords: string[]) => {
    for (const kw of keywords) {
      const idx = p.indexOf(kw);
      if (idx !== -1) {
        candidates.push({ sector, index: idx });
      }
    }
  };

  addCandidate('🛡️ Volante 1', ['volante 2', 'volante2', 'apoio interno']);
  addCandidate('🛡️ Volante 2', ['volante 1', 'volante1', 'apoio externo']);
  addCandidate('🛡️ Monitoria', ['monitoria']);
  addCandidate('📚 Biblioteca', ['biblioteca', 'bliblioteca']);
  addCandidate('🏥 Enfermaria', ['enfermaria']);
  addCandidate('🚗 S1', ['s1']);
  addCandidate('🚗 S2', ['s2']);
  addCandidate('🏢 1º Andar', ['1º andar', '1 andar', 'primeiro andar']);
  addCandidate('🏢 2º Andar', ['2º andar', '2 andar', 'segundo andar']);
  addCandidate('🏢 3º Andar', ['3º andar', '3 andar', 'terceiro andar']);
  addCandidate('🌳 Pátio Lateral', ['patio', 'pátio', 'lateral', 'gramado', 'botânico', 'botanico']);
  addCandidate('🏫 Térreo', ['térreo', 'terreo']);

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.index - b.index);
    return candidates[0].sector;
  }

  return '🛡️ Monitoria';
}

export default function Monitores() {
  const { isAdmin } = useAuth();
  const { monitores, horaAtual, gradeMonitores, periodos, atualizar } = useEscola();
  const [busca, setBusca] = useState('');
  const [monitorSelecionadoId, setMonitorSelecionadoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'macro' | 'monitor' | 'setor'>('macro');
  const [diaFiltro, setDiaFiltro] = useState(() => {
    const dias = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    return dias[horaAtual.getDay()] || 'SEGUNDA';
  });

  // Modal para Edição da Escala do Monitor
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [monitorEditando, setMonitorEditando] = useState<any>(null);
  const [linhasEditando, setLinhasEditando] = useState<any[]>([]);
  const [replicarSemana, setReplicarSemana] = useState(false);
  const [salvandoEscala, setSalvandoEscala] = useState(false);

  // Modal de Horários Padrões / Períodos
  const [modalPeriodosAberto, setModalPeriodosAberto] = useState(false);
  const [segmentoPeriodo, setSegmentoPeriodo] = useState<'6e7' | '8e9' | 'medio' | 'monitoria'>('monitoria');
  const [periodosEditaveis, setPeriodosEditaveis] = useState<any[]>([]);
  const [salvandoPeriodos, setSalvandoPeriodos] = useState(false);

  // Carregar períodos quando abrir o modal de Horários Padrões
  useEffect(() => {
    if (modalPeriodosAberto) {
      buscarPeriodos().then(todos => {
        const filtrados = todos.filter(p => p.segmento === segmentoPeriodo);
        setPeriodosEditaveis(filtrados);
      });
    }
  }, [modalPeriodosAberto, segmentoPeriodo]);

  const minutosAgora = horaAtual.getHours() * 60 + horaAtual.getMinutes();

  // Mapa de cores: cada nome de monitor recebe uma cor fixa
  const mapaCorMonitor = useMemo(() => {
    const mapa: Record<string, string> = {};
    const nomes = Array.from(new Set([
      ...(monitores || []).map(m => m.nome),
      ...(gradeMonitores || []).map(g => g.monitorNome),
    ])).sort();
    nomes.forEach((nome, i) => {
      const monitor = (monitores || []).find(m => m.nome === nome);
      const gradeEntry = (gradeMonitores || []).find(g => g.monitorNome === nome && g.corEtiqueta);
      mapa[nome] = monitor?.cor || gradeEntry?.corEtiqueta || CORES_MONITOR[i % CORES_MONITOR.length];
    });
    return mapa;
  }, [monitores, gradeMonitores]);

  const monitoresFiltrados = (monitores || []).filter(m => {
    const b = busca.toLowerCase();
    return (m.nome?.toLowerCase() || '').includes(b) || (m.materia?.toLowerCase() || '').includes(b);
  });

  const monitorAtivo = monitores.find(m => m.id === monitorSelecionadoId);

  // Grade do monitor selecionado, filtrada pelo dia
  const gradeDoMonitor = useMemo(() => {
    if (!monitorAtivo) return [];
    return (gradeMonitores || [])
      .filter(g => g.monitorNome === monitorAtivo.nome && g.diaSemana === diaFiltro)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
  }, [monitorAtivo, diaFiltro, gradeMonitores]);

  // Grade de todos os monitores do dia (escala geral)
  const escalaDoDia = useMemo(() => {
    return (gradeMonitores || [])
      .filter(g => g.diaSemana === diaFiltro)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
  }, [gradeMonitores, diaFiltro]);

  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [acompanharTempoReal, setAcompanharTempoReal] = useState(true);

  const horariosDisponiveis = useMemo(() => {
    if (escalaDoDia.length === 0) return [];
    
    let minMinutos = 24 * 60;
    let maxMinutos = 0;
    escalaDoDia.forEach(slot => {
      const start = horaParaMinutos(slot.horarioInicio);
      const end = horaParaMinutos(slot.horarioFim);
      if (start < minMinutos) minMinutos = start;
      if (end > maxMinutos) maxMinutos = end;
    });

    minMinutos = Math.floor(minMinutos / 30) * 30;
    maxMinutos = Math.ceil(maxMinutos / 30) * 30;

    const list: string[] = [];
    for (let t = minMinutos; t < maxMinutos; t += 30) {
      const hInicio = `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
      const tFim = t + 30;
      const hFim = `${Math.floor(tFim / 60).toString().padStart(2, '0')}:${(tFim % 60).toString().padStart(2, '0')}`;
      list.push(`${hInicio} - ${hFim}`);
    }
    return list;
  }, [escalaDoDia]);

  const horarioAtivoPorSetor = useMemo(() => {
    if (horariosDisponiveis.length === 0) return null;
    if (!acompanharTempoReal && horarioSelecionado && horariosDisponiveis.includes(horarioSelecionado)) {
      return horarioSelecionado;
    }
    const agoraMinutos = horaAtual.getHours() * 60 + horaAtual.getMinutes();
    const ativoAgora = horariosDisponiveis.find(h => {
      const [inicio, fim] = h.split(' - ');
      return agoraMinutos >= horaParaMinutos(inicio) && agoraMinutos < horaParaMinutos(fim);
    });
    return ativoAgora || horariosDisponiveis[0];
  }, [horariosDisponiveis, horarioSelecionado, acompanharTempoReal, horaAtual]);

  const slotsNoHorario = useMemo(() => {
    if (!horarioAtivoPorSetor) return [];
    const [inicio, fim] = horarioAtivoPorSetor.split(' - ');
    return escalaDoDia.filter(g => 
      horariosSobrepoem(g.horarioInicio, g.horarioFim, inicio, fim)
    );
  }, [escalaDoDia, horarioAtivoPorSetor]);

  const handleExportarGeral = () => {
    generateEscalaGeralPDF(escalaDoDia, diaFiltro, monitores);
  };

  const handleExportarIndividuais = () => {
    generateEscalasIndividuaisPDF(monitores, gradeMonitores, diaFiltro);
  };

  const handleExportarMonitorAtivo = () => {
    if (monitorAtivo) {
      generateEscalasIndividuaisPDF([monitorAtivo], gradeMonitores, diaFiltro);
    }
  };

  // Abrir Modal de Edição de Escala
  const abrirEdicaoEscala = (monitor: any, slotPadraoMinutos?: number) => {
    if (!isAdmin) return;
    setMonitorEditando(monitor);
    const slotsExistentes = gradeMonitores
      .filter(g => g.monitorNome === monitor.nome && g.diaSemana === diaFiltro)
      .map(g => ({
        id: g.id,
        horarioInicio: g.horarioInicio.slice(0, 5),
        horarioFim: g.horarioFim.slice(0, 5),
        posto: g.posto || '',
        funcao: g.funcao || 'Monitoria Geral',
        corEtiqueta: g.corEtiqueta || monitor.cor || '#3B82F6',
        tipo: (g.funcao === 'ALMOÇO' || g.funcao === 'INTERVALO') ? 'almoco' : 'servico'
      }));

    if (slotsExistentes.length === 0 && slotPadraoMinutos !== undefined) {
      const inicio = minutosParaHora(slotPadraoMinutos);
      const fim = minutosParaHora(slotPadraoMinutos + 60);
      slotsExistentes.push({
        id: `novo-${Date.now()}`,
        horarioInicio: inicio,
        horarioFim: fim,
        posto: 'TÉRREO',
        funcao: 'Monitoria Geral',
        corEtiqueta: monitor.cor || '#3B82F6',
        tipo: 'servico'
      });
    }

    setLinhasEditando(slotsExistentes);
    setReplicarSemana(false);
    setModalEdicaoAberto(true);
  };

  // Salvar Escala do Monitor no Supabase
  const salvarEscalaMonitor = async () => {
    if (!monitorEditando) return;
    setSalvandoEscala(true);

    try {
      if (linhasEditando.length === 0) {
        if (replicarSemana) {
          for (const dia of DIAS_SEMANA) {
            await limparGradeMonitorDia(monitorEditando.nome, dia);
          }
        } else {
          await limparGradeMonitorDia(monitorEditando.nome, diaFiltro);
        }
      } else {
        const diasParaSalvar = replicarSemana ? DIAS_SEMANA : [diaFiltro];
        const payloads: any[] = [];
        
        for (const dia of diasParaSalvar) {
          linhasEditando.forEach(l => {
            payloads.push({
              monitorNome: monitorEditando.nome,
              diaSemana: dia,
              horarioInicio: l.horarioInicio,
              horarioFim: l.horarioFim,
              posto: l.posto || 'A DEFINIR',
              funcao: l.funcao || 'Monitoria Geral',
              corEtiqueta: monitorEditando.cor || '#3B82F6'
            });
          });
        }
        await salvarGradeMonitores(payloads);
      }

      await atualizar();
      setModalEdicaoAberto(false);
    } catch (e) {
      console.error('Erro ao salvar escala:', e);
    } finally {
      setSalvandoEscala(false);
    }
  };

  // Salvar períodos de horários padrões
  const salvarModeloPeriodos = async () => {
    setSalvandoPeriodos(true);
    try {
      const ok = await salvarPeriodos(periodosEditaveis);
      if (ok) {
        await atualizar();
        setModalPeriodosAberto(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvandoPeriodos(false);
    }
  };

  // Linhas da grade macro de horas para exibição no topo
  const timeLabels = useMemo(() => {
    const list: string[] = [];
    for (let t = HORA_INICIO_MINUTOS; t <= HORA_FIM_MINUTOS; t += 60) {
      list.push(minutosParaHora(t));
    }
    return list;
  }, []);

  // ========== SUB-PÁGINA: Grade individual do monitor ==========
  if (monitorAtivo) {
    const cor = mapaCorMonitor[monitorAtivo.nome] || '#3B82F6';

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-8 text-white relative" style={{ backgroundColor: cor }}>
            <div className="absolute top-6 right-6 flex gap-2">
              {isAdmin && (
                <button 
                  onClick={handleExportarMonitorAtivo} 
                  className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all text-black"
                  title="Exportar PDF deste monitor"
                >
                  <FileText size={20} />
                </button>
              )}
              <button 
                onClick={() => setMonitorSelecionadoId(null)} 
                className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all text-black"
                title="Voltar"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-3xl font-black" style={{ color: cor }}>
                {(monitorAtivo.nome || 'M').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic leading-none text-black">{monitorAtivo.nome}</h2>
                <p className="text-sm font-bold opacity-80 mt-1 italic text-black/70">
                  {monitorAtivo.tipo === 'volante' ? 'VOLANTE' : monitorAtivo.tipo === 'hibrido' ? 'HÍBRIDO' : 'FIXO'} · {monitorAtivo.turno}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
              <h3 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
                <Calendar size={18} style={{ color: cor }} /> Grade de Postos
              </h3>
              <div className="flex gap-1 p-1 bg-black rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                {DIAS_SEMANA.map(dia => (
                  <button key={dia} onClick={() => setDiaFiltro(dia)}
                    className={cn("px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                      diaFiltro === dia ? "text-black shadow-md" : "text-white/40 hover:bg-white/5")}
                    style={diaFiltro === dia ? { backgroundColor: cor } : {}}>
                    {dia.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {gradeDoMonitor.length === 0 ? (
                <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">Sem postos neste dia.</div>
              ) : gradeDoMonitor.map((slot, i) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border-2 border-white/5 bg-[#0d0d0d] shadow-premium flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden"
                  style={{ borderLeft: `6px solid ${slot.corEtiqueta || cor}` }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-black rounded-xl border border-white/5 flex items-center justify-center text-[10px] font-black" style={{ color: cor }}>#{i+1}</div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: cor }}>{slot.horarioInicio} — {slot.horarioFim}</p>
                      <h4 className="text-base font-black text-white italic tracking-tighter">{slot.posto}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: `${cor}15`, color: cor }}>
                      <MapPin size={10} className="inline mr-1" />{slot.funcao || 'Monitoria'}
                    </div>
                    {slot.instrucoes && (
                      <div className="px-3 py-1.5 bg-white/5 rounded-xl text-[8px] font-black text-white/40 italic truncate max-w-[200px]">
                        {slot.instrucoes}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
              <div className="p-4 bg-black rounded-xl border border-white/5 text-center">
                <p className="text-[7px] font-black uppercase opacity-30 mb-1">Postos Hoje</p>
                <p className="text-2xl font-black italic" style={{ color: cor }}>{gradeDoMonitor.length}</p>
              </div>
              <div className="p-4 bg-black rounded-xl border border-white/5 text-center">
                <p className="text-[7px] font-black uppercase opacity-30 mb-1">Início</p>
                <p className="text-lg font-black italic text-white">{gradeDoMonitor[0]?.horarioInicio || '--:--'}</p>
              </div>
              <div className="p-4 bg-black rounded-xl border border-white/5 text-center">
                <p className="text-[7px] font-black uppercase opacity-30 mb-1">Fim</p>
                <p className="text-lg font-black italic text-white">{gradeDoMonitor[gradeDoMonitor.length - 1]?.horarioFim || '--:--'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">
            <span className="text-[#42a0f5]">Monitores</span>
          </h1>
          <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">
            Escala geral, timeline interativa de postos e horários.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 bg-[#0a0a0a] rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            {DIAS_SEMANA.map(dia => (
              <button key={dia} onClick={() => setDiaFiltro(dia)}
                className={cn("px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                  diaFiltro === dia ? "bg-[#42a0f5] text-black shadow-md" : "text-white/40 hover:bg-white/5")}>
                {dia.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="relative group w-48 lg:w-64">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#42a0f5]" size={18} />
            <input type="text" placeholder="Buscar monitor ou local..." value={busca} onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[#0a0a0a] border-2 border-white/5 rounded-2xl text-white font-black text-xs focus:ring-4 focus:ring-[#42a0f5]/5 outline-none" />
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-[#0a0a0a] p-1 rounded-2xl border border-white/5 gap-1 w-fit">
          <button
            onClick={() => setViewMode('macro')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
              viewMode === 'macro'
                ? "bg-[#42a0f5] text-black shadow-md"
                : "text-white/45 hover:bg-white/5 hover:text-white"
            )}
          >
            <Calendar size={12} />
            Escala Macro Timeline
          </button>
          <button
            onClick={() => setViewMode('monitor')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
              viewMode === 'monitor'
                ? "bg-[#42a0f5] text-black shadow-md"
                : "text-white/45 hover:bg-white/5 hover:text-white"
            )}
          >
            <Users size={12} />
            Lista Detalhada
          </button>
          <button
            onClick={() => setViewMode('setor')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
              viewMode === 'setor'
                ? "bg-[#fbbf24] text-black shadow-md"
                : "text-white/45 hover:bg-white/5 hover:text-white"
            )}
          >
            <MapPin size={12} />
            Por Setor
          </button>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={() => setModalPeriodosAberto(true)}
              className="flex-1 md:flex-initial btn-secondary flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
              title="Configurar horários padrões e turnos de intervalo"
            >
              <Settings size={12} className="text-[#a855f7]" />
              Horários Padrões & Intervalos
            </button>
          )}
          <button
            onClick={handleExportarGeral}
            className="flex-1 md:flex-initial btn-secondary flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            title="Exportar PDF da escala geral do dia"
          >
            <FileText size={12} className="text-[#fbbf24]" />
            PDF Escala Geral
          </button>
          <button
            onClick={handleExportarIndividuais}
            className="flex-1 md:flex-initial btn-secondary flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            title="Exportar PDFs individuais (um por página) de todos os monitores"
          >
            <Printer size={12} className="text-[#42a0f5]" />
            PDFs Individuais
          </button>
        </div>
      </div>

      {viewMode === 'macro' && (
        <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-6 md:p-8 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Painel de Escala Macro — {diaFiltro}
            </h3>
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
              {isAdmin ? "Clique nas células ou nomes para editar a escala" : "Modo Visualização"}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[900px] relative pb-4">
              <div className="grid grid-cols-[200px_1fr] border-b border-white/5 pb-4">
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest self-end pl-2">Monitores</div>
                <div className="relative h-6 flex justify-between">
                  {timeLabels.map((time) => {
                    const min = horaParaMinutos(time);
                    const pct = ((min - HORA_INICIO_MINUTOS) / TOTAL_MINUTOS) * 100;
                    return (
                      <div 
                        key={time} 
                        className="absolute -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${pct}%` }}
                      >
                        <span className="text-[9px] font-black text-white/50 tracking-wider bg-black px-1.5 py-0.5 rounded-md border border-white/5">
                          {time}
                        </span>
                        <div className="w-[1px] h-3 bg-white/10 mt-1" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="divide-y divide-white/5 relative">
                <div className="absolute left-[200px] right-0 top-0 bottom-0 pointer-events-none flex justify-between">
                  {timeLabels.map((time) => {
                    const min = horaParaMinutos(time);
                    const pct = ((min - HORA_INICIO_MINUTOS) / TOTAL_MINUTOS) * 100;
                    return (
                      <div 
                        key={`line-${time}`} 
                        className="absolute h-full w-[1px] bg-white/[0.02] border-dashed border-r"
                        style={{ left: `${pct}%` }}
                      />
                    );
                  })}
                </div>

                {monitoresFiltrados.length === 0 ? (
                  <div className="py-16 text-center opacity-30 text-xs italic">Nenhum monitor encontrado.</div>
                ) : (
                  monitoresFiltrados.map((m) => {
                    const cor = mapaCorMonitor[m.nome] || '#3B82F6';
                    const turnos = (gradeMonitores || [])
                      .filter(g => g.monitorNome === m.nome && g.diaSemana === diaFiltro)
                      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

                    return (
                      <div 
                        key={m.id} 
                        className="grid grid-cols-[200px_1fr] py-4 items-center hover:bg-white/[0.01] transition-all relative group"
                      >
                        <div 
                          className="flex items-center gap-3 pr-4 border-r border-white/5 cursor-pointer select-none"
                          onClick={() => isAdmin ? abrirEdicaoEscala(m) : setMonitorSelecionadoId(m.id)}
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 relative"
                            style={{ backgroundColor: `${cor}20`, color: cor, border: `1.5px solid ${cor}40` }}
                          >
                            {m.nome.charAt(0)}
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#0d0d0d] flex items-center justify-center border border-white/10">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }} />
                            </span>
                          </div>
                          <div className="min-w-0 font-sans">
                            <h4 className="text-xs font-black text-white truncate leading-tight group-hover:text-primary transition-all">
                              {m.nome}
                            </h4>
                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                              {m.tipo} · {m.turno}
                            </p>
                          </div>
                          {isAdmin && (
                            <Edit2 size={10} className="text-white/20 group-hover:text-primary ml-auto opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          )}
                        </div>

                        <div className="relative h-14 w-full flex items-center px-2">
                          {isAdmin && (
                            <div 
                              className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 cursor-pointer border border-dashed border-primary/10 rounded-xl m-1 hover:bg-primary/[0.02] transition-all"
                              onClick={() => abrirEdicaoEscala(m, HORA_INICIO_MINUTOS)}
                              title="Adicionar turno de trabalho"
                            >
                              <Plus size={14} className="text-primary/45" />
                              <span className="text-[9px] font-black uppercase text-primary/45 tracking-widest">Montar Turno</span>
                            </div>
                          )}

                          {turnos.map((slot) => {
                            const minStart = Math.max(horaParaMinutos(slot.horarioInicio), HORA_INICIO_MINUTOS);
                            const minEnd = Math.min(horaParaMinutos(slot.horarioFim), HORA_FIM_MINUTOS);
                            if (minStart >= minEnd) return null;

                            const left = ((minStart - HORA_INICIO_MINUTOS) / TOTAL_MINUTOS) * 100;
                            const width = ((minEnd - minStart) / TOTAL_MINUTOS) * 100;

                            const ehAlmoco = slot.funcao === 'ALMOÇO' || slot.posto === 'ALMOÇO' || slot.posto === 'REFEITÓRIO';
                            const blockColor = ehAlmoco ? '#fbbf24' : (slot.corEtiqueta || cor);

                            return (
                              <div
                                key={slot.id}
                                className={cn(
                                  "absolute z-10 h-11 rounded-xl p-2 border-2 transition-all flex flex-col justify-center cursor-pointer select-none",
                                  ehAlmoco 
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400" 
                                    : "bg-[#0d0d0d] border-white/5 text-white hover:border-primary/50 shadow-md hover:shadow-primary/10"
                                )}
                                style={{ 
                                  left: `${left}%`, 
                                  width: `${width}%`,
                                  borderLeft: `4px solid ${blockColor}`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAdmin) {
                                    abrirEdicaoEscala(m);
                                  } else {
                                    setMonitorSelecionadoId(m.id);
                                  }
                                }}
                                title={`${slot.posto} (${slot.funcao}) : ${slot.horarioInicio} - ${slot.horarioFim}`}
                              >
                                <div className="text-[9px] font-black truncate flex items-center gap-1 uppercase tracking-tight">
                                  {ehAlmoco ? <Coffee size={10} className="shrink-0" /> : <MapPin size={10} className="shrink-0" />}
                                  {slot.posto}
                                </div>
                                <div className="text-[7.5px] font-bold text-white/50 truncate flex items-center justify-between mt-0.5 leading-none">
                                  <span className="truncate">{slot.funcao}</span>
                                  <span className="text-[7px] bg-black/40 px-1 rounded text-primary shrink-0 ml-1">
                                    {slot.horarioInicio.slice(0, 5)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'monitor' && (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
              <Users size={18} className="text-[#42a0f5]" /> Equipe de Monitores
            </h2>
            <div className="flex flex-col gap-3">
              {monitoresFiltrados.map((monitor) => {
                const cor = mapaCorMonitor[monitor.nome] || '#3B82F6';
                const postosHoje = (gradeMonitores || []).filter(g => g.monitorNome === monitor.nome && g.diaSemana === diaFiltro).length;
                const ativo = monitor.status === 'ativo';

                return (
                  <motion.div key={monitor.id} whileHover={{ x: 5 }} onClick={() => setMonitorSelecionadoId(monitor.id)}
                    className={cn("bg-[#0d0d0d] rounded-2xl shadow-premium p-4 cursor-pointer group border-2 transition-all flex items-center justify-between",
                      ativo ? "border-white/5 hover:border-white/20" : "border-white/5 opacity-40")}
                    style={{ borderLeftWidth: '5px', borderLeftColor: cor }}>

                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all"
                        style={{ backgroundColor: `${cor}20`, color: cor }}>
                        {(monitor.nome || 'M')[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tighter leading-tight italic group-hover:text-[#42a0f5]">{monitor.nome}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${cor}15`, color: cor }}>
                            {monitor.tipo === 'volante' ? 'VOLANTE' : monitor.tipo === 'hibrido' ? 'HÍBRIDO' : 'FIXO'}
                          </span>
                          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{monitor.turno}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex flex-col items-end">
                        <p className="text-[10px] font-black text-white tracking-widest">{monitor.horarioInicio} — {monitor.horarioFim}</p>
                        <p className="text-[9px] font-black uppercase" style={{ color: cor }}>{postosHoje} posto{postosHoje !== 1 ? 's' : ''} hoje</p>
                      </div>
                      {ativo && <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: cor, boxShadow: `0 0 8px ${cor}` }} />}
                      <ChevronRight size={18} className="text-[#42a0f5] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#fbbf24]" /> Escala do Dia — {diaFiltro}
              </div>
              <select 
                value={busca || 'Todos'} 
                onChange={(e) => setBusca(e.target.value === 'Todos' ? '' : e.target.value)}
                className="bg-[#0a0a0a] border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none ring-2 ring-[#42a0f5]/10 focus:ring-[#42a0f5]/30 text-[#42a0f5] cursor-pointer"
              >
                <option value="Todos">Todos os Monitores</option>
                {monitores.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </select>
            </h2>

            {escalaDoDia.length === 0 ? (
              <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">Nenhum posto agendado.</div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const monitoresNaEscala = Array.from(new Set<string>(escalaDoDia.map(g => g.monitorNome)))
                    .filter(nome => !busca || nome.toLowerCase().includes(busca.toLowerCase()))
                    .sort() as string[];

                  if (monitoresNaEscala.length === 0) {
                    return (
                      <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">
                        Nenhum monitor correspondente à busca.
                      </div>
                    );
                  }

                  return monitoresNaEscala.map(nome => {
                    const cor = mapaCorMonitor[nome] || '#3B82F6';
                    const postos = escalaDoDia
                      .filter(g => g.monitorNome === nome)
                      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

                    return (
                      <div key={nome} className="bg-[#0a0a0a]/50 rounded-[1.5rem] border border-white/5 p-5 flex flex-col md:flex-row md:items-center gap-6 hover:border-white/10 transition-all">
                        <div className="md:w-56 shrink-0 flex items-center gap-4 bg-black/30 p-3 rounded-2xl border border-white/5">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
                            style={{ backgroundColor: `${cor}20`, color: cor }}>
                            {nome.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-white truncate leading-tight tracking-tight italic">{nome}</h4>
                            <p className="text-[9px] font-black uppercase mt-1 tracking-widest" style={{ color: cor }}>
                              {postos.length} {postos.length === 1 ? 'Plantão' : 'Plantões'}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 pt-1 snap-x scroll-smooth custom-scrollbar">
                          {postos.map(slot => {
                            const minInicio = horaParaMinutos(slot.horarioInicio);
                            const minFim = horaParaMinutos(slot.horarioFim);
                            const estaAtivo = minutosAgora >= minInicio && minutosAgora < minFim;

                            return (
                              <div
                                key={slot.id}
                                className={cn(
                                  "flex-shrink-0 w-64 bg-[#0d0d0d] rounded-2xl p-4 border transition-all flex flex-col justify-between min-h-[110px] snap-start hover:bg-[#121212]",
                                  estaAtivo ? "border-[#fbbf24]/50 shadow-[0_0_12px_rgba(251,191,36,0.15)] bg-[#141414]" : "border-white/5"
                                )}
                                style={{ borderLeft: `5px solid ${cor}` }}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black text-white/40 tracking-wider">
                                      🕒 {slot.horarioInicio} - {slot.horarioFim}
                                    </span>
                                    {estaAtivo && (
                                      <span className="px-2 py-0.5 bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 rounded-md text-[8px] font-black uppercase tracking-wider animate-pulse">
                                        Agora
                                      </span>
                                    )}
                                  </div>

                                  <h5 className="text-xs font-black text-white italic tracking-tight truncate leading-none mt-0.5">
                                    📍 {slot.posto}
                                  </h5>

                                  {slot.funcao && slot.funcao !== 'Monitoria Geral' && (
                                    <p className="text-[9px] text-white/50 font-semibold italic truncate mt-0.5">
                                      ⚙️ {slot.funcao}
                                    </p>
                                  )}

                                  {slot.instrucoes && (
                                    <p className="text-[8px] text-white/30 italic mt-1 bg-white/[0.01] p-1.5 rounded-lg border border-white/[0.02] line-clamp-2 leading-relaxed">
                                      {slot.instrucoes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </section>
        </>
      )}

      {viewMode === 'setor' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 bg-[#0a0a0a]/50 p-5 rounded-[1.5rem] border border-white/5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#fbbf24]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fbbf24]">Horários Disponíveis</span>
              </div>
              <button
                onClick={() => {
                  setAcompanharTempoReal(!acompanharTempoReal);
                  if (!acompanharTempoReal) {
                    setHorarioSelecionado(null);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all flex items-center gap-1.5",
                  acompanharTempoReal 
                    ? "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30" 
                    : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", acompanharTempoReal ? "bg-[#fbbf24] animate-pulse" : "bg-white/30")} />
                {acompanharTempoReal ? "Tempo Real Ativo" : "Fixar Tempo Real"}
              </button>
            </div>
            
            {horariosDisponiveis.length === 0 ? (
              <div className="py-4 text-center opacity-20 italic font-black text-xs">
                Nenhum horário na escala deste dia.
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scroll-smooth custom-scrollbar no-scrollbar">
                {horariosDisponiveis.map(h => {
                  const isActive = horarioAtivoPorSetor === h;
                  return (
                    <button
                      key={h}
                      onClick={() => {
                        setAcompanharTempoReal(false);
                        setHorarioSelecionado(h);
                      }}
                      className={cn(
                        "flex-shrink-0 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
                        isActive
                          ? "bg-[#fbbf24] text-black shadow-md font-bold"
                          : "bg-[#0d0d0d] text-white/45 hover:bg-white/5 hover:text-white border border-white/5"
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {escalaDoDia.length === 0 ? (
            <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">
              Nenhum posto agendado.
            </div>
          ) : (
            horarioAtivoPorSetor && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {MACRO_SETORES.map(macro => {
                  const slotsNoSetor = slotsNoHorario.filter(slot => obterMacroSetor(slot.posto) === macro);
                  
                  const slotsFiltrados = slotsNoSetor.filter(slot => {
                    if (!busca) return true;
                    const b = busca.toLowerCase();
                    return slot.monitorNome.toLowerCase().includes(b) ||
                           slot.posto.toLowerCase().includes(b) ||
                           (slot.funcao || '').toLowerCase().includes(b);
                  });

                  if (busca && slotsFiltrados.length === 0) return null;

                  const temMonitores = slotsFiltrados.length > 0;

                  return (
                    <div 
                      key={macro} 
                      className={cn(
                        "bg-[#0a0a0a]/50 rounded-[1.5rem] border p-5 flex flex-col justify-between min-h-[150px] hover:border-white/10 transition-all",
                        temMonitores ? "border-white/5" : "border-dashed border-white/5 opacity-40 bg-[#0d0d0d]/10"
                      )}
                    >
                      <div className="flex flex-col h-full justify-between gap-4">
                        <div>
                          <span className="text-xs font-black text-white italic tracking-tight uppercase tracking-wider block mb-2">{macro}</span>
                          
                          {temMonitores ? (
                            <div className="space-y-2">
                              {slotsFiltrados.map(slot => {
                                const cor = mapaCorMonitor[slot.monitorNome] || '#3B82F6';
                                return (
                                  <div 
                                    key={slot.id} 
                                    className="bg-[#0d0d0d] rounded-xl p-3 border border-white/5"
                                    style={{ borderLeft: `4px solid ${cor}` }}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-black text-white italic truncate">
                                        👤 {slot.monitorNome}
                                      </span>
                                    </div>
                                    
                                    {slot.posto && slot.posto !== macro && (
                                      <p className="text-[8px] text-[#fbbf24] font-bold uppercase tracking-wider mt-1">
                                        📍 {slot.posto}
                                      </p>
                                    )}

                                    {slot.funcao && slot.funcao !== 'Monitoria Geral' && (
                                      <p className="text-[9px] text-white/50 font-semibold italic truncate mt-1">
                                        ⚙️ {slot.funcao}
                                      </p>
                                    )}

                                    {slot.instrucoes && (
                                      <p className="text-[8px] text-white/30 italic mt-1.5 bg-white/[0.01] p-1.5 rounded border border-white/[0.02] line-clamp-2 leading-relaxed">
                                        {slot.instrucoes}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-6 flex items-center justify-center text-[9px] font-black text-white/20 uppercase tracking-widest bg-black/20 rounded-xl border border-dashed border-white/5">
                              Sem Monitor
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE ESCALA DO MONITOR */}
      <AnimatePresence>
        {modalEdicaoAberto && monitorEditando && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setModalEdicaoAberto(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-4xl bg-surface-container-lowest border border-white/10 rounded-[3rem] p-6 md:p-10 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0" 
                    style={{ backgroundColor: `${monitorEditando.cor || '#3B82F6'}20`, color: monitorEditando.cor || '#3B82F6' }}>
                    {monitorEditando.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                      Editar Turnos — <span style={{ color: monitorEditando.cor || '#3B82F6' }}>{monitorEditando.nome}</span>
                    </h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                      Dia: {diaFiltro} | Edite os turnos e atribuições do monitor
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalEdicaoAberto(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 flex items-center justify-center transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 mb-6">
                {linhasEditando.length === 0 ? (
                  <div className="py-12 text-center text-white/30 italic text-sm border-2 border-dashed border-white/5 rounded-3xl">
                    Nenhum turno configurado para este dia. Clique no botão abaixo para adicionar.
                  </div>
                ) : (
                  linhasEditando.map((linha, idx) => {
                    const ehAlmoco = linha.tipo === 'almoco';
                    return (
                      <div key={linha.id} 
                        className={cn("p-4 rounded-2xl border-2 transition-all flex flex-col md:flex-row items-center gap-4 relative overflow-hidden",
                          ehAlmoco ? "bg-amber-500/5 border-amber-500/10" : "bg-black/30 border-white/5"
                        )}
                        style={{ borderLeft: `6px solid ${ehAlmoco ? '#fbbf24' : (monitorEditando.cor || '#3B82F6')}` }}
                      >
                        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-start">
                          <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                            {idx + 1}
                          </span>
                          <button 
                            type="button"
                            onClick={() => {
                              const novas = [...linhasEditando];
                              if (novas[idx].tipo === 'servico') {
                                novas[idx].tipo = 'almoco';
                                novas[idx].funcao = 'ALMOÇO';
                                novas[idx].posto = 'ALMOÇO';
                              } else {
                                novas[idx].tipo = 'servico';
                                novas[idx].funcao = 'Monitoria Geral';
                                novas[idx].posto = 'TÉRREO';
                              }
                              setLinhasEditando(novas);
                            }}
                            className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all",
                              ehAlmoco ? "bg-amber-500/20 text-amber-500" : "bg-white/5 text-white/40 hover:bg-white/10"
                            )}
                          >
                            <Coffee size={10} />
                            {ehAlmoco ? "Intervalo/Almoço" : "Turno Normal"}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5 shrink-0 w-full md:w-auto justify-center">
                          <input type="time" value={linha.horarioInicio} 
                            onChange={e => {
                              const novas = [...linhasEditando];
                              novas[idx].horarioInicio = e.target.value;
                              setLinhasEditando(novas);
                            }}
                            className="bg-transparent text-xs font-black text-center text-primary outline-none border-none w-14" />
                          <span className="text-white/20">—</span>
                          <input type="time" value={linha.horarioFim} 
                            onChange={e => {
                              const novas = [...linhasEditando];
                              novas[idx].horarioFim = e.target.value;
                              setLinhasEditando(novas);
                            }}
                            className="bg-transparent text-xs font-black text-center text-primary outline-none border-none w-14" />
                        </div>

                        <div className="relative w-full md:flex-1">
                          <SeletorLocalPosto 
                            value={linha.posto}
                            onChange={val => {
                              const novas = [...linhasEditando];
                              novas[idx].posto = val;
                              setLinhasEditando(novas);
                            }}
                            className="w-full bg-[#161616] border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none focus:border-primary/45 appearance-none cursor-pointer uppercase"
                          />
                        </div>

                        <div className="w-full md:flex-1">
                          <input type="text" value={linha.funcao} placeholder="Atividade / Função..."
                            onChange={e => {
                              const novas = [...linhasEditando];
                              novas[idx].funcao = e.target.value;
                              setLinhasEditando(novas);
                            }}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none focus:border-primary/45 placeholder:opacity-30 uppercase" 
                          />
                        </div>

                        <div className="flex gap-1 shrink-0 ml-auto w-full md:w-auto justify-end">
                          <button 
                            onClick={() => {
                              setLinhasEditando(linhasEditando.filter((_, i) => i !== idx));
                            }}
                            title="Remover este turno"
                            className="p-2 text-white/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                <button 
                  onClick={() => {
                    const ultimoTurno = linhasEditando[linhasEditando.length - 1];
                    let proxInicio = '07:30';
                    let proxFim = '08:30';
                    if (ultimoTurno) {
                      proxInicio = ultimoTurno.horarioFim;
                      const [h, m] = proxInicio.split(':').map(Number);
                      proxFim = minutosParaHora(h * 60 + m + 60);
                    }
                    setLinhasEditando([...linhasEditando, {
                      id: `novo-${Date.now()}`,
                      horarioInicio: proxInicio,
                      horarioFim: proxFim,
                      posto: 'TÉRREO',
                      funcao: 'Monitoria Geral',
                      corEtiqueta: monitorEditando.cor || '#3B82F6',
                      tipo: 'servico'
                    }]);
                  }}
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Plus size={16} /> Adicionar Novo Turno / Intervalo
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6 shrink-0">
                <label className="flex items-center gap-2 text-xs font-bold text-white/60 cursor-pointer select-none">
                  <input type="checkbox" checked={replicarSemana} onChange={e => setReplicarSemana(e.target.checked)} 
                    className="w-4 h-4 rounded border-white/10 bg-black checked:bg-primary accent-primary text-black focus:ring-0 focus:ring-offset-0" />
                  <span>Aplicar esta mesma escala para a semana inteira (Segunda a Sexta)</span>
                </label>

                <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                  <button 
                    onClick={salvarEscalaMonitor}
                    disabled={salvandoEscala}
                    className="flex-1 md:flex-initial btn-primary px-8 py-3 flex items-center justify-center gap-2"
                  >
                    {salvandoEscala ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    {salvandoEscala ? "Salvando..." : "Salvar Escala"}
                  </button>
                  <button onClick={() => setModalEdicaoAberto(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-all">
                    Cancelar
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIGURAÇÃO DE HORÁRIOS PADRÕES & INTERVALOS */}
      <AnimatePresence>
        {modalPeriodosAberto && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setModalPeriodosAberto(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-3xl bg-surface-container-lowest border border-white/10 rounded-[3rem] p-6 md:p-10 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <Settings size={22} className="text-[#a855f7]" />
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                      Configurar Horários Padrões & Intervalos
                    </h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                      Gerencie as grades de horários e períodos modelo por segmento
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalPeriodosAberto(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 flex items-center justify-center transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="flex bg-black p-1 rounded-xl border border-white/5 gap-1 shrink-0 mb-6 w-fit">
                <button onClick={() => setSegmentoPeriodo('monitoria')} 
                  className={cn("px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
                    segmentoPeriodo === 'monitoria' ? "bg-[#a855f7] text-white" : "text-white/40 hover:bg-white/5")}>
                  Monitoria
                </button>
                <button onClick={() => setSegmentoPeriodo('6e7')} 
                  className={cn("px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
                    segmentoPeriodo === '6e7' ? "bg-[#a855f7] text-white" : "text-white/40 hover:bg-white/5")}>
                  6º e 7º Ano
                </button>
                <button onClick={() => setSegmentoPeriodo('8e9')} 
                  className={cn("px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
                    segmentoPeriodo === '8e9' ? "bg-[#a855f7] text-white" : "text-white/40 hover:bg-white/5")}>
                  8º e 9º Ano
                </button>
                <button onClick={() => setSegmentoPeriodo('medio')} 
                  className={cn("px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
                    segmentoPeriodo === 'medio' ? "bg-[#a855f7] text-white" : "text-white/40 hover:bg-white/5")}>
                  Ensino Médio
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-6">
                {periodosEditaveis.length === 0 ? (
                  <div className="py-12 text-center text-white/30 italic text-sm border-2 border-dashed border-white/5 rounded-3xl">
                    Sem horários salvos para este segmento. Adicione novos horários abaixo.
                  </div>
                ) : (
                  periodosEditaveis.map((p, idx) => (
                    <div key={p.id || idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 group">
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-[10px] font-black text-white/30 shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">
                        <input type="time" value={p.horarioInicio} 
                          onChange={e => {
                            const novos = [...periodosEditaveis];
                            novos[idx].horarioInicio = e.target.value;
                            setPeriodosEditaveis(novos.sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio)));
                          }} 
                          className="bg-transparent text-xs font-black text-center text-white outline-none border-none w-14" />
                        <span className="text-white/20">—</span>
                        <input type="time" value={p.horarioFim} 
                          onChange={e => {
                            const novos = [...periodosEditaveis];
                            novos[idx].horarioFim = e.target.value;
                            setPeriodosEditaveis(novos);
                          }} 
                          className="bg-transparent text-xs font-black text-center text-white outline-none border-none w-14" />
                      </div>

                      <div className="flex-1 w-full">
                        <input type="text" value={p.nome} placeholder="NOME DO PERÍODO/AULA" 
                          onChange={e => {
                            const novos = [...periodosEditaveis];
                            novos[idx].nome = e.target.value;
                            setPeriodosEditaveis(novos);
                          }} 
                          className="w-full bg-transparent border-none text-[10px] font-black text-primary outline-none uppercase" />
                      </div>

                      <div className="shrink-0 w-full sm:w-36">
                        <select
                          value={p.tipo || 'aula'}
                          onChange={e => {
                            const novos = [...periodosEditaveis];
                            novos[idx].tipo = e.target.value as any;
                            setPeriodosEditaveis(novos);
                          }}
                          className="w-full bg-[#121212] border border-white/5 rounded-lg py-1.5 px-2 text-xs font-semibold text-white outline-none cursor-pointer"
                        >
                          <option value="aula">Aula / Turno</option>
                          <option value="intervalo">Intervalo / Recreio</option>
                          <option value="almoco">Almoço</option>
                          <option value="after">After School</option>
                        </select>
                      </div>

                      <button onClick={() => setPeriodosEditaveis(periodosEditaveis.filter((_, i) => i !== idx))} 
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all self-end sm:self-auto">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}

                <button 
                  onClick={() => setPeriodosEditaveis([...periodosEditaveis, {
                    id: `novo-per-${Date.now()}`,
                    horarioInicio: '08:00',
                    horarioFim: '08:45',
                    nome: 'NOVA AULA / TURNO',
                    segmento: segmentoPeriodo,
                    tipo: 'aula'
                  }])}
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Plus size={16} /> Adicionar Novo Período Modelo
                </button>
              </div>

              <div className="flex gap-2 border-t border-white/5 pt-6 shrink-0 justify-end">
                <button 
                  onClick={salvarModeloPeriodos} 
                  disabled={salvandoPeriodos}
                  className="btn-primary px-8 py-3 flex items-center gap-2 text-white"
                  style={{ backgroundColor: '#a855f7' }}
                >
                  {salvandoPeriodos ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  {salvandoPeriodos ? "Salvando..." : "Salvar Horários Padrões"}
                </button>
                <button onClick={() => setModalPeriodosAberto(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white transition-all">
                  Cancelar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
