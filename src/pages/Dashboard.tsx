import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, DoorOpen, ChevronLeft, ChevronRight, 
  Sparkles, UserCheck, Search, Activity, User, ArrowRight, Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const TAMANHO_PAGINA = 10;

export default function Dashboard() {
  const { gradeCompleta, locaisCMS, horaAtual, alunos } = useEscola();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [salaSelecionada, setSalaSelecionada] = useState<number | null>(null);
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [buscaAlunoModal, setBuscaAlunoModal] = useState('');

  // Filtrar apenas o que está acontecendo AGORA para o grid principal
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

  const diaSemanaExtenso = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(horaAtual);
  const horaFormatada = horaAtual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Omni-Search: Busca em toda a grade semanal (Estratégia Minimalista)
  const resultadosBusca = useMemo(() => {
    if (buscaGlobal.length < 3) return [];
    
    const termo = buscaGlobal.toLowerCase();
    const encontrados: any[] = [];
    const nomesProcessados = new Set();

    gradeCompleta.forEach(slot => {
      // 1. Busca por nome de aluno
      const alunosNoSlot = (slot.listaAlunos || []).filter(a => a.toLowerCase().includes(termo));
      
      alunosNoSlot.forEach(aluno => {
        const key = `${aluno}-${slot.diaSemana}-${slot.horario}`;
        if (!nomesProcessados.has(key)) {
          encontrados.push({
            tipo: 'aluno',
            nome: aluno,
            local: slot.numeroSala,
            atividade: slot.materia,
            professor: slot.nomeProfessor,
            dia: slot.diaSemana,
            horario: slot.horario,
            tipoAtiv: slot.tipo
          });
          nomesProcessados.add(key);
        }
      });

      // 2. Busca por sala ou matéria (apenas se não houver muitos alunos encontrados)
      if (encontrados.length < 10) {
        if (slot.materia.toLowerCase().includes(termo) || slot.numeroSala.toString() === termo) {
           const key = `local-${slot.numeroSala}-${slot.diaSemana}-${slot.horario}`;
           if (!nomesProcessados.has(key)) {
             encontrados.push({
               tipo: 'local',
               nome: slot.materia,
               local: slot.numeroSala,
               professor: slot.nomeProfessor,
               dia: slot.diaSemana,
               horario: slot.horario,
               tipoAtiv: slot.tipo
             });
             nomesProcessados.add(key);
           }
        }
      }
    });

    return encontrados.sort((a, b) => a.nome.localeCompare(b.nome)).slice(0, 15);
  }, [buscaGlobal, gradeCompleta]);

  const modalSala = useMemo(() => {
    if (!salaSelecionada) return null;
    const slot = gradeAgora.find(g => g.numeroSala === salaSelecionada);
    const local = locaisCMS.find(l => l.numero === salaSelecionada);
    const alunosFiltrados = (slot?.listaAlunos || []).filter(a => 
      a.toLowerCase().includes(buscaAlunoModal.toLowerCase())
    );
    return { slot, local, alunosFiltrados };
  }, [salaSelecionada, gradeAgora, locaisCMS, buscaAlunoModal]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-32"
    >
      <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
        <div>
           <h1 className="text-5xl font-black tracking-tighter text-[#42a0f5] flex items-center gap-4 italic uppercase">
             <Activity className="w-12 h-12" /> Central <span className="text-white">de Consultas</span>
           </h1>
           <p className="text-on-surface-variant font-black mt-2 uppercase tracking-[0.3em] text-[10px] opacity-50 flex items-center gap-2">
             <Calendar size={14} /> {diaSemanaExtenso} • {horaFormatada} • Campus Inteligente
           </p>
        </div>

        {/* Omni-Search: A ferramenta principal */}
        <div className="relative w-full xl:w-[500px] group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-outline group-focus-within:text-[#42a0f5] transition-all" />
          </div>
          <input 
            type="text"
            placeholder="Nome do Aluno, Sala ou Oficina..."
            value={buscaGlobal}
            onChange={(e) => setBuscaGlobal(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-surface-container-low border-none rounded-[2.5rem] text-base font-black focus:ring-8 focus:ring-[#42a0f5]/5 shadow-2xl transition-all placeholder:text-outline/40"
          />

          {/* Resultados da Busca Global - Semanal */}
          <AnimatePresence>
            {buscaGlobal.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-full mt-4 left-0 w-full bg-[#0d1117] rounded-[3rem] border border-[#30363d] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[100] overflow-hidden p-4"
              >
                <div className="p-4 border-b border-white/5 mb-2 flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#42a0f5]">Resultados da Grade Semanal</span>
                   <span className="text-[10px] font-black opacity-40">{resultadosBusca.length} encontrados</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2 p-2">
                   {resultadosBusca.map((res, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-5 p-5 hover:bg-white/5 rounded-3xl cursor-default transition-all group border border-transparent hover:border-white/5"
                      >
                         <div className={cn(
                           "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                           res.tipo === 'aluno' ? "bg-[#42a0f5]/10 text-[#42a0f5]" : "bg-emerald-500/10 text-emerald-500"
                         )}>
                            {res.tipo === 'aluno' ? <User size={24} /> : <DoorOpen size={24} />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                               <p className="font-black text-lg text-white truncate italic tracking-tight">{res.nome}</p>
                               <span className={cn(
                                 "text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                                 res.tipoAtiv === 'after_school' ? "bg-amber-500/20 text-amber-500" :
                                 res.tipoAtiv === 'language_lab' ? "bg-indigo-500/20 text-indigo-500" : "bg-[#42a0f5]/20 text-[#42a0f5]"
                               )}>
                                 {res.tipoAtiv === 'regular' ? 'Aula' : res.tipoAtiv.replace('_', ' ')}
                               </span>
                            </div>
                            <div className="flex items-center gap-3 text-on-surface-variant font-bold text-[10px] uppercase tracking-tighter">
                               <span className="flex items-center gap-1"><Calendar size={10} /> {res.dia}</span>
                               <span className="flex items-center gap-1"><Clock size={10} /> {res.horario}</span>
                               <span className="flex items-center gap-1 text-white/60"><DoorOpen size={10} /> Sala {res.local}</span>
                            </div>
                         </div>
                      </div>
                   ))}
                   {resultadosBusca.length === 0 && (
                      <div className="p-20 text-center opacity-20 italic font-black text-sm">Nenhum registro encontrado na grade semanal</div>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Grid Principal: O que está rolando AGORA */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
           <h2 className="text-2xl font-black tracking-tighter italic flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#42a0f5] animate-pulse" />
              Ambientes <span className="text-[#42a0f5]">Ativos Agora</span>
           </h2>
           {totalPaginas > 1 && (
             <div className="flex items-center gap-4">
                <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-3 bg-surface-container-low rounded-2xl disabled:opacity-20 transition-all"><ChevronLeft size={20} /></button>
                <span className="text-[10px] font-black uppercase tracking-widest">{paginaAtual} de {totalPaginas}</span>
                <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-3 bg-surface-container-low rounded-2xl disabled:opacity-20 transition-all"><ChevronRight size={20} /></button>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {salasExibidas.map((sala) => (
            <motion.div
              key={sala.id}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => { setSalaSelecionada(sala.numeroSala); setBuscaAlunoModal(''); }}
              className={cn(
                "relative group p-8 rounded-[3rem] border border-[#30363d] bg-surface-container-lowest hover:border-[#42a0f5] transition-all cursor-pointer shadow-2xl",
                sala.tipo === 'language_lab' ? "hover:border-indigo-500" :
                sala.tipo === 'after_school' ? "hover:border-amber-500" : ""
              )}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-inner",
                  sala.tipo === 'language_lab' ? "bg-indigo-500/20 text-indigo-400" :
                  sala.tipo === 'after_school' ? "bg-amber-500/20 text-amber-400" : "bg-[#42a0f5]/20 text-[#42a0f5]"
                )}>
                  {sala.numeroSala}
                </div>
                <div className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase bg-white/5 border border-white/5 text-on-surface-variant">
                   {sala.listaAlunos?.length || 0} ALUNOS
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-2xl font-black text-white truncate italic tracking-tighter leading-tight">{sala.materia}</p>
                <div className="flex items-center gap-3 pt-6 border-t border-white/5 opacity-60">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[11px] font-black text-[#42a0f5]">
                      {sala.nomeProfessor[0]}
                   </div>
                   <p className="text-sm font-black truncate">{sala.nomeProfessor}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MODAL DE ENSALAMENTO NOMINAL (DETALHADO) */}
      <AnimatePresence>
        {salaSelecionada && modalSala && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-[#0d1117] w-full max-w-2xl rounded-[4rem] border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_50px_150px_rgba(0,0,0,1)]"
            >
              <div className={cn(
                "p-12 text-white relative",
                modalSala.slot?.tipo === 'language_lab' ? "bg-indigo-600" :
                modalSala.slot?.tipo === 'after_school' ? "bg-amber-600" : "bg-[#42a0f5]"
              )}>
                <button 
                  onClick={() => { setSalaSelecionada(null); setBuscaAlunoModal(''); }}
                  className="absolute top-10 right-10 w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all text-3xl font-light"
                >✕</button>
                <div className="flex items-center gap-10">
                  <div className="w-32 h-32 bg-white/20 rounded-[3rem] flex items-center justify-center text-6xl font-black shadow-2xl">
                    {modalSala.local?.numero || modalSala.slot?.numeroSala}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-70 mb-2">Consulta de Ensalamento</p>
                    <h2 className="text-5xl font-black tracking-tighter leading-none italic">{modalSala.local?.nome || 'Sala ' + modalSala.slot?.numeroSala}</h2>
                    <p className="text-lg font-bold opacity-90 mt-4 italic">{modalSala.slot?.materia} • {modalSala.slot?.nomeProfessor}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-12 overflow-hidden flex flex-col bg-surface-container-lowest">
                <div className="flex items-center justify-between gap-8 mb-10">
                  <h3 className="text-3xl font-black tracking-tighter italic">Alunos Confirmados</h3>
                  <div className="relative group flex-1 max-w-[300px]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5]" size={20} />
                    <input 
                      type="text"
                      placeholder="Filtrar alunos..."
                      value={buscaAlunoModal}
                      onChange={(e) => setBuscaAlunoModal(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-[2rem] text-sm font-black focus:ring-8 focus:ring-[#42a0f5]/5 shadow-inner transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {modalSala.alunosFiltrados.map((aluno, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      key={idx} 
                      className="flex items-center gap-6 p-6 bg-surface-container-low/40 rounded-[2rem] hover:bg-[#42a0f5]/10 transition-all group border border-transparent hover:border-[#42a0f5]/20 shadow-sm"
                    >
                       <div className="w-12 h-12 bg-surface-container-high rounded-2xl flex items-center justify-center text-[11px] font-black text-on-surface-variant group-hover:bg-[#42a0f5] group-hover:text-black transition-all">
                          {idx + 1}
                       </div>
                       <span className="font-black text-xl text-on-surface-variant group-hover:text-white transition-colors italic tracking-tight">{aluno}</span>
                    </motion.div>
                  ))}
                  {modalSala.alunosFiltrados.length === 0 && (
                    <div className="py-20 text-center opacity-20 italic font-black">Nenhum aluno ensalado no momento</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}