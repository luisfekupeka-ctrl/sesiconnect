import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Calendar, DoorOpen, Clock, 
  Trash2, Plus, Coffee, Utensils, BookOpen,
  RefreshCw, Search, User, Palette, Layers,
  GraduationCap, Zap
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeSala, salvarPeriodos } from '../services/dataService';
import { cn } from '../lib/utils';
import { Sala, EntradaGradeSala } from '../types';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

interface LinhaGrade {
  id: string;
  horario: string;
  tipo: 'aula' | 'intervalo' | 'almoco' | 'after' | 'laboratorio_idiomas';
  materia: string;
  professor: string;
}

export default function ScheduleEditor() {
  const { salas, gradeCompleta, professoresCMS, atualizar, periodos } = useEscola();

  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string>('6e7');
  const [linhas, setLinhas] = useState<LinhaGrade[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [modalPeriodosAberto, setModalPeriodosAberto] = useState(false);
  const [periodosEditaveis, setPeriodosEditaveis] = useState<any[]>([]);

  // Inicializa sala
  useEffect(() => {
    if (!salaSelecionada && salas.length > 0) setSalaSelecionada(salas[0]);
  }, [salas, salaSelecionada]);

  // Carrega dados da sala/dia ou gera base por segmento
  useEffect(() => {
    if (salaSelecionada) {
      const existentes = gradeCompleta.filter(
        e => (Number(e.numeroSala) === Number(salaSelecionada.numero) || Number((e as any).numero_sala) === Number(salaSelecionada.numero)) && 
             (String(e.diaSemana).toUpperCase() === String(diaSelecionado).toUpperCase() || String((e as any).dia_semana).toUpperCase() === String(diaSelecionado).toUpperCase())
      ).sort((a,b) => (a.horario || '').localeCompare(b.horario || ''));

      const periodosDoSegmento = periodos.filter(p => p.segmento === segmentoSelecionado);
      const periodosAlvo = periodosDoSegmento.length > 0 ? periodosDoSegmento : periodos;

      if (existentes.length > 0) {
        setLinhas(existentes.map((e, i) => ({
          id: e.id || `l-${i}`,
          horario: e.horario || '07:30 - 08:15',
          tipo: (e.tipo as any) || (e.materia === 'INTERVALO' ? 'intervalo' : e.materia === 'ALMOÇO' ? 'almoco' : 'aula'),
          materia: e.materia || '',
          professor: e.nomeProfessor || (e as any).nome_professor || ''
        })));
      } else {
        setLinhas(periodosAlvo.map((p, i) => ({
          id: `p-${i}`,
          horario: `${p.horarioInicio.slice(0, 5)} - ${p.horarioFim.slice(0, 5)}`,
          tipo: p.tipo as any,
          materia: p.tipo === 'intervalo' ? 'INTERVALO' : p.tipo === 'almoco' ? 'ALMOÇO' : '',
          professor: p.tipo === 'intervalo' || p.tipo === 'almoco' ? '—' : ''
        })));
      }
    }
  }, [salaSelecionada, diaSelecionado, gradeCompleta, periodos, segmentoSelecionado]);

  const addLinha = () => {
    const ultimo = linhas[linhas.length - 1];
    setLinhas([...linhas, { id: `new-${Date.now()}`, horario: ultimo?.horario || '07:30 - 08:15', tipo: 'aula', materia: '', professor: '' }]);
  };

  const removeLinha = (id: string) => {
    setLinhas(linhas.filter(l => l.id !== id));
  };

  const updateLinha = (id: string, field: keyof LinhaGrade, value: string) => {
    setLinhas(prev => {
      const novas = prev.map(l => {
        if (l.id === id) {
          const novo = { ...l, [field]: value };
          
          // Lógica de Vínculo Automático
          if (field === 'materia') {
            const up = value.toUpperCase();
            if (up.includes('ENGLISH') || up.includes('LAB') || up.includes('INGLES')) novo.tipo = 'laboratorio_idiomas';
            else if (up.includes('AFTER') || up.includes('OFICINA')) novo.tipo = 'after';
            else if (up === 'INTERVALO') { novo.tipo = 'intervalo'; novo.professor = '—'; }
            else if (up === 'ALMOÇO' || up === 'ALMOCO') { novo.tipo = 'almoco'; novo.professor = '—'; }
            else novo.tipo = 'aula';
          }
          
          if (field === 'tipo') {
            if (value === 'intervalo') { novo.materia = 'INTERVALO'; novo.professor = '—'; }
            else if (value === 'almoco') { novo.materia = 'ALMOÇO'; novo.professor = '—'; }
          }
          return novo;
        }
        return l;
      });

      // Ordenação em Tempo Real (Só se o campo alterado for horário)
      if (field === 'horario') {
        return novas.sort((a, b) => a.horario.localeCompare(b.horario));
      }
      return novas;
    });
  };

  const handleSalvar = async () => {
    if (!salaSelecionada) return;
    setSalvando(true);
    setMensagem(null);
    
    // Ordenar por horário antes de salvar
    const linhasOrdenadas = [...linhas].sort((a,b) => a.horario.localeCompare(b.horario));

    const entradas: any[] = linhasOrdenadas.map(l => ({
      numero_sala: Number(salaSelecionada.numero),
      dia_semana: diaSelecionado,
      horario: l.horario,
      nome_professor: l.professor || '—',
      materia: l.materia || 'A DEFINIR',
      turma: salaSelecionada.ano || 'A DEFINIR',
      tipo: l.tipo === 'laboratorio_idiomas' ? 'laboratorio_idiomas' : l.tipo === 'after' ? 'after' : 'regular',
      lista_alunos: [] 
    }));

    try {
      const ok = await salvarGradeSala(entradas);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Grade salva com sucesso!' });
        atualizar();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar. Verifique sua conexão.' });
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Falha crítica ao salvar no banco.' });
    }
    setSalvando(false);
    setTimeout(() => setMensagem(null), 3000);
  };

  const getCorProf = (nome: string) => {
    const prof = professoresCMS.find(p => p.nome === nome);
    return prof?.cor || '#1a1a1a';
  };

  const abrirConfiguracaoPeriodos = () => {
    const p = periodos.filter(p => p.segmento === segmentoSelecionado);
    setPeriodosEditaveis(p.length > 0 ? p : []);
    setModalPeriodosAberto(true);
  };

  const handleSalvarPeriodos = async () => {
    setSalvando(true);
    const ok = await salvarPeriodos(periodosEditaveis);
    if (ok) {
      setMensagem({ tipo: 'sucesso', texto: 'Modelo de horários atualizado!' });
      setModalPeriodosAberto(false);
      atualizar();
    } else {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar o modelo.' });
    }
    setSalvando(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Gestão <span className="text-primary">de Grades</span></h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
             <Zap size={12} className="text-primary" /> Sistema de Inteligência de Ensalamento Ativo
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSalvar} disabled={salvando} className="bg-primary text-black px-10 py-5 rounded-[2rem] font-black uppercase text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20">
            {salvando ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {salvando ? 'Processando...' : 'Salvar Alterações'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
        {/* Sidebar de Configuração */}
        <aside className="space-y-6">
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <Layers size={14} /> Segmento
              </p>
              <button onClick={abrirConfiguracaoPeriodos} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-black transition-all">
                <Palette size={14} />
              </button>
            </div>
            <div className="space-y-2">
               {[
                 { id: '6e7', label: '6º e 7º Ano' },
                 { id: '8e9', label: '8º e 9º Ano' },
                 { id: 'medio', label: 'Ensino Médio' }
               ].map(s => (
                 <button key={s.id} onClick={() => setSegmentoSelecionado(s.id)} className={cn("w-full p-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all border-2", segmentoSelecionado === s.id ? "bg-primary/10 border-primary text-primary" : "bg-black border-white/5 text-white/20")}>
                   {s.label}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
               <DoorOpen size={14} /> Seleção de Sala
            </p>
            <div className="grid grid-cols-4 gap-3">
              {salas.map(s => (
                <button key={s.id} onClick={() => setSalaSelecionada(s)} className={cn("aspect-square rounded-2xl text-xs font-black transition-all border-2", salaSelecionada?.id === s.id ? "bg-primary border-primary text-black" : "bg-black border-white/5 text-white/40 hover:border-primary/50")}>
                  {s.numero}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Calendar size={14} /> Dia da Semana
            </p>
            <div className="grid grid-cols-1 gap-2">
              {DIAS_SEMANA.map(dia => (
                <button key={dia} onClick={() => setDiaSelecionado(dia)} className={cn("w-full p-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all border-2", diaSelecionado === dia ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5" : "bg-black border-white/5 text-white/40")}>
                  {dia}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Workspace do Editor Intelignete */}
        <main className="bg-white/5 p-12 rounded-[4rem] border border-white/5 relative shadow-3xl">
          <div className="flex items-center justify-between mb-12 pb-8 border-b border-white/10">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-primary text-black rounded-[2rem] flex items-center justify-center text-5xl font-black italic shadow-2xl shadow-primary/30">
                {salaSelecionada?.numero}
              </div>
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">{salaSelecionada?.nome}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">{diaSelecionado}</span>
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest">{salaSelecionada?.ano}</span>
                </div>
              </div>
            </div>
            <button onClick={addLinha} className="bg-primary/10 text-primary hover:bg-primary hover:text-black p-5 rounded-[2rem] transition-all group shadow-xl">
              <Plus size={32} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="space-y-4">
            {linhas.map((linha) => {
              const corProf = getCorProf(linha.professor);
              return (
                <motion.div layout key={linha.id} className="group flex items-center gap-4">
                  <div className={cn("flex-1 bg-black/60 border border-white/5 p-3 rounded-[2.5rem] flex items-center gap-6 transition-all hover:border-primary/40", linha.tipo !== 'aula' && "bg-black/20")} style={{ borderLeft: `8px solid ${corProf}` }}>
                    
                    {/* Inputs de Horário com Relógio */}
                    <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-3xl border border-white/5">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-white/20 mb-1">Início</span>
                        <input 
                          type="time" 
                          value={linha.horario.split('-')[0]?.trim() || '07:30'} 
                          onChange={e => {
                            const fim = linha.horario.split('-')[1]?.trim() || '08:15';
                            updateLinha(linha.id, 'horario', `${e.target.value} - ${fim}`);
                          }} 
                          className="bg-transparent border-none text-[11px] font-black text-white w-16 outline-none uppercase appearance-none" 
                        />
                      </div>
                      <div className="w-px h-8 bg-white/10 mx-1" />
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-white/20 mb-1">Fim</span>
                        <input 
                          type="time" 
                          value={linha.horario.split('-')[1]?.trim() || '08:15'} 
                          onChange={e => {
                            const inicio = linha.horario.split('-')[0]?.trim() || '07:30';
                            updateLinha(linha.id, 'horario', `${inicio} - ${e.target.value}`);
                          }} 
                          className="bg-transparent border-none text-[11px] font-black text-white w-16 outline-none uppercase appearance-none" 
                        />
                      </div>
                    </div>

                    {/* Matéria Intelignete */}
                    <div className="flex-1">
                      <div className="text-[8px] font-black uppercase text-white/20 mb-1 ml-1">Matéria / Atividade</div>
                      <input 
                        type="text" 
                        value={linha.materia} 
                        placeholder="EX: MATEMÁTICA..." 
                        onChange={e => updateLinha(linha.id, 'materia', e.target.value)} 
                        className="w-full bg-transparent border-none text-sm font-black text-primary outline-none placeholder:text-white/5 uppercase" 
                      />
                    </div>

                    {/* Professor Dinâmico */}
                    <div className="flex-1">
                      <div className="text-[8px] font-black uppercase text-white/20 mb-1 ml-1">Professor Responsável</div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: corProf }} />
                        <input 
                          type="text" 
                          value={linha.professor} 
                          placeholder="SELECIONE..." 
                          list="professores-list"
                          onChange={e => updateLinha(linha.id, 'professor', e.target.value)} 
                          className="w-full bg-transparent border-none text-sm font-black text-white outline-none placeholder:text-white/5 uppercase" 
                        />
                      </div>
                    </div>

                    {/* Badge de Tipo Inteligente */}
                    <div className="flex gap-2 p-2 bg-black/40 rounded-3xl border border-white/5">
                      <button title="Aula Regular" onClick={() => updateLinha(linha.id, 'tipo', 'aula')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'aula' ? "bg-primary text-black shadow-lg" : "text-white/20 hover:text-white")}><BookOpen size={16} /></button>
                      <button title="Intervalo / Café" onClick={() => updateLinha(linha.id, 'tipo', 'intervalo')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'intervalo' ? "bg-amber-500 text-black shadow-lg" : "text-white/20 hover:text-white")}><Coffee size={16} /></button>
                      <button title="Language Lab" onClick={() => updateLinha(linha.id, 'tipo', 'laboratorio_idiomas')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'laboratorio_idiomas' ? "bg-blue-500 text-black shadow-lg" : "text-white/20 hover:text-white")}><GraduationCap size={16} /></button>
                      <button title="After School" onClick={() => updateLinha(linha.id, 'tipo', 'after')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'after' ? "bg-purple-500 text-black shadow-lg" : "text-white/20 hover:text-white")}><Zap size={16} /></button>
                    </div>
                  </div>

                  <button onClick={() => removeLinha(linha.id)} className="p-5 bg-red-500/10 text-red-500 rounded-[2rem] opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-xl">
                    <Trash2 size={24} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {linhas.length === 0 && (
            <div className="py-32 text-center opacity-10">
              <RefreshCw size={100} className="mx-auto mb-8 animate-spin-slow" />
              <p className="font-black uppercase tracking-[0.5em] text-lg">Selecione uma sala ou adicione aulas</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Configuração de Períodos (Esqueleto) */}
      <AnimatePresence>
        {modalPeriodosAberto && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalPeriodosAberto(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl bg-surface-container-lowest border border-white/10 rounded-[4rem] p-12 shadow-3xl overflow-hidden">
              <div className="mb-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Editar Modelo: <span className="text-primary">{segmentoSelecionado === '6e7' ? '6º e 7º' : segmentoSelecionado === '8e9' ? '8º e 9º' : 'Ensino Médio'}</span></h2>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-2">Estes horários serão usados como padrão para novas salas.</p>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 mb-10 custom-scrollbar">
                {periodosEditaveis.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 group">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[10px] font-black text-white/20">{idx + 1}</div>
                    <div className="flex items-center gap-2">
                       <input type="time" value={p.horarioInicio} onChange={e => {
                         const novos = [...periodosEditaveis];
                         novos[idx].horarioInicio = e.target.value;
                         setPeriodosEditaveis(novos.sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio)));
                       }} className="bg-transparent border-none text-[10px] font-black text-white outline-none" />
                       <span className="text-white/20">—</span>
                       <input type="time" value={p.horarioFim} onChange={e => {
                         const novos = [...periodosEditaveis];
                         novos[idx].horarioFim = e.target.value;
                         setPeriodosEditaveis(novos);
                       }} className="bg-transparent border-none text-[10px] font-black text-white outline-none" />
                    </div>
                    <div className="flex-1">
                      <input type="text" value={p.nome} placeholder="NOME DO PERÍODO" onChange={e => {
                         const novos = [...periodosEditaveis];
                         novos[idx].nome = e.target.value;
                         setPeriodosEditaveis(novos);
                       }} className="w-full bg-transparent border-none text-[10px] font-black text-primary outline-none uppercase" />
                    </div>
                    <button onClick={() => setPeriodosEditaveis(periodosEditaveis.filter((_, i) => i !== idx))} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setPeriodosEditaveis([...periodosEditaveis, { id: `new-${Date.now()}`, horarioInicio: '07:30', horarioFim: '08:15', nome: 'NOVA AULA', segmento: segmentoSelecionado, tipo: 'aula' }])}
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white/20 hover:text-primary hover:border-primary/30 transition-all"
                >
                  <Plus size={14} /> Adicionar Novo Período ao Padrão
                </button>
              </div>

              <div className="flex gap-4">
                <button onClick={handleSalvarPeriodos} className="flex-1 bg-primary text-black py-5 rounded-[2rem] font-black uppercase text-xs">Salvar Modelo</button>
                <button onClick={() => setModalPeriodosAberto(false)} className="px-10 bg-white/5 text-white/40 py-5 rounded-[2rem] font-black uppercase text-xs">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <datalist id="professores-list">
        {professoresCMS.map(p => <option key={p.id} value={p.nome} />)}
      </datalist>

      {/* Notificação Flutuante Premium */}
      <AnimatePresence>
        {mensagem && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.8 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            exit={{ y: 100, opacity: 0, scale: 0.8 }} 
            className={cn(
              "fixed bottom-12 right-12 px-10 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-3xl z-50 border-2", 
              mensagem.tipo === 'sucesso' ? "bg-primary text-black border-white/20" : "bg-red-500 text-white border-white/20"
            )}
          >
            {mensagem.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
