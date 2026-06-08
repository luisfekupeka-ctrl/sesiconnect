import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Search, Clock, MapPin, ChevronLeft, ChevronRight, Users, Calendar, Shield, AlertTriangle, FileText, Printer } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { generateEscalaGeralPDF, generateEscalasIndividuaisPDF } from '../lib/reportGenerator';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const HORAS_ESCALA = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const ESCALA_INICIO = 7 * 60;
const ESCALA_FIM = 18 * 60;
const ESCALA_TOTAL = ESCALA_FIM - ESCALA_INICIO;

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

// Paleta de cores vibrantes para cada monitor
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

function obterMacroSetor(posto: string): string {
  const p = (posto || '').trim().toLowerCase();
  
  if (p === 'almoço' || p === 'almoco' || p === 'almoçando') return '🍽️ Almoço';
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

  // Raw spreadsheet/text matching rules
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
  const { monitores, horaAtual, gradeMonitores } = useEscola();
  const [busca, setBusca] = useState('');
  const [monitorSelecionadoId, setMonitorSelecionadoId] = useState<string | null>(null);
  const [diaFiltro, setDiaFiltro] = useState(() => {
    const dias = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    return dias[horaAtual.getDay()] || 'SEGUNDA';
  });

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

  const [viewMode, setViewMode] = useState<'monitor' | 'setor'>('monitor');

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


  // ========== SUB-PÁGINA: Grade individual do monitor ==========
  if (monitorAtivo) {
    const cor = mapaCorMonitor[monitorAtivo.nome] || '#3B82F6';

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
          {/* Cabeçalho */}
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
            {/* Seletor de dia */}
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

            {/* Grade vertical de postos */}
            <div className="flex flex-col gap-3">
              {gradeDoMonitor.length === 0 ? (
                <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">Sem postos neste dia.</div>
              ) : gradeDoMonitor.map((slot, i) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border-2 border-white/5 bg-[#0d0d0d] shadow-premium flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden"
                  style={{ borderLeftWidth: '6px', borderLeftColor: slot.corEtiqueta || cor }}
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

            {/* Resumo */}
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

  // ========== PÁGINA PRINCIPAL ==========
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">
            <span className="text-[#42a0f5]">Monitores</span>
          </h1>
          <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">
            Grade de postos, funções e escala geral do dia.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[#0a0a0a] border-2 border-white/5 rounded-2xl text-white font-black text-xs focus:ring-4 focus:ring-[#42a0f5]/5 outline-none" />
          </div>
        </div>
      </header>

      {/* Seletor de Modo de Visualização e Botões de PDF */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-[#0a0a0a] p-1 rounded-2xl border border-white/5 gap-1 w-fit">
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
            Por Monitor
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
            Por Setor / Local
          </button>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
        )}
      </div>

      {viewMode === 'monitor' ? (
        <>
          {/* ====== SEÇÃO 1: LISTA DE MONITORES ====== */}
          <section className="space-y-4">
            <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
              <Users size={18} className="text-[#42a0f5]" /> Equipe
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

          {/* ====== SEÇÃO 2: ESCALA GERAL DO DIA ====== */}
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
                  const monitoresNaEscala = Array.from(new Set(escalaDoDia.map(g => g.monitorNome)))
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
                        {/* Monitor Profile Panel */}
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

                        {/* Scrolling shifts list */}
                        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 pt-1 snap-x scroll-smooth custom-scrollbar">
                          {postos.map(slot => {
                            const minInicio = horaParaMinutos(slot.horarioInicio);
                            const minFim = horaParaMinutos(slot.horarioFim);
                            const minutosAgora = new Date().getHours() * 60 + new Date().getMinutes();
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
                                  {/* Horário */}
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

                                  {/* Posto / Local */}
                                  <h5 className="text-xs font-black text-white italic tracking-tight truncate leading-none mt-0.5">
                                    📍 {slot.posto}
                                  </h5>

                                  {/* Função */}
                                  {slot.funcao && slot.funcao !== 'Monitoria Geral' && (
                                    <p className="text-[9px] text-white/50 font-semibold italic truncate mt-0.5">
                                      ⚙️ {slot.funcao}
                                    </p>
                                  )}

                                  {/* Instruções se houver */}
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
      ) : (
        /* ==================== VISÃO POR SETOR ==================== */
        <div className="space-y-4">
          {(() => {
            if (escalaDoDia.length === 0) {
              return (
                <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">
                  Nenhum posto agendado.
                </div>
              );
            }

            return MACRO_SETORES.map(macro => {
              const postos = escalaDoDia
                .filter(g => obterMacroSetor(g.posto) === macro)
                .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

              const postosFiltrados = postos.filter(slot => {
                if (!busca) return true;
                const b = busca.toLowerCase();
                return slot.monitorNome.toLowerCase().includes(b) ||
                       slot.posto.toLowerCase().includes(b) ||
                       (slot.funcao || '').toLowerCase().includes(b);
              });

              if (busca && postosFiltrados.length === 0) return null;

              return (
                <div key={macro} className="bg-[#0a0a0a]/50 rounded-[1.5rem] border border-white/5 p-5 flex flex-col md:flex-row md:items-center gap-6 hover:border-white/10 transition-all">
                  {/* Setor Profile Panel */}
                  <div className="md:w-56 shrink-0 flex items-center gap-4 bg-black/30 p-3 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 bg-white/5 text-[#fbbf24]">
                      {macro.split(' ')[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-white truncate leading-tight tracking-tight italic">{macro.split(' ').slice(1).join(' ')}</h4>
                      <p className="text-[9px] font-black uppercase mt-1 tracking-widest text-white/40">
                        {postosFiltrados.length} {postosFiltrados.length === 1 ? 'Plantão' : 'Plantões'}
                      </p>
                    </div>
                  </div>

                  {/* Scrolling shifts list */}
                  <div className="flex-1 flex gap-4 overflow-x-auto pb-2 pt-1 snap-x scroll-smooth custom-scrollbar">
                    {postosFiltrados.length === 0 ? (
                      <div className="flex-shrink-0 w-64 bg-black/10 rounded-2xl p-4 border border-dashed border-white/5 flex flex-col justify-center items-center min-h-[110px]">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sem Monitor</span>
                      </div>
                    ) : (
                      (() => {
                        const slotsByTime: { [key: string]: typeof postosFiltrados } = {};
                        postosFiltrados.forEach(slot => {
                          const key = `${slot.horarioInicio} - ${slot.horarioFim}`;
                          if (!slotsByTime[key]) slotsByTime[key] = [];
                          slotsByTime[key].push(slot);
                        });
                        const sortedKeys = Object.keys(slotsByTime).sort((a, b) => {
                          const startA = a.split(' - ')[0];
                          const startB = b.split(' - ')[0];
                          return startA.localeCompare(startB);
                        });
                        return sortedKeys.map(timeKey => {
                          const slots = slotsByTime[timeKey];
                          return (
                            <div key={timeKey} className="flex-shrink-0 w-64 flex flex-col gap-3 snap-start">
                              {slots.map(slot => {
                                const minInicio = horaParaMinutos(slot.horarioInicio);
                                const minFim = horaParaMinutos(slot.horarioFim);
                                const minutosAgora = new Date().getHours() * 60 + new Date().getMinutes();
                                const estaAtivo = minutosAgora >= minInicio && minutosAgora < minFim;
                                const cor = mapaCorMonitor[slot.monitorNome] || '#3B82F6';

                                return (
                                  <div
                                    key={slot.id}
                                    className={cn(
                                      "w-full bg-[#0d0d0d] rounded-2xl p-4 border transition-all flex flex-col justify-between min-h-[110px] hover:bg-[#121212]",
                                      estaAtivo ? "border-[#fbbf24]/50 shadow-[0_0_12px_rgba(251,191,36,0.15)] bg-[#141414]" : "border-white/5"
                                    )}
                                    style={{ borderLeft: `5px solid ${cor}` }}
                                  >
                                    <div className="flex flex-col gap-2">
                                      {/* Horário */}
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

                                      {/* Monitor */}
                                      <h5 className="text-xs font-black text-white italic tracking-tight truncate leading-none mt-0.5">
                                        👤 {slot.monitorNome}
                                      </h5>

                                      {/* Posto específico se diferente do macro */}
                                      {slot.posto && slot.posto !== macro && (
                                        <p className="text-[9px] text-[#fbbf24] font-bold uppercase tracking-wider mt-0.5">
                                          📍 {slot.posto}
                                        </p>
                                      )}

                                      {/* Função */}
                                      {slot.funcao && slot.funcao !== 'Monitoria Geral' && (
                                        <p className="text-[9px] text-white/50 font-semibold italic truncate mt-0.5">
                                          ⚙️ {slot.funcao}
                                        </p>
                                      )}

                                      {/* Instruções se houver */}
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
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Legenda de cores */}
      <section className="flex flex-wrap gap-2">
        {Object.entries(mapaCorMonitor).map(([nome, cor]) => (
          <div key={nome} className="flex items-center gap-2 px-3 py-1.5 bg-[#0d0d0d] rounded-lg border border-white/5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
            <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{nome.split(' ')[0]}</span>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
