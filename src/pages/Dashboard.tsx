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
  const { estadoEscola, horaAtual, salas, atividadesAfter, ocorrencias, alunos } = useEscola();
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
      <header>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#42a0f5]">Agora</h1>
        <p className="text-on-surface-variant font-semibold mt-1 capitalize text-base">
          {diaSemanaExtenso} • {horaFormatada}
        </p>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[
          { rotulo: 'Aulas', valor: totalOcupadas, icone: Clock, cor: 'text-[#42a0f5]', bg: 'bg-[#42a0f5]/10' },
          { rotulo: 'After', valor: afterAtivo, icone: Sparkles, cor: 'text-[#f1d86f]', bg: 'bg-[#f1d86f]/10' },
          { rotulo: 'Alunos', valor: totalAlunos, icone: UserCheck, cor: 'text-[#0aeb7a]', bg: 'bg-[#0aeb7a]/10' },
          { rotulo: 'Ocorrências', valor: ocorrenciasHoje, icone: AlertTriangle, cor: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((m, i) => (
          <div key={i} className="bg-surface p-5 md:p-7 rounded-2xl border border-[#30363d] flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{m.rotulo}</p>
              <p className="text-2xl md:text-4xl font-black text-white">{m.valor}</p>
            </div>
            <div className={cn("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center", m.bg, m.cor)}>
              <m.icone size={24} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Próxima Transição */}
      <div className="bg-surface border-2 border-dashed border-[#30363d] rounded-2xl p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#42a0f5]/10 text-[#42a0f5] rounded-2xl flex items-center justify-center border border-[#42a0f5]/30">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Próxima Transição</p>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">{estadoEscola.rotuloProximaTransicao}</h3>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Horário</p>
          <p className="text-3xl md:text-5xl font-black text-[#42a0f5] tracking-tight">{estadoEscola.proximaTransicao}</p>
        </div>
      </div>

      {/* Salas Ocupadas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-[#42a0f5]">
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

        {/* GRID DE SALAS - OTIMIZADO PARA MOBILE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
          {salasExibidas.map((sala) => (
            <motion.div
              key={sala.numeroSala}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative group p-6 rounded-[2rem] border-2 border-[#30363d] bg-surface hover:border-[#42a0f5] transition-all shadow-xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter">#{sala.numeroSala.toString().padStart(2, '0')}</h3>
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Ocupada</p>
                </div>
                <div className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Em Aula
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black uppercase text-on-surface-variant tracking-widest block mb-1">Disciplina</label>
                  <p className="text-xl font-black text-white truncate italic">{sala.materiaAtual}</p>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <label className="text-[8px] font-black uppercase text-on-surface-variant tracking-widest block mb-2">Professor</label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-800/30 border border-blue-800/50 flex items-center justify-center text-blue-400 font-black text-xs">
                      {sala.professorAtual[0]}
                    </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border-2 border-dashed border-[#30363d] rounded-2xl p-12 md:p-16 text-center">
            <p className="text-on-surface-variant font-bold text-sm uppercase tracking-wider">Nenhuma aula em andamento.</p>
          </div>
        )}
      </section>

      {/* Mapa de Ocupação */}
      <section className="bg-surface/50 p-6 md:p-8 rounded-2xl border border-[#30363d]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-5">Mapa de Ocupação</h3>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {estadoEscola.salas.map((sala) => (
            <div
              key={sala.numeroSala}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                sala.estaOcupada 
                  ? "bg-[#42a0f5] text-black border border-[#42a0f5] scale-105" 
                  : "bg-surface text-on-surface-variant/40 border border-[#30363d]"
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