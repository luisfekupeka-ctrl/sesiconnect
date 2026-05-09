import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, ClipboardList, Info, ChevronRight, User, Search, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

// Helper para comparar horários "HH:mm"
const compararHorarios = (h1: string, h2: string) => {
  return h1.localeCompare(h2);
};

export default function MonitorPortal() {
  const { gradeMonitores, monitores } = useEscola();
  const [monitorNome, setMonitorNome] = useState('');
  const [busca, setBusca] = useState('');
  const [agora, setAgora] = useState(new Date());

  // Atualiza o relógio interno a cada minuto
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const horaAtualStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const saudacao = useMemo(() => {
    const h = agora.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, [agora]);

  const roteiro = useMemo(() => {
    if (!monitorNome) return [];
    return gradeMonitores
      .filter(g => g.monitorNome === monitorNome)
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
  }, [gradeMonitores, monitorNome]);

  const listaMonitores = useMemo(() => {
    return monitores.filter(m => 
      m.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [monitores, busca]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-10">
        
        {/* Header Principal */}
        <header className="text-center space-y-4 pt-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-secondary text-on-secondary rounded-[2rem] flex items-center justify-center mx-auto shadow-glow-yellow relative"
          >
            <Clock size={36} />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-on-secondary/20 rounded-[2rem]"
            />
          </motion.div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white italic">SESI <span className="text-secondary">Connect</span></h1>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.4em] mt-1">Portal do Monitor</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!monitorNome ? (
            <motion.div 
              key="selecao"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white">{saudacao}, Monitor!</h2>
                <p className="text-on-surface-variant text-sm font-medium">Selecione seu perfil para acessar sua escala.</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-secondary transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Qual seu nome?"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-2 border-white/5 rounded-[2rem] text-lg font-bold text-white focus:border-secondary/30 focus:ring-4 focus:ring-secondary/5 transition-all placeholder:text-white/10 shadow-premium outline-none"
                />
              </div>

              <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {listaMonitores.map((m, idx) => (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setMonitorNome(m.nome)}
                    className="flex items-center gap-4 p-5 bg-surface-container-low/50 backdrop-blur-sm rounded-[2rem] text-left hover:bg-secondary/10 transition-all group border border-white/5 shadow-sm"
                  >
                    <div className="w-14 h-14 bg-surface-container-high text-secondary rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-white/5 group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                      {m.nome[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-lg truncate group-hover:text-secondary transition-colors">{m.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{m.turno}</span>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Posto Fixo: {m.localPermanencia || "—"}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-on-surface-variant/30 group-hover:text-secondary transition-all" />
                  </motion.button>
                ))}
                {listaMonitores.length === 0 && (
                  <div className="text-center py-10 opacity-30 italic text-sm text-on-surface-variant">
                    Nenhum monitor encontrado.
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="escala"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pb-24"
            >
              {/* Card de Perfil Premium */}
              <div className="relative p-8 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-surface-container-low opacity-90" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/20 blur-[60px] rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
                
                <div className="relative flex items-center gap-5">
                   <button 
                    onClick={() => setMonitorNome('')}
                    className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 shadow-lg active:scale-95"
                   >
                     <User size={24} className="text-white" />
                   </button>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-secondary tracking-[0.2em] mb-1">Escala do Monitor</p>
                      <h2 className="text-2xl font-black text-white truncate">{monitorNome}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Online agora · {horaAtualStr}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Linha do Tempo / Escala */}
              <div className="relative space-y-8">
                {roteiro.map((slot, idx) => {
                  // Lógica de "Agora"
                  const estaAcontecendo = compararHorarios(horaAtualStr, slot.horarioInicio) >= 0 && 
                                          compararHorarios(horaAtualStr, slot.horarioFim) < 0;
                  
                  const jaPassou = compararHorarios(horaAtualStr, slot.horarioFim) >= 0;

                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "relative pl-12 transition-all duration-500",
                        jaPassou ? "opacity-30 grayscale" : "opacity-100"
                      )}
                    >
                      {/* Conector da Linha */}
                      {idx !== roteiro.length - 1 && (
                        <div className="absolute left-[23px] top-12 bottom-[-40px] w-0.5 bg-gradient-to-b from-white/10 to-white/5" />
                      )}

                      {/* Ícone de Posto */}
                      <div 
                        className={cn(
                          "absolute left-0 top-3 w-12 h-12 rounded-2xl border-4 border-background shadow-xl flex items-center justify-center text-white transition-all z-10",
                          estaAcontecendo ? "scale-125 shadow-secondary/20 z-20" : "scale-100"
                        )}
                        style={{ backgroundColor: slot.corEtiqueta || '#3b82f6' }}
                      >
                        {estaAcontecendo ? <Sparkles size={20} className="animate-pulse" /> : <MapPin size={18} />}
                      </div>

                      <div className={cn(
                        "rounded-[2.5rem] p-7 space-y-5 shadow-premium border transition-all duration-500 relative overflow-hidden",
                        estaAcontecendo 
                          ? "bg-surface-container-low border-secondary/40 ring-2 ring-secondary/20" 
                          : "bg-surface-container-low/40 border-white/5"
                      )}>
                        {estaAcontecendo && (
                          <div className="absolute top-0 right-0 p-4">
                            <span className="flex items-center gap-2 px-3 py-1 bg-secondary text-on-secondary rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                              <Timer size={10} className="animate-spin-slow" /> Em Andamento
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className={cn(
                            "text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-2",
                            estaAcontecendo ? "text-secondary" : "text-white/40"
                          )}>
                            <Clock size={14} /> {slot.horarioInicio} — {slot.horarioFim}
                          </span>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-40">Local do Posto</p>
                          <h3 className={cn(
                            "text-2xl font-black leading-tight italic",
                            estaAcontecendo ? "text-white" : "text-white/80"
                          )}>{slot.posto}</h3>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                           <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 inline-flex items-center gap-2">
                              <ClipboardList size={14} className={estaAcontecendo ? "text-secondary" : "text-primary"} />
                              <span className="text-[11px] font-black uppercase text-white/70 tracking-widest">{slot.funcao || 'Monitoria Geral'}</span>
                           </div>
                        </div>

                        {slot.instrucoes && (
                          <div className={cn(
                            "p-5 rounded-3xl border flex gap-4 transition-all",
                            estaAcontecendo ? "bg-secondary/5 border-secondary/20" : "bg-white/5 border-white/5"
                          )}>
                             <Info size={20} className={estaAcontecendo ? "text-secondary" : "text-white/30"} />
                             <div className="text-sm text-on-surface-variant italic font-medium leading-relaxed">
                                {slot.instrucoes}
                             </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {roteiro.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-center py-24 bg-surface-container-low/30 rounded-[3rem] border border-dashed border-white/10"
                  >
                    <ClipboardList size={64} className="mx-auto mb-6 text-white/5" />
                    <p className="font-black uppercase text-xs tracking-[0.3em] text-on-surface-variant/40">Nenhuma atividade agendada para hoje</p>
                  </motion.div>
                )}
              </div>
              
              <button 
                onClick={() => setMonitorNome('')}
                className="w-full py-8 text-on-surface-variant hover:text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-colors"
              >
                <Search size={16} /> Trocar Perfil de Monitor
              </button>

              <div className="text-center pb-10">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/5">
                  <ShieldCheck size={14} className="text-secondary" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                    SESI CONNECT SECURITY
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
