import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Clock, MapPin, ChevronRight, Search, 
  ArrowLeft, Bell, Calendar, Coffee, ShieldCheck 
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';
import { obterDiaSemana, estaNoHorario } from '../services/motorEscolar';

export default function MonitorPortal() {
  const { gradeMonitores, monitores, horaAtual } = useEscola();
  const [monitorSelecionado, setMonitorSelecionado] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [diaFiltro] = useState(obterDiaSemana(horaAtual));

  const listaMonitores = monitores.map(m => m.nome).sort();
  const filteredMonitores = listaMonitores.filter(m => 
    m.toLowerCase().includes(busca.toLowerCase())
  );

  const minhaGrade = gradeMonitores.filter(g => 
    g.monitorNome === monitorSelecionado && g.diaSemana === diaFiltro
  ).sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

  const postoAtual = minhaGrade.find(g => 
    estaNoHorario(horaAtual, g.horarioInicio, g.horarioFim)
  );

  const proximoPosto = minhaGrade.find(g => {
    const [h, m] = g.horarioInicio.split(':').map(Number);
    const agoraH = horaAtual.getHours();
    const agoraM = horaAtual.getMinutes();
    return (h > agoraH) || (h === agoraH && m > agoraM);
  });

  if (!monitorSelecionado) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
            <User size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">Portal do Monitor</h1>
          <p className="text-on-surface-variant text-sm mb-8">Selecione seu nome para consultar sua escala de hoje.</p>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
            <input 
              type="text" 
              placeholder="Buscar seu nome..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredMonitores.map(nome => (
              <button 
                key={nome}
                onClick={() => setMonitorSelecionado(nome)}
                className="w-full p-4 bg-surface-container-low hover:bg-primary/10 hover:text-primary rounded-xl text-left font-black text-sm transition-all flex items-center justify-between group"
              >
                {nome}
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Header do Monitor */}
      <header className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-[2.5rem] editorial-shadow border border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={() => setMonitorSelecionado(null)} className="p-2 bg-surface-container-low rounded-xl hover:bg-hover">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Monitor(a)</p>
            <h2 className="text-lg font-black">{monitorSelecionado}</h2>
          </div>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Bell size={20} />
        </div>
      </header>

      {/* Card AGORA */}
      <motion.div 
        layoutId="status-card"
        className="bg-primary text-on-primary p-8 rounded-[3rem] shadow-2xl shadow-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 rounded-full" />
        
        <div className="flex items-center gap-2 mb-6 bg-on-primary/10 w-fit px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-on-primary rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Atividade Atual</span>
        </div>

        {postoAtual ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin size={32} />
              <h3 className="text-3xl font-black tracking-tighter leading-none">{postoAtual.posto}</h3>
            </div>
            <div className="flex items-center gap-2 opacity-80">
              <Clock size={16} />
              <span className="text-sm font-bold">{postoAtual.horarioInicio} até {postoAtual.horarioFim}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tighter">Fora de Horário</h3>
            <p className="text-sm opacity-80 font-bold">Você não tem postos registrados para este horário.</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-on-primary/10 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Próxima Troca</p>
            <p className="text-lg font-black">{postoAtual?.horarioFim || '--:--'}</p>
          </div>
          {proximoPosto && (
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Seguir Para</p>
              <p className="text-sm font-bold">{proximoPosto.posto}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Timeline do Dia */}
      <div className="bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Agenda de Hoje
          </h3>
          <span className="text-[10px] font-black bg-surface-container-low px-3 py-1 rounded-full uppercase tracking-widest">{diaFiltro}</span>
        </div>

        {minhaGrade.length === 0 ? (
          <div className="py-12 text-center space-y-4 opacity-40">
            <Coffee size={40} className="mx-auto" />
            <p className="text-sm font-black uppercase tracking-widest">Nenhuma escala para hoje</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
            {minhaGrade.map((g, idx) => {
              const ativo = estaNoHorario(horaAtual, g.horarioInicio, g.horarioFim);
              const agoraStr = `${horaAtual.getHours().toString().padStart(2, '0')}:${horaAtual.getMinutes().toString().padStart(2, '0')}`;
              const passado = !ativo && g.horarioFim < agoraStr;

              return (
                <div key={idx} className={cn(
                  "relative pl-10 transition-all",
                  passado ? "opacity-30" : "opacity-100"
                )}>
                  {/* Dot */}
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 transition-all z-10 flex items-center justify-center",
                    ativo ? "bg-primary border-primary/20 scale-125" : "bg-surface-container-lowest border-surface-container-high"
                  )}>
                    {ativo && <div className="w-1.5 h-1.5 bg-on-primary rounded-full" />}
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl transition-all border",
                    ativo ? "bg-surface-container-high border-primary/20 shadow-lg" : "bg-surface-container-low/50 border-transparent"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", ativo ? "text-primary" : "text-on-surface-variant")}>
                        {g.horarioInicio} - {g.horarioFim}
                      </span>
                      {ativo && <span className="text-[8px] font-black bg-primary text-on-primary px-2 py-0.5 rounded-full animate-pulse">AGORA</span>}
                    </div>
                    <p className={cn("text-sm font-black", ativo ? "text-on-surface-bright" : "text-on-surface")}>{g.posto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 flex items-center justify-center gap-2">
          <ShieldCheck size={12} /> SESI CONNECT SECURITY
        </p>
      </div>
    </div>
  );
}
