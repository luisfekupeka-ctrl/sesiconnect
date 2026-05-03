import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Users, Calendar, ChevronDown, User, DoorOpen, Search, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export default function AfterSchool() {
  const { atividadesAfter, estadoEscola } = useEscola();
  const [diaFiltro, setDiaFiltro] = useState<string>(DIAS[0]); // Padrão: Segunda
  const [atividadeAberta, setAtividadeAberta] = useState<string | null>(null);
  const [buscaAlunos, setBuscaAlunos] = useState('');

  const atividadesDoDia = atividadesAfter.filter(a => a.dias.includes(diaFiltro));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full mb-4 border border-amber-500/20">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Atividades Extracurriculares</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface-bright mb-2 italic">After <span className="text-amber-500">School</span></h1>
          <p className="text-on-surface-variant text-lg font-medium">Cronograma semanal de oficinas e esportes. Selecione um dia para ver o ensalamento.</p>
        </div>

        {/* Seletor Semanal Minimalista */}
        <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-[2rem] border border-[#30363d] w-full md:w-auto overflow-x-auto no-scrollbar">
          {DIAS.map(dia => (
            <button
              key={dia}
              onClick={() => setDiaFiltro(dia)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                diaFiltro === dia ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-on-surface-variant hover:bg-white/5"
              )}
            >
              {dia}
            </button>
          ))}
        </div>
      </header>

      {/* Grid de Atividades do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {atividadesDoDia.map((ativ) => {
          const expandida = atividadeAberta === ativ.id;
          const alunosNoBloco = ativ.listaAlunos || [];
          const alunosFiltrados = alunosNoBloco.filter(a => a.toLowerCase().includes(buscaAlunos.toLowerCase()));

          return (
            <motion.div
              layout
              key={ativ.id}
              className={cn(
                "bg-[#0d1117] p-10 rounded-[3.5rem] shadow-2xl border-2 transition-all relative overflow-hidden group",
                expandida ? "border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.2)]" : "border-[#30363d] hover:border-amber-500/30 shadow-xl"
              )}
            >
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] group-hover:bg-amber-500/10 transition-all" />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                 <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-inner shadow-amber-500/5">
                    {ativ.nome.charAt(0)}
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-2">
                       <Clock size={12} className="text-amber-500" />
                       <span className="text-[10px] font-black uppercase text-white tracking-widest">{ativ.horarioInicio} - {ativ.horarioFim}</span>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-[9px] font-black rounded-lg uppercase tracking-widest">
                       {ativ.categoria}
                    </span>
                 </div>
              </div>

              <div className="relative z-10 space-y-2 mb-10">
                 <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none group-hover:text-amber-400 transition-colors">{ativ.nome}</h3>
                 <div className="flex items-center gap-2 text-amber-500/60 text-[10px] font-black uppercase tracking-[0.4em] italic">
                    <div className="w-4 h-[2px] bg-amber-500" /> {ativ.grupoAlunos || 'GRUPO MISTO'}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-t border-white/5 relative z-10">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest opacity-40 flex items-center gap-1">
                       <DoorOpen size={10} /> Localização
                    </p>
                    <p className="text-base font-black text-white italic">{ativ.local}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest opacity-40 flex items-center gap-1">
                       <User size={10} /> Professor
                    </p>
                    <p className="text-base font-black text-white italic">{ativ.nomeProfessor}</p>
                 </div>
              </div>

              {/* Seção de Ensalamento */}
              <div className="pt-8 border-t border-white/5 space-y-6 relative z-10">
                 <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setAtividadeAberta(expandida ? null : ativ.id)}
                      className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500 flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Users size={16} /> {alunosNoBloco.length} Alunos Ensalados
                      <ChevronDown size={14} className={cn("transition-transform", expandida && "rotate-180")} />
                    </button>
                    {expandida && (
                      <div className="relative group w-32">
                         <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                         <input 
                           type="text" 
                           placeholder="Buscar..."
                           value={buscaAlunos}
                           onChange={(e) => setBuscaAlunos(e.target.value)}
                           className="w-full pl-8 pr-2 py-2 bg-white/5 border-none rounded-xl text-[9px] font-black outline-none focus:ring-2 focus:ring-amber-500/20"
                         />
                      </div>
                    )}
                 </div>

                 <AnimatePresence>
                    {expandida && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                         <div className="grid gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                            {alunosFiltrados.map((aluno, i) => (
                               <motion.div 
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 key={i} 
                                 className="text-[12px] font-black py-4 px-6 bg-white/[0.03] rounded-[1.5rem] flex items-center justify-between group/item hover:bg-amber-500 hover:text-black transition-all border border-white/5"
                                >
                                  <span className="italic tracking-tight">{aluno}</span>
                                  <span className="text-[9px] opacity-30 font-black group-hover/item:opacity-60">#{i+1}</span>
                               </motion.div>
                            ))}
                         </div>
                         
                         <button 
                           onClick={() => alert('Abrindo chamada digital para ' + ativ.nome)}
                           className="w-full py-5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl mt-4 shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                         >
                            <Sparkles size={18} /> Registrar Chamada
                         </button>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            </motion.div>
          );
        })}

        {atividadesDoDia.length === 0 && (
          <div className="col-span-full py-32 text-center opacity-20 italic font-black uppercase text-sm tracking-[0.5em] border-2 border-dashed border-white/5 rounded-[4rem]">
             Sem atividades programadas para este dia.
          </div>
        )}
      </div>
    </motion.div>
  );
}
