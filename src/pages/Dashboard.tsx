import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, DoorOpen, ChevronLeft, ChevronRight, 
  Sparkles, UserCheck, Search, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const TAMANHO_PAGINA = 10;

export default function Dashboard() {
  const { gradeProcessada, locaisCMS, horaAtual, alunos } = useEscola();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [salaSelecionada, setSalaSelecionada] = useState<number | null>(null);
  const [buscaAluno, setBuscaAluno] = useState('');

  const salasOcupadas = gradeProcessada.filter(s => s.numeroSala > 0);
  const totalPaginas = Math.ceil(salasOcupadas.length / TAMANHO_PAGINA) || 1;
  const salasExibidas = salasOcupadas.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA);

  const diaSemanaExtenso = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(horaAtual);
  const horaFormatada = horaAtual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const modalSala = useMemo(() => {
    if (!salaSelecionada) return null;
    const slot = gradeProcessada.find(g => g.numeroSala === salaSelecionada);
    const local = locaisCMS.find(l => l.numero === salaSelecionada);
    const alunosFiltrados = (slot?.listaAlunos || []).filter(a => 
      a.toLowerCase().includes(buscaAluno.toLowerCase())
    );
    return { slot, local, alunosFiltrados };
  }, [salaSelecionada, gradeProcessada, locaisCMS, buscaAluno]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tighter text-[#42a0f5] flex items-center gap-3">
             <Activity className="animate-pulse" /> Agora no Colégio
           </h1>
           <p className="text-on-surface-variant font-bold mt-1 capitalize">
             {diaSemanaExtenso} • {horaFormatada}
           </p>
        </div>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { rotulo: 'Salas em Aula', valor: salasOcupadas.length, icone: DoorOpen, cor: 'text-[#42a0f5]', bg: 'bg-[#42a0f5]/10' },
          { rotulo: 'After School', valor: gradeProcessada.filter(s => s.tipo === 'after_school').length, icone: Sparkles, cor: 'text-[#f1d86f]', bg: 'bg-[#f1d86f]/10' },
          { rotulo: 'Alunos no Campus', valor: alunos.length, icone: UserCheck, cor: 'text-[#0aeb7a]', bg: 'bg-[#0aeb7a]/10' },
        ].map((m, i) => (
          <div key={i} className="bg-surface p-6 rounded-3xl border border-[#30363d] flex items-center justify-between shadow-lg shadow-black/20">
            <div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">{m.rotulo}</p>
              <p className="text-3xl font-black text-white">{m.valor}</p>
            </div>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", m.bg, m.cor)}>
              <m.icone size={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Salas Ocupadas */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-black tracking-tight text-white italic">
            Monitoramento <span className="text-[#42a0f5]">de Salas</span>
          </h2>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} 
                className="p-3 bg-surface rounded-2xl active:scale-95 transition-all border border-[#30363d]"
                disabled={paginaAtual === 1}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-black px-4">{paginaAtual} de {totalPaginas}</span>
              <button 
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} 
                className="p-3 bg-surface rounded-2xl active:scale-95 transition-all border border-[#30363d]"
                disabled={paginaAtual === totalPaginas}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
          {salasExibidas.map((sala) => (
            <motion.div
              key={sala.id}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSalaSelecionada(sala.numeroSala)}
              className={cn(
                "relative group p-6 rounded-[2.5rem] border-2 border-[#30363d] bg-surface hover:border-[#42a0f5] transition-all shadow-2xl overflow-hidden cursor-pointer",
                sala.tipo === 'language_lab' ? "hover:border-indigo-500 shadow-indigo-500/10" :
                sala.tipo === 'after_school' ? "hover:border-amber-500 shadow-amber-500/10" : "shadow-blue-500/10"
              )}
            >
              <div className={cn(
                "absolute top-0 left-0 w-full h-1.5",
                sala.tipo === 'language_lab' ? "bg-indigo-500" :
                sala.tipo === 'after_school' ? "bg-amber-500" : "bg-[#42a0f5]"
              )} />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none mb-1">
                    #{sala.numeroSala.toString().padStart(2, '0')}
                  </h3>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                    sala.tipo === 'language_lab' ? "bg-indigo-500/20 text-indigo-400" :
                    sala.tipo === 'after_school' ? "bg-amber-500/20 text-amber-400" : "bg-[#42a0f5]/20 text-[#42a0f5]"
                  )}>
                    {sala.tipo === 'regular' ? 'EM AULA' : sala.tipo.replace('_', ' ')}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white/5 border-white/10 text-on-surface-variant flex items-center gap-1.5">
                  <UserCheck size={12} /> {sala.listaAlunos?.length || 0}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest block mb-1 opacity-50">Disciplina</label>
                  <p className="text-xl font-black text-white truncate italic tracking-tight">{sala.materia}</p>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#42a0f5] font-black text-sm shadow-inner">
                      {sala.nomeProfessor[0]}
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <label className="text-[8px] font-black uppercase text-on-surface-variant tracking-widest block mb-0.5 opacity-50">Professor</label>
                       <p className="text-sm font-black text-on-surface truncate group-hover:text-[#42a0f5] transition-all">
                        {sala.nomeProfessor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* MODAL DE ENSALAMENTO NOMINAL */}
        <AnimatePresence>
          {salaSelecionada && modalSala && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-[#0d1117] w-full max-w-2xl rounded-[3rem] border border-[#30363d] editorial-shadow overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                {/* Header do Modal */}
                <div className={cn(
                  "p-8 md:p-10 text-white relative",
                  modalSala.slot?.tipo === 'language_lab' ? "bg-indigo-600 shadow-[inset_0_-20px_50px_rgba(0,0,0,0.3)]" :
                  modalSala.slot?.tipo === 'after_school' ? "bg-amber-600 shadow-[inset_0_-20px_50px_rgba(0,0,0,0.3)]" : 
                  "bg-[#42a0f5] shadow-[inset_0_-20px_50px_rgba(0,0,0,0.3)]"
                )}>
                  <button 
                    onClick={() => { setSalaSelecionada(null); setBuscaAluno(''); }}
                    className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                  >
                    ✕
                  </button>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl">
                      {modalSala.local?.numero || modalSala.slot?.numeroSala}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Ensalamento Ativo Agora</p>
                      <h2 className="text-4xl font-black tracking-tighter leading-none italic">{modalSala.local?.nome || 'Sala ' + modalSala.slot?.numeroSala}</h2>
                    </div>
                  </div>

                  <div className="flex gap-8 mt-8 pt-8 border-t border-white/10">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Professor Responsável</p>
                      <p className="font-black text-xl italic">{modalSala.slot?.nomeProfessor}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Matéria / Atividade</p>
                      <p className="font-black text-xl italic">{modalSala.slot?.materia}</p>
                    </div>
                  </div>
                </div>

                {/* Lista de Alunos Pesquisável */}
                <div className="flex-1 p-8 md:p-10 overflow-hidden flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                      <DoorOpen size={24} className="text-[#42a0f5]" />
                      Lista de Alunos
                      <span className="text-xs bg-white/5 px-4 py-1.5 rounded-full text-on-surface-variant font-black border border-white/5">
                        {modalSala.slot?.listaAlunos?.length || 0} PRESENTES
                      </span>
                    </h3>
                    <div className="relative group flex-1 md:max-w-[250px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-[#42a0f5] transition-colors" size={18} />
                      <input 
                        type="text"
                        placeholder="Buscar por nome..."
                        value={buscaAluno}
                        onChange={(e) => setBuscaAluno(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-surface border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-[#42a0f5]/10 transition-all placeholder:text-on-surface-variant/30"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {modalSala.alunosFiltrados.map((aluno, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        key={idx} 
                        className="flex items-center gap-5 p-5 bg-surface rounded-[1.5rem] hover:bg-white/5 transition-all group border border-transparent hover:border-[#30363d]"
                      >
                         <div className="w-10 h-10 bg-[#1c2128] text-on-surface-variant rounded-xl flex items-center justify-center text-xs font-black group-hover:bg-[#42a0f5] group-hover:text-black transition-all shadow-inner">
                            {(idx + 1).toString().padStart(2, '0')}
                         </div>
                         <span className="font-black text-lg text-on-surface group-hover:text-white transition-colors">{aluno}</span>
                         <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <span className="px-3 py-1 bg-[#42a0f5]/10 text-[#42a0f5] text-[9px] font-black uppercase tracking-widest rounded-lg border border-[#42a0f5]/20">Verificado</span>
                         </div>
                      </motion.div>
                    ))}
                    {modalSala.alunosFiltrados.length === 0 && (
                      <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                        <Search size={48} />
                        <p className="font-black uppercase text-xs tracking-widest">Nenhum aluno encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Mapa de Ocupação Rápido */}
      <section className="bg-surface/30 p-8 rounded-[3rem] border border-[#30363d] backdrop-blur-xl">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-6 text-center opacity-50 italic">Mapa Visual de Ocupação do Campus</h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-3">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => {
            const ocupada = gradeProcessada.some(s => s.numeroSala === num);
            return (
              <div
                key={num}
                className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all shadow-lg",
                  ocupada 
                    ? "bg-[#42a0f5] text-black border-2 border-[#42a0f5]/50 scale-105 shadow-[#42a0f5]/20" 
                    : "bg-surface text-on-surface-variant/30 border border-[#30363d]"
                )}
              >
                {num}
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}