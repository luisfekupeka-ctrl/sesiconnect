import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, FileText, CheckCircle2, XCircle, Clock, Calendar, Download } from 'lucide-react';
import { RegistroChamada } from '../types';
import { buscarChamadas } from '../services/dataService';
import { cn } from '../lib/utils';

export default function ControleFaltas() {
  const [chamadas, setChamadas] = useState<RegistroChamada[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [buscaAluno, setBuscaAluno] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroProfessor, setFiltroProfessor] = useState('');
  const [filtroData, setFiltroData] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const dados = await buscarChamadas();
    setChamadas(dados);
    setLoading(false);
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'presente': return { cor: 'text-emerald-500 bg-emerald-500/10', icone: CheckCircle2, label: 'Presente' };
      case 'falta': return { cor: 'text-rose-500 bg-rose-500/10', icone: XCircle, label: 'Falta' };
      case 'atraso': return { cor: 'text-amber-500 bg-amber-500/10', icone: Clock, label: 'Atraso' };
      case 'justificado': return { cor: 'text-blue-500 bg-blue-500/10', icone: FileText, label: 'Justificado' };
      default: return { cor: 'text-gray-500 bg-gray-500/10', icone: FileText, label: status };
    }
  };

  // Aplicação de Filtros Locais
  const filtrados = chamadas.filter(c => {
    const matchAluno = c.nomeAluno.toLowerCase().includes(buscaAluno.toLowerCase());
    const matchDisc = filtroDisciplina ? c.materia === filtroDisciplina : true;
    const matchProf = filtroProfessor ? c.professor === filtroProfessor : true;
    const matchData = filtroData ? c.data === filtroData : true;
    return matchAluno && matchDisc && matchProf && matchData;
  });

  // Extrair opções únicas para os selects
  const disciplinasUnicas = Array.from(new Set(chamadas.map(c => c.materia))).sort();
  const professoresUnicos = Array.from(new Set(chamadas.map(c => c.professor))).sort();
  
  // Cálculos de Resumo (baseados nos itens filtrados)
  const totalRegistros = filtrados.length;
  const faltas = filtrados.filter(c => c.status === 'falta').length;
  const presencas = filtrados.filter(c => c.status === 'presente' || c.status === 'atraso').length; // atraso conta como presença para frequência
  const frequencia = totalRegistros > 0 ? Math.round((presencas / totalRegistros) * 100) : 0;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">Controle de Faltas</h1>
          <p className="text-on-surface-variant font-bold">Histórico geral de chamadas e frequência escolar.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-surface-container-high hover:bg-hover px-4 py-2 rounded-xl text-sm font-bold transition-colors w-fit">
          <Download size={16} />
          Exportar Relatório
        </button>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 editorial-shadow">
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">Registros Filtrados</p>
          <p className="text-3xl font-black">{totalRegistros}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-rose-500/20 editorial-shadow">
          <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-2">Total de Faltas</p>
          <p className="text-3xl font-black text-rose-500">{faltas}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-emerald-500/20 editorial-shadow">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">Presenças</p>
          <p className="text-3xl font-black text-emerald-500">{presencas}</p>
        </div>
        <div className="bg-primary text-on-primary p-6 rounded-[2rem] editorial-shadow">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Frequência %</p>
          <p className="text-3xl font-black">{frequencia}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 editorial-shadow flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por aluno..." 
            value={buscaAluno}
            onChange={e => setBuscaAluno(e.target.value)}
            className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-xl py-3 pl-12 pr-4 text-sm font-bold transition-all outline-none"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4 w-full lg:w-auto">
          <select 
            value={filtroDisciplina} 
            onChange={e => setFiltroDisciplina(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-bold flex-1 lg:w-48 outline-none focus:ring-2 ring-primary"
          >
            <option value="">Todas as Disciplinas</option>
            {disciplinasUnicas.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select 
            value={filtroProfessor} 
            onChange={e => setFiltroProfessor(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-bold flex-1 lg:w-48 outline-none focus:ring-2 ring-primary"
          >
            <option value="">Todos os Professores</option>
            {professoresUnicos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <input 
            type="date" 
            value={filtroData}
            onChange={e => setFiltroData(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-bold flex-1 lg:w-40 outline-none focus:ring-2 ring-primary"
          />
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 editorial-shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold">Carregando chamadas...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center opacity-50">
            <Filter size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold text-lg">Nenhum registro encontrado</p>
            <p className="text-sm">Tente ajustar os filtros acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Data / Hora</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Aluno</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Turma / Sala</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Disciplina / Prof</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtrados.map((chamada, idx) => {
                  const dataFormatada = new Date(chamada.data).toLocaleDateString('pt-BR');
                  const cfg = getStatusConfig(chamada.status);
                  const Icon = cfg.icone;

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                      key={chamada.id || idx} 
                      className="hover:bg-surface-container-low/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-on-surface-variant" />
                          <span className="font-bold text-sm">{dataFormatada}</span>
                        </div>
                        <span className="text-xs text-on-surface-variant font-bold mt-1 block">{chamada.horario}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-sm">{chamada.nomeAluno}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold block">{chamada.turmaAluno}</span>
                        <span className="text-xs text-on-surface-variant block mt-0.5">Sala {chamada.sala}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold block">{chamada.materia}</span>
                        <span className="text-xs text-on-surface-variant block mt-0.5">{chamada.professor}</span>
                      </td>
                      <td className="p-4">
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest", cfg.cor)}>
                          <Icon size={14} />
                          {cfg.label}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
