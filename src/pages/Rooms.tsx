import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, ChevronRight, UserCheck, ChevronDown, ClipboardCheck, Users, Clock, DoorOpen, LayoutGrid, CheckCircle2, XCircle } from 'lucide-react';
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
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="min-h-screen pb-20 px-2 md:px-8 pt-4 space-y-6">
        <div className="bg-[#0a0a0a] rounded-[1.5rem] md:rounded-[2rem] border border-white/5 overflow-hidden shadow-premium">
          <div className="p-6 md:p-8 bg-[#fbbf24] text-black relative">
             <button onClick={() => setSalaSelecionada(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20 transition-all"><ChevronLeft size={20} /></button>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-black text-[#fbbf24] rounded-2xl flex items-center justify-center text-3xl font-black">{salaSelecionada.numero}</div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-60 mb-1">Ensalamento</p>
                  <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic leading-none">{salaSelecionada.nome}</h2>
                  <p className="text-xs md:text-sm font-bold opacity-70 mt-2 italic">{salaSelecionada.segmento}</p>
                </div>
             </div>
          </div>
          <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest">
             <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex gap-1 p-1 bg-black rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                   {LISTA_DIAS.map(dia => (
                      <button key={dia} onClick={() => setDiaGrade(dia)}
                        className={cn("px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all",
                          diaGrade === dia ? "bg-[#fbbf24] text-black shadow-md" : "text-white/40 hover:bg-white/5")}>
                        {dia.slice(0, 3)}
                      </button>
                   ))}
                </div>
                <div className="relative group w-full md:w-64">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                   <input 
                    type="text" placeholder="Filtrar..." value={buscaAlunos} onChange={(e) => setBuscaAlunos(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black border border-white/5 rounded-xl text-[11px] font-black outline-none"
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {obterBlocosDeHorario(periodos).map(bloco => (
                  <BlocoHorarioSala key={bloco.indice} bloco={bloco} salaSelecionada={salaSelecionada} diaGrade={diaGrade} gradeCompleta={gradeCompleta} languageLab={languageLab} atividadesAfter={atividadesAfter} buscaFiltro={buscaAlunos} />
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
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full mb-3 border border-[#fbbf24]/20">
             <LayoutGrid size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest italic">Visão de Ambientes</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 italic leading-none">Salas <span className="text-[#fbbf24]">&</span> Ambientes</h1>
          <p className="text-white/40 text-sm md:text-lg font-medium italic border-l-4 border-[#fbbf24]/30 pl-4 max-w-xl">Monitoramento e ensalamento dinâmico.</p>
        </div>
        <div className="relative group w-full lg:w-[350px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fbbf24]" size={20} />
          <input
            type="text" placeholder="Achar sala..." value={busca} onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-12 pr-6 py-4 md:py-5 bg-[#0a0a0a] border-2 border-white/5 rounded-2xl md:rounded-[1.5rem] text-white font-black text-sm focus:ring-4 focus:ring-[#fbbf24]/5 outline-none"
          />
        </div>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {salasFiltradas.map((sala) => {
          const estadoSala = estadoEscola.salas.find(s => s.numeroSala === sala.numero);
          const ocupada = estadoSala?.estaOcupada || false;
          const aulaAtual = estadoSala?.aulaAtual;
          return (
            <motion.div key={sala.numero} whileHover={{ y: -5 }} onClick={() => setSalaSelecionada(sala)}
              className={cn("bg-[#0d0d0d] rounded-2xl md:rounded-[2rem] shadow-premium p-6 cursor-pointer group border-2 transition-all relative overflow-hidden flex flex-col justify-between min-h-[260px]",
                ocupada ? "border-[#fbbf24]/40" : "border-white/5 hover:border-[#fbbf24]/30")}>
               <div className="flex justify-between items-start relative z-10">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black transition-all",
                    ocupada ? "bg-[#fbbf24] text-black" : "bg-black text-[#fbbf24] group-hover:bg-[#fbbf24] group-hover:text-black")}>{sala.numero}</div>
                  <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                    ocupada ? "bg-[#fbbf24]/10 text-[#fbbf24]" : "bg-white/5 text-white/20")}>{ocupada ? '● EM AULA' : 'LIVRE'}</div>
               </div>
               <div className="relative z-10">
                  <h3 className="text-lg font-black text-white tracking-tighter leading-tight italic group-hover:text-[#fbbf24]">{sala.nome}</h3>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{sala.segmento}</p>
               </div>
               <div className="relative z-10 pt-4 border-t border-white/5">
                 {ocupada && aulaAtual ? (
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-white italic truncate max-w-[100px]">{aulaAtual.professor}</p>
                       <UserCheck size={16} className="text-[#fbbf24]" />
                    </div>
                 ) : (
                    <div className="flex items-center justify-between opacity-20 group-hover:opacity-100 transition-opacity">
                       <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Visualizar</span>
                       <ChevronRight size={16} className="text-[#fbbf24]" />
                    </div>
                 )}
               </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function BlocoHorarioSala({ bloco, salaSelecionada, diaGrade, gradeCompleta, languageLab, atividadesAfter, buscaFiltro }: any) {
  const [expandido, setExpandido] = useState(false);
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  const range = `${bloco.inicio} - ${bloco.fim}`;
  const entradasDia = gradeCompleta.filter((e: any) => e.numeroSala === salaSelecionada.numero && e.diaSemana === diaGrade);
  const entradaRegular = entradasDia.find((e: any) => e.horario === range);
  
  const lab = languageLab.find((l: any) => l.sala.includes(salaSelecionada.numero.toString()) && l.diaSemana === diaGrade && l.horarioInicio <= bloco.inicio && l.horarioFim >= bloco.fim);
  const after = atividadesAfter.find((a: any) => a.local.includes(salaSelecionada.numero.toString()) && a.dias.includes(diaGrade) && a.horarioInicio <= bloco.inicio && a.horarioFim >= bloco.fim);

  let entradaFinal: any = null;
  let alunosNoBloco: string[] = [];
  let tipo = 'regular';

  if (entradaRegular && (entradaRegular.tipo === 'after_school' || entradaRegular.tipo === 'language_lab')) tipo = entradaRegular.tipo;
  else if (after) tipo = 'after_school';
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
     <div className="p-6 rounded-2xl bg-black border-2 border-dashed border-white/5 opacity-20 flex flex-col items-center justify-center gap-2 h-fit">
        <span className="text-[9px] font-black uppercase opacity-60">{bloco.inicio} — {bloco.fim}</span>
        <p className="text-[8px] font-black uppercase tracking-[0.2em]">Disponível</p>
     </div>
  );

  const alunosFiltrados = alunosNoBloco.filter(a => a.toLowerCase().includes(buscaFiltro.toLowerCase()));
  const isActive = entradaFinal.materia && entradaFinal.materia !== 'A DEFINIR';

  const alternarPresenca = (aluno: string) => {
    setPresencas(prev => ({
      ...prev,
      [aluno]: prev[aluno] === undefined ? true : prev[aluno] === true ? false : true
    }));
  };

  return (
     <motion.div layout className={cn("p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-4 relative overflow-hidden h-fit shadow-premium",
        !isActive ? "bg-black border-dashed border-white/5 opacity-20" :
        tipo === 'after_school' ? "bg-[#fbbf24]/5 border-[#fbbf24]/20" : 
        tipo === 'language_lab' ? "bg-indigo-500/5 border-indigo-500/20" : "bg-[#0a0a0a] border-white/5",
        expandido && "border-[#fbbf24] bg-[#fbbf24]/10")}>
        <div className="flex justify-between items-center relative z-10">
           <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{bloco.inicio} — {bloco.fim}</span>
           {isActive && <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/10">{tipo.toUpperCase()}</span>}
        </div>
        <div className="relative z-10">
           <h4 className="text-lg font-black text-white italic tracking-tighter leading-tight group-hover:text-[#fbbf24]">{entradaFinal.materia}</h4>
           <p className="text-[10px] font-black italic opacity-60 text-[#fbbf24]">{entradaFinal.prof}</p>
        </div>
        {isActive && (
          <div className="pt-4 border-t border-white/5 space-y-4 relative z-10">
             <button onClick={() => setExpandido(!expandido)} className="w-full flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#fbbf24]">
                <span className="flex items-center gap-2"><Users size={14} /> {alunosNoBloco.length} Alunos</span>
                <ChevronDown size={14} className={cn("transition-transform duration-500", expandido && "rotate-180")} />
             </button>
             <AnimatePresence>
               {expandido && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4">
                    <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                       {alunosFiltrados.map((aluno, i) => (
                         <div key={i} onClick={() => alternarPresenca(aluno)}
                            className={cn("p-3 rounded-xl flex items-center justify-between border text-xs cursor-pointer",
                              presencas[aluno] === true ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                              presencas[aluno] === false ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-white/[0.03] border-white/5 text-white/60")}>
                            <span className="font-black italic">{aluno}</span>
                            <div className="flex items-center gap-2">{presencas[aluno] === true && <CheckCircle2 size={14} />}{presencas[aluno] === false && <XCircle size={14} />}</div>
                         </div>
                       ))}
                    </div>
                    <button onClick={() => alert('Chamada enviada!')} className="w-full py-3 bg-[#fbbf24] text-black text-[9px] font-black uppercase tracking-widest rounded-xl">Finalizar Chamada</button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}
     </motion.div>
  );
}
