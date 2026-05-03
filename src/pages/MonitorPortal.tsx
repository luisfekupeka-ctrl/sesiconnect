import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, ClipboardList, Info, ChevronRight, User, Search, ShieldCheck } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function MonitorPortal() {
  const { gradeMonitores, monitores } = useEscola();
  const [monitorNome, setMonitorNome] = useState('');
  const [busca, setBusca] = useState('');

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
    <div className="min-h-screen bg-surface-container-lowest p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Clock size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface">Portal do Monitor</h1>
          <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
            Consulte sua escala, postos e instruções de trabalho para hoje.
          </p>
        </header>

        {!monitorNome ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
              <input 
                type="text"
                placeholder="Qual seu nome?"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-surface-container-low border-none rounded-[2rem] text-lg font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline/40 shadow-sm"
              />
            </div>

            <div className="grid gap-3">
              {listaMonitores.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMonitorNome(m.nome)}
                  className="flex items-center gap-4 p-5 bg-surface-container-low rounded-[2rem] text-left hover:bg-primary/5 transition-all group border border-white/5 shadow-sm"
                >
                  <div className="w-12 h-12 bg-primary text-on-surface-bright rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                    {m.nome[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-on-surface group-hover:text-primary transition-colors">{m.nome}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest">{m.turno}</p>
                  </div>
                  <ChevronRight size={20} className="text-outline" />
                </button>
              ))}
              {listaMonitores.length === 0 && (
                <div className="text-center py-10 opacity-30 italic text-sm">
                  Nenhum monitor encontrado com esse nome.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8 pb-20">
            {/* Perfil Selecionado */}
            <div className="flex items-center gap-4 p-6 bg-primary text-on-surface-bright rounded-[2.5rem] shadow-xl shadow-primary/20">
               <button 
                onClick={() => setMonitorNome('')}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
               >
                 <User size={20} />
               </button>
               <div>
                  <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Roteiro de:</p>
                  <h2 className="text-xl font-black truncate">{monitorNome}</h2>
               </div>
            </div>

            {/* Linha do Tempo */}
            <div className="relative space-y-6">
              {roteiro.map((slot, idx) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-10"
                >
                  {/* Linha vertical */}
                  {idx !== roteiro.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-1 bg-outline-variant/20 rounded-full" />
                  )}

                  {/* Ponto na linha */}
                  <div 
                    className="absolute left-0 top-2 w-10 h-10 rounded-2xl border-4 border-surface-container-lowest shadow-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: slot.corEtiqueta }}
                  >
                    <MapPin size={16} />
                  </div>

                  <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-4 shadow-sm border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                        <Clock size={12} /> {slot.horarioInicio} — {slot.horarioFim}
                      </span>
                    </div>

                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-tighter mb-1 opacity-50">Local do Posto</p>
                      <h3 className="text-xl font-black text-on-surface leading-tight italic">{slot.posto}</h3>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                       <div className="px-4 py-2 bg-black/20 rounded-xl border border-white/5 inline-flex items-center gap-2">
                          <ClipboardList size={14} className="text-primary" />
                          <span className="text-xs font-black uppercase text-on-surface tracking-tighter">{slot.funcao || 'Monitoria Geral'}</span>
                       </div>
                    </div>

                    {slot.instrucoes && (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                         <Info size={16} className="text-primary shrink-0 mt-0.5" />
                         <div className="text-sm text-on-surface-variant italic font-medium leading-relaxed">
                            "{slot.instrucoes}"
                         </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {roteiro.length === 0 && (
                <div className="text-center py-20 opacity-30">
                  <ClipboardList size={48} className="mx-auto mb-4" />
                  <p className="font-black uppercase text-xs tracking-widest">Nenhuma atividade agendada</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setMonitorNome('')}
              className="w-full py-5 text-on-surface-variant font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Search size={14} /> Trocar Monitor
            </button>

            <div className="text-center pt-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 flex items-center justify-center gap-2">
                <ShieldCheck size={12} /> SESI CONNECT SECURITY
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
