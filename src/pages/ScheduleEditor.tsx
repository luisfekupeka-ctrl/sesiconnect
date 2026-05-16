import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Calendar, DoorOpen, Clock, 
  Trash2, Plus, Coffee, Utensils, BookOpen,
  RefreshCw, Search, User, Palette
} from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarGradeSala } from '../services/dataService';
import { cn } from '../lib/utils';
import { Sala, EntradaGradeSala } from '../types';

const DIAS_SEMANA = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];

const PALETA_CORES = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'
];

interface LinhaGrade {
  id: string;
  horario: string;
  tipo: 'aula' | 'intervalo' | 'almoco';
  materia: string;
  professor: string;
}

export default function ScheduleEditor() {
  const { salas, gradeCompleta, professoresCMS, atualizar } = useEscola();

  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);
  const [linhas, setLinhas] = useState<LinhaGrade[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Inicializa sala
  useEffect(() => {
    if (!salaSelecionada && salas.length > 0) setSalaSelecionada(salas[0]);
  }, [salas, salaSelecionada]);

  // Carrega dados da sala/dia
  useEffect(() => {
    if (salaSelecionada) {
      const existentes = gradeCompleta.filter(
        e => (e.numeroSala === salaSelecionada.numero || e.numero_sala === salaSelecionada.numero) && 
             (e.diaSemana === diaSelecionado || e.dia_semana === diaSelecionado)
      ).sort((a,b) => (a.horario || '').localeCompare(b.horario || ''));

      if (existentes.length > 0) {
        setLinhas(existentes.map((e, i) => ({
          id: e.id || `l-${i}`,
          horario: e.horario || '07:30 - 08:15',
          tipo: e.materia === 'INTERVALO' ? 'intervalo' : e.materia === 'ALMOÇO' ? 'almoco' : 'aula',
          materia: e.materia || '',
          professor: e.nomeProfessor || e.nome_professor || ''
        })));
      } else {
        // Default se estiver vazio
        setLinhas([
          { id: '1', horario: '07:30 - 08:15', tipo: 'aula', materia: '', professor: '' },
          { id: '2', horario: '08:15 - 09:00', tipo: 'aula', materia: '', professor: '' },
          { id: '3', horario: '09:00 - 09:20', tipo: 'intervalo', materia: 'INTERVALO', professor: '—' }
        ]);
      }
    }
  }, [salaSelecionada, diaSelecionado, gradeCompleta]);

  const addLinha = () => {
    const ultimoHorario = linhas.length > 0 ? linhas[linhas.length - 1].horario : '07:30 - 08:15';
    setLinhas([...linhas, { id: `new-${Date.now()}`, horario: ultimoHorario, tipo: 'aula', materia: '', professor: '' }]);
  };

  const removeLinha = (id: string) => {
    setLinhas(linhas.filter(l => l.id !== id));
  };

  const updateLinha = (id: string, field: keyof LinhaGrade, value: string) => {
    setLinhas(linhas.map(l => {
      if (l.id === id) {
        const novo = { ...l, [field]: value };
        if (field === 'tipo') {
          if (value === 'intervalo') { novo.materia = 'INTERVALO'; novo.professor = '—'; }
          else if (value === 'almoco') { novo.materia = 'ALMOÇO'; novo.professor = '—'; }
        }
        return novo;
      }
      return l;
    }));
  };

  const handleSalvar = async () => {
    if (!salaSelecionada) return;
    setSalvando(true);
    
    const entradas: Omit<EntradaGradeSala, 'id'>[] = linhas.map(l => ({
      numeroSala: salaSelecionada.numero,
      nomeSala: salaSelecionada.nome,
      diaSemana: diaSelecionado,
      horario: l.horario,
      nomeProfessor: l.professor || '—',
      materia: l.materia || 'A DEFINIR',
      turma: salaSelecionada.ano || 'A DEFINIR',
      tipo: 'regular',
      listaAlunos: []
    }));

    const ok = await salvarGradeSala(entradas);
    if (ok) {
      setMensagem({ tipo: 'sucesso', texto: 'Grade salva com sucesso!' });
      atualizar();
    } else {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar no banco.' });
    }
    setSalvando(false);
    setTimeout(() => setMensagem(null), 3000);
  };

  const getCorProf = (nome: string) => {
    const prof = professoresCMS.find(p => p.nome === nome);
    return prof?.cor || '#1a1a1a';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Editor <span className="text-primary">Manual</span></h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">Gestão de horários sala a sala</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSalvar} disabled={salvando} className="bg-primary text-black px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20">
            {salvando ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
        {/* Sidebar de Seleção */}
        <aside className="space-y-6">
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Selecione a Sala</p>
            <div className="grid grid-cols-4 gap-2">
              {salas.map(s => (
                <button key={s.id} onClick={() => setSalaSelecionada(s)} className={cn("aspect-square rounded-xl text-xs font-black transition-all border-2", salaSelecionada?.id === s.id ? "bg-primary border-primary text-black" : "bg-black border-white/5 text-white/40 hover:border-primary/50")}>
                  {s.numero}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Dia da Semana</p>
            <div className="space-y-2">
              {DIAS_SEMANA.map(dia => (
                <button key={dia} onClick={() => setDiaSelecionado(dia)} className={cn("w-full p-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all border-2", diaSelecionado === dia ? "bg-primary/10 border-primary text-primary" : "bg-black border-white/5 text-white/40")}>
                  {dia}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Workspace do Editor */}
        <main className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5 relative">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary text-black rounded-3xl flex items-center justify-center text-4xl font-black italic shadow-2xl shadow-primary/20">
                {salaSelecionada?.numero}
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase">{salaSelecionada?.nome}</h2>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{diaSelecionado} · {salaSelecionada?.ano}</p>
              </div>
            </div>
            <button onClick={addLinha} className="bg-white/10 hover:bg-primary hover:text-black p-4 rounded-2xl transition-all group">
              <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="space-y-3">
            {linhas.map((linha) => {
              const corProf = getCorProf(linha.professor);
              return (
                <div key={linha.id} className="group flex items-center gap-4">
                  <div className="flex-1 bg-black/40 border border-white/5 p-2 rounded-3xl flex items-center gap-4 transition-all hover:border-primary/30" style={{ borderLeft: `6px solid ${corProf}` }}>
                    
                    {/* Input de Horário */}
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-2xl">
                      <Clock size={14} className="text-white/20" />
                      <input type="text" value={linha.horario} onChange={e => updateLinha(linha.id, 'horario', e.target.value)} className="bg-transparent border-none text-[10px] font-black text-white w-28 outline-none uppercase" />
                    </div>

                    {/* Input de Matéria */}
                    <div className="flex-1">
                      <input type="text" value={linha.materia} placeholder="MATÉRIA..." onChange={e => updateLinha(linha.id, 'materia', e.target.value)} className="w-full bg-transparent border-none text-xs font-black text-primary outline-none placeholder:text-white/5 uppercase" />
                    </div>

                    {/* Input de Professor */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: corProf }} />
                      <input 
                        type="text" 
                        value={linha.professor} 
                        placeholder="PROFESSOR..." 
                        list="professores-list"
                        onChange={e => updateLinha(linha.id, 'professor', e.target.value)} 
                        className="w-full bg-transparent border-none text-xs font-black text-white outline-none placeholder:text-white/5 uppercase" 
                      />
                    </div>

                    {/* Seletor de Tipo (Aula/Cafe/Almoco) */}
                    <div className="flex gap-1 p-1 bg-black/40 rounded-2xl border border-white/5">
                      <button onClick={() => updateLinha(linha.id, 'tipo', 'aula')} className={cn("p-2 rounded-xl transition-all", linha.tipo === 'aula' ? "bg-primary text-black" : "text-white/20 hover:text-white")}><BookOpen size={14} /></button>
                      <button onClick={() => updateLinha(linha.id, 'tipo', 'intervalo')} className={cn("p-2 rounded-xl transition-all", linha.tipo === 'intervalo' ? "bg-amber-500 text-black" : "text-white/20 hover:text-white")}><Coffee size={14} /></button>
                      <button onClick={() => updateLinha(linha.id, 'tipo', 'almoco')} className={cn("p-2 rounded-xl transition-all", linha.tipo === 'almoco' ? "bg-red-500 text-black" : "text-white/20 hover:text-white")}><Utensils size={14} /></button>
                    </div>
                  </div>

                  <button onClick={() => removeLinha(linha.id)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          {linhas.length === 0 && (
            <div className="py-20 text-center opacity-10">
              <RefreshCw size={64} className="mx-auto mb-4 animate-pulse" />
              <p className="font-black uppercase tracking-[0.3em]">Clique no + para começar</p>
            </div>
          )}
        </main>
      </div>

      <datalist id="professores-list">
        {professoresCMS.map(p => <option key={p.id} value={p.nome} />)}
      </datalist>

      {/* Notificação */}
      <AnimatePresence>
        {mensagem && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className={cn("fixed bottom-10 right-10 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl z-50", mensagem.tipo === 'sucesso' ? "bg-primary text-black" : "bg-red-500 text-white")}>
            {mensagem.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
