import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Calendar, User, Clock, 
  Trash2, Copy, Check, RefreshCw, ChevronLeft, LayoutGrid,
  Plus, Coffee, X, Palette, Search, MapPin, Briefcase
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeMonitores } from '../services/dataService';
import { cn } from '../lib/utils';
import { Monitor, GradeMonitor } from '../types';
import { useNavigate } from 'react-router-dom';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

interface LinhaGradeMonitor {
  id: string;
  horarioInicio: string;
  horarioFim: string;
  posto: string;
  funcao: string;
  tipo: 'servico' | 'almoco';
}

export default function MonitorScheduleEditor() {
  const { 
    monitores, gradeMonitores, periodos, atualizar
  } = useEscola();
  const navigate = useNavigate();

  const [monitorSelecionado, setMonitorSelecionado] = useState<Monitor | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);
  const [linhas, setLinhas] = useState<LinhaGradeMonitor[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [modalCopiaAberto, setModalCopiaAberto] = useState(false);
  const [buscaMonitor, setBuscaMonitor] = useState('');

  // Sincronizar linhas quando monitor ou dia muda
  useEffect(() => {
    if (monitorSelecionado) {
      // Usar os períodos padrão como base
      const periodosFiltrados = periodos.filter(p => p.segmento === '6e7'); // Padrão base
      const baseLinhas: LinhaGradeMonitor[] = periodosFiltrados.map((p, i) => ({
        id: `l-${i}`,
        horarioInicio: p.horarioInicio.slice(0, 5),
        horarioFim: p.horarioFim.slice(0, 5),
        posto: '',
        funcao: 'Monitoria Geral',
        tipo: p.tipo === 'almoco' || p.tipo === 'intervalo' ? 'almoco' : 'servico'
      }));

      // Preencher com dados existentes
      const existentes = gradeMonitores.filter(
        e => e.monitorNome === monitorSelecionado.nome && e.diaSemana === diaSelecionado
      );

      existentes.forEach(e => {
        const idx = baseLinhas.findIndex(l => l.horarioInicio === e.horarioInicio && l.horarioFim === e.horarioFim);
        if (idx >= 0) {
          baseLinhas[idx].posto = e.posto;
          baseLinhas[idx].funcao = e.funcao;
          baseLinhas[idx].tipo = e.funcao === 'ALMOÇO' ? 'almoco' : 'servico';
        }
      });

      setLinhas(baseLinhas);
    }
  }, [monitorSelecionado, diaSelecionado, gradeMonitores, periodos]);

  const atualizarLinha = (id: string, campo: keyof LinhaGradeMonitor, valor: any) => {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  };

  const toggleAlmoco = (id: string) => {
    setLinhas(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (l.tipo === 'servico') {
        return { ...l, tipo: 'almoco', funcao: 'ALMOÇO', posto: 'Refeitório' };
      } else {
        return { ...l, tipo: 'servico', funcao: 'Monitoria Geral', posto: '' };
      }
    }));
  };

  const handleSalvar = async () => {
    if (!monitorSelecionado) return;
    setSalvando(true); setMensagem(null);
    
    const entradas: Partial<GradeMonitor>[] = linhas.map(l => ({
      monitorNome: monitorSelecionado.nome,
      diaSemana: diaSelecionado,
      horarioInicio: l.horarioInicio,
      horarioFim: l.horarioFim,
      posto: l.posto || 'A DEFINIR',
      funcao: l.funcao || 'Monitoria Geral',
      corEtiqueta: monitorSelecionado.cor || '#3B82F6'
    }));

    const ok = await salvarGradeMonitores(entradas);
    setMensagem(ok ? { tipo: 'sucesso', texto: 'Escala salva!' } : { tipo: 'erro', texto: 'Erro ao salvar.' });
    if (ok) atualizar();
    setSalvando(false);
  };

  const handleCopiarParaDias = async (diasAlvo: string[]) => {
    if (!monitorSelecionado) return;
    setSalvando(true);
    let sucesso = true;

    for (const dia of diasAlvo) {
      const entradas: Partial<GradeMonitor>[] = linhas.map(l => ({
        monitorNome: monitorSelecionado.nome,
        diaSemana: dia,
        horarioInicio: l.horarioInicio,
        horarioFim: l.horarioFim,
        posto: l.posto || 'A DEFINIR',
        funcao: l.funcao || 'Monitoria Geral',
        corEtiqueta: monitorSelecionado.cor || '#3B82F6'
      }));
      const ok = await salvarGradeMonitores(entradas);
      if (!ok) sucesso = false;
    }

    setMensagem(sucesso ? { tipo: 'sucesso', texto: `Copiado para ${diasAlvo.length} dias!` } : { tipo: 'erro', texto: 'Erro ao copiar.' });
    if (sucesso) {
      atualizar();
      setModalCopiaAberto(false);
    }
    setSalvando(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 lg:p-12 font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-all text-[10px] font-black uppercase tracking-widest mb-4 group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel ADM
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-3">
              <Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-tighter">Escala de Monitores</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">Diner <span className="text-primary">de Monitores</span></h1>
            <p className="text-on-surface-variant font-medium mt-1 text-sm opacity-60">Monte a escala diária de cada monitor com locais e funções específicas.</p>
          </div>
          
          <div className="flex gap-3">
            {mensagem && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                className={cn("px-4 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase", 
                  mensagem.tipo === 'sucesso' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                {mensagem.tipo === 'sucesso' ? <Check size={14} /> : <X size={14} />}
                {mensagem.texto}
              </motion.div>
            )}
            <button onClick={handleSalvar} disabled={!monitorSelecionado || salvando}
              className={cn("btn-primary shadow-xl shadow-primary/20", (salvando || !monitorSelecionado) && "opacity-50 pointer-events-none")}>
              {salvando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {salvando ? 'Salvando...' : 'Salvar Escala'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          
          {/* Sidebar de Seleção */}
          <aside className="space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-white/5 space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-4"><User size={14} /> Selecionar Monitor</label>
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                  <input type="text" placeholder="Buscar monitor..." value={buscaMonitor} onChange={e => setBuscaMonitor(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {monitores.filter(m => !buscaMonitor || m.nome.toLowerCase().includes(buscaMonitor.toLowerCase())).map(m => (
                    <button key={m.id} onClick={() => setMonitorSelecionado(m)}
                      className={cn("w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 text-left",
                        monitorSelecionado?.id === m.id ? "bg-primary/10 border-primary shadow-lg" : "bg-surface-container-low border-transparent hover:border-white/5")}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black" style={{ backgroundColor: `${m.cor}20`, color: m.cor }}>
                        {m.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black truncate">{m.nome}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">{m.tipo}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2"><Calendar size={14} /> Dia da Semana</label>
                <div className="grid grid-cols-5 gap-1">
                  {DIAS_SEMANA.map(dia => (
                    <button key={dia} onClick={() => setDiaSelecionado(dia)}
                      className={cn("py-3 rounded-lg text-[8px] font-black transition-all border",
                        diaSelecionado === dia ? "bg-primary text-black border-primary" : "bg-surface-container-low text-on-surface-variant border-transparent")}>
                      {dia.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid de Edição */}
          <main className="bg-surface-container-lowest rounded-[3rem] border border-white/5 overflow-hidden">
            {!monitorSelecionado ? (
              <div className="p-32 text-center space-y-4 opacity-20">
                <User size={64} className="mx-auto" />
                <p className="text-xl font-black italic tracking-tighter">Selecione um monitor para começar</p>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl font-black italic shadow-2xl" 
                      style={{ backgroundColor: monitorSelecionado.cor, color: '#fff' }}>
                      {monitorSelecionado.nome.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic leading-none">{monitorSelecionado.nome}</h2>
                      <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.3em] mt-2">{diaSelecionado} • {monitorSelecionado.tipo}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModalCopiaAberto(true)} className="px-5 py-3 bg-surface-container-low rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2 border border-transparent hover:border-primary/20"><Copy size={12} /> Copiar Dias</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {linhas.map((linha, idx) => {
                    const ehAlmoco = linha.tipo === 'almoco';
                    return (
                      <motion.div key={linha.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                        className={cn("rounded-2xl transition-all border-2",
                          ehAlmoco ? "bg-amber-500/5 border-amber-500/10" : "bg-surface-container-low border-transparent hover:border-white/5")}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[60px_180px_1fr_1fr_60px] items-center gap-6 p-5">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black",
                            ehAlmoco ? "bg-amber-500/20 text-amber-500" : "bg-surface-container-high text-on-surface-variant")}>
                            {ehAlmoco ? <Coffee size={20} /> : idx + 1}
                          </div>

                          <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl">
                            <input type="time" value={linha.horarioInicio} onChange={e => atualizarLinha(linha.id, 'horarioInicio', e.target.value)}
                              className="bg-transparent border-none text-xs font-black text-center outline-none w-full" />
                            <span className="text-[10px] opacity-20">/</span>
                            <input type="time" value={linha.horarioFim} onChange={e => atualizarLinha(linha.id, 'horarioFim', e.target.value)}
                              className="bg-transparent border-none text-xs font-black text-center outline-none w-full" />
                          </div>

                          <div className="relative group">
                            <label className="text-[8px] font-black uppercase text-on-surface-variant absolute -top-2 left-3 bg-surface-container-lowest px-1 flex items-center gap-1"><Briefcase size={8} /> Função</label>
                            <input type="text" value={linha.funcao} placeholder="Ex: Monitoria Geral"
                              onChange={e => atualizarLinha(linha.id, 'funcao', e.target.value)}
                              className="w-full bg-black/20 border-none rounded-xl py-3 px-4 text-xs font-black outline-none placeholder:opacity-20" />
                          </div>

                          <div className="relative group">
                            <label className="text-[8px] font-black uppercase text-on-surface-variant absolute -top-2 left-3 bg-surface-container-lowest px-1 flex items-center gap-1"><MapPin size={8} /> Local / Posto</label>
                            <input type="text" value={linha.posto} placeholder="Ex: Pátio Central"
                              onChange={e => atualizarLinha(linha.id, 'posto', e.target.value)}
                              className="w-full bg-black/20 border-none rounded-xl py-3 px-4 text-xs font-black outline-none placeholder:opacity-20" />
                          </div>

                          <div className="flex justify-center">
                            <button onClick={() => toggleAlmoco(linha.id)} 
                              className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                ehAlmoco ? "bg-amber-500 text-black shadow-lg" : "bg-surface-container-high text-on-surface-variant hover:text-amber-500")}>
                              <Coffee size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal Copiar */}
      <AnimatePresence>
        {modalCopiaAberto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/10 max-w-md w-full space-y-8">
              <h3 className="text-3xl font-black tracking-tighter italic">Copiar Escala</h3>
              <p className="text-on-surface-variant text-sm font-medium">Selecione para quais dias deseja replicar esta escala:</p>
              <div className="grid grid-cols-2 gap-4">
                {DIAS_SEMANA.filter(d => d !== diaSelecionado).map(dia => (
                  <button key={dia} onClick={() => handleCopiarParaDias([dia])} 
                    className="p-6 bg-surface-container-low hover:bg-primary/10 hover:text-primary rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-primary/20">
                    {dia}
                  </button>
                ))}
                <button onClick={() => handleCopiarParaDias(DIAS_SEMANA.filter(d => d !== diaSelecionado))} 
                  className="col-span-2 p-6 bg-primary text-black rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                  Toda a Semana
                </button>
              </div>
              <button onClick={() => setModalCopiaAberto(false)} className="w-full py-2 text-on-surface-variant font-black text-[10px] uppercase tracking-widest">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
