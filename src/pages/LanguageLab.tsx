import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, MapPin, Clock, Users, Search, ChevronLeft, User, CheckCircle2, BookOpen } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { languageLab } = useEscola();
  const [labSelecionado, setLabSelecionado] = useState<any | null>(null);
  const [busca, setBusca] = useState('');

  if (labSelecionado) {
    const alunosFiltrados = (labSelecionado.listaAlunos || []).filter((a: string) => a.toLowerCase().includes(busca.toLowerCase()));

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-10 pb-32"
      >
        {/* Painel de Detalhes Interno */}
        <div className="bg-[#0d1117] rounded-[4rem] border border-[#30363d] overflow-hidden shadow-2xl">
          <div className="p-12 bg-indigo-600 text-white relative">
             <button 
               onClick={() => setLabSelecionado(null)}
               className="absolute top-10 right-10 w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all shadow-xl"
             >
               <ChevronLeft size={28} className="mr-1" />
             </button>

             <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 bg-white/10 rounded-[3rem] flex items-center justify-center text-6xl font-black shadow-inner border border-white/5">
                  {labSelecionado.nivel.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                     <span className="px-4 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">Level Details</span>
                     <span className="text-white/60 font-black text-sm uppercase italic tracking-widest">{labSelecionado.diaSemana}</span>
                  </div>
                  <h2 className="text-6xl font-black tracking-tighter italic leading-none">{labSelecionado.nivel}</h2>
                  <p className="text-xl font-bold opacity-70 mt-4 italic flex items-center gap-3">
                     <BookOpen size={20} /> {labSelecionado.turma}
                  </p>
                </div>
             </div>
          </div>

          <div className="p-12 space-y-12 bg-surface-container-lowest">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><MapPin size={14} /> Sala Designada</p>
                   <p className="text-3xl font-black italic">{labSelecionado.sala}</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><User size={14} /> Professor(a)</p>
                   <p className="text-3xl font-black italic">{labSelecionado.professor}</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><Clock size={14} /> Horário</p>
                   <p className="text-3xl font-black italic">{labSelecionado.horarioInicio} - {labSelecionado.horarioFim}</p>
                </div>
             </div>

             <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <h3 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-4">
                      <Users size={32} className="text-indigo-400" /> Relação de Alunos
                   </h3>
                   <div className="relative group w-full md:w-80">
                      <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-indigo-400" />
                      <input 
                       type="text"
                       placeholder="Procurar aluno..."
                       value={busca}
                       onChange={(e) => setBusca(e.target.value)}
                       className="w-full pl-14 pr-8 py-5 bg-white/5 border-none rounded-[2rem] text-sm font-black focus:ring-8 focus:ring-indigo-500/10 shadow-inner outline-none"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {alunosFiltrados.length === 0 ? (
                      <div className="col-span-full py-20 text-center opacity-30 italic text-lg">Nenhum aluno encontrado para esta busca.</div>
                   ) : (
                     alunosFiltrados.map((aluno: string, i: number) => (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         key={i} 
                         className="p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-indigo-600 hover:text-black transition-all cursor-default group/item shadow-lg"
                       >
                          <span className="text-base font-black italic tracking-tight">{aluno}</span>
                          <span className="text-[10px] font-black opacity-30 group-hover/item:opacity-60">#{i+1}</span>
                       </motion.div>
                     ))
                   )}
                </div>

                <button 
                  onClick={() => alert('Registrando frequência para o nível ' + labSelecionado.nivel)}
                  className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-500 hover:scale-[1.01] transition-all flex items-center justify-center gap-4 border border-indigo-400/20"
                >
                   <CheckCircle2 size={24} /> Finalizar Chamada Digital
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16 pb-32 px-4">
      <header className="max-w-4xl">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-500/10 text-indigo-400 rounded-full mb-6 border border-indigo-500/20 shadow-xl">
          <Languages size={20} />
          <span className="text-xs font-black uppercase tracking-[0.3em] italic">Intelligence Lab</span>
        </div>
        <h1 className="text-7xl font-black tracking-tighter text-white mb-6 italic leading-none">Language <span className="text-indigo-500">Lab</span></h1>
        <p className="text-on-surface-variant text-2xl font-medium leading-relaxed italic opacity-80 border-l-4 border-indigo-500/30 pl-8">
          Gestão centralizada de ensalamento por proficiência. Acesse cada nível para gerenciar a frequência e consultar alocações.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {languageLab.map((lab) => (
          <motion.div
            key={lab.id}
            whileHover={{ y: -15, scale: 1.02 }}
            onClick={() => setLabSelecionado(lab)}
            className="bg-[#0d1117] p-12 rounded-[4rem] shadow-2xl border-2 border-[#30363d] hover:border-indigo-500/50 transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[450px]"
          >
             <div className="flex justify-between items-start relative z-10">
                <div className="w-24 h-24 bg-indigo-500 text-black rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl group-hover:scale-110 transition-transform">
                  {lab.nivel.charAt(0)}
                </div>
                <div className="flex flex-col items-end gap-3">
                   <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-2">
                      <Clock size={16} className="text-indigo-400" />
                      <span className="text-xs font-black uppercase text-white tracking-widest">{lab.horarioInicio}</span>
                   </div>
                   <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-xl uppercase tracking-widest border border-indigo-500/20">
                      {lab.diaSemana}
                   </span>
                </div>
             </div>

             <div className="relative z-10 space-y-3">
                <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none group-hover:text-indigo-400 transition-colors">{lab.nivel}</h3>
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-10 bg-indigo-500/50" />
                   <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.4em]">{lab.turma}</p>
                </div>
             </div>

             <div className="pt-8 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity relative z-10">
                <div className="flex items-center gap-3">
                   <Users size={20} className="text-indigo-400" />
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">{lab.listaAlunos?.length || 0} Alunos</span>
                </div>
                <ChevronLeft size={24} className="text-indigo-400 rotate-180 group-hover:translate-x-3 transition-transform" />
             </div>

             <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] group-hover:bg-indigo-500/10 transition-all" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
