import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DoorOpen, Clock, Users, GraduationCap, AlertTriangle, Search, ChevronLeft, ChevronRight, UserCheck, ChevronDown, ClipboardCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { Sala } from '../types';

const DIAS_SEMANA_NOMES: Record<string, string> = {
  'DOMINGO': 'Dom', 'SEGUNDA': 'Seg', 'TERÇA': 'Ter', 'QUARTA': 'Qua', 'QUINTA': 'Qui', 'SEXTA': 'Sex', 'SÁBADO': 'Sáb'
};
const LISTA_DIAS = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

export default function RoomsPage() {
  const { salas, estadoEscola, gradeCompleta, languageLab, atividadesAfter, horaAtual, periodos } = useEscola();
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'livres' | 'ocupadas'>('todas');
  const [busca, setBusca] = useState('');
  const [diaGrade, setDiaGrade] = useState(obterDiaSemana(horaAtual));
  const [salaGradeModal, setSalaGradeModal] = useState<Sala | null>(null);
  const [buscaAlunosModal, setBuscaAlunosModal] = useState('');

  const salasFiltradas = useMemo(() => {
    return salas.filter((sala) => {
      const coincideBusca = sala.nome.toLowerCase().includes(busca.toLowerCase()) || sala.numero.toString().includes(busca);
      const estadoSala = estadoEscola.salas.find((s) => s.numeroSala === sala.numero);
      const ocupada = estadoSala?.estaOcupada || false;
      const coincideStatus = filtroStatus === 'todas' || (filtroStatus === 'ocupadas' && ocupada) || (filtroStatus === 'livres' && !ocupada);
      return coincideBusca && coincideStatus;
    });
  }, [salas, busca, filtroStatus, estadoEscola.salas]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-32">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface mb-2 italic">Ambientes <span className="text-[#42a0f5] italic">& Salas</span></h1>
          <p className="text-on-surface-variant text-lg font-medium italic">Consulta nominal de ensalamento por bloco de horário.</p>
        </div>
        <div className="relative group w-full lg:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5] transition-colors" size={20} />
          <input
            type="text"
            placeholder="Achar sala..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-surface-container-low border-none rounded-[2rem] text-on-surface font-black text-sm focus:ring-4 focus:ring-[#42a0f5]/10 shadow-inner"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {salasFiltradas.map((sala) => {
          const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
          const ocupada = estadoSala?.estaOcupada || false;
          const aulaAtual = estadoSala?.aulaAtual;
          const alunosNoBloco = estadoSala?.listaAlunos || [];

          return (
            <motion.div
              key={sala.numero}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSalaGradeModal(sala)}
              className={cn(
                "bg-[#0d1117] rounded-[3rem] shadow-2xl p-8 cursor-pointer group border-2 transition-all relative overflow-hidden",
                ocupada ? "border-[#42a0f5]/30 shadow-[#42a0f5]/5" : "border-[#30363d] hover:border-[#42a0f5]/20"
              )}
            >
               <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner",
                    ocupada ? "bg-[#42a0f5] text-black" : "bg-[#42a0f5]/10 text-[#42a0f5]"
                  )}>
                    {sala.numero}
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest",
                    ocupada ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" : "bg-white/5 text-on-surface-variant opacity-40"
                  )}>
                    {ocupada ? '● EM AULA' : 'DISPONÍVEL'}
                  </div>
               </div>

               <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white tracking-tighter leading-tight mb-1 italic group-hover:text-[#42a0f5] transition-colors">{sala.nome}</h3>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40">{sala.segmento}</p>
               </div>
               
               {ocupada && aulaAtual && (
                 <div className="mt-8 pt-6 border-t border-white/5 space-y-4 relative z-10">
                    <div>
                       <p className="text-[9px] font-black uppercase text-[#42a0f5] tracking-widest mb-1">Aula Atual</p>
                       <h4 className="text-lg font-black text-white italic truncate leading-none">{aulaAtual.materia}</h4>
                       <p className="text-[11px] font-bold text-on-surface-variant opacity-60 truncate">{aulaAtual.professor}</p>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest opacity-40">{alunosNoBloco.length} Alunos</p>
                       <div className="flex flex-wrap gap-1">
                          {alunosNoBloco.slice(0, 3).map((aluno, i) => (
                            <span key={i} className="text-[9px] font-black bg-white/5 px-2 py-1 rounded-lg text-on-surface-variant italic truncate max-w-[80px]">
                               {aluno.split(' ')[0]}
                            </span>
                          ))}
                          {alunosNoBloco.length > 3 && (
                            <span className="text-[9px] font-black text-[#42a0f5]">+ {alunosNoBloco.length - 3}</span>
                          )}
                       </div>
                    </div>
                 </div>
               )}

               {!ocupada && (
                 <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between opacity-30">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                      <Clock size={14} /> Grade Semanal
                    </span>
                    <ChevronRight size={18} className="text-outline group-hover:translate-x-2 transition-all" />
                 </div>
               )}

               <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#42a0f5]/5 rounded-full blur-3xl" />
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {salaGradeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0d1117] w-full max-w-6xl rounded-[4rem] border border-[#30363d] shadow-[0_50px_150px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div className="p-12 bg-[#42a0f5] text-white relative">
                <button onClick={() => setSalaGradeModal(null)} className="absolute top-10 right-10 w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all text-3xl font-light">✕</button>
                <div className="flex items-center gap-10">
                   <div className="w-32 h-32 bg-white/20 rounded-[3rem] flex items-center justify-center text-6xl font-black shadow-2xl">
                     {salaGradeModal.numero}
                   </div>
                   <div>
                     <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-70 mb-2">Consulta de Ensalamento por Bloco</p>
                     <h2 className="text-6xl font-black tracking-tighter italic leading-none">{salaGradeModal.nome}</h2>
                     <p className="text-lg font-bold opacity-80 mt-4 italic">{salaGradeModal.segmento} • {salaGradeModal.ano || 'Matriz de Salas'}</p>
                   </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col p-12 space-y-10 bg-surface-container-lowest">
                 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="flex gap-2 p-2 bg-surface-container-low rounded-[2rem] border border-[#30363d] w-fit">
                       {LISTA_DIAS.map(dia => (
                          <button
                            key={dia}
                            onClick={() => setDiaGrade(dia)}
                            className={cn(
                              "px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                              diaGrade === dia ? "bg-[#42a0f5] text-black shadow-xl" : "text-on-surface-variant hover:bg-white/5"
                            )}
                          >
                            {dia}
                          </button>
                       ))}
                    </div>
                    <div className="relative group flex-1 max-w-[350px]">
                       <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5] transition-all" />
                       <input 
                        type="text"
                        placeholder="Pesquisar aluno..."
                        value={buscaAlunosModal}
                        onChange={(e) => setBuscaAlunosModal(e.target.value)}
                        className="w-full pl-14 pr-8 py-5 bg-surface-container-low border-none rounded-[2rem] text-sm font-black focus:ring-8 focus:ring-[#42a0f5]/5 shadow-inner"
                       />
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pr-4 custom-scrollbar pb-10">
                    {obterBlocosDeHorario(periodos).map(bloco => (
                      <BlocoHorarioSala 
                        key={bloco.indice}
                        bloco={bloco}
                        salaGradeModal={salaGradeModal}
                        diaGrade={diaGrade}
                        gradeCompleta={gradeCompleta}
                        languageLab={languageLab}
                        atividadesAfter={atividadesAfter}
                      />
                    ))}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BlocoHorarioSala({ bloco, salaGradeModal, diaGrade, gradeCompleta, languageLab, atividadesAfter }: any) {
  const [expandido, setExpandido] = useState(false);
  const [busca, setBusca] = useState('');

  const range = `${bloco.inicio} - ${bloco.fim}`;
  const entradasDia = gradeCompleta.filter((e: any) => e.numeroSala === salaGradeModal.numero && e.diaSemana === diaGrade);
  const entradaRegular = entradasDia.find((e: any) => e.horario === range);
  
  const lab = languageLab.find((l: any) => l.sala.includes(salaGradeModal.numero.toString()) && l.diaSemana === diaGrade && l.horarioInicio <= bloco.inicio && l.horarioFim >= bloco.fim);
  const after = atividadesAfter.find((a: any) => a.local.includes(salaGradeModal.numero.toString()) && a.dias.includes(diaGrade) && a.horarioInicio <= bloco.inicio && a.horarioFim >= bloco.fim);

  let entradaFinal: any = null;
  let alunosNoBloco: string[] = [];
  let tipo = 'regular';

  if (entradaRegular && (entradaRegular.tipo === 'after_school' || entradaRegular.tipo === 'language_lab')) {
     tipo = entradaRegular.tipo;
  } else if (after) tipo = 'after_school';
  else if (lab) tipo = 'language_lab';

  if (tipo === 'after_school' && (after || entradaRegular)) {
     entradaFinal = { materia: entradaRegular?.materia || after?.nome, prof: entradaRegular?.nomeProfessor || after?.nomeProfessor };
     alunosNoBloco = after?.listaAlunos || entradaRegular?.listaAlunos || [];
  } else if (tipo === 'language_lab' && (lab || entradaRegular)) {
     entradaFinal = { materia: entradaRegular?.materia || `Inglês: ${lab?.nivel}`, prof: entradaRegular?.nomeProfessor || lab?.professor };
     alunosNoBloco = lab?.listaAlunos || entradaRegular?.listaAlunos || [];
  } else if (entradaRegular) {
     entradaFinal = { materia: entradaRegular.materia, prof: entradaRegular.nomeProfessor };
     alunosNoBloco = entradaRegular.listaAlunos || [];
  }

  if (!entradaFinal) return (
     <div key={bloco.indice} className="p-12 rounded-[4rem] bg-white/[0.02] border-2 border-dashed border-white/5 opacity-20 flex flex-col items-center justify-center gap-4 group hover:opacity-40 transition-all h-fit">
        <span className="text-[11px] font-black uppercase tracking-[0.4em] mb-2">{bloco.inicio} — {bloco.fim}</span>
        <p className="text-sm font-black uppercase tracking-[0.3em] italic">Ambiente Disponível</p>
     </div>
  );

  const alunosFiltrados = alunosNoBloco.filter(a => a.toLowerCase().includes(busca.toLowerCase()));
  const isActive = entradaFinal.materia && entradaFinal.materia !== 'A DEFINIR';

  return (
     <motion.div 
       layout
       onClick={() => isActive && setExpandido(!expandido)}
       className={cn(
        "p-10 rounded-[4rem] border-2 transition-all flex flex-col gap-8 shadow-2xl relative overflow-hidden group cursor-pointer h-fit",
        !isActive ? "bg-white/[0.02] border-dashed border-white/5 opacity-20" :
        tipo === 'after_school' ? "bg-amber-500/[0.03] border-amber-500/20 shadow-amber-500/5" : 
        tipo === 'language_lab' ? "bg-indigo-500/[0.03] border-indigo-500/20 shadow-indigo-500/5" : 
        "bg-surface-container-low/40 border-[#30363d] shadow-black/40",
        expandido && "border-[#42a0f5] bg-[#42a0f5]/5"
      )}
     >
        <div className="flex justify-between items-center relative z-10">
           <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-[#42a0f5] animate-pulse shadow-[0_0_10px_rgba(66,160,245,0.5)]" : "bg-white/20")} />
              <span className="text-[12px] font-black uppercase tracking-[0.3em] opacity-50">{bloco.inicio} — {bloco.fim}</span>
           </div>
           {isActive && (
             <span className={cn(
               "text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border shadow-sm",
               tipo === 'after_school' ? "bg-amber-500/20 text-amber-500 border-amber-500/20" :
               tipo === 'language_lab' ? "bg-indigo-500/20 text-indigo-500 border-indigo-500/20" : 
               "bg-[#42a0f5]/20 text-[#42a0f5] border-[#42a0f5]/20"
             )}>{tipo === 'regular' ? 'Aula Regular' : tipo.replace('_', ' ').toUpperCase()}</span>
           )}
        </div>
        
        <div className="relative z-10">
           <h4 className="text-3xl font-black text-white italic tracking-tighter leading-none mb-3 group-hover:text-[#42a0f5] transition-colors">{entradaFinal.materia}</h4>
           <div className="flex items-center gap-3 text-on-surface-variant">
              <div className="p-2 bg-white/5 rounded-xl"><UserCheck size={16} className="text-[#42a0f5]" /></div>
              <p className="text-sm font-black italic tracking-tight">{entradaFinal.prof}</p>
           </div>
        </div>

        {isActive && (
          <div className="pt-8 border-t border-white/5 space-y-6 relative z-10">
             <div className="flex justify-between items-center">
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#42a0f5] flex items-center gap-2">
                  <Users size={14} /> {alunosNoBloco.length} Alunos Ensalados
                  <ChevronDown size={14} className={cn("transition-transform", expandido && "rotate-180")} />
                </div>
                {expandido && (
                  <div className="relative group w-32" onClick={(e) => e.stopPropagation()}>
                     <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                     <input 
                       type="text" 
                       placeholder="Buscar..."
                       value={busca}
                       onChange={(e) => setBusca(e.target.value)}
                       className="w-full pl-8 pr-2 py-2 bg-white/5 border-none rounded-xl text-[9px] font-black outline-none focus:ring-2 focus:ring-[#42a0f5]/20"
                     />
                  </div>
                )}
             </div>
             
             <AnimatePresence>
               {expandido && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden"
                 >
                    <div className="max-h-[160px] overflow-y-auto pr-3 custom-scrollbar grid gap-3 pb-4">
                       {alunosFiltrados.length === 0 ? (
                          <p className="text-[10px] italic opacity-30 text-center py-6">Nenhum aluno encontrado.</p>
                       ) : (
                         alunosFiltrados.map((aluno, i) => (
                           <motion.div 
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             key={i} 
                             className="text-[12px] font-black py-4 px-6 bg-white/[0.03] rounded-[1.5rem] flex items-center justify-between group/item hover:bg-[#42a0f5] hover:text-black transition-all border border-white/5"
                           >
                              <span className="italic tracking-tight">{aluno}</span>
                              <span className="text-[9px] opacity-30 font-black group-hover/item:opacity-60">#{i+1}</span>
                           </motion.div>
                         ))
                       )}
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Iniciando chamada digital para ' + entradaFinal.materia);
                      }}
                      className="w-full py-5 bg-[#42a0f5] text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl mt-2 shadow-xl shadow-[#42a0f5]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       <ClipboardCheck size={18} /> Registrar Chamada
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}

        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#42a0f5]/5 rounded-full blur-[80px] group-hover:bg-[#42a0f5]/10 transition-all" />
     </motion.div>
  );
}
