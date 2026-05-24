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
  const [linhas, setLinhas] = useState<LinhaGradeMonitor[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [buscaMonitor, setBuscaMonitor] = useState('');

  const periodosFallback = useMemo(() => [
    { id: '1', nome: '1ª Aula', horarioInicio: '07:30', horarioFim: '08:20', tipo: 'aula' },
    { id: '2', nome: '2ª Aula', horarioInicio: '08:20', horarioFim: '09:10', tipo: 'aula' },
    { id: '3', nome: '3ª Aula', horarioInicio: '09:10', horarioFim: '10:00', tipo: 'aula' },
    { id: 'int', nome: 'Intervalo', horarioInicio: '10:00', horarioFim: '10:20', tipo: 'intervalo' },
    { id: '4', nome: '4ª Aula', horarioInicio: '10:20', horarioFim: '11:10', tipo: 'aula' },
    { id: '5', nome: '5ª Aula', horarioInicio: '11:10', horarioFim: '12:00', tipo: 'aula' },
    { id: 'alm', nome: 'Almoço', horarioInicio: '12:00', horarioFim: '13:00', tipo: 'almoco' },
    { id: '6', nome: '6ª Aula', horarioInicio: '13:00', horarioFim: '13:50', tipo: 'aula' },
  ], []);

  // Sincronizar linhas quando monitor muda
  useEffect(() => {
    if (monitorSelecionado) {
      // Buscar dados de SEGUNDA como base (já que é fixa)
      const existentes = gradeMonitores.filter(
        e => e.monitorNome === monitorSelecionado.nome && e.diaSemana === 'SEGUNDA'
      ).sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

      if (existentes.length > 0) {
        const carregaExistente: LinhaGradeMonitor[] = existentes.map((e, i) => ({
          id: `l-${i}-${Date.now()}`,
          horarioInicio: e.horarioInicio.slice(0, 5),
          horarioFim: e.horarioFim.slice(0, 5),
          posto: e.posto || '',
          funcao: e.funcao || 'Monitoria Geral',
          tipo: (e.funcao === 'ALMOÇO' || e.funcao === 'INTERVALO') ? 'almoco' : 'servico'
        }));
        setLinhas(carregaExistente);
      } else {
        // Se não tiver nada, começa vazio para criação manual
        setLinhas([]);
      }
    }
  }, [monitorSelecionado, gradeMonitores]);

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
    
    let sucessoTotal = true;

    // Salva a mesma escala para todos os dias da semana
    for (const dia of DIAS_SEMANA) {
        const entradas: Partial<GradeMonitor>[] = linhas.map(l => ({
            monitorNome: monitorSelecionado.nome,
            diaSemana: dia,
            horarioInicio: l.horarioInicio,
            horarioFim: l.horarioFim,
            posto: l.posto || 'A DEFINIR',
            funcao: l.funcao || 'Monitoria Geral',
            corEtiqueta: monitorSelecionado.cor || '#fbbf24'
        }));
        const ok = await salvarGradeMonitores(entradas);
        if (!ok) sucessoTotal = false;
    }

    setMensagem(sucessoTotal ? { tipo: 'sucesso', texto: 'Escala Semanal salva!' } : { tipo: 'erro', texto: 'Erro ao salvar.' });
    if (sucessoTotal) atualizar();
    setSalvando(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 lg:p-12 font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-4 group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel ADM
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full mb-3 border border-primary/20">
              <Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Escala Fixa Semanal</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">Gestão <span className="text-primary">de Monitores</span></h1>
            <p className="text-on-surface-variant font-medium mt-2 text-sm opacity-60">Defina a escala única que será replicada para todos os dias da semana.</p>
          </div>
          
          <div className="flex gap-3">
            {mensagem && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                className={cn("px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase", 
                  mensagem.tipo === 'sucesso' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")}>
                {mensagem.tipo === 'sucesso' ? <Check size={18} /> : <X size={18} />}
                {mensagem.texto}
              </motion.div>
            )}
            <button onClick={handleSalvar} disabled={!monitorSelecionado || salvando}
              className={cn("btn-primary shadow-2xl shadow-primary/30", (salvando || !monitorSelecionado) && "opacity-50 pointer-events-none")}>
              {salvando ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              {salvando ? 'Salvando...' : 'Salvar Escala Semanal'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
          
          {/* Sidebar de Seleção */}
          <aside className="space-y-6">
            <div className="bg-surface-container-lowest p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2 mb-6 ml-2">
                    <User size={16} className="text-primary" /> Selecionar Monitor
                </label>
                <div className="relative mb-6">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                  <input type="text" placeholder="Buscar monitor..." value={buscaMonitor} onChange={e => setBuscaMonitor(e.target.value)}
                    className="w-full bg-surface-container-low border-white/5 border rounded-2xl py-4 pl-12 pr-5 text-sm font-bold outline-none focus:border-primary/50 transition-all" />
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {monitores.filter(m => !buscaMonitor || m.nome.toLowerCase().includes(buscaMonitor.toLowerCase())).map(m => (
                    <button key={m.id} onClick={() => setMonitorSelecionado(m)}
                      className={cn("w-full p-5 rounded-3xl flex items-center gap-5 transition-all border-2 text-left group",
                        monitorSelecionado?.id === m.id ? "bg-primary/10 border-primary shadow-xl" : "bg-surface-container-low border-transparent hover:border-white/10")}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner" style={{ backgroundColor: `${m.cor}20`, color: m.cor }}>
                        {m.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black truncate text-white">{m.nome}</p>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest", monitorSelecionado?.id === m.id ? "text-primary" : "text-on-surface-variant")}>{m.tipo}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-relaxed">
                    DICA: A escala configurada aqui será aplicada automaticamente de Segunda a Sexta para o monitor selecionado.
                </p>
              </div>
            </div>
          </aside>

          {/* Grid de Edição */}
          <main className="bg-surface-container-lowest rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
            {!monitorSelecionado ? (
              <div className="p-40 text-center space-y-6 opacity-20">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <User size={48} />
                </div>
                <p className="text-2xl font-black italic tracking-tighter">Selecione um monitor para configurar a escala fixa</p>
              </div>
            ) : (
              <div className="p-10">
                <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/5">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl font-black italic shadow-2xl" 
                      style={{ backgroundColor: monitorSelecionado.cor, color: '#000' }}>
                      {monitorSelecionado.nome.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-4xl font-black italic leading-none tracking-tighter text-white">{monitorSelecionado.nome}</h2>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-primary font-black uppercase tracking-[0.3em]">Escala Semanal Fixa</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-lg bg-white/5 text-on-surface-variant border border-white/5">{monitorSelecionado.tipo}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="space-y-3 min-w-[900px]">
                  {linhas.map((linha, idx) => {
                    const ehAlmoco = linha.tipo === 'almoco';
                    return (
                      <motion.div key={linha.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                        className={cn("rounded-[2rem] transition-all border-2 group/row",
                          ehAlmoco ? "bg-primary/5 border-primary/10" : "bg-black/40 border-white/5 hover:border-primary/20")}
                      >
                        <div className="grid grid-cols-[60px_160px_1fr_1fr_100px] items-center gap-6 p-5">
                          {/* Índice / Ícone */}
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-inner",
                            ehAlmoco ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant")}>
                            {ehAlmoco ? <Coffee size={20} /> : idx + 1}
                          </div>

                          {/* Horário */}
                          <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                            <input type="time" value={linha.horarioInicio} onChange={e => atualizarLinha(linha.id, 'horarioInicio', e.target.value)}
                              className="bg-transparent border-none text-xs font-black text-center outline-none w-full text-primary" />
                            <span className="text-xs opacity-20">/</span>
                            <input type="time" value={linha.horarioFim} onChange={e => atualizarLinha(linha.id, 'horarioFim', e.target.value)}
                              className="bg-transparent border-none text-xs font-black text-center outline-none w-full text-primary" />
                          </div>

                          {/* Função */}
                          <div className="relative">
                            <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                            <input type="text" value={linha.funcao} placeholder="Função..."
                              onChange={e => atualizarLinha(linha.id, 'funcao', e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-sm font-bold outline-none italic placeholder:opacity-20 focus:border-primary/30 transition-all" />
                          </div>

                          {/* Local / Posto */}
                          <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                            <input type="text" value={linha.posto} placeholder="Local / Posto..."
                              onChange={e => atualizarLinha(linha.id, 'posto', e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-sm font-bold outline-none italic placeholder:opacity-20 focus:border-primary/30 transition-all" />
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex justify-end gap-2">
                            <button onClick={() => toggleAlmoco(linha.id)} 
                              className={cn("p-3 rounded-xl transition-all",
                                ehAlmoco ? "text-primary bg-primary/10 shadow-lg" : "text-white/10 hover:text-primary hover:bg-primary/5")}>
                              <Coffee size={20} />
                            </button>
                            <button onClick={() => setLinhas(prev => prev.filter(p => p.id !== linha.id))} className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  <div className="mt-8 flex justify-center">
                    <button onClick={() => setLinhas(prev => [...prev, { id: `l-${Date.now()}`, horarioInicio: '00:00', horarioFim: '00:00', posto: '', funcao: 'Monitoria Geral', tipo: 'servico' }])}
                      className="px-8 py-4 bg-white/5 border border-white/10 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-3 group shadow-xl">
                      <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Adicionar Horário na Escala
                    </button>
                  </div>
                </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
