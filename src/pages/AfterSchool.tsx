import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Users, ChevronLeft, User, DoorOpen, Search, Star, ChevronRight } from 'lucide-react';
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
    const alunos = ativSelecionada.listaAlunos || [];
    const alunosFiltrados = alunos.filter((a: string) => a.toLowerCase().includes(busca.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-8 bg-[#fbbf24] text-black relative">
             <button onClick={() => setAtivSelecionada(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-black text-[#fbbf24] rounded-2xl flex items-center justify-center text-2xl font-black">{ativSelecionada.nome.charAt(0)}</div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black tracking-tighter italic leading-none">{ativSelecionada.nome}</h2>
                  <p className="text-[10px] font-bold opacity-70 mt-1 italic">{ativSelecionada.categoria}</p>
                </div>
             </div>
          </div>
          <div className="p-6 space-y-8 bg-surface-container-lowest">
             <div className="grid grid-cols-3 gap-2">
                <InfoBox label="Ambiente" value={ativSelecionada.local} icon={<DoorOpen size={12} />} color="yellow" />
                <InfoBox label="Docente" value={ativSelecionada.nomeProfessor} icon={<User size={12} />} color="yellow" />
                <InfoBox label="Hora" value={ativSelecionada.horarioInicio} icon={<Clock size={12} />} color="yellow" />
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                   <h3 className="text-lg font-black italic tracking-tighter text-white flex items-center gap-2"><Users size={18} className="text-[#fbbf24]" /> Alunos</h3>
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
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">After <span className="text-[#fbbf24]">School</span></h1>
          <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#fbbf24]/20 pl-4">Consulta de oficinas.</p>
        </div>
        <div className="flex gap-1 p-1 bg-[#0a0a0a] rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          {DIAS.map(dia => (
            <button key={dia} onClick={() => setDiaFiltro(dia)}
              className={cn("px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                diaFiltro === dia ? "bg-[#fbbf24] text-black shadow-md" : "text-white/40 hover:bg-white/5")}>
              {dia.slice(0, 3)}
            </button>
          ))}
        </div>
      </header>
      
      {/* Lista Vertical de Oficinas */}
      <div className="flex flex-col gap-3">
        {atividadesDoDia.map((ativ) => (
          <motion.div key={ativ.id} whileHover={{ x: 5 }} onClick={() => setAtivSelecionada(ativ)}
            className="bg-[#0d0d0d] p-5 rounded-2xl shadow-premium border-2 border-white/5 hover:border-[#fbbf24]/40 transition-all flex items-center justify-between group cursor-pointer overflow-hidden">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#fbbf24] text-black rounded-xl flex items-center justify-center text-2xl font-black">{ativ.nome.charAt(0)}</div>
                <div>
                   <h3 className="text-lg font-black text-white italic tracking-tighter group-hover:text-[#fbbf24]">{ativ.nome}</h3>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{ativ.categoria}</p>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <div className="hidden md:flex flex-col items-end">
                   <p className="text-[10px] font-black text-white tracking-widest">{ativ.horarioInicio}</p>
                   <p className="text-[9px] font-black text-[#fbbf24] uppercase italic">Oficina</p>
                </div>
                <ChevronRight size={18} className="text-[#fbbf24] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
             </div>
          </motion.div>
        ))}
        {atividadesDoDia.length === 0 && (
           <div className="py-16 text-center opacity-20 italic font-black text-sm border-2 border-dashed border-white/5 rounded-2xl">Sem atividades.</div>
        )}
      </div>
    </motion.div>
  );
}

function InfoBox({ label, value, icon, color }: any) {
  return (
    <div className="p-3 bg-black rounded-xl border border-white/5 flex flex-col">
       <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-30 flex items-center gap-1 mb-0.5">{icon} {label}</p>
       <p className={cn("text-xs font-black italic truncate", color === 'yellow' ? "text-[#fbbf24]" : "text-[#42a0f5]")}>{value}</p>
    </div>
  );
}
