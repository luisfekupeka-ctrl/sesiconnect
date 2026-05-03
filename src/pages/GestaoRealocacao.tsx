import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, CalendarX, BookOpen, UserMinus, FileSignature, CheckCircle2, AlertCircle, RefreshCw, DoorOpen, Users, ChevronRight, FileDown, ShieldCheck, ArrowLeft, FileText, Check, Info, ChevronDown, Coffee, Filter, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import {
  ProfessorConfig,
  ResultadoRealocacao,
  StatusEvento,
} from '../types';
import {
  buscarProfessoresConfig,
  buscarRealocacoes,
  calcularModoProva,
  calcularCenarioFalta,
  salvarEventoEscola,
  salvarRealocacoes,
  aprovarRascunho,
  excluirEvento
} from '../services/motorRealocacao';
const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const SEGMENTOS = ['6º e 7º', '8º e 9º', 'Ensino Médio'];

export default function GestaoRealocacao() {
  const { professores, gradeCompleta, salas, periodos } = useEscola();
  const [professoresConfig, setProfessoresConfig] = useState<ProfessorConfig[]>([]);
  const [historico, setHistorico] = useState<ResultadoRealocacao[]>([]);

  // ESTADO DO WIZARD
  const [step, setStep] = useState(1);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [diaSel, setDiaSel] = useState('');
  const [tipoFluxo, setTipoFluxo] = useState<'SALA' | 'PROFESSOR' | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [segmentoSel, setSegmentoSel] = useState<string>('6º e 7º');
  const [horariosSel, setHorariosSel] = useState<string[]>([]);
  const [isModoProva, setIsModoProva] = useState(false);
  const [profFixoProva, setProfFixoProva] = useState('');

  // Sincroniza o dia da semana com a data selecionada
  useEffect(() => {
    if (dataSelecionada) {
      const data = new Date(dataSelecionada + 'T00:00:00');
      const dias = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
      setDiaSel(dias[data.getDay()]);
    }
  }, [dataSelecionada]);

  const [resultados, setResultados] = useState<ResultadoRealocacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroHistorico, setFiltroHistorico] = useState<'TODOS' | 'RASCUNHOS'>('TODOS');

  // Lógica de Horários Consecutivos para Modo Prova
  const verificarConsecutividade = () => {
    if (horariosSel.length <= 1) return true;
    const sorted = [...horariosSel].sort();
    for (let i = 0; i < sorted.length - 1; i++) {
      const fimAtual = sorted[i].split(' - ')[1];
      const inicioProximo = sorted[i + 1].split(' - ')[0];
      if (fimAtual !== inicioProximo) return false;
    }
    return true;
  };

  const horariosSaoConsecutivos = verificarConsecutividade();

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const config = await buscarProfessoresConfig();
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

  const mudarSubstituto = (index: number, novoNome: string) => {
    setResultados(prev => prev.map((item, idx) =>
      idx === index ? { ...item, professorSubstituto: novoNome } : item
    ));
  };

  const handleCalcular = () => {
    setCarregando(true);
    setTimeout(() => {
      let res: ResultadoRealocacao[] = [];
      if (tipoFluxo === 'SALA' && isModoProva) {
        res = calcularModoProva(profFixoProva, Number(targetId), horariosSel, diaSel, segmentoSel, gradeCompleta, professoresConfig);
      } else if (tipoFluxo === 'SALA') {
        // Substituição normal por sala: identifica o professor original de cada horário
        horariosSel.forEach(h => {
          const entradaOriginal = gradeCompleta.find(
            g => g.numeroSala === Number(targetId) && g.diaSemana === diaSel && g.horario === h
          );
          if (entradaOriginal) {
            const subsHorario = calcularCenarioFalta(diaSel, [h], entradaOriginal.nomeProfessor, segmentoSel, gradeCompleta, professoresConfig);
            res = [...res, ...subsHorario];
          }
        });
      } else {
        const profAlvo = tipoFluxo === 'PROFESSOR' ? targetId : 'Desconhecido';
        res = calcularCenarioFalta(diaSel, horariosSel, profAlvo, segmentoSel, gradeCompleta, professoresConfig);
      }
      setResultados(res);
      setStep(4);
      setCarregando(false);
    }, 800);
  };

  const handleFinalizar = async (isDraft: boolean) => {
    setCarregando(true);
    const status: StatusEvento = isDraft ? 'RASCUNHO' : 'EFETIVADO';
    console.log('[DEBUG] handleFinalizar - isDraft:', isDraft, 'status:', status);
    
    const resultadosComSegmento = resultados.map(r => ({
      ...r,
      eventoId: r.eventoId || 'temp',
      segmento: r.segmento || segmentoSel
    }));
    
    try {
      const eventoId = await salvarEventoEscola({
        tipo: isModoProva ? 'PROVA' : 'FALTA',
        dia: dataSelecionada, // Agora salva a data completa
        horarios: horariosSel,
        professor: tipoFluxo === 'PROFESSOR' ? targetId : profFixoProva,
        status
      });

      console.log('[DEBUG] eventoId retornado:', eventoId);
      console.log('[DEBUG] resultados a salvar:', resultadosComSegmento.length);

      if (eventoId) {
        const ok = await salvarRealocacoes(resultadosComSegmento.map(r => ({ ...r, eventoId, status })));
        console.log('[DEBUG] resultado salvarRealocacoes:', ok);
        alert(isDraft ? 'Rascunho salvo com sucesso!' : 'Realocações efetivadas com sucesso!');
        setStep(1);
        setResultados([]);
        carregarDados();
      }
    } catch (e) {
      console.error('[DEBUG] Erro em handleFinalizar:', e);
      alert(isDraft ? 'Erro ao salvar rascunho.' : 'Erro ao efetivar.');
    } finally {
      setCarregando(false);
    }
  };

  const handleAprovar = async (eventoId: string) => {
    setCarregando(true);
    const ok = await aprovarRascunho(eventoId);
    if (ok) {
      alert('Substituição efetivada com sucesso!');
      await carregarDados();
    } else {
      alert('Erro ao aprovar rascunho.');
    }
    setCarregando(false);
  };

  const handleExcluir = async (eventoId: string) => {
    if (!confirm('Deseja realmente excluir este registro permanentemente?')) return;
    setCarregando(true);
    const ok = await excluirEvento(eventoId);
    if (ok) {
      alert('Registro removido com sucesso!');
      await carregarDados();
    } else {
      alert('Erro ao excluir registro.');
    }
    setCarregando(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header className="bg-surface p-10 rounded-[3.5rem] editorial-shadow border border-blue-800">
        <h1 className="text-5xl font-black tracking-tighter text-on-surface-bright">Smart Sub</h1>
        <p className="text-accent-amber font-black uppercase text-[10px] tracking-widest mt-2">Inteligência em Realocação</p>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-container-lowest p-10 rounded-[3rem] editorial-shadow border border-blue-800">
            <h2 className="text-3xl font-black mb-8 text-on-surface-bright">1. Selecione a Data</h2>
            <div className="flex flex-col gap-6">
              <div className="relative group">
                <input 
                  type="date" 
                  value={dataSelecionada} 
                  onChange={e => setDataSelecionada(e.target.value)}
                  className="w-full bg-surface-container-low p-6 rounded-3xl font-black text-2xl text-on-surface border-2 border-blue-800 focus:border-accent-amber transition-all outline-none"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase">
                    {diaSel}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[-1, 0, 1, 2, 3].map(offset => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const iso = d.toISOString().split('T')[0];
                  const diasCompact = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                  return (
                    <button 
                      key={iso}
                      onClick={() => setDataSelecionada(iso)}
                      className={cn(
                        "flex-1 min-w-[100px] p-4 rounded-2xl border-2 font-black transition-all",
                        dataSelecionada === iso 
                          ? "bg-amber-700 border-amber-600 text-white shadow-lg scale-105" 
                          : "bg-surface-container-high border-blue-800 text-on-surface opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="text-[10px] uppercase opacity-70">{diasCompact[d.getDay()]}</div>
                      <div className="text-lg">{d.getDate()}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full mt-10 py-6 bg-blue-800 text-white rounded-3xl font-black uppercase text-xs tracking-widest border border-blue-700 hover:bg-blue-700 shadow-2xl transition-all">Próximo Passo</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => { setTipoFluxo('SALA'); setStep(3); }} className="p-10 bg-surface rounded-[3rem] hover:bg-blue-900/50 hover:border-accent-amber transition-all group border border-blue-800">
              <DoorOpen size={48} className="mx-auto mb-4 group-hover:scale-110 transition-all text-accent-amber" />
              <h3 className="text-xl font-black uppercase text-on-surface-bright">Por Sala</h3>
            </button>
            <button onClick={() => { setTipoFluxo('PROFESSOR'); setStep(3); }} className="p-10 bg-surface rounded-[3rem] hover:bg-blue-900/50 hover:border-accent-amber transition-all group border border-blue-800">
              <UserMinus size={48} className="mx-auto mb-4 group-hover:scale-110 transition-all text-accent-rose" />
              <h3 className="text-xl font-black uppercase text-on-surface-bright">Professor Faltou</h3>
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface p-10 rounded-[3.5rem] editorial-shadow border border-blue-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-on-surface-bright">Configuração</h2>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-surface-container-low p-5 rounded-2xl font-black text-on-surface border border-blue-800">
                  <option value="">Selecione o Alvo...</option>
                  {tipoFluxo === 'SALA' ? salas.map(s => <option key={s.numero} value={s.numero}>Sala {s.numero}</option>) : professores.map(p => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                </select>

                {tipoFluxo === 'SALA' && (
                  <div className={cn("p-6 rounded-3xl border-2 transition-all", horariosSaoConsecutivos && horariosSel.length > 1 ? "bg-amber-500/10 border-amber-500" : "bg-surface-container-low border-transparent opacity-50")}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" disabled={!horariosSaoConsecutivos || horariosSel.length <= 1} checked={isModoProva} onChange={e => setIsModoProva(e.target.checked)} className="w-5 h-5 accent-amber-700" />
                      <span className="font-black text-amber-500 uppercase tracking-wider">MODO PROVA</span>
                    </label>
                    {isModoProva && (
                      <select value={profFixoProva} onChange={e => setProfFixoProva(e.target.value)} className="w-full mt-4 p-4 rounded-2xl bg-surface-container-high border-2 border-amber-700/50 text-on-surface font-black outline-none focus:border-amber-500 transition-all">
                        <option value="">Selecione o Fiscal da Prova...</option>
                        {Array.from(new Set(
                          gradeCompleta
                            .filter(g => g.numeroSala === Number(targetId) && g.diaSemana === diaSel && horariosSel.includes(g.horario))
                            .map(g => g.nomeProfessor)
                        )).map(nome => (
                          <option key={nome} value={nome}>{nome}</option>
                        ))}
                      </select>
                    )}
                    {!horariosSaoConsecutivos && <p className="text-[10px] text-red-500 mt-2 font-bold flex items-center gap-1"><Info size={12} /> Selecione horários seguidos para ativar.</p>}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-on-surface-variant">Selecione as Aulas</h3>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                  {gradeCompleta.filter(g => g.diaSemana === diaSel && (tipoFluxo === 'SALA' ? g.numeroSala === Number(targetId) : g.nomeProfessor === targetId)).map(g => (
                    <button key={g.id} onClick={() => setHorariosSel(prev => prev.includes(g.horario) ? prev.filter(h => h !== g.horario) : [...prev, g.horario])}
                      className={cn("p-4 rounded-xl text-xs font-black text-left transition-all border-2", horariosSel.includes(g.horario) ? "bg-amber-700 text-white border-amber-600 shadow-md" : "bg-surface-container-highest border-blue-800 text-on-surface")}>
                      {g.horario} - {g.turma}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button onClick={() => setStep(2)} className="px-8 py-5 font-black uppercase text-xs">Voltar</button>
              <button onClick={handleCalcular} disabled={horariosSel.length === 0 || carregando} className="flex-1 py-5 bg-blue-800 text-white rounded-2xl font-black uppercase text-xs">Calcular Realocação</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface p-10 rounded-[3.5rem] editorial-shadow border border-blue-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-on-surface-bright">Sugestões de Substituição</h2>
              <button onClick={() => window.print()} className="bg-amber-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-amber-600 hover:bg-amber-600 transition-all"><FileDown className="inline mr-2" size={16} /> Gerar PDF</button>
            </div>
            <div className="overflow-hidden rounded-3xl border border-blue-800">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface">
                  <tr>
                    <th className="p-5">Horário</th>
                    <th className="p-5">Turma</th>
                    <th className="p-5">Original</th>
                    <th className="p-5">Substituto (Troca Rápida)</th>
                    <th className="p-5">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-800/30">
                  {resultados.map((r, i) => {
                    // Verificação de conflito: professor já possui aula na grade base neste horário
                    const temConflitoNaGrade = gradeCompleta.some(g =>
                      g.nomeProfessor === r.professorSubstituto &&
                      g.diaSemana === diaSel &&
                      g.horario === r.horario
                    );

                    const semProfessor = r.professorSubstituto === 'A DEFINIR';

                    return (
                      <tr key={i} className={cn("text-sm font-medium transition-colors", semProfessor ? "bg-red-900/30" : "hover:bg-surface-container-low/50 even:bg-surface-container-low/20")}>
                        <td className="p-5 font-black text-on-surface-bright">{r.horario}</td>
                        <td className="p-5 text-on-surface">{r.turma}</td>
                        <td className="p-5 text-on-surface-variant line-through">{r.professorOriginal}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <div className="relative group/swap">
                              <select
                                value={r.professorSubstituto}
                                onChange={(e) => mudarSubstituto(i, e.target.value)}
                                className={cn("font-black px-3 py-2 rounded-xl outline-none appearance-none cursor-pointer pr-10 border transition-all shadow-md",
                                  semProfessor ? "bg-red-900/40 text-red-400 border-red-700 animate-pulse" : "bg-blue-900/30 hover:bg-blue-900/50 text-on-surface-bright border-blue-800")}
                              >
                                {semProfessor && <option value="A DEFINIR">SELECIONAR...</option>}
                                {professores.map(p => (
                                  <option key={p.id} value={p.nome} className="text-on-surface bg-surface">{p.nome}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-amber pointer-events-none opacity-60" />
                            </div>
                            {temConflitoNaGrade && (
                              <div className="group relative">
                                <AlertCircle size={14} className="text-red-500 animate-pulse cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                                  Este professor já está em aula nesta sala!
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase bg-blue-900/30 text-accent-amber",
                            temConflitoNaGrade && "bg-red-900/30 text-red-400"
                          )}>
                            {r.acao}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-10">
              <button
                onClick={() => handleFinalizar(true)}
                disabled={carregando}
                className="flex-1 py-6 bg-surface-container-high text-on-surface rounded-3xl font-black uppercase text-xs tracking-[0.1em] border border-blue-800 hover:bg-blue-900/50 transition-all flex justify-center items-center gap-2"
              >
                <FileText size={16} />
                Salvar como Rascunho
              </button>
              <button
                onClick={() => handleFinalizar(false)}
                disabled={carregando}
                className="flex-[2] py-6 bg-amber-700 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-amber-600 transition-all flex justify-center items-center gap-2 border border-amber-600"
              >
                {carregando ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Efetivar Grade Oficial
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
