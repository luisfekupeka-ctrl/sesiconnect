import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Search, Clock, MapPin, ChevronLeft, ChevronRight, Users, Calendar, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const HORAS_ESCALA = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const ESCALA_INICIO = 7 * 60;
const ESCALA_FIM = 18 * 60;
const ESCALA_TOTAL = ESCALA_FIM - ESCALA_INICIO;

const MACRO_SETORES = [
  '🏫 Térreo',
  '🏢 1º Andar',
  '🏢 2º Andar',
  '🏢 3º Andar',
  '📚 Biblioteca',
  '🏥 Enfermaria',
  '🚗 Estacionamento',
  '🌳 Gramado & Pátios',
  '🛡️ Apoio / Volante',
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
  const p = (posto || '').toLowerCase();
  if (p.includes('almoça') || p.includes('almoço')) return '🍽️ Almoço';
  if (p.includes('estacionamento') || p.includes('apoio s1') || p.includes('saída s1')) return '🚗 Estacionamento';
  if (p.includes('1º andar') || p.includes('1 andar')) return '🏢 1º Andar';
  if (p.includes('2º andar') || p.includes('2 andar')) return '🏢 2º Andar';
  if (p.includes('3º andar') || p.includes('3 andar')) return '🏢 3º Andar';
  if (p.includes('biblioteca')) return '📚 Biblioteca';
  if (p.includes('enfermaria')) return '🏥 Enfermaria';
  if (p.includes('gramado') || p.includes('botânico') || p.includes('patio') || p.includes('pátio')) return '🌳 Gramado & Pátios';
  if (p.includes('térreo') || p.includes('terreo')) return '🏫 Térreo';
  return '🛡️ Apoio / Volante';
}

export default function Monitores() {
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
  const [subViewMode, setSubViewMode] = useState<'quadro' | 'timeline'>('quadro');
  const [blocoSelecionado, setBlocoSelecionado] = useState<string>('');

  // Lista de blocos de horário do dia
  const blocosHorarios = useMemo(() => {
    const blocos = new Set<string>();
    (gradeMonitores || []).forEach(g => {
      if (g.diaSemana === diaFiltro) {
        blocos.add(`${g.horarioInicio} - ${g.horarioFim}`);
      }
    });
    return Array.from(blocos).sort((a, b) => a.localeCompare(b));
  }, [gradeMonitores, diaFiltro]);

  // Bloco selecionado atual (se não definido, pega o bloco atual do horário do colégio ou o primeiro)
  const blocoAtivo = useMemo(() => {
    if (blocoSelecionado && blocosHorarios.includes(blocoSelecionado)) {
      return blocoSelecionado;
    }
    
    // Tenta encontrar o bloco atual com base em horaAtual
    const minutosAgora = horaAtual.getHours() * 60 + horaAtual.getMinutes();
    const blocoAtual = blocosHorarios.find(bloco => {
      const [inicio, fim] = bloco.split(' - ');
      const minInicio = horaParaMinutos(inicio);
      const minFim = horaParaMinutos(fim);
      return minutosAgora >= minInicio && minutosAgora < minFim;
    });

    return blocoAtual || blocosHorarios[0] || '';
  }, [blocoSelecionado, blocosHorarios, horaAtual]);

  // ========== SUB-PÁGINA: Grade individual do monitor ==========
  if (monitorAtivo) {
    const cor = mapaCorMonitor[monitorAtivo.nome] || '#3B82F6';

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
          {/* Cabeçalho */}
          <div className="p-6 md:p-8 text-white relative" style={{ backgroundColor: cor }}>
            <button onClick={() => setMonitorSelecionadoId(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
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

      {/* Seletor de Modo de Visualização */}
      <div className="flex bg-[#0a0a0a] p-1 rounded-2xl border border-white/5 self-start gap-1 w-fit">
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
        <div className="space-y-6">
          {/* Controles da Visão por Setor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a]/50 p-4 rounded-[1.5rem] border border-white/5">
            <div className="flex gap-1 p-1 bg-black rounded-xl border border-white/5 self-start">
              <button
                onClick={() => setSubViewMode('quadro')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  subViewMode === 'quadro' ? "bg-[#fbbf24] text-black shadow-md" : "text-white/40 hover:bg-white/5"
                )}
              >
                📋 Quadro de Postos
              </button>
              <button
                onClick={() => setSubViewMode('timeline')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  subViewMode === 'timeline' ? "bg-[#fbbf24] text-black shadow-md" : "text-white/40 hover:bg-white/5"
                )}
              >
                📅 Linha do Tempo
              </button>
            </div>

            {subViewMode === 'quadro' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Horário:</span>
                <select
                  value={blocoAtivo}
                  onChange={(e) => setBlocoSelecionado(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none ring-2 ring-[#fbbf24]/10 focus:ring-[#fbbf24]/30 text-[#fbbf24] cursor-pointer"
                >
                  {blocosHorarios.length === 0 ? (
                    <option value="">Sem horários hoje</option>
                  ) : (
                    blocosHorarios.map(bloco => (
                      <option key={bloco} value={bloco}>
                        {bloco}
                      </option>
                    ))
                  )}
                </select>
                
                <button
                  onClick={() => setBlocoSelecionado('')}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  🕒 Agora
                </button>
              </div>
            )}
          </div>

          {subViewMode === 'quadro' ? (
            /* ================ RENDER DO QUADRO DE POSTOS (ORGANOGRAMA POR HORÁRIO) ================ */
            <div className="space-y-12">
              {blocosHorarios.length === 0 ? (
                <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">
                  Nenhum horário de monitoria agendado para hoje.
                </div>
              ) : (
                blocosHorarios.map(bloco => {
                  const [inicioSel, fimSel] = bloco.split(' - ');
                  
                  // Filtra todas as alocações deste bloco de horário no dia
                  const alocacoesNoBloco = (gradeMonitores || []).filter(g => {
                    return g.diaSemana === diaFiltro && 
                           g.horarioInicio.slice(0, 5) === inicioSel && 
                           g.horarioFim.slice(0, 5) === fimSel;
                  });

                  // Verifica se há alguma alocação correspondente à busca
                  const contemBusca = alocacoesNoBloco.some(a => {
                    const b = busca.toLowerCase();
                    return a.monitorNome.toLowerCase().includes(b) || 
                           a.posto.toLowerCase().includes(b) || 
                           (a.funcao || '').toLowerCase().includes(b);
                  });

                  // Se houver busca e não corresponder a nenhuma alocação deste bloco, oculta o bloco
                  if (busca && !contemBusca) return null;

                  return (
                    <motion.div 
                      key={bloco} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Título do Bloco de Horário */}
                      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <Clock size={16} className="text-[#fbbf24] shrink-0" />
                        <h3 className="text-lg font-black tracking-tight text-white/90 italic font-headline">
                          {bloco}
                        </h3>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-white/5 border border-white/5 rounded-xl text-white/40">
                          {alocacoesNoBloco.length} {alocacoesNoBloco.length === 1 ? 'Alocação' : 'Alocações'}
                        </span>
                      </div>

                      {/* Carrossel Horizontal de Cards de Locais */}
                      <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth custom-scrollbar">
                        {MACRO_SETORES.map(macro => {
                          const alocacoesNoSetor = alocacoesNoBloco.filter(g => obterMacroSetor(g.posto) === macro);
                          
                          // Aplica busca individual se houver
                          const alocacoesFiltradas = alocacoesNoSetor.filter(a => {
                            const b = busca.toLowerCase();
                            return a.monitorNome.toLowerCase().includes(b) || 
                                   a.posto.toLowerCase().includes(b) || 
                                   (a.funcao || '').toLowerCase().includes(b);
                          });

                          // Oculta cards vazios apenas se houver uma busca ativa
                          if (busca && alocacoesFiltradas.length === 0) return null;

                          const totalMonitores = alocacoesNoSetor.length;

                          return (
                            <motion.div
                              key={macro}
                              layout
                              className={cn(
                                "flex-shrink-0 w-80 bg-[#0d0d0d]/80 backdrop-blur-md rounded-3xl p-5 border-2 transition-all flex flex-col justify-between min-h-[220px] snap-start hover:border-white/10",
                                totalMonitores > 0 ? "border-white/5" : "border-red-500/10 bg-red-950/5"
                              )}
                              style={{ borderTop: `4px solid ${totalMonitores > 0 ? '#fbbf24' : '#ef4444'}` }}
                            >
                              <div className="flex flex-col h-full justify-between">
                                <div>
                                  {/* Header do Card */}
                                  <div className="flex items-center justify-between mb-4 gap-2">
                                    <h4 className="text-sm font-black text-white italic tracking-tight truncate">{macro}</h4>
                                    {totalMonitores > 0 ? (
                                      <span className="px-2 py-0.5 bg-[#fbbf24]/10 text-[#fbbf24] rounded-md text-[8px] font-black uppercase tracking-wider shrink-0">
                                        {totalMonitores} monitor{totalMonitores > 1 ? 'es' : ''}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0">
                                        Vazio
                                      </span>
                                    )}
                                  </div>

                                  {/* Lista de Monitores Alocados */}
                                  {totalMonitores > 0 ? (
                                    <div className="space-y-3">
                                      {alocacoesNoSetor.map(aloc => {
                                        const cor = mapaCorMonitor[aloc.monitorNome] || '#3B82F6';
                                        return (
                                          <div key={aloc.id} className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-start gap-3">
                                            <div
                                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 shadow-inner"
                                              style={{ backgroundColor: `${cor}20`, color: cor }}
                                            >
                                              {aloc.monitorNome.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-black text-white truncate leading-tight">{aloc.monitorNome}</p>
                                              <p className="text-[8px] font-black uppercase tracking-wider mt-0.5" style={{ color: cor }}>
                                                {aloc.posto}
                                              </p>
                                              {aloc.funcao && aloc.funcao !== 'Monitoria Geral' && (
                                                <p className="text-[9px] text-white/40 italic mt-1 font-medium leading-none">{aloc.funcao}</p>
                                              )}
                                              {aloc.instrucoes && (
                                                <p className="text-[8px] text-white/30 italic mt-1.5 bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.03] leading-relaxed">
                                                  {aloc.instrucoes}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    /* Sem Cobertura */
                                    macro !== '🍽️ Almoço' ? (
                                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-red-500/50">
                                        <AlertTriangle size={20} className="mb-1 text-red-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Sem Cobertura</p>
                                        <p className="text-[8px] text-white/30 italic mt-1">Nenhum monitor designado para este setor.</p>
                                      </div>
                                    ) : (
                                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-white/20">
                                        <Clock size={20} className="mb-1 text-white/20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Sem Almoço</p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            /* ================ RENDER DA LINHA DO TEMPO POR SETOR ================ */
            <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium relative">
              {/* Scroll Wrapper */}
              <div className="overflow-x-auto scrollbar-premium">
                <div className="min-w-[1600px] relative">
                  
                  {/* Linhas de Grade Verticais */}
                  <div className="absolute inset-0 pointer-events-none flex z-0">
                    <div className="w-48 shrink-0 border-r border-white/10" />
                    <div className="flex-1 flex h-full">
                      {HORAS_ESCALA.map(hora => (
                        <div key={hora} className="flex-1 border-l border-white/10 h-full border-dashed" />
                      ))}
                    </div>
                  </div>

                  {/* Cabeçalho de Horários */}
                  <div className="flex border-b border-white/10 bg-white/[0.02] relative z-10">
                    <div className="w-48 shrink-0 p-4 border-r border-white/10">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Setor / Posto</p>
                    </div>
                    <div className="flex-1 relative">
                      <div className="flex">
                        {HORAS_ESCALA.map(hora => (
                          <div key={hora} className="flex-1 text-center py-4 text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest border-l border-white/10">
                            {hora}
                          </div>
                        ))}
                      </div>
                      {/* Linha do horário atual */}
                      {minutosAgora >= ESCALA_INICIO && minutosAgora <= ESCALA_FIM && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                          style={{ left: `${((minutosAgora - ESCALA_INICIO) / ESCALA_TOTAL) * 100}%` }}>
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agrupamento por Macro Setor */}
                  {MACRO_SETORES.map(macro => {
                    // Pegar todos os postos específicos ativos neste macro setor no dia
                    const postosNoMacro = Array.from(new Set(
                      (gradeMonitores || [])
                        .filter(g => g.diaSemana === diaFiltro && obterMacroSetor(g.posto) === macro)
                        .map(g => g.posto.trim())
                    )).sort();

                    if (postosNoMacro.length === 0) return null;

                    return (
                      <div key={macro} className="border-b border-white/5">
                        {/* Cabeçalho do Grupo */}
                        <div className="bg-white/[0.02] px-4 py-2 flex items-center justify-between border-b border-white/[0.03]">
                          <span className="text-[10px] font-black text-[#fbbf24] italic tracking-tight">{macro}</span>
                        </div>

                        {/* Linhas de postos específicos */}
                        {postosNoMacro.map(posto => {
                          const alocacoesNoPosto = (gradeMonitores || []).filter(g => g.diaSemana === diaFiltro && g.posto.trim() === posto);

                          // Algoritmo de Distribuição em Raias (Lanes) para evitar sobreposição
                          const sortedAlocs = [...alocacoesNoPosto].sort((a, b) => {
                            return horaParaMinutos(a.horarioInicio) - horaParaMinutos(b.horarioInicio);
                          });

                          const lanes: any[][] = [];
                          const alocWithLane = sortedAlocs.map(aloc => {
                            const start = horaParaMinutos(aloc.horarioInicio);
                            const end = horaParaMinutos(aloc.horarioFim);
                            
                            let laneIndex = 0;
                            let placed = false;
                            
                            for (let i = 0; i < lanes.length; i++) {
                              const lane = lanes[i];
                              const hasOverlap = lane.some(item => {
                                const itemStart = horaParaMinutos(item.horarioInicio);
                                const itemEnd = horaParaMinutos(item.horarioFim);
                                return (start < itemEnd && end > itemStart);
                              });
                              
                              if (!hasOverlap) {
                                lane.push(aloc);
                                laneIndex = i;
                                placed = true;
                                break;
                              }
                            }
                            
                            if (!placed) {
                              lanes.push([aloc]);
                              laneIndex = lanes.length - 1;
                            }
                            
                            return { ...aloc, laneIndex };
                          });

                          const laneCount = lanes.length || 1;
                          const rowHeight = laneCount * 76 + 12; // 76px por raia + padding

                          return (
                            <div key={posto} className="flex border-b border-white/[0.02] hover:bg-white/[0.01] transition-all relative z-10">
                              {/* Nome do Posto */}
                              <div className="w-48 shrink-0 p-3 border-r border-white/10 flex items-center min-w-0 bg-[#0a0a0a]/40">
                                <p className="text-[10px] font-black text-white truncate" title={posto}>
                                  {posto}
                                </p>
                              </div>

                              {/* Barras de tempo dos Monitores */}
                              <div className="flex-1 relative py-2" style={{ height: `${rowHeight}px` }}>
                                {alocWithLane.map(slot => {
                                  const minInicio = horaParaMinutos(slot.horarioInicio);
                                  const minFim = horaParaMinutos(slot.horarioFim);
                                  const leftPct = Math.max(0, ((minInicio - ESCALA_INICIO) / ESCALA_TOTAL) * 100);
                                  const widthPct = Math.min(100 - leftPct, ((minFim - minInicio) / ESCALA_TOTAL) * 100);
                                  const estaAtivo = minutosAgora >= minInicio && minutosAgora < minFim;
                                  const cor = mapaCorMonitor[slot.monitorNome] || '#3B82F6';
                                  const topPos = slot.laneIndex * 76 + 8; // 76px de altura por item + margem

                                  return (
                                    <div
                                      key={slot.id}
                                      className={cn(
                                        "absolute h-16 rounded-sm flex flex-col justify-center px-3 gap-0.5 overflow-hidden transition-all border border-white/[0.06] hover:bg-[#1e1e1e]",
                                        estaAtivo ? "shadow-lg scale-102 z-10" : ""
                                      )}
                                      style={{
                                        left: `calc(${leftPct}% + 2px)`,
                                        width: `calc(${widthPct}% - 4px)`,
                                        backgroundColor: estaAtivo ? '#1e1e1e' : '#141414',
                                        borderLeft: `4px solid ${cor}`,
                                        color: '#fff',
                                        top: `${topPos}px`,
                                        boxShadow: estaAtivo ? `0 0 12px ${cor}40` : 'none',
                                      }}
                                      title={`${slot.horarioInicio}–${slot.horarioFim} | ${slot.monitorNome} | ${slot.funcao}`}
                                    >
                                      <span className="text-xs font-bold text-white tracking-tight truncate leading-none">
                                        {slot.monitorNome}
                                      </span>
                                      <span className="text-[9px] font-bold text-white/40 leading-none">
                                        {slot.horarioInicio} - {slot.horarioFim}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
