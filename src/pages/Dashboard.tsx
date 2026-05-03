import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, DoorOpen, ChevronLeft, ChevronRight, 
  Sparkles, UserCheck, Search, Activity, User, ArrowRight, Calendar,
  ShieldCheck, AlertTriangle, TrendingUp, Users, Map
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const TAMANHO_PAGINA = 10;

export default function Dashboard() {
  const { gradeCompleta, locaisCMS, horaAtual, professores, monitores, estadoEscola } = useEscola();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [salaSelecionada, setSalaSelecionada] = useState<number | null>(null);
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [buscaAluno, setBuscaAluno] = useState('');

  // Lógica de tempo atual
  const diaHoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(horaAtual).toUpperCase();
  const horaMinAgora = horaAtual.getHours() * 60 + horaAtual.getMinutes();

  const gradeAgora = useMemo(() => {
    return gradeCompleta.filter(slot => {
       if (slot.diaSemana.toUpperCase() !== diaHoje && !diaHoje.includes(slot.diaSemana.toUpperCase())) return false;
       const [inicio, fim] = slot.horario.split('-').map(h => {
          const [hh, mm] = h.trim().split(':').map(Number);
          return hh * 60 + mm;
       });
       return horaMinAgora >= inicio && horaMinAgora < fim;
    });
  }, [gradeCompleta, diaHoje, horaMinAgora]);

  const totalPaginas = Math.ceil(gradeAgora.length / TAMANHO_PAGINA) || 1;
  const salasExibidas = gradeAgora.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA);

  // Estatísticas Rápidas
  const stats = {
    aulasAtivas: gradeAgora.length,
    totalAlunos: gradeAgora.reduce((acc, s) => acc + (s.listaAlunos?.length || 0), 0),
    salasLivres: 31 - gradeAgora.length,
    monitoresAtivos: monitores.filter(m => m.status === 'ativo').length
  };

  // Resultados da Busca Global
  const resultadosBusca = useMemo(() => {
    if (buscaGlobal.length < 3) return [];
    const termo = buscaGlobal.toLowerCase();
    return gradeCompleta.filter(slot => 
      slot.materia.toLowerCase().includes(termo) || 
      slot.nomeProfessor.toLowerCase().includes(termo) ||
      (slot.listaAlunos || []).some(a => a.toLowerCase().includes(termo))
    ).slice(0, 10);
  }, [buscaGlobal, gradeCompleta]);

  if (salaSelecionada) {
    const slot = gradeAgora.find(g => g.numeroSala === salaSelecionada);
    const alunosFiltrados = (slot?.listaAlunos || []).filter(a => a.toLowerCase().includes(buscaAluno.toLowerCase()));

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-32 px-4 md:px-10 pt-4 md:pt-10 space-y-10">
        <div className="bg-[#0a0a0a] rounded-[3rem] md:rounded-[4.5rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-8 md:p-12 bg-[#fbbf24] text-black relative">
             <button onClick={() => setSalaSelecionada(null)} className="absolute top-8 right-8 w-12 h-12 md:w-16 md:h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={24} /></button>
             <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-black text-[#fbbf24] rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-4xl md:text-6xl font-black">{salaSelecionada}</div>
                <div className="text-center md:text-left">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Live Room Feed</p>
                   <h2 className="text-4xl md:text-7xl font-black tracking-tighter italic leading-none">{slot?.materia || 'Ambiente Livre'}</h2>
                   <p className="text-lg md:text-2xl font-bold opacity-80 mt-4 italic">{slot?.nomeProfessor || 'Disponível para Atividades'}</p>
                </div>
             </div>
          </div>
          <div className="p-8 md:p-12 space-y-12 bg-surface-container-lowest">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white">Alunos em Aula</h3>
                <div className="relative group w-full md:w-80">
                   <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" />
                   <input 
                    type="text" placeholder="Filtrar..." value={buscaAluno} onChange={(e) => setBuscaAluno(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-black border border-white/5 rounded-[2rem] text-sm font-black focus:ring-8 focus:ring-[#fbbf24]/5 outline-none"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {alunosFiltrados.map((aluno, i) => (
                  <div key={i} className="p-6 bg-black rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-[#fbbf24] hover:text-black transition-all">
                     <span className="font-black italic text-lg">{aluno}</span>
                     <span className="text-[10px] opacity-30">#{i+1}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 md:space-y-20 pb-32 px-4">
      {/* Header com Busca Inteligente */}
      <header className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-10">
        <div className="max-w-4xl">
           <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full mb-6 border border-[#fbbf24]/20 shadow-xl">
             <Activity size={20} className="animate-pulse" />
             <span className="text-xs font-black uppercase tracking-[0.3em] italic">Live Sesi Connect</span>
           </div>
           <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white mb-6 italic leading-none">Dash<span className="text-[#fbbf24]">board</span></h1>
           <p className="text-white/40 text-xl md:text-3xl font-medium leading-relaxed italic border-l-8 border-[#fbbf24]/20 pl-8 md:pl-12 max-w-3xl">
             Visão em tempo real do campus. Encontre alunos, monitore salas e gerencie escalas.
           </p>
        </div>

        <div className="relative group w-full xl:w-[500px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fbbf24]" size={28} />
          <input
            type="text"
            placeholder="Aluno, Professor ou Sala..."
            value={buscaGlobal}
            onChange={(e) => setBuscaGlobal(e.target.value)}
            className="w-full pl-16 pr-8 py-6 md:py-8 bg-[#0d0d0d] border-2 border-white/5 rounded-[2.5rem] md:rounded-[3.5rem] text-white font-black text-xl focus:ring-8 focus:ring-[#fbbf24]/5 shadow-2xl outline-none"
          />
          {/* Resultados Rápidos */}
          <AnimatePresence>
            {buscaGlobal.length >= 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full mt-4 left-0 w-full bg-[#141414] rounded-[2.5rem] border border-white/10 shadow-premium z-50 p-4 space-y-2">
                {resultadosBusca.map((r, i) => (
                  <div key={i} className="p-5 hover:bg-[#fbbf24] hover:text-black rounded-2xl transition-all cursor-default flex flex-col gap-1">
                     <p className="font-black italic text-lg">{r.materia}</p>
                     <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{r.nomeProfessor} • Sala {r.numeroSala}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Cards de Métricas Premium */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
         <MetricCard icon={<DoorOpen />} label="Aulas Ativas" value={stats.aulasAtivas} color="blue" />
         <MetricCard icon={<Users />} label="Alunos em Sala" value={stats.totalAlunos} color="yellow" />
         <MetricCard icon={<ShieldCheck />} label="Monitores" value={stats.monitoresAtivos} color="green" />
         <MetricCard icon={<TrendingUp />} label="Salas Livres" value={stats.salasLivres} color="white" />
      </section>

      {/* Grid de Salas Ativas */}
      <section className="space-y-10">
         <div className="flex items-center justify-between">
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white flex items-center gap-6">
               <div className="w-4 h-4 rounded-full bg-[#fbbf24] animate-pulse shadow-[0_0_20px_#fbbf24]" />
               Atividade <span className="text-[#fbbf24]">Síncrona</span>
            </h2>
            <div className="flex gap-4">
               <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} className="p-4 bg-white/5 rounded-2xl hover:bg-[#fbbf24] hover:text-black transition-all border border-white/5"><ChevronLeft size={24} /></button>
               <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} className="p-4 bg-white/5 rounded-2xl hover:bg-[#fbbf24] hover:text-black transition-all border border-white/5"><ChevronRight size={24} /></button>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-8">
            {salasExibidas.map((sala) => (
              <motion.div
                key={sala.id}
                whileHover={{ y: -10 }}
                onClick={() => setSalaSelecionada(sala.numeroSala)}
                className="p-10 bg-[#0d0d0d] rounded-[3.5rem] border-2 border-white/5 hover:border-[#fbbf24]/50 transition-all cursor-pointer flex flex-col justify-between h-[340px] relative overflow-hidden group shadow-premium"
              >
                 <div className="flex justify-between items-start relative z-10">
                    <div className="w-20 h-20 bg-[#fbbf24] text-black rounded-[1.8rem] flex items-center justify-center text-4xl font-black shadow-2xl">{sala.numeroSala}</div>
                    <span className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#fbbf24]">{sala.listaAlunos?.length || 0} ALUNOS</span>
                 </div>
                 <div className="space-y-3 relative z-10">
                    <h4 className="text-3xl font-black text-white italic tracking-tighter leading-none group-hover:text-[#fbbf24] transition-colors">{sala.materia}</h4>
                    <p className="text-xs font-black text-white/30 uppercase tracking-[0.3em] italic">{sala.nomeProfessor}</p>
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#fbbf24]/5 rounded-full blur-[60px]" />
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
      "p-10 rounded-[3.5rem] border-2 flex flex-col gap-6 shadow-premium transition-all hover:scale-[1.02]",
      color === 'yellow' ? "bg-[#fbbf24]/5 border-[#fbbf24]/20" :
      color === 'blue' ? "bg-[#42a0f5]/5 border-[#42a0f5]/20" :
      color === 'green' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/10"
    )}>
       <div className={cn(
         "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl",
         color === 'yellow' ? "bg-[#fbbf24] text-black" :
         color === 'blue' ? "bg-[#42a0f5] text-black" :
         color === 'green' ? "bg-emerald-500 text-black" : "bg-white text-black"
       )}>
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">{label}</p>
          <p className="text-5xl font-black tracking-tighter italic">{value}</p>
       </div>
    </div>
  );
}