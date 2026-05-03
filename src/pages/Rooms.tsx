import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, ChevronRight, UserCheck, ChevronDown, ClipboardCheck, Users, Clock, DoorOpen, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterBlocosDeHorario, obterDiaSemana } from '../services/motorEscolar';
import { Sala } from '../types';

const LISTA_DIAS = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

export default function RoomsPage() {
  const { salas, estadoEscola, gradeCompleta, languageLab, atividadesAfter, horaAtual, periodos } = useEscola();
  const [busca, setBusca] = useState('');
  const [diaGrade, setDiaGrade] = useState(obterDiaSemana(horaAtual));
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [buscaAlunos, setBuscaAlunos] = useState('');

  const salasFiltradas = useMemo(() => {
    return salas.filter((sala) => {
      const coincideBusca = sala.nome.toLowerCase().includes(busca.toLowerCase()) || sala.numero.toString().includes(busca);
      return coincideBusca;
    });
  }, [salas, busca]);

  if (salaSelecionada) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="min-h-screen pb-32 pt-2 md:pt-10 px-2 md:px-10 space-y-6 md:space-y-10"
      >
        {/* Painel Superior Minimalista */}
        <div className="bg-[#0a0a0a] rounded-[2.5rem] md:rounded-[4rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-8 md:p-12 bg-[#fbbf24] text-black relative">
             <button 
               onClick={() => setSalaSelecionada(null)}
               className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 md:w-16 md:h-16 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 transition-all"
             >
               <ChevronLeft size={24} className="md:size-32" />
             </button>

             <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-black text-[#fbbf24] rounded-[1.5rem] md:rounded-[3rem] flex items-center justify-center text-3xl md:text-6xl font-black shadow-2xl">
                  {salaSelecionada.numero}
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-1">Ensalamento Nominal</p>
                  <h2 className="text-3xl md:text-6xl font-black tracking-tighter italic leading-none">{salaSelecionada.nome}</h2>
                  <p className="text-sm md:text-lg font-bold opacity-70 mt-2 md:mt-4 italic">{salaSelecionada.segmento}</p>
                </div>
             </div>
          </div>

          <div className="p-6 md:p-12 space-y-8 md:space-y-12">
             <div className="flex flex-col xl:flex-row gap-6 md:items-center justify-between">
                {/* Seletor de Dia Compacto (Mobile Friendly) */}
                <div className="flex gap-1 p-1.5 bg-black rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar">
                   {LISTA_DIAS.map(dia => (
                      <button
                        key={dia}
                        onClick={() => setDiaGrade(dia)}
                        className={cn(
                          "px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                          diaGrade === dia ? "bg-[#fbbf24] text-black shadow-lg" : "text-white/40 hover:bg-white/5"
                        )}
                      >
                        {dia.slice(0, 3)}
                      </button>
                   ))}
                </div>
                
                <div className="relative group w-full xl:w-80">
                   <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#fbbf24]" />
                   <input 
                    type="text"
                    placeholder="Filtrar alunos..."
                    value={buscaAlunos}
                    onChange={(e) => setBuscaAlunos(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 md:py-5 bg-black border border-white/5 rounded-2xl text-xs md:text-sm font-black focus:ring-4 focus:ring-[#fbbf24]/10 shadow-inner outline-none"
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {obterBlocosDeHorario(periodos).map(bloco => (
                  <BlocoHorarioSala 
                    key={bloco.indice}
                    bloco={bloco}
                    salaSelecionada={salaSelecionada}
                    diaGrade={diaGrade}
                    gradeCompleta={gradeCompleta}
                    languageLab={languageLab}
                    atividadesAfter={atividadesAfter}
                    buscaFiltro={buscaAlunos}
                  />
                ))}
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 md:space-y-16 pb-32 px-4">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full mb-4 border border-[#fbbf24]/20">
             <LayoutGrid size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest italic">Visão de Ambientes</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-4 italic leading-none">
            Salas <span className="text-[#fbbf24]">&</span> Ambientes
          </h1>
          <p className="text-white/40 text-base md:text-2xl font-medium leading-relaxed italic max-w-2xl border-l-4 border-[#fbbf24]/30 pl-6 md:pl-10">
            Monitoramento de ocupação e ensalamento dinâmico. Clique para gerenciar presenças.
          </p>
        </div>
        
        <div className="relative group w-full lg:w-[450px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fbbf24] transition-colors" size={24} />
          <input
            type="text"
            placeholder="Achar sala..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-16 pr-8 py-6 md:py-8 bg-[#0a0a0a] border-2 border-white/5 rounded-[2rem] md:rounded-[3rem] text-white font-black text-lg md:text-xl focus:ring-8 focus:ring-[#fbbf24]/5 shadow-2xl outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
        {salasFiltradas.map((sala) => {
          const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
          const ocupada = estadoSala?.estaOcupada || false;
          const aulaAtual = estadoSala?.aulaAtual;

          return (
            <motion.div
              key={sala.numero}
              whileHover={{ y: -10, scale: 1.01 }}
              onClick={() => setSalaSelecionada(sala)}
              className={cn(
                "bg-[#0d0d0d] rounded-[3rem] md:rounded-[4rem] shadow-premium p-10 cursor-pointer group border-2 transition-all relative overflow-hidden flex flex-col justify-between min-h-[360px]",
                ocupada ? "border-[#fbbf24]/40" : "border-white/5 hover:border-[#fbbf24]/30"
              )}
            >
               <div className="flex justify-between items-start relative z-10">
                  <div className={cn(
                    "w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-4xl font-black shadow-2xl transition-all",
                    ocupada ? "bg-[#fbbf24] text-black" : "bg-black text-[#fbbf24] group-hover:bg-[#fbbf24] group-hover:text-black"
                  )}>
                    {sala.numero}
                  </div>
                  <div className={cn(
                    "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    ocupada ? "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20" : "bg-white/5 text-white/20"
                  )}>
                    {ocupada ? '● EM AULA' : 'LIVRE'}
                  </div>
               </div>

               <div className="relative z-10">
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2 italic group-hover:text-[#fbbf24] transition-colors">{sala.nome}</h3>
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">{sala.segmento}</p>
               </div>
               
               <div className="relative z-10 pt-8 border-t border-white/5">
                 {ocupada && aulaAtual ? (
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-[#fbbf24] tracking-widest opacity-60">Lecionando</p>
                          <p className="text-base font-bold text-white italic truncate max-w-[160px]">{aulaAtual.professor}</p>
                       </div>
                       <div className="w-12 h-12 bg-[#fbbf24]/10 rounded-2xl flex items-center justify-center">
                          <UserCheck size={20} className="text-[#fbbf24]" />
                       </div>
                    </div>
                 ) : (
                    <div className="flex items-center justify-between opacity-20 group-hover:opacity-100 transition-opacity">
                       <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Visualizar</span>
                       <ChevronRight size={24} className="text-[#fbbf24] group-hover:translate-x-2 transition-transform" />
                    </div>
                 )}
               </div>

               {/* Glow de Fundo */}
               <div className={cn(
                 "absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-[100px] transition-all duration-700",
                 ocupada ? "bg-[#fbbf24]/10" : "bg-white/5 group-hover:bg-[#fbbf24]/10"
               )} />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function BlocoHorarioSala({ bloco, salaSelecionada, diaGrade, gradeCompleta, languageLab, atividadesAfter, buscaFiltro }: any) {
  const [expandido, setExpandido] = useState(false);

  const range = `${bloco.inicio} - ${bloco.fim}`;
  const entradasDia = gradeCompleta.filter((e: any) => e.numeroSala === salaSelecionada.numero && e.diaSemana === diaGrade);
  const entradaRegular = entradasDia.find((e: any) => e.horario === range);
  
  const lab = languageLab.find((l: any) => l.sala.includes(salaSelecionada.numero.toString()) && l.diaSemana === diaGrade && l.horarioInicio <= bloco.inicio && l.horarioFim >= bloco.fim);
  const after = atividadesAfter.find((a: any) => a.local.includes(salaSelecionada.numero.toString()) && a.dias.includes(diaGrade) && a.horarioInicio <= bloco.inicio && a.horarioFim >= bloco.fim);

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
     <div className="p-10 md:p-12 rounded-[2.5rem] md:rounded-[4rem] bg-black border-2 border-dashed border-white/5 opacity-20 flex flex-col items-center justify-center gap-4 transition-all h-fit">
        <span className="text-[11px] font-black uppercase tracking-[0.4em] mb-1">{bloco.inicio} — {bloco.fim}</span>
        <p className="text-xs font-black uppercase tracking-[0.3em] italic">Disponível</p>
     </div>
  );

  const alunosFiltrados = alunosNoBloco.filter(a => a.toLowerCase().includes(buscaFiltro.toLowerCase()));
  const isActive = entradaFinal.materia && entradaFinal.materia !== 'A DEFINIR';

  return (
     <motion.div 
       layout
       className={cn(
        "p-8 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border-2 transition-all flex flex-col gap-6 relative overflow-hidden h-fit shadow-premium",
        !isActive ? "bg-black border-dashed border-white/5 opacity-20" :
        tipo === 'after_school' ? "bg-[#fbbf24]/5 border-[#fbbf24]/20" : 
        tipo === 'language_lab' ? "bg-indigo-500/5 border-indigo-500/20" : 
        "bg-[#0a0a0a] border-white/5",
        expandido && "border-[#fbbf24] bg-[#fbbf24]/10"
      )}
     >
        <div className="flex justify-between items-center relative z-10">
           <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-[#fbbf24] animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.6)]" : "bg-white/20")} />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">{bloco.inicio} — {bloco.fim}</span>
           </div>
           {isActive && (
             <span className={cn(
               "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border",
               tipo === 'after_school' ? "bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/20" :
               tipo === 'language_lab' ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/20" : 
               "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20"
             )}>{tipo === 'regular' ? 'REGULAR' : tipo.replace('_', ' ').toUpperCase()}</span>
           )}
        </div>
        
        <div className="relative z-10">
           <h4 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter leading-none mb-3 group-hover:text-[#fbbf24] transition-colors">{entradaFinal.materia}</h4>
           <div className="flex items-center gap-3 opacity-60">
              <UserCheck size={16} className="text-[#fbbf24]" />
              <p className="text-sm font-black italic">{entradaFinal.prof}</p>
           </div>
        </div>

        {isActive && (
          <div className="pt-6 border-t border-white/5 space-y-4 relative z-10">
             <button 
               onClick={() => setExpandido(!expandido)}
               className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-[#fbbf24] hover:opacity-80 transition-opacity"
             >
                <span className="flex items-center gap-2"><Users size={16} /> {alunosNoBloco.length} Matriculados</span>
                <ChevronDown size={18} className={cn("transition-transform duration-500", expandido && "rotate-180")} />
             </button>
             
             <AnimatePresence>
               {expandido && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden space-y-4"
                 >
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar grid gap-2">
                       {alunosFiltrados.length === 0 ? (
                          <p className="text-[10px] italic opacity-30 text-center py-6">Nenhum aluno encontrado.</p>
                       ) : (
                         alunosFiltrados.map((aluno, i) => (
                           <div key={i} className="text-[13px] font-black py-4 px-6 bg-white/[0.03] rounded-2xl flex items-center justify-between border border-white/5 hover:bg-[#fbbf24] hover:text-black transition-all cursor-default">
                              <span className="italic">{aluno}</span>
                              <span className="text-[10px] opacity-30">#{i+1}</span>
                           </div>
                         ))
                       )}
                    </div>

                    <button 
                      onClick={() => alert('Lançando chamada para ' + entradaFinal.materia)}
                      className="w-full py-5 bg-[#fbbf24] text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-glow-yellow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       <ClipboardCheck size={20} /> Registrar Chamada Digital
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}

        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#fbbf24]/5 rounded-full blur-[80px]" />
     </motion.div>
  );
}
