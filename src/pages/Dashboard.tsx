import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, DoorOpen, ChevronLeft, ChevronRight, 
  Sparkles, UserCheck, Search, Activity, User, ArrowRight, Calendar,
  ShieldCheck, AlertTriangle, TrendingUp, Users, Map
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const TAMANHO_PAGINA = 12;

export default function Dashboard() {
  const { gradeCompleta, horaAtual, monitores } = useEscola();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [salaSelecionada, setSalaSelecionada] = useState<number | null>(null);
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [buscaAluno, setBuscaAluno] = useState('');

  const diaHoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(horaAtual).toUpperCase();
  const horaMinAgora = horaAtual.getHours() * 60 + horaAtual.getMinutes();

  const gradeAgora = useMemo(() => {
    return gradeCompleta.filter(slot => {
       if (!slot.diaSemana || !slot.horario || !slot.horario.includes('-')) return false;
       if (slot.diaSemana.toUpperCase() !== diaHoje && !diaHoje.includes(slot.diaSemana.toUpperCase())) return false;
       const parts = slot.horario.split('-');
       if (parts.length < 2) return false;
       const [hh1, mm1] = (parts[0]?.trim() || '0:0').split(':').map(Number);
       const [hh2, mm2] = (parts[1]?.trim() || '0:0').split(':').map(Number);
       const inicio = (hh1 || 0) * 60 + (mm1 || 0);
       const fim = (hh2 || 0) * 60 + (mm2 || 0);
       return horaMinAgora >= inicio && horaMinAgora < fim;
    });
  }, [gradeCompleta, diaHoje, horaMinAgora]);

  const totalPaginas = Math.ceil(gradeAgora.length / TAMANHO_PAGINA) || 1;
  const salasExibidas = gradeAgora.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA);

  const stats = {
    aulasAtivas: gradeAgora.length,
    totalAlunos: gradeAgora.reduce((acc, s) => acc + (s.listaAlunos?.length || 0), 0),
    salasLivres: 31 - gradeAgora.length,
    monitoresAtivos: monitores.filter(m => m.status === 'ativo').length
  };

  const resultadosBusca = useMemo(() => {
    if (buscaGlobal.length < 3) return [];
    const termo = buscaGlobal.toLowerCase();
    return gradeCompleta.filter(slot => 
      slot.materia.toLowerCase().includes(termo) || 
      slot.nomeProfessor.toLowerCase().includes(termo) ||
      (slot.listaAlunos || []).some(a => a.toLowerCase().includes(termo))
    ).slice(0, 8);
  }, [buscaGlobal, gradeCompleta]);

  if (salaSelecionada) {
    const slot = gradeAgora.find(g => g.numeroSala === salaSelecionada);
    const alunosFiltrados = (slot?.listaAlunos || []).filter(a => a.toLowerCase().includes(buscaAluno.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen pb-20 px-4 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-8 bg-[#fbbf24] text-black relative">
             <button onClick={() => setSalaSelecionada(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-black text-[#fbbf24] rounded-2xl flex items-center justify-center text-3xl font-black">{salaSelecionada}</div>
                <div>
                   <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-60 mb-1">Room Feed</p>
                   <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic leading-none">{slot?.materia || 'Livre'}</h2>
                   <p className="text-sm md:text-lg font-bold opacity-80 mt-2 italic">{slot?.nomeProfessor}</p>
                </div>
             </div>
          </div>
          <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest">
             <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl md:text-2xl font-black italic tracking-tighter text-white flex items-center gap-2">
                   <Users size={20} className="text-[#fbbf24]" /> Matriculados
                </h3>
                <div className="relative group w-48 md:w-64">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                   <input 
                    type="text" placeholder="Filtrar..." value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black border border-white/5 rounded-xl text-[11px] font-black outline-none"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {alunosFiltrados.map((aluno, i) => (
                  <div key={i} className="p-4 bg-black rounded-xl border border-white/5 flex items-center justify-between text-sm">
                     <span className="font-black italic text-white/80">{aluno}</span>
                     <span className="text-[9px] opacity-20">#{i+1}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-20 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl">
           <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full mb-4 border border-[#fbbf24]/20">
             <Activity size={14} className="animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Live Sesi Connect</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">Dash<span className="text-[#fbbf24]">board</span></h1>
           <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#fbbf24]/20 pl-4 max-w-xl">
             Visão em tempo real. Encontre alunos e monitore salas.
           </p>
        </div>

        <div className="relative group w-full lg:w-[350px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fbbf24]" size={20} />
          <input
            type="text"
            placeholder="Buscar..."
            value={buscaGlobal}
            onChange={(e) => setBuscaGlobal(e.target.value)}
            className="w-full pl-12 pr-6 py-4 md:py-5 bg-[#0d0d0d] border-2 border-white/5 rounded-2xl md:rounded-[1.5rem] text-white font-black text-sm focus:ring-4 focus:ring-[#fbbf24]/5 outline-none"
          />
          <AnimatePresence>
            {buscaGlobal.length >= 3 && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full mt-2 left-0 w-full bg-[#141414] rounded-2xl border border-white/10 shadow-premium z-50 p-3 space-y-1">
                {resultadosBusca.map((r, i) => (
                  <div key={i} className="p-3 hover:bg-[#fbbf24] hover:text-black rounded-xl transition-all cursor-default text-xs flex flex-col gap-0.5">
                     <p className="font-black italic">{r.materia}</p>
                     <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Sala {r.numeroSala}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <MetricCard icon={<DoorOpen size={18}/>} label="Aulas" value={stats.aulasAtivas} color="blue" />
         <MetricCard icon={<Users size={18}/>} label="Alunos" value={stats.totalAlunos} color="yellow" />
         <MetricCard icon={<ShieldCheck size={18}/>} label="Equipe" value={stats.monitoresAtivos} color="green" />
         <MetricCard icon={<TrendingUp size={18}/>} label="Livres" value={stats.salasLivres} color="white" />
      </section>

      <section className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse shadow-[0_0_10px_#fbbf24]" />
               Grade <span className="text-[#fbbf24]">Ativa</span>
            </h2>
            <div className="flex gap-2">
               <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} className="p-2.5 bg-white/5 rounded-xl hover:bg-[#fbbf24] hover:text-black transition-all border border-white/5"><ChevronLeft size={16} /></button>
               <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} className="p-2.5 bg-white/5 rounded-xl hover:bg-[#fbbf24] hover:text-black transition-all border border-white/5"><ChevronRight size={16} /></button>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {salasExibidas.map((sala) => (
              <motion.div
                key={sala.id}
                whileHover={{ y: -5 }}
                onClick={() => setSalaSelecionada(sala.numeroSala)}
                className="p-6 bg-[#0d0d0d] rounded-[1.5rem] border-2 border-white/5 hover:border-[#fbbf24]/50 transition-all cursor-pointer flex flex-col justify-between h-[220px] relative overflow-hidden group shadow-premium"
              >
                 <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 bg-[#fbbf24] text-black rounded-xl flex items-center justify-center text-xl font-black">{sala.numeroSala}</div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#fbbf24]">{sala.listaAlunos?.length || 0} AL</span>
                 </div>
                 <div className="space-y-1 relative z-10">
                    <h4 className="text-lg font-black text-white italic tracking-tighter leading-tight group-hover:text-[#fbbf24] truncate">{sala.materia}</h4>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic truncate">{sala.nomeProfessor}</p>
                 </div>
                 <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#fbbf24]/5 rounded-full blur-[40px]" />
              </motion.div>
            ))}
         </div>
      </section>
    </motion.div>
  );
}

function MetricCard({ icon, label, value, color }: any) {
  return (
    <div className={cn(
      "p-6 rounded-[1.5rem] border-2 flex flex-col gap-3 shadow-premium transition-all",
      color === 'yellow' ? "bg-[#fbbf24]/5 border-[#fbbf24]/20" :
      color === 'blue' ? "bg-[#42a0f5]/5 border-[#42a0f5]/20" :
      color === 'green' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/10"
    )}>
       <div className={cn(
         "w-10 h-10 rounded-xl flex items-center justify-center",
         color === 'yellow' ? "bg-[#fbbf24] text-black" :
         color === 'blue' ? "bg-[#42a0f5] text-black" :
         color === 'green' ? "bg-emerald-500 text-black" : "bg-white text-black"
       )}>
          {icon}
       </div>
       <div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-0.5">{label}</p>
          <p className="text-3xl font-black tracking-tighter italic">{value}</p>
       </div>
    </div>
  );
}