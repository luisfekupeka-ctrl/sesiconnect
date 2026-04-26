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
          { rotulo: 'Aulas', valor: totalOcupadas, icone: Clock, cor: 'text-on-surface-bright', bg: 'bg-cyan-900/30' },
          { rotulo: 'After School', valor: afterAtivo, icone: Sparkles, cor: 'text-accent-amber', bg: 'bg-amber-900/30' },
          { rotulo: 'Alunos', valor: totalAlunos, icone: UserCheck, cor: 'text-accent-emerald', bg: 'bg-emerald-900/30' },
          { rotulo: 'Ocorrências', valor: ocorrenciasHoje, icone: AlertTriangle, cor: 'text-accent-rose', bg: 'bg-rose-900/30' },
        ].map((m, i) => (
          <div key={i} className="bg-surface p-5 md:p-7 rounded-2xl border border-cyan-900 flex items-center justify-between">
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
      <div className="bg-surface border-2 border-dashed border-cyan-800 rounded-2xl p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-cyan-900/30 text-on-surface-bright rounded-2xl flex items-center justify-center border border-cyan-800">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Próxima Transição</p>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-on-surface-bright">{estadoEscola.rotuloProximaTransicao}</h3>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Horário</p>
          <p className="text-3xl md:text-5xl font-black text-accent-amber tracking-tight">{estadoEscola.proximaTransicao}</p>
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
                className="p-2 bg-surface rounded-xl active:scale-95 transition-all"
                disabled={paginaAtual === 1}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-bold px-2">{paginaAtual}/{totalPaginas}</span>
              <button 
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} 
                className="p-2 bg-surface rounded-xl active:scale-95 transition-all"
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
              <div key={sala.numeroSala} className="bg-surface p-6 md:p-7 rounded-2xl border border-cyan-900 group hover:border-accent-cyan transition-all">
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 bg-cyan-900/30 rounded-2xl flex items-center justify-center text-on-surface-bright group-hover:bg-cyan-900/50 transition-all">
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
                    <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                      <Users size={14} />
                    </div>
                    <span className="text-sm font-semibold text-on-surface-variant">{sala.professorAtual}</span>
                  </div>
                  <div className="pt-3 border-t border-cyan-900 flex justify-between items-center">
                    <span className="text-xs font-bold bg-surface-container-high px-3 py-1.5 rounded-lg uppercase tracking-wider">{sala.turmaAtual}</span>
                    <span className="text-xs font-bold text-accent-amber">{sala.horarioFim}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border-2 border-dashed border-cyan-800 rounded-2xl p-12 md:p-16 text-center">
            <p className="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Nenhuma aula em andamento.</p>
          </div>
        )}
      </section>

      {/* Mapa de Ocupação */}
      <section className="bg-surface/50 p-6 md:p-8 rounded-2xl border border-cyan-900">
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-5">Mapa de Ocupação</h3>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {estadoEscola.salas.map((sala) => (
            <div
              key={sala.numeroSala}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                sala.estaOcupada 
                  ? "bg-accent-amber text-gray-900 border border-amber-400 scale-105" 
                  : "bg-surface text-on-surface-variant/40 border border-cyan-900"
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