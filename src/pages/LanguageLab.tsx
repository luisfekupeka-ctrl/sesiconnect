import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, GraduationCap, MapPin, Clock, Users, Search, ChevronDown, User } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { languageLab } = useEscola();
  const [labSelecionado, setLabSelecionado] = useState<string | null>(null);
  const [buscaAlunos, setBuscaAlunos] = useState('');

  // Agrupar labs por nível para uma visão mais organizada
  const labsAgrupados = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    languageLab.forEach(lab => {
      if (!grupos[lab.nivel]) grupos[lab.nivel] = [];
      grupos[lab.nivel].push(lab);
    });
    return grupos;
  }, [languageLab]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-32"
    >
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full mb-4 border border-indigo-500/20 shadow-sm">
            <Languages size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ensalamento de Idiomas</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-on-surface-bright mb-4 italic">Language <span className="text-indigo-500">Labs</span></h1>
          <p className="text-on-surface-variant text-xl font-medium leading-relaxed">
            Consulte os níveis de proficiência por ano. Clique em um card para ver a lista nominal de alunos ensalados.
          </p>
        </div>
      </header>

      {/* Seções por Nível */}
      <div className="space-y-16">
        {Object.entries(labsAgrupados).map(([nivel, labs]) => (
          <section key={nivel} className="space-y-8">
            <div className="flex items-center gap-6">
               <h2 className="text-3xl font-black tracking-tighter text-white italic uppercase whitespace-nowrap">{nivel}</h2>
               <div className="h-px bg-gradient-to-r from-indigo-500/30 to-transparent w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {labs.map((lab) => {
                const selecionado = labSelecionado === lab.id;
                return (
                  <motion.div
                    layout
                    key={lab.id}
                    onClick={() => setLabSelecionado(selecionado ? null : lab.id)}
                    className={cn(
                      "bg-surface-container-lowest p-10 rounded-[3.5rem] shadow-2xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                      selecionado ? "border-indigo-500 shadow-indigo-500/20" : "border-transparent hover:border-indigo-500/20"
                    )}
                  >
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px]" />

                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div className={cn(
                        "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-700 shadow-2xl",
                        selecionado ? "bg-indigo-600 text-white" : "bg-surface-container-low text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"
                      )}>
                        <GraduationCap size={40} />
                      </div>
                      <div className="text-right">
                         <span className="text-[11px] font-black bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-2xl uppercase tracking-[0.2em] border border-indigo-500/20 shadow-inner">
                            {lab.turma}
                         </span>
                      </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                       <div>
                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40 mb-1">Instrutor Responsável</p>
                          <h3 className="text-2xl font-black text-white italic tracking-tighter truncate leading-tight">{lab.professor}</h3>
                       </div>

                       <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/5">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40 flex items-center gap-1">
                                <MapPin size={10} /> Localização
                             </p>
                             <p className="text-sm font-black text-white italic">{lab.sala}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40 flex items-center gap-1">
                                <Clock size={10} /> Período
                             </p>
                             <p className="text-sm font-black text-white italic">{lab.horarioInicio} - {lab.horarioFim}</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-indigo-400">
                             <Users size={16} />
                             <span className="text-xs font-black uppercase tracking-widest">{lab.listaAlunos?.length || 0} Matriculados</span>
                          </div>
                          <ChevronDown className={cn("text-outline transition-transform duration-500", selecionado && "rotate-180 text-indigo-500")} />
                       </div>
                    </div>

                    {/* LISTA NOMINAL PESQUISÁVEL */}
                    <AnimatePresence>
                      {selecionado && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-8 pt-8 border-t border-white/10"
                        >
                           <div className="flex items-center justify-between gap-4 mb-8">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Alunos por Ano</h4>
                              <div className="relative group flex-1 max-w-[200px]">
                                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-indigo-500" />
                                 <input 
                                    type="text"
                                    placeholder="Buscar por nome..."
                                    value={buscaAlunos}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setBuscaAlunos(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-2xl text-[10px] font-black focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {(lab.listaAlunos || [])
                                .filter(a => a.toLowerCase().includes(buscaAlunos.toLowerCase()))
                                .map((aluno, idx) => (
                                <div key={idx} className="flex items-center gap-5 p-5 bg-surface-container-low/50 rounded-3xl hover:bg-indigo-500/10 transition-all group border border-transparent hover:border-indigo-500/20">
                                   <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[10px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                      {idx + 1}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="font-black text-sm text-on-surface-variant group-hover:text-white transition-colors italic truncate">{aluno}</p>
                                      <p className="text-[8px] font-black uppercase text-indigo-500/40 tracking-widest">{lab.turma}</p>
                                   </div>
                                   <User size={14} className="text-outline group-hover:text-indigo-500 transition-colors" />
                                </div>
                              ))}
                              {(lab.listaAlunos || []).length === 0 && (
                                 <div className="p-10 text-center opacity-20 italic font-black text-xs">Nenhum aluno ensalado neste nível</div>
                              )}
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </motion.div>
  );
}
