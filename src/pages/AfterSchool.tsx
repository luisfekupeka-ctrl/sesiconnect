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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {atividadesDoDia.map((ativ) => {
          const expandida = atividadeAberta === ativ.id;
          return (
            <motion.div
              layout
              key={ativ.id}
              onClick={() => setAtividadeAberta(expandida ? null : ativ.id)}
              className={cn(
                "bg-surface-container-lowest rounded-[2.5rem] border-2 transition-all p-8 cursor-pointer relative overflow-hidden group",
                expandida ? "border-amber-500 shadow-2xl" : "border-transparent hover:border-amber-500/20 shadow-xl"
              )}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                 <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Sparkles size={28} />
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Horário</p>
                    <p className="font-black text-sm text-on-surface-bright">{ativ.horarioInicio} - {ativ.horarioFim}</p>
                 </div>
              </div>

              <div className="relative z-10 space-y-4">
                 <div>
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em]">{ativ.categoria}</span>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter truncate">{ativ.nome}</h3>
                 </div>

                 <div className="flex items-center gap-4 text-on-surface-variant font-bold text-xs">
                    <div className="flex items-center gap-1.5"><DoorOpen size={14} className="text-amber-500" /> {ativ.local}</div>
                    <div className="flex items-center gap-1.5"><Users size={14} className="text-amber-500" /> {ativ.quantidadeAlunos} Alunos</div>
                 </div>

                 <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{ativ.nomeProfessor}</p>
                    <ChevronDown className={cn("text-outline transition-transform duration-500", expandida && "rotate-180 text-amber-500")} />
                 </div>
              </div>

              {/* LISTA DE ALUNOS EXPANDIDA */}
              <AnimatePresence>
                {expandida && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-6 pt-6 border-t border-white/5"
                  >
                     <div className="flex items-center justify-between gap-4 mb-6">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Ensalamento Nominal</p>
                        <div className="relative group max-w-[180px]">
                           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-amber-500" />
                           <input 
                              type="text"
                              placeholder="Filtrar..."
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setBuscaAlunos(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-[10px] font-black focus:ring-2 focus:ring-amber-500/20"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(ativ.listaAlunos || [])
                          .filter(a => a.toLowerCase().includes(buscaAlunos.toLowerCase()))
                          .map((aluno, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-xl hover:bg-amber-500/5 transition-all group">
                             <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[10px] font-black group-hover:bg-amber-500 group-hover:text-black transition-all">
                                {i + 1}
                             </div>
                             <span className="text-xs font-black text-on-surface-variant group-hover:text-white transition-colors">{aluno}</span>
                          </div>
                        ))}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {atividadesDoDia.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30 italic font-black uppercase text-xs tracking-widest">
             Sem atividades programadas para este dia.
          </div>
        )}
      </div>
    </motion.div>
  );
}
