import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, Calendar, DoorOpen, Clock, 
  Trash2, Plus, Coffee, Utensils, BookOpen,
  RefreshCw, Search, User, Users, Palette, Layers,
  GraduationCap, Zap, AlertCircle
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeSala, salvarPeriodos } from '../services/dataService';
import { cn, normalizarNomeComum } from '../lib/utils';
import type { Sala, EntradaGradeSala } from '../types';
import SeletorAlunos from '../components/SeletorAlunos';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

interface LinhaGrade {
  id: string;
  horario: string;
  tipo: 'aula' | 'intervalo' | 'almoco' | 'after' | 'laboratorio_idiomas';
  materia: string;
  professor: string;
  listaAlunos?: string[];
}

export default function ScheduleEditor() {
  const { salas, gradeCompleta, professoresCMS, atualizar, periodos, alunos } = useEscola();

  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string>('6e7');
  const [linhas, setLinhas] = useState<LinhaGrade[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [slotAlunosEditar, setSlotAlunosEditar] = useState<LinhaGrade | null>(null);

  const [modalPeriodosAberto, setModalPeriodosAberto] = useState(false);
  const [periodosEditaveis, setPeriodosEditaveis] = useState<any[]>([]);

  // Helper: Detecta o código do segmento a partir do ano/turma da sala
  const detectarSegmentoDaSala = (sala: Sala): string => {
    const ano = (sala.ano || '').toLowerCase();
    if (ano.includes('6') || ano.includes('7')) return '6e7';
    if (ano.includes('8') || ano.includes('9')) return '8e9';
    if (ano.includes('em') || ano.includes('médio') || ano.includes('medio') || ano.includes('1º ano e') || ano.includes('2º ano e') || ano.includes('3º ano e')) return 'medio';
    return '6e7'; // fallback
  };

  // Inicializa sala e auto-detecta segmento
  useEffect(() => {
    if (!salaSelecionada && salas.length > 0) {
      setSalaSelecionada(salas[0]);
      setSegmentoSelecionado(detectarSegmentoDaSala(salas[0]));
    }
  }, [salas, salaSelecionada]);

  // Auto-troca segmento quando muda a sala
  useEffect(() => {
    if (salaSelecionada) {
      const segDetectado = detectarSegmentoDaSala(salaSelecionada);
      setSegmentoSelecionado(segDetectado);
    }
  }, [salaSelecionada]);

  // Helper: Detecta tipo real do período pelo nome (o banco salva tudo como 'aula')
  const detectarTipoPeriodo = (nome: string): { tipo: string; materia: string; professor: string } => {
    const n = (nome || '').toLowerCase().trim();
    if (n.includes('lanche') || n.includes('intervalo')) return { tipo: 'intervalo', materia: nome.toUpperCase(), professor: '—' };
    if (n.includes('almoço') || n.includes('almoco')) return { tipo: 'intervalo', materia: 'ALMOÇO', professor: '—' };
    if (n.includes('after')) return { tipo: 'after', materia: '', professor: '' };
    return { tipo: 'aula', materia: '', professor: '' };
  };

  // Monta linhas a partir do template do segmento com deduplicação de horários
  const montarLinhasDoSegmento = (seg: string) => {
    const pAlvo = periodos.filter(p => p.segmento === seg);

    // Deduplicação estrita por horário de início/fim (HH:MM)
    const unique = new Map<string, any>();
    for (const p of pAlvo) {
      const key = `${p.horarioInicio.slice(0, 5)}-${p.horarioFim.slice(0, 5)}`;
      if (!unique.has(key)) {
        unique.set(key, p);
      }
    }
    const targetPeriodos = Array.from(unique.values()).sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

    return targetPeriodos.map((p, i) => {
      const det = detectarTipoPeriodo(p.nome);
      return {
        id: `p-${i}-${Date.now()}`,
        horario: `${p.horarioInicio.slice(0, 5)} - ${p.horarioFim.slice(0, 5)}`,
        tipo: det.tipo as any,
        materia: det.materia,
        professor: det.professor,
      };
    });
  };

  // Função para trocar segmento — Reativa e Definitiva
  const handleSegmentoChange = (novoSeg: string) => {
    const temDados = linhas.some(l => l.materia && l.materia !== 'INTERVALO' && l.materia !== 'ALMOÇO' && l.materia !== 'LANCHE');
    
    const mudar = () => {
      setSegmentoSelecionado(novoSeg);
      const novasLinhas = montarLinhasDoSegmento(novoSeg);
      if (novasLinhas.length > 0) setLinhas(novasLinhas);
    };

    if (temDados) {
      if (window.confirm("Trocar o segmento irá resetar os horários desta sala. Deseja continuar?")) {
        mudar();
      }
    } else {
      mudar();
    }
  };

  // Carrega dados da sala/dia com alinhamento estrito ao esqueleto do segmento
  useEffect(() => {
    if (salaSelecionada) {
      const segDetectado = detectarSegmentoDaSala(salaSelecionada);
      
      // 1. Obtém os períodos padrão do segmento de forma deduplicada
      const pAlvo = periodos.filter(p => p.segmento === segDetectado);
      const uniqueTemplates = new Map<string, any>();
      for (const p of pAlvo) {
        const key = `${p.horarioInicio.slice(0, 5)} - ${p.horarioFim.slice(0, 5)}`;
        if (!uniqueTemplates.has(key)) {
          uniqueTemplates.set(key, p);
        }
      }
      const targetPeriodos = Array.from(uniqueTemplates.values()).sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

      // 2. Filtra as entradas existentes no banco para essa sala e dia
      const existentes = gradeCompleta.filter(
        e => (Number(e.numeroSala) === Number(salaSelecionada.numero) || Number((e as any).numero_sala) === Number(salaSelecionada.numero)) && 
             (String(e.diaSemana).toUpperCase() === String(diaSelecionado).toUpperCase() || String((e as any).dia_semana).toUpperCase() === String(diaSelecionado).toUpperCase())
      );

      // 3. Mapeia as entradas do banco por horário para mesclagem limpa
      const existentesMap = new Map<string, any>();
      existentes.forEach(e => {
        const hKey = String(e.horario).trim();
        if (!existentesMap.has(hKey)) {
          existentesMap.set(hKey, e);
        } else {
          const prev = existentesMap.get(hKey);
          if ((!prev.materia || prev.materia === 'A DEFINIR') && e.materia && e.materia !== 'A DEFINIR') {
            existentesMap.set(hKey, e);
          }
        }
      });

      // 4. Reconstrói as linhas alinhadas estritamente com os períodos oficiais
      const linhasMescladas = targetPeriodos.map((p, i) => {
        const key = `${p.horarioInicio.slice(0, 5)} - ${p.horarioFim.slice(0, 5)}`;
        const dbEntry = existentesMap.get(key);
        
        if (dbEntry) {
          return {
            id: dbEntry.id || `db-${i}-${Date.now()}`,
            horario: key,
            tipo: (dbEntry.tipo as any) || (dbEntry.materia === 'INTERVALO' || dbEntry.materia === 'LANCHE' ? 'intervalo' : dbEntry.materia === 'ALMOÇO' ? 'intervalo' : 'aula'),
            materia: dbEntry.materia || '',
            professor: dbEntry.nomeProfessor || dbEntry.nome_professor || '',
            listaAlunos: dbEntry.listaAlunos || dbEntry.lista_alunos || []
          };
        } else {
          const det = detectarTipoPeriodo(p.nome);
          return {
            id: `template-${i}-${Date.now()}`,
            horario: key,
            tipo: det.tipo as any,
            materia: det.materia,
            professor: det.professor,
            listaAlunos: []
          };
        }
      });

      setLinhas(linhasMescladas);
    }
  }, [salaSelecionada, diaSelecionado, gradeCompleta, periodos, segmentoSelecionado]);

  const addLinha = () => {
    const ultimo = linhas[linhas.length - 1];
    setLinhas([...linhas, { id: `new-${Date.now()}`, horario: ultimo?.horario || '07:30 - 08:15', tipo: 'aula', materia: '', professor: '' }]);
  };

  const removeLinha = (id: string) => {
    setLinhas(linhas.filter(l => l.id !== id));
  };

  const updateLinha = (id: string, field: keyof LinhaGrade, value: any) => {
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
      dia_semana: String(diaSelecionado).toUpperCase().trim(),
      horario: String(l.horario).trim(),
      nome_professor: l.professor || '—',
      materia: l.materia || 'A DEFINIR',
      turma: salaSelecionada.ano || 'A DEFINIR',
      tipo: l.tipo || 'regular',
      lista_alunos: l.listaAlunos || []
    }));

    console.log('[DEBUG] Enviando grade para Supabase:', entradas);

    try {
      const ok = await salvarGradeSala(entradas);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Grade salva com sucesso!' });
        atualizar();
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar. Verifique sua conexão.' });
      }
    } catch (err) {
      console.error('[DEBUG] Erro catastrófico:', err);
      setMensagem({ tipo: 'erro', texto: 'Falha crítica ao salvar no banco.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  const getCorProf = (nome: string) => {
    const prof = professoresCMS.find(p => p.nome === nome);
    return prof?.cor || '#1a1a1a';
  };

  const abrirConfiguracaoPeriodos = () => {
    const periodosDoSegmento = periodos.filter(p => p.segmento === segmentoSelecionado);
    setPeriodosEditaveis(periodosDoSegmento.length > 0 ? [...periodosDoSegmento] : []);
    setModalPeriodosAberto(true);
  };

  const handleSalvarPeriodos = async () => {
    setSalvando(true);
    try {
      const paraSalvar = periodosEditaveis.map(p => ({ ...p, segmento: segmentoSelecionado }));
      console.log('[DEBUG] handleSalvarPeriodos enviando:', paraSalvar);
      const ok = await salvarPeriodos(paraSalvar);
      if (ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Modelo do Segmento salvo!' });
        await atualizar(); 
        setModalPeriodosAberto(false);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar modelo. Veja console.' });
      }
    } catch (err) {
      console.error('[DEBUG] handleSalvarPeriodos erro:', err);
      setMensagem({ tipo: 'erro', texto: 'Falha ao processar salvamento.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pb-28 md:pb-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase">Gestão <span className="text-primary">de Grades</span></h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
             <Zap size={12} className="text-primary" /> Sistema Ativo <span className="text-primary/20 ml-2">v3.0</span>
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <button onClick={handleSalvar} disabled={salvando} className="w-full md:w-auto bg-primary text-black px-6 md:px-10 py-4 md:py-5 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20">
            {salvando ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {salvando ? 'Processando...' : 'Salvar Alterações'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-10">
        {/* Sidebar de Configuração */}
        <aside className="space-y-4 lg:space-y-6">
          <div className="bg-white/5 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <Layers size={14} /> Segmento
              </p>
              <button onClick={abrirConfiguracaoPeriodos} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-black transition-all">
                <Palette size={14} />
              </button>
            </div>
            <div className="hidden lg:block space-y-2">
               {[
                 { id: '6e7', label: '6º e 7º Ano' },
                 { id: '8e9', label: '8º e 9º Ano' },
                 { id: 'medio', label: 'Ensino Médio' }
               ].map(s => (
                 <button key={s.id} onClick={() => handleSegmentoChange(s.id)} className={cn("w-full p-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all border-2", segmentoSelecionado === s.id ? "bg-primary/10 border-primary text-primary" : "bg-black border-white/5 text-white/20")}>
                   {s.label}
                 </button>
               ))}
            </div>
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
               {[
                 { id: '6e7', label: '6º/7º Ano' },
                 { id: '8e9', label: '8º/9º Ano' },
                 { id: 'medio', label: 'E. Médio' }
               ].map(s => (
                 <button key={s.id} onClick={() => handleSegmentoChange(s.id)} className={cn("px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 shrink-0", segmentoSelecionado === s.id ? "bg-primary/10 border-primary text-primary" : "bg-black border-white/5 text-white/40")}>
                   {s.label}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white/5 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-white/5 shadow-2xl">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 lg:mb-6 flex items-center gap-2">
               <DoorOpen size={14} /> Seleção de Sala
            </p>
            <div className="hidden lg:grid grid-cols-4 gap-3">
              {salas.map(s => (
                <button key={s.id} onClick={() => setSalaSelecionada(s)} className={cn("aspect-square rounded-2xl text-xs font-black transition-all border-2", salaSelecionada?.id === s.id ? "bg-primary border-primary text-black" : "bg-black border-white/5 text-white/40 hover:border-primary/50")}>
                  {s.numero}
                </button>
              ))}
            </div>
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              {salas.map(s => (
                <button key={s.id} onClick={() => setSalaSelecionada(s)} className={cn("min-w-[44px] h-11 rounded-xl text-xs font-black transition-all border-2 shrink-0 flex items-center justify-center", salaSelecionada?.id === s.id ? "bg-primary border-primary text-black" : "bg-black border-white/5 text-white/40")}>
                  {s.numero}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-white/5 shadow-2xl">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 lg:mb-6 flex items-center gap-2">
              <Calendar size={14} /> Dia da Semana
            </p>
            <div className="hidden lg:grid grid-cols-1 gap-2">
              {DIAS_SEMANA.map(dia => (
                <button key={dia} onClick={() => setDiaSelecionado(dia)} className={cn("w-full p-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all border-2", diaSelecionado === dia ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5" : "bg-black border-white/5 text-white/40")}>
                  {dia}
                </button>
              ))}
            </div>
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
              {DIAS_SEMANA.map(dia => (
                <button key={dia} onClick={() => setDiaSelecionado(dia)} className={cn("px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 shrink-0", diaSelecionado === dia ? "bg-primary/10 border-primary text-primary" : "bg-black border-white/5 text-white/40")}>
                  {dia.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Workspace do Editor Inteligente */}
        <main 
          key={`${salaSelecionada?.id}-${diaSelecionado}-${segmentoSelecionado}`}
          className="bg-white/5 p-4 md:p-8 lg:p-12 rounded-[2rem] lg:rounded-[4rem] border border-white/5 relative shadow-3xl"
        >
          <div className="flex items-center justify-between mb-8 md:mb-12 pb-6 md:pb-8 border-b border-white/10">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-primary text-black rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-3xl md:text-5xl font-black italic shadow-2xl shadow-primary/30">
                {salaSelecionada?.numero}
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter">{salaSelecionada?.nome}</h2>
                <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
                  <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[8px] md:text-[9px] font-black text-primary uppercase tracking-widest">{diaSelecionado}</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">{salaSelecionada?.ano}</span>
                </div>
              </div>
            </div>
            <button onClick={addLinha} className="bg-primary/10 text-primary hover:bg-primary hover:text-black p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] transition-all group shadow-xl">
              <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="overflow-x-auto pb-6 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div className="space-y-4 w-full">
            {linhas.map((linha) => {
              const corProf = getCorProf(linha.professor);
              return (
                <motion.div layout key={linha.id} className="group flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-black/40 lg:bg-transparent p-4 lg:p-0 rounded-[2rem] border border-white/5 lg:border-none relative">
                  <div className={cn("flex-1 bg-black/60 border border-white/5 p-4 lg:p-3 rounded-[2rem] lg:rounded-[2.5rem] flex flex-col md:flex-row items-stretch md:items-center gap-4 lg:gap-6 transition-all hover:border-primary/40", linha.tipo !== 'aula' && "bg-black/20")} style={{ borderLeft: `8px solid ${corProf}` }}>
                    
                    {/* Botão de Horário (Abre Modal de Detalhes) */}
                    <button 
                      type="button"
                      onClick={() => setSlotAlunosEditar(linha)}
                      className="flex items-center justify-between md:justify-center gap-3 bg-white/5 hover:bg-[#42a0f5]/20 px-6 py-3 rounded-3xl border border-white/5 hover:border-[#42a0f5]/50 transition-all cursor-pointer group"
                      title="Clique para Editar Detalhes e Ensalamento"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-white/20 mb-1 group-hover:text-[#42a0f5] transition-colors">Início</span>
                        <span className="text-[11px] font-black text-white">{linha.horario.split('-')[0]?.trim() || '07:30'}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10 mx-1" />
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-white/20 mb-1 group-hover:text-[#42a0f5] transition-colors">Fim</span>
                        <span className="text-[11px] font-black text-white">{linha.horario.split('-')[1]?.trim() || '08:15'}</span>
                      </div>
                    </button>

                    {/* Matéria / Atividade Dinâmica */}
                    <div className="flex-1">
                      <div className="text-[8px] font-black uppercase text-white/20 mb-1 ml-1">
                        {linha.tipo === 'laboratorio_idiomas' ? 'Nível / Módulo' : linha.tipo === 'after' ? 'Atividade After' : linha.tipo === 'intervalo' || linha.tipo === 'almoco' ? 'Intervalo' : 'Matéria'}
                      </div>
                      <input 
                        type="text" 
                        value={linha.materia} 
                        placeholder={linha.tipo === 'laboratorio_idiomas' ? 'EX: LEVEL 3...' : linha.tipo === 'after' ? 'EX: ROBÓTICA...' : 'EX: MATEMÁTICA...'}
                        onChange={e => updateLinha(linha.id, 'materia', e.target.value)} 
                        disabled={linha.tipo === 'intervalo' || linha.tipo === 'almoco'}
                        className={cn("w-full bg-transparent border-none text-sm font-black outline-none uppercase", 
                          linha.tipo === 'intervalo' || linha.tipo === 'almoco' ? 'text-amber-500/60' : 
                          linha.tipo === 'laboratorio_idiomas' ? 'text-blue-400' :
                          linha.tipo === 'after' ? 'text-purple-400' : 'text-primary',
                          'placeholder:text-white/5'
                        )}
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
                          onBlur={e => {
                            const val = e.target.value;
                            const listCanonNames = (professoresCMS || []).map(p => p.nome);
                            if (val && listCanonNames.length > 0) {
                              const normal = normalizarNomeComum(val, listCanonNames);
                              updateLinha(linha.id, 'professor', normal);
                            }
                          }}
                          className="w-full bg-transparent border-none text-sm font-black text-white outline-none placeholder:text-white/5 uppercase" 
                        />
                      </div>
                    </div>

                    {/* Badge de Tipo Inteligente */}
                    <div className="flex gap-2 p-2 bg-black/40 rounded-3xl border border-white/5 justify-around md:justify-start">
                      <button title="Aula Regular" onClick={() => updateLinha(linha.id, 'tipo', 'aula')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'aula' ? "bg-primary text-black shadow-lg" : "text-white/20 hover:text-white")}><BookOpen size={16} /></button>
                      <button title="Intervalo / Café" onClick={() => updateLinha(linha.id, 'tipo', 'intervalo')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'intervalo' ? "bg-amber-500 text-black shadow-lg" : "text-white/20 hover:text-white")}><Coffee size={16} /></button>
                      <button title="Language Lab" onClick={() => updateLinha(linha.id, 'tipo', 'laboratorio_idiomas')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'laboratorio_idiomas' ? "bg-blue-500 text-black shadow-lg" : "text-white/20 hover:text-white")}><GraduationCap size={16} /></button>
                      <button title="After School" onClick={() => updateLinha(linha.id, 'tipo', 'after')} className={cn("p-3 rounded-2xl transition-all", linha.tipo === 'after' ? "bg-purple-500 text-black shadow-lg" : "text-white/20 hover:text-white")}><Zap size={16} /></button>
                    </div>
                  </div>
                  <div className="flex lg:flex-col flex-row gap-2 justify-end lg:justify-start opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button title="Remover Aula" onClick={() => removeLinha(linha.id)} className="w-full lg:w-auto p-3 lg:p-4 bg-red-500/10 text-red-500 rounded-[1.5rem] lg:rounded-[2rem] hover:bg-red-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 text-xs font-black uppercase">
                      <Trash2 size={16} /> <span className="lg:hidden">Remover</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
            </div>
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

      {/* Modal de Ensalamento por Horário */}
      <AnimatePresence>
        {slotAlunosEditar && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSlotAlunosEditar(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-6xl bg-surface-container-lowest border border-white/10 rounded-[4rem] p-8 md:p-12 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="mb-8 shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                    <Users className="text-[#42a0f5]" size={32} /> Detalhes e Ensalamento
                  </h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">
                    Defina as informações e os alunos matriculados para esta aula
                  </p>
                </div>
                <button onClick={() => setSlotAlunosEditar(null)} className="w-12 h-12 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 flex items-center justify-center transition-all">
                  X
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                {/* Coluna Esquerda: Informações da Aula */}
                <div className="space-y-6 overflow-y-auto custom-scrollbar pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Informações Básicas</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Turma / Segmento</label>
                    <input type="text" readOnly value={salaSelecionada?.ano || ''} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-sm font-black text-white/60 outline-none uppercase cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Tipo de Aula</label>
                      <div className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-sm font-black text-white outline-none uppercase">
                        {slotAlunosEditar.tipo === 'laboratorio_idiomas' ? 'Language Lab' : slotAlunosEditar.tipo === 'after' ? 'After School' : slotAlunosEditar.tipo === 'intervalo' || slotAlunosEditar.tipo === 'almoco' ? 'Intervalo' : 'Aula Regular'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Sala / Local</label>
                      <input type="text" readOnly value={`SALA ${salaSelecionada?.numero} - ${salaSelecionada?.nome}`} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-sm font-black text-white/60 outline-none uppercase cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Matéria</label>
                      <input type="text" value={slotAlunosEditar.materia} onChange={e => {
                        updateLinha(slotAlunosEditar.id, 'materia', e.target.value);
                        setSlotAlunosEditar({...slotAlunosEditar, materia: e.target.value});
                      }} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-black text-white outline-none focus:border-primary uppercase transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Professor</label>
                      <input type="text" value={slotAlunosEditar.professor} list="professores-list" onChange={e => {
                        updateLinha(slotAlunosEditar.id, 'professor', e.target.value);
                        setSlotAlunosEditar({...slotAlunosEditar, professor: e.target.value});
                      }} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-black text-white outline-none focus:border-primary uppercase transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Dia da Semana</label>
                    <input type="text" readOnly value={diaSelecionado} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-sm font-black text-white/60 outline-none uppercase cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Início</label>
                      <input type="time" value={slotAlunosEditar.horario.split('-')[0]?.trim() || ''} onChange={e => {
                        const fim = slotAlunosEditar.horario.split('-')[1]?.trim() || '';
                        const novo = `${e.target.value} - ${fim}`;
                        updateLinha(slotAlunosEditar.id, 'horario', novo);
                        setSlotAlunosEditar({...slotAlunosEditar, horario: novo});
                      }} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-black text-white outline-none focus:border-primary uppercase transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-2">Fim</label>
                      <input type="time" value={slotAlunosEditar.horario.split('-')[1]?.trim() || ''} onChange={e => {
                        const inicio = slotAlunosEditar.horario.split('-')[0]?.trim() || '';
                        const novo = `${inicio} - ${e.target.value}`;
                        updateLinha(slotAlunosEditar.id, 'horario', novo);
                        setSlotAlunosEditar({...slotAlunosEditar, horario: novo});
                      }} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-black text-white outline-none focus:border-primary uppercase transition-all" />
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Alunos Matriculados */}
                <div className="space-y-6 flex flex-col h-full overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 shrink-0">
                    <div className="w-1.5 h-6 bg-[#42a0f5] rounded-full" />
                    <h4 className="text-[10px] font-black uppercase text-[#42a0f5] tracking-[0.3em]">Alunos Matriculados</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar rounded-[2.5rem]">
                    <SeletorAlunos
                      alunos={alunos}
                      selecionados={slotAlunosEditar.listaAlunos || []}
                      onChange={(novos) => {
                        updateLinha(slotAlunosEditar.id, 'listaAlunos', novos);
                        setSlotAlunosEditar({ ...slotAlunosEditar, listaAlunos: novos });
                      }}
                      turmaAlvo={salaSelecionada?.ano}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex gap-4 mt-8 pt-8 border-t border-white/5">
                <button onClick={() => setSlotAlunosEditar(null)} className="w-full bg-[#42a0f5] text-black py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl shadow-[#42a0f5]/20 hover:scale-[1.02] transition-all">Salvar e Fechar</button>
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
              "fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest z-[400] shadow-2xl flex items-center gap-3",
              mensagem.tipo === 'sucesso' ? "bg-primary text-black shadow-primary/20" : "bg-red-500 text-white shadow-red-500/20"
            )}
          >
            {mensagem.tipo === 'sucesso' ? <Save size={14} /> : <AlertCircle size={14} />}
            {mensagem.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
