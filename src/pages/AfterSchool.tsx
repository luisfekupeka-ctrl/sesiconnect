import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Users, ChevronLeft, User, DoorOpen, Search, ClipboardCheck, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export default function AfterSchool() {
  const { atividadesAfter } = useEscola();
  const [diaFiltro, setDiaFiltro] = useState<string>(DIAS[0]);
  const [ativSelecionada, setAtivSelecionada] = useState<any | null>(null);
  const [busca, setBusca] = useState('');

  const atividadesDoDia = atividadesAfter.filter(a => a.dias.includes(diaFiltro));

  if (ativSelecionada) {
    const alunosFiltrados = (ativSelecionada.listaAlunos || []).filter((a: string) => a.toLowerCase().includes(busca.toLowerCase()));

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-10 pb-32"
      >
        <div className="bg-[#0d1117] rounded-[4rem] border border-[#30363d] overflow-hidden shadow-2xl">
          <div className="p-12 bg-amber-600 text-white relative">
             <button 
               onClick={() => setAtivSelecionada(null)}
               className="absolute top-10 right-10 w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all"
             >
               <ChevronLeft size={28} className="mr-1" />
             </button>

             <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 bg-white/10 rounded-[3rem] flex items-center justify-center text-6xl font-black shadow-inner">
                  {ativSelecionada.nome.charAt(0)}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">After School Program</p>
                  <h2 className="text-6xl font-black tracking-tighter italic leading-none">{ativSelecionada.nome}</h2>
                  <p className="text-xl font-bold opacity-70 mt-4 italic">{ativSelecionada.categoria}</p>
                </div>
             </div>
          </div>

          <div className="p-12 space-y-12 bg-surface-container-lowest">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><DoorOpen size={14} /> Localização</p>
                   <p className="text-3xl font-black italic">{ativSelecionada.local}</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><User size={14} /> Professor Responsável</p>
                   <p className="text-3xl font-black italic">{ativSelecionada.nomeProfessor}</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><Clock size={14} /> Horário</p>
                   <p className="text-3xl font-black italic">{ativSelecionada.horarioInicio} - {ativSelecionada.horarioFim}</p>
                </div>
             </div>

             <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <h3 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-4">
                      <Users size={32} className="text-amber-500" /> Lista Nominal
                   </h3>
                   <div className="relative group w-full md:w-80">
                      <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-amber-500" />
                      <input 
                       type="text"
                       placeholder="Procurar aluno..."
                       value={busca}
                       onChange={(e) => setBusca(e.target.value)}
                       className="w-full pl-14 pr-8 py-5 bg-white/5 border-none rounded-[2rem] text-sm font-black focus:ring-8 focus:ring-amber-500/10 shadow-inner outline-none"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {alunosFiltrados.length === 0 ? (
                      <div className="col-span-full py-20 text-center opacity-30 italic text-lg">Nenhum aluno encontrado.</div>
                   ) : (
                     alunosFiltrados.map((aluno: string, i: number) => (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         key={i} 
                         className="p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-amber-600 hover:text-black transition-all cursor-default group/item shadow-lg"
                       >
                          <span className="text-base font-black italic tracking-tight">{aluno}</span>
                          <span className="text-[10px] font-black opacity-30 group-hover/item:opacity-60">#{i+1}</span>
                       </motion.div>
                     ))
                   )}
                </div>

                <button 
                  onClick={() => alert('Realizando chamada para ' + ativSelecionada.nome)}
                  className="w-full py-8 bg-amber-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-amber-500 hover:scale-[1.01] transition-all flex items-center justify-center gap-4"
                >
                   <ClipboardCheck size={24} /> Registrar Presença After School
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 pb-32 px-4">
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-amber-500/10 text-amber-500 rounded-full mb-6 border border-amber-500/20 shadow-xl">
            <Sparkles size={20} />
            <span className="text-xs font-black uppercase tracking-[0.3em] italic">Extracurricular</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-white mb-6 italic leading-none">After <span className="text-amber-500">School</span></h1>
          <p className="text-on-surface-variant text-2xl font-medium leading-relaxed italic opacity-80 border-l-4 border-amber-500/30 pl-8">
            Oficinas, esportes e atividades complementares. Selecione o dia e a modalidade para gerenciar o ensalamento.
          </p>
        </div>

        <div className="flex gap-2 p-2 bg-[#0d1117] rounded-[2.5rem] border border-[#30363d] shadow-2xl overflow-x-auto no-scrollbar">
          {DIAS.map(dia => (
            <button
              key={dia}
              onClick={() => setDiaFiltro(dia)}
              className={cn(
                "px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                diaFiltro === dia ? "bg-amber-600 text-white shadow-xl" : "text-on-surface-variant hover:bg-white/5"
              )}
            >
              {dia}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {atividadesDoDia.map((ativ) => (
          <motion.div
            key={ativ.id}
            whileHover={{ y: -15, scale: 1.02 }}
            onClick={() => setAtivSelecionada(ativ)}
            className="bg-[#0d1117] p-12 rounded-[4rem] shadow-2xl border-2 border-[#30363d] hover:border-amber-500/50 transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[450px]"
          >
             <div className="flex justify-between items-start relative z-10">
                <div className="w-24 h-24 bg-amber-600 text-white rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl group-hover:scale-110 transition-transform">
                  {ativ.nome.charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-3">
                   <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-2">
                      <Clock size={16} className="text-amber-500" />
                      <span className="text-xs font-black uppercase text-white tracking-widest">{ativ.horarioInicio}</span>
                   </div>
                   <span className="px-4 py-1.5 bg-amber-500/20 text-amber-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-amber-500/20">
                      {ativ.categoria}
                   </span>
                </div>
             </div>

             <div className="relative z-10 space-y-3">
                <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none group-hover:text-amber-500 transition-colors">{ativ.nome}</h3>
                <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.4em] italic">{ativ.grupoAlunos || 'Grupo Misto'}</p>
             </div>

             <div className="pt-8 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity relative z-10">
                <div className="flex items-center gap-3">
                   <Users size={20} className="text-amber-500" />
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">{ativ.listaAlunos?.length || 0} Alunos</span>
                </div>
                <ArrowRight size={24} className="text-amber-500 group-hover:translate-x-3 transition-transform" />
             </div>

             <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] group-hover:bg-amber-500/10 transition-all" />
          </motion.div>
        ))}

        {atividadesDoDia.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-20 italic font-black uppercase text-xl tracking-[0.5em] border-4 border-dashed border-[#30363d] rounded-[5rem]">
             Nenhuma atividade nesta {diaFiltro}.
          </div>
        )}
      </div>
    </motion.div>
  );
}
