import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, CalendarX, BookOpen, UserMinus, FileSignature, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { 
  ProfessorConfig, 
  EventoEscola, 
  ResultadoRealocacao, 
  TipoEventoEscola 
} from '../types';
import { 
  buscarProfessoresConfig, 
  buscarRealocacoes, 
  calcularCenarioFalta, 
  calcularCenarioProva, 
  salvarEventoEscola, 
  salvarRealocacoes 
} from '../services/motorRealocacao';
import { DIAS_SEMANA } from '../services/dataService';

export default function GestaoRealocacao() {
  const { professores, gradeSalas } = useEscola();
  const [professoresConfig, setProfessoresConfig] = useState<ProfessorConfig[]>([]);
  const [historico, setHistorico] = useState<ResultadoRealocacao[]>([]);
  
  const [modoAtivo, setModoAtivo] = useState<'HISTORICO' | 'NOVA_FALTA' | 'NOVA_PROVA'>('HISTORICO');
  
  const [novoEvento, setNovoEvento] = useState<Partial<EventoEscola>>({ dia: 'SEGUNDA' });
  const [sugestoes, setSugestoes] = useState<ResultadoRealocacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const config = await buscarProfessoresConfig();
    
    // Se o banco de config estiver vazio, cria configs dinâmicas baseadas na grade para testes
    if (config.length === 0) {
      const fallbackConfig = professores.map(p => ({
        id: p.id,
        nome: p.nome,
        disciplina: p.materia,
        cargaMaximaDia: 6,
        area: 'Outras' as const
      }));
      setProfessoresConfig(fallbackConfig);
    } else {
      setProfessoresConfig(config);
    }

    const rec = await buscarRealocacoes();
    setHistorico(rec);
  }

  async function calcularSugestoes() {
    setCarregando(true);
    setSugestoes([]);

    // Delay simulado para UX
    await new Promise(r => setTimeout(r, 800));

    try {
      if (modoAtivo === 'NOVA_FALTA') {
        const result = calcularCenarioFalta(novoEvento as EventoEscola, gradeSalas, professoresConfig);
        setSugestoes(result);
      } else if (modoAtivo === 'NOVA_PROVA') {
        const result = calcularCenarioProva(novoEvento as EventoEscola, gradeSalas, professoresConfig);
        setSugestoes(result);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao calcular cenário. Verifique se os dados estão preenchidos.');
    } finally {
      setCarregando(false);
    }
  }

  async function efetivarRealocacao() {
    setCarregando(true);
    try {
      // Salva o evento no DB
      const eventoId = await salvarEventoEscola(novoEvento);
      if (eventoId) {
        // Vincula as sugestoes ao evento
        const sugestoesComEvento = sugestoes.map(s => ({ ...s, eventoId }));
        await salvarRealocacoes(sugestoesComEvento);
        alert('Realocações efetivadas com sucesso!');
        setModoAtivo('HISTORICO');
        setSugestoes([]);
        carregarDados();
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao efetivar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <header className="flex justify-between items-end bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10">
        <div>
          <div className="flex items-center gap-3 mb-2 text-primary">
            <RefreshCw size={24} />
            <h1 className="text-3xl font-black tracking-tighter">Motor de Realocação</h1>
          </div>
          <p className="text-on-surface-variant font-medium">Automatize substituições e trocas de professores</p>
        </div>
      </header>

      {/* ABAS */}
      <div className="flex gap-4 mb-6 overflow-x-auto no-scrollbar">
        <button onClick={() => { setModoAtivo('HISTORICO'); setSugestoes([]); }} className={cn("px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap", modoAtivo === 'HISTORICO' ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high")}>Histórico Geral</button>
        <button onClick={() => { setModoAtivo('NOVA_FALTA'); setSugestoes([]); setNovoEvento({ tipo: 'FALTA', dia: 'SEGUNDA', horarios: [] }); }} className={cn("px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2", modoAtivo === 'NOVA_FALTA' ? "bg-error text-on-error" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high")}><UserMinus size={16}/> Registrar Falta</button>
        <button onClick={() => { setModoAtivo('NOVA_PROVA'); setSugestoes([]); setNovoEvento({ tipo: 'PROVA', dia: 'SEGUNDA', horarios: [] }); }} className={cn("px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2", modoAtivo === 'NOVA_PROVA' ? "bg-secondary text-on-secondary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high")}><FileSignature size={16}/> Registrar Prova (Liberação)</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LADO ESQUERDO: CONTROLES / FORMULÁRIO */}
        <div className="lg:col-span-1 space-y-6">
          {modoAtivo !== 'HISTORICO' && (
            <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] editorial-shadow border border-outline-variant/10">
              <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                {modoAtivo === 'NOVA_FALTA' ? <UserMinus size={20} className="text-error" /> : <FileSignature size={20} className="text-secondary" />}
                {modoAtivo === 'NOVA_FALTA' ? 'Detalhes da Ausência' : 'Detalhes da Prova'}
              </h3>

              <div className="space-y-4">
                {/* Dia da Semana */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Dia da Semana</label>
                  <select value={novoEvento.dia} onChange={e => setNovoEvento({...novoEvento, dia: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-primary outline-none">
                    {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {modoAtivo === 'NOVA_PROVA' && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Professor Ocupado na Prova</label>
                    <select value={novoEvento.professor || ''} onChange={e => setNovoEvento({...novoEvento, professor: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-primary outline-none">
                      <option value="">Selecione...</option>
                      {professores.map(p => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                    </select>
                  </div>
                )}

                {modoAtivo === 'NOVA_FALTA' && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Turma Afetada pela Falta</label>
                    <select value={novoEvento.turma || ''} onChange={e => setNovoEvento({...novoEvento, turma: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-primary outline-none">
                      <option value="">Selecione a Turma...</option>
                      {/* Agrupamento simples de turmas existentes */}
                      {Array.from(new Set(gradeSalas.map(g => g.turma))).sort().map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">
                    {modoAtivo === 'NOVA_FALTA' ? 'Horário da Falta' : 'Horários (Bloco de Prova)'}
                  </label>
                  {/* Simplificação: Um único input textual para horários separados por vírgula, ou select múltiplo */}
                  <input type="text" placeholder="Ex: 13:00 - 13:45, 13:45 - 14:30" 
                    value={novoEvento.horarios?.join(', ') || ''} 
                    onChange={e => setNovoEvento({...novoEvento, horarios: e.target.value.split(',').map(s => s.trim())})} 
                    className="w-full bg-surface-container p-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-primary outline-none" 
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1">Separe horários por vírgula.</p>
                </div>

                <button 
                  onClick={calcularSugestoes}
                  disabled={carregando || (!novoEvento.professor && modoAtivo === 'NOVA_PROVA') || (!novoEvento.turma && modoAtivo === 'NOVA_FALTA')}
                  className="w-full mt-4 py-4 bg-primary text-on-primary font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-primary/90 disabled:opacity-50 transition-all flex justify-center gap-2"
                >
                  {carregando ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                  Calcular Solução Automática
                </button>
              </div>
            </div>
          )}
          
          {modoAtivo === 'HISTORICO' && (
            <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] editorial-shadow border border-outline-variant/10 text-center opacity-60">
              <CalendarX size={48} className="mx-auto mb-4" />
              <p className="font-black text-sm">Selecione uma opção acima para gerar novas alocações.</p>
            </div>
          )}
        </div>

        {/* LADO DIREITO: RESULTADOS / SUGESTÕES / HISTÓRICO */}
        <div className="lg:col-span-2">
          
          {modoAtivo !== 'HISTORICO' ? (
            <div className="bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10 min-h-[500px]">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                Soluções Propostas pelo Motor
              </h2>

              {sugestoes.length === 0 && !carregando ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-50 text-center">
                  <AlertCircle size={40} className="mb-4" />
                  <p className="font-black">Preencha os dados e calcule as sugestões.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sugestoes.map((s, idx) => (
                    <div key={idx} className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block",
                          s.acao === 'Troca Completa' ? "bg-primary text-on-primary" : "bg-tertiary text-on-tertiary"
                        )}>
                          {s.acao}
                        </span>
                        <h4 className="font-black text-lg">{s.horario} • {s.turma}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm font-bold text-on-surface-variant">
                          <span className="line-through opacity-60">{s.professorOriginal || 'Faltante'}</span>
                          <span className="text-primary">→</span >
                          <span className="text-on-surface">{s.professorSubstituto}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sugestoes.length > 0 && (
                    <button 
                      onClick={efetivarRealocacao}
                      disabled={carregando}
                      className="w-full mt-6 py-4 bg-on-surface text-surface-container-lowest font-black rounded-2xl uppercase tracking-widest hover:bg-on-surface/90 transition-all"
                    >
                      Efetivar Mudanças na Grade Oficial
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-8 rounded-[3rem] editorial-shadow border border-outline-variant/10">
              <h2 className="text-2xl font-black mb-6">Histórico Recente</h2>
              
              {historico.length === 0 ? (
                <div className="py-12 text-center opacity-50">Nenhum evento registrado.</div>
              ) : (
                <div className="space-y-3">
                  {historico.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low/50">
                      <div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                          h.tipo === 'FALTA' ? "bg-error/20 text-error" : "bg-secondary/20 text-secondary"
                        )}>
                          {h.tipo} • {h.acao}
                        </span>
                        <p className="font-bold text-sm mt-1">{h.turma} • {h.horario}</p>
                      </div>
                      <div className="text-right text-xs font-bold text-on-surface-variant">
                        <p><span className="line-through">{h.professorOriginal}</span></p>
                        <p className="text-primary">{h.professorSubstituto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
