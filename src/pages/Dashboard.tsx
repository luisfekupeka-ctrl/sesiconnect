import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Users, DoorOpen, LayoutGrid, ChevronLeft, 
  ChevronRight, Activity, BookOpen, AlertTriangle, 
  Search, Bell, Sparkles, UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { obterDiaSemana } from '../services/motorEscolar';

const TAMANHO_PAGINA = 8;

export default function Dashboard() {
  const { estadoEscola, horaAtual, salas, professores, atividadesAfter, monitores, ocorrencias, alunos } = useEscola();
  const [paginaAtual, setPaginaAtual] = useState(1);

  const salasOcupadas = estadoEscola.salas.filter(s => s.estaOcupada);
  const totalOcupadas = salasOcupadas.length;
  const afterAtivo = atividadesAfter.length; // Simplificação para demo
  const totalAlunos = alunos.length;
  const ocorrenciasHoje = ocorrencias.length;

  // Paginação
  const totalPaginas = Math.ceil(salasOcupadas.length / TAMANHO_PAGINA);
  const salasExibidas = salasOcupadas.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA);

  const diaSemanaExtenso = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(horaAtual);
  const horaFormatada = horaAtual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Título e Data */}
      <header>
        <h1 className="text-4xl font-black tracking-tighter text-on-surface-bright">Agora</h1>
        <p className="text-on-surface-variant font-bold mt-1 capitalize">
          {diaSemanaExtenso} • {horaFormatada}
        </p>
      </header>

      {/* Cards de Métricas (Estilo EscolaLive) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { rotulo: 'Aulas agora', valor: totalOcupadas, icone: Clock, cor: 'text-blue-500', bg: 'bg-blue-500/10' },
          { rotulo: 'After School ativo', valor: afterAtivo, icone: Sparkles, cor: 'text-amber-500', bg: 'bg-amber-500/10' },
          { rotulo: 'Alunos cadastrados', valor: totalAlunos, icone: UserCheck, cor: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { rotulo: 'Ocorrências hoje', valor: ocorrenciasHoje, icone: AlertTriangle, cor: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((m, i) => (
          <div key={i} className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow border border-outline-variant/5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-1">{m.rotulo}</p>
              <p className="text-4xl font-black text-on-surface-bright">{m.valor}</p>
            </div>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", m.bg, m.cor)}>
              <m.icone size={28} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Próxima Transição (Estilo Clássico solicitado) */}
      <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary text-on-surface-bright rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Próxima Transição</p>
            <h3 className="text-3xl font-black tracking-tighter text-on-surface-bright">{estadoEscola.rotuloProximaTransicao}</h3>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Horário Previsto</p>
          <p className="text-5xl font-black text-primary tracking-tighter">{estadoEscola.proximaTransicao}</p>
        </div>
      </div>

      {/* Seção Principal: Aulas em Andamento */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black tracking-tighter text-on-surface-bright flex items-center gap-3">
            Ocupação das Salas
          </h2>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} className="p-2 bg-surface-container-low rounded-xl">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black">{paginaAtual} de {totalPaginas}</span>
              <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} className="p-2 bg-surface-container-low rounded-xl">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {salasExibidas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {salasExibidas.map((sala) => (
              <div key={sala.numeroSala} className="bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/5 group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-8">
                   <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                     <DoorOpen size={24} />
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Sala</p>
                     <p className="text-xl font-black">{sala.numeroSala.toString().padStart(2, '0')}</p>
                   </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Disciplina</p>
                    <h3 className="text-lg font-black leading-tight text-on-surface-bright">{sala.materiaAtual}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                      <Users size={12} />
                    </div>
                    <span className="text-[11px] font-bold text-on-surface-variant">{sala.professorAtual}</span>
                  </div>
                  <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                    <span className="text-[10px] font-black bg-surface-container-low px-3 py-1 rounded-full uppercase tracking-widest">{sala.turmaAtual}</span>
                    <span className="text-[10px] font-black text-primary">{sala.horarioFim}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/10 rounded-[3rem] p-20 text-center">
            <p className="text-on-surface-variant font-black text-sm uppercase tracking-widest">Nenhuma aula em andamento neste momento.</p>
          </div>
        )}
      </section>

      {/* Mapa Rápido (Compacto) */}
      <section className="bg-surface-container-low/30 p-10 rounded-[3rem] border border-outline-variant/10">
        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant mb-8">Mapa de Ocupação em Tempo Real</h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-16 gap-3">
          {estadoEscola.salas.map((sala) => (
            <div
              key={sala.numeroSala}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                sala.estaOcupada 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-110" 
                  : "bg-surface-container-lowest text-on-surface-variant/40 border border-outline-variant/10"
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
