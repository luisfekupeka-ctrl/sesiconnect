import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Users, Search, ChevronLeft, User, BookOpen, Globe, ChevronRight } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';

export default function LanguageLab() {
  const { languageLab } = useEscola();
  const [labSelecionado, setLabSelecionado] = useState<any | null>(null);
  const [busca, setBusca] = useState('');

  if (labSelecionado) {
    const alunos = labSelecionado.listaAlunos || [];
    const alunosFiltrados = alunos.filter((a: string) => a.toLowerCase().includes(busca.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-8 bg-[#42a0f5] text-black relative">
             <button onClick={() => setLabSelecionado(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-black text-[#42a0f5] rounded-2xl flex items-center justify-center text-2xl font-black">{labSelecionado.nivel.charAt(0)}</div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black tracking-tighter italic leading-none">{labSelecionado.nivel}</h2>
                  <p className="text-[10px] font-bold opacity-70 mt-1 italic flex items-center gap-2"><BookOpen size={12} /> {labSelecionado.turma}</p>
                </div>
             </div>
          </div>
          <div className="p-6 space-y-8 bg-surface-container-lowest">
             <div className="grid grid-cols-3 gap-2">
                <InfoBox label="Sala" value={labSelecionado.sala} icon={<MapPin size={12} />} />
                <InfoBox label="Docente" value={labSelecionado.professor} icon={<User size={12} />} />
                <InfoBox label="Hora" value={labSelecionado.horarioInicio} icon={<Clock size={12} />} />
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                   <h3 className="text-lg font-black italic tracking-tighter text-white flex items-center gap-2"><Users size={18} className="text-[#42a0f5]" /> Alunos</h3>
                   <div className="relative group w-48">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input type="text" placeholder="Filtrar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-black border border-white/5 rounded-xl text-[10px] font-black outline-none" />
                   </div>
                </div>
                {/* Lista Vertical de Alunos */}
                <div className="flex flex-col gap-1.5">
                   {alunosFiltrados.map((aluno: string, i: number) => (
                     <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-black italic text-white/50">{aluno}</div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">Language <span className="text-[#42a0f5]">Lab</span></h1>
          <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#42a0f5]/20 pl-4">Consulta por proficiência.</p>
        </div>
      </header>
      
      {/* Lista Vertical de Níveis */}
      <div className="flex flex-col gap-3">
        {languageLab.map((lab) => (
          <motion.div key={lab.id} whileHover={{ x: 5 }} onClick={() => setLabSelecionado(lab)}
            className="bg-[#0d0d0d] p-5 rounded-2xl shadow-premium border-2 border-white/5 hover:border-[#42a0f5]/40 transition-all flex items-center justify-between group cursor-pointer overflow-hidden">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#42a0f5] text-black rounded-xl flex items-center justify-center text-2xl font-black">{lab.nivel.charAt(0)}</div>
                <div>
                   <h3 className="text-lg font-black text-white italic tracking-tighter group-hover:text-[#42a0f5]">{lab.nivel}</h3>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{lab.turma}</p>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                   <p className="text-[10px] font-black text-white tracking-widest">{lab.horarioInicio}</p>
                   <p className="text-[9px] font-black text-[#42a0f5] uppercase">{lab.diaSemana}</p>
                </div>
                <ChevronRight size={18} className="text-[#42a0f5] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
             </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function InfoBox({ label, value, icon }: any) {
  return (
    <div className="p-3 bg-black rounded-xl border border-white/5 flex flex-col">
       <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-30 flex items-center gap-1 mb-0.5">{icon} {label}</p>
       <p className="text-xs font-black italic text-[#42a0f5] truncate">{value}</p>
    </div>
  );
}
