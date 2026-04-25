import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock, MapPin, ChevronRight, Search, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { cn } from '../lib/utils';
import { obterDiaSemana, estaNoHorario, obterBlocosDeHorario } from '../services/motorEscolar';
import ModalChamada from '../components/ModalChamada';
import { EntradaGradeSala } from '../types';

export default function ChamadaProfessor() {
  const { professores, horaAtual } = useEscola();
  const [professorSelecionado, setProfessorSelecionado] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [diaFiltro] = useState(obterDiaSemana(horaAtual));
  const [aulaParaChamada, setAulaParaChamada] = useState<EntradaGradeSala | null>(null);

  const listaProfessores = professores.map(p => p.nome).sort();
  const filteredProfessores = listaProfessores.filter(p => 
    p.toLowerCase().includes(busca.toLowerCase())
  );

  const professor = professores.find(p => p.nome === professorSelecionado);
  
  // Pegar a agenda do professor para o dia de hoje
  const minhaAgenda = professor?.agendaDoDia.filter(g => 
    g.diaSemana === diaFiltro
  ).sort((a, b) => a.horario.localeCompare(b.horario)) || [];

  if (!professorSelecionado) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
            <User size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">Portal do Professor</h1>
          <p className="text-on-surface-variant text-sm mb-8">Selecione seu nome para acessar suas turmas e fazer a chamada.</p>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
            <input 
              type="text" 
              placeholder="Buscar seu nome..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProfessores.map(nome => (
              <button 
                key={nome}
                onClick={() => setProfessorSelecionado(nome)}
                className="w-full p-4 bg-surface-container-low hover:bg-primary/10 hover:text-primary rounded-xl text-left font-black text-sm transition-all flex items-center justify-between group"
              >
                {nome}
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 pt-6 px-4">
      <header className="flex items-center gap-4 bg-surface-container-lowest p-6 rounded-[2.5rem] editorial-shadow border border-outline-variant/10">
        <button onClick={() => setProfessorSelecionado(null)} className="p-2 bg-surface-container-low rounded-xl hover:bg-hover">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Professor(a)</p>
          <h2 className="text-xl font-black">{professorSelecionado}</h2>
        </div>
      </header>

      <div className="bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Agenda Completa
          </h3>
          <span className="text-[10px] font-black bg-surface-container-low px-3 py-1 rounded-full uppercase tracking-widest">
            {diaFiltro}
          </span>
        </div>

        {/* Seletor de Dia da Semana (Opcional se quiser trocar de dia, mas manteremos o dia atual por padrão ou os botões de dia se houver espaço) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'].map(dia => (
             <button
               key={dia}
               onClick={() => { /* Poderia alterar o diaFiltro via estado se adicionado */ }}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                 diaFiltro === dia ? "bg-primary text-on-surface-bright shadow-md shadow-primary/20" : "bg-surface-container-low text-on-surface-variant cursor-default"
               )}
             >
               {dia.slice(0, 3)}
             </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {obterBlocosDeHorario().map(bloco => {
            const range = `${bloco.inicio} - ${bloco.fim}`;
            const aula = minhaAgenda.find(a => a.horario === range);
            const isAgora = estaNoHorario(horaAtual, bloco.inicio, bloco.fim) && diaFiltro === obterDiaSemana(horaAtual);

            return (
              <div key={bloco.indice} className={cn(
                "p-5 rounded-3xl border-2 transition-all flex flex-col justify-between",
                isAgora ? "bg-primary border-primary text-on-surface-bright shadow-xl shadow-primary/10" : 
                aula ? "bg-surface-container-low border-transparent shadow-sm" : "bg-surface-container-low/30 border-transparent opacity-50"
              )}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn("text-[10px] font-mono font-black", isAgora ? "text-on-surface-bright/60" : "text-outline")}>{bloco.inicio} — {bloco.fim}</span>
                    {isAgora && <div className="w-2 h-2 rounded-full bg-surface-container-low animate-pulse" />}
                  </div>
                  <p className={cn("text-sm font-black mb-1", isAgora ? "text-on-surface-bright" : "text-on-surface")}>
                    {aula?.materia || 'Horário Livre'}
                  </p>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className={isAgora ? "text-on-surface-bright/60" : "text-on-surface-variant"} />
                    <p className={cn("text-[10px] font-bold", isAgora ? "text-on-surface-bright/80" : "text-on-surface-variant")}>
                      {aula?.nomeSala ? `Sala ${aula.numeroSala} (${aula.nomeSala})` : '—'}
                    </p>
                  </div>
                  {aula?.turma && (
                    <p className={cn("mt-2 text-[9px] font-black uppercase tracking-widest", isAgora ? "text-on-surface-bright/60" : "text-primary")}>
                      {aula.turma}
                    </p>
                  )}
                </div>

                {aula && (
                  <button
                    onClick={() => setAulaParaChamada(aula)}
                    disabled={!isAgora}
                    className={cn(
                      "mt-4 w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      isAgora 
                        ? "bg-on-surface-bright text-primary hover:bg-white shadow-md" 
                        : "bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-50"
                    )}
                  >
                    <CheckCircle2 size={14} />
                    {isAgora ? 'Fazer Chamada' : 'Aguardar Horário'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {aulaParaChamada && (
          <ModalChamada 
            aula={aulaParaChamada} 
            onClose={() => setAulaParaChamada(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
