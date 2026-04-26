import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, Users, DoorOpen, ChevronLeft, ChevronRight, 
  Activity, AlertTriangle, Sparkles, UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';

const TAMANHO_PAGINA = 8;

export default function Dashboard() {
  const { estadoEscola, horaAtual, salas, professores, atividadesAfter, monitores, ocorrencias, alunos } = useEscola();
  const [paginaAtual, setPaginaAtual] = useState(1);

  const salasOcupadas = estadoEscola.salas.filter(s => s.estaOcupada);
  const totalOcupadas = salasOcupadas.length;
  const afterAtivo = atividadesAfter.length;
  const totalAlunos = alunos.length;
  const ocorrenciasHoje = ocorrencias.length;

  const totalPaginas = Math.ceil(salasOcupadas.length / TAMANHO_PAGINA) || 1;
  const salasExibidas = salasOcupadas.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA);

  const diaSemanaExtenso = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(horaAtual);
  const horaFormatada = horaAtual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Título */}
      <header>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface-bright">Agora</h1>
        <p className="text-on-surface-variant font-semibold mt-1 capitalize text-base">
          {diaSemanaExtenso} • {horaFormatada}
        </p>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[
          { rotulo: 'Aulas', valor: totalOcupadas, icone: Clock, cor: 'text-blue-400', bg: 'bg-blue-500/15' },
          { rotulo: 'After School', valor: afterAtivo, icone: Sparkles, cor: 'text-amber-400', bg: 'bg-amber-500/15' },
          { rotulo: 'Alunos', valor: totalAlunos, icone: UserCheck, cor: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { rotulo: 'Ocorrências', valor: ocorrenciasHoje, icone: AlertTriangle, cor: 'text-rose-400', bg: 'bg-rose-500/15' },
        ].map((m, i) => (
          <div key={i} className="bg-surface-container-lowest p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-outline/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{m.rotulo}</p>
              <p className="text-2xl md:text-4xl font-black text-on-surface-bright">{m.valor}</p>
            </div>
            <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center", m.bg, m.cor)}>
              <m.icone size={24} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Próxima Transição */}
      <div className="bg-primary/8 border-2 border-dashed border-primary/25 rounded-2xl p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Próxima Transição</p>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-on-surface-bright">{estadoEscola.rotuloProximaTransicao}</h3>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Horário</p>
          <p className="text-3xl md:text-5xl font-black text-primary tracking-tight">{estadoEscola.proximaTransicao}</p>
        </div>
      </div>

      {/* Salas Ocupadas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-on-surface-bright">
            Salas Ocupadas
          </h2>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} 
                className="p-2 bg-surface-container-low rounded-xl active:scale-95 transition-all"
                disabled={paginaAtual === 1}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-bold px-2">{paginaAtual}/{totalPaginas}</span>
              <button 
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} 
                className="p-2 bg-surface-container-low rounded-xl active:scale-95 transition-all"
                disabled={paginaAtual === totalPaginas}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {salasExibidas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {salasExibidas.map((sala) => (
              <div key={sala.numeroSala} className="bg-surface-container-lowest p-6 md:p-7 rounded-2xl border border-outline/10 group hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                     <DoorOpen size={24} />
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Sala</p>
                     <p className="text-xl font-black">{sala.numeroSala.toString().padStart(2, '0')}</p>
                   </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Disciplina</p>
                    <h3 className="text-base font-bold leading-tight text-on-surface-bright">{sala.materiaAtual}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                      <Users size={14} />
                    </div>
                    <span className="text-sm font-semibold text-on-surface-variant">{sala.professorAtual}</span>
                  </div>
                  <div className="pt-3 border-t border-outline/10 flex justify-between items-center">
                    <span className="text-xs font-bold bg-surface-container-low px-3 py-1.5 rounded-lg uppercase tracking-wider">{sala.turmaAtual}</span>
                    <span className="text-xs font-bold text-primary">{sala.horarioFim}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border-2 border-dashed border-outline/15 rounded-2xl p-12 md:p-16 text-center">
            <p className="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Nenhuma aula em andamento.</p>
          </div>
        )}
      </section>

      {/* Mapa de Ocupação */}
      <section className="bg-surface-container-low/30 p-6 md:p-8 rounded-2xl border border-outline/10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-5">Mapa de Ocupação</h3>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {estadoEscola.salas.map((sala) => (
            <div
              key={sala.numeroSala}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                sala.estaOcupada 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105" 
                  : "bg-surface-container-lowest text-on-surface-variant/40 border border-outline/10"
              )}
            >
              {sala.numeroSala}
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}