import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FileText, ChevronRight, Search, ArrowLeft, 
  Trash2, Download, X, LayoutGrid, ShieldAlert, FileSearch,
  HardDrive
} from 'lucide-react';
import { Aluno, RegistroOcorrencia } from '../types';
import { cn } from '../lib/utils';
import { arquivarELimparMes } from '../services/dataService';
import FichaOcorrencia from './FichaOcorrencia';

interface Props {
  alunos: Aluno[];
  ocorrencias: RegistroOcorrencia[];
  atualizar: () => void;
}

type ViewMode = 'UNIDADES' | 'TURMAS' | 'ALUNOS' | 'DOCUMENTOS';

export default function ExploradorProntuario({ alunos, ocorrencias, atualizar }: Props) {
  const [caminho, setCaminho] = useState<string[]>(['Sesi Connect', 'Prontuário']);
  const [viewMode, setViewMode] = useState<ViewMode>('UNIDADES');
  const [selecao, setSelecao] = useState<{ unidade?: string; turma?: string; aluno?: Aluno }>({});
  const [busca, setBusca] = useState('');
  const [visualizandoDoc, setVisualizandoDoc] = useState<RegistroOcorrencia | null>(null);
  const [carregando, setCarregando] = useState(false);

  const ANOS = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º EM', '2º EM', '3º EM'];

  // Navegação
  const entrarUnidade = (ano: string) => {
    setSelecao({ unidade: ano });
    setCaminho(['Sesi Connect', 'Prontuário', ano]);
    setViewMode('TURMAS');
  };

  const entrarTurma = (turma: string) => {
    setSelecao(prev => ({ ...prev, turma }));
    setCaminho(['Sesi Connect', 'Prontuário', selecao.unidade!, turma]);
    setViewMode('ALUNOS');
  };

  const entrarAluno = (aluno: Aluno) => {
    setSelecao(prev => ({ ...prev, aluno }));
    setCaminho(['Sesi Connect', 'Prontuário', selecao.unidade!, selecao.turma!, aluno.nome]);
    setViewMode('DOCUMENTOS');
  };

  const voltar = () => {
    if (viewMode === 'DOCUMENTOS') {
        setViewMode('ALUNOS');
        setCaminho(['Sesi Connect', 'Prontuário', selecao.unidade!, selecao.turma!]);
    } else if (viewMode === 'ALUNOS') {
        setViewMode('TURMAS');
        setCaminho(['Sesi Connect', 'Prontuário', selecao.unidade!]);
    } else if (viewMode === 'TURMAS') {
        setViewMode('UNIDADES');
        setCaminho(['Sesi Connect', 'Prontuário']);
    }
  };

  const handleArquivar = async () => {
    const mes = new Date().getMonth();
    const ano = new Date().getFullYear();
    const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

    if (confirm(`DESEJA FECHAR O MÊS DE ${nomeMes.toUpperCase()}?\n\nIsso irá:\n1. Gerar os PDFs de backup\n2. APAGAR todos os registros deste mês.\n\nESTA AÇÃO É IRREVERSÍVEL.`)) {
        setCarregando(true);
        const ok = await arquivarELimparMes(mes, ano);
        if (ok) {
            alert('Mês arquivado com sucesso!');
            atualizar();
        }
        setCarregando(false);
    }
  };

  return (
    <div className="bg-[#050505] text-white rounded-[3.5rem] overflow-hidden shadow-3xl flex flex-col h-[750px] border border-white/5 font-sans">
      
      {/* Top Header Toolbar */}
      <div className="bg-white/5 p-6 flex items-center gap-6 border-b border-white/5">
        <div className="flex gap-2">
          <button onClick={voltar} disabled={viewMode === 'UNIDADES'} 
            className="p-3 hover:bg-white/10 rounded-2xl disabled:opacity-10 transition-all text-primary">
            <ArrowLeft size={20} />
          </button>
        </div>
        
        <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-5 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
          {caminho.map((p, i) => (
            <React.Fragment key={p}>
              <span className={cn("hover:text-primary cursor-pointer transition-colors", i === caminho.length - 1 && "text-white")}>{p}</span>
              {i < caminho.length - 1 && <ChevronRight size={12} className="text-white/10" />}
            </React.Fragment>
          ))}
        </div>

        <div className="relative w-72">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          <input 
            type="text" 
            placeholder="Pesquisar..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-12 py-3 text-xs font-bold outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Simplificada */}
        <aside className="w-64 bg-black/20 border-r border-white/5 p-8 flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-6 ml-2">Acesso Direto</p>
              <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-4 text-[10px] font-black uppercase tracking-widest bg-primary text-black rounded-2xl transition-all text-left">
                      <Folder size={18} /> Prontuário
                  </button>
                  <button className="w-full flex items-center gap-3 p-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white rounded-2xl transition-all text-left">
                      <FileSearch size={18} /> Relatórios
                  </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
             <button onClick={handleArquivar} className="w-full flex items-center gap-3 p-5 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black rounded-2xl transition-all group">
                <Trash2 size={18} className="group-hover:scale-110 transition-transform" /> {carregando ? '...' : 'Fechar Mês'}
             </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-black/10">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8"
            >
              {viewMode === 'UNIDADES' && ANOS.map(ano => (
                <button key={ano} onClick={() => entrarUnidade(ano)} className="flex flex-col items-center gap-4 group">
                    <div className="w-24 h-24 flex items-center justify-center relative">
                        <Folder size={80} className="text-primary fill-primary/10 group-hover:scale-110 group-hover:fill-primary transition-all duration-300" />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mt-2">{ano.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] font-black text-white/40 group-hover:text-primary transition-colors uppercase tracking-widest">{ano}</span>
                </button>
              ))}

              {viewMode === 'TURMAS' && turmasDaUnidade.map(turma => (
                <button key={turma} onClick={() => entrarTurma(turma)} className="flex flex-col items-center gap-4 group">
                    <div className="w-24 h-24 flex items-center justify-center">
                        <Folder size={80} className="text-primary fill-primary/10 group-hover:scale-110 group-hover:fill-primary transition-all" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 group-hover:text-primary transition-colors uppercase tracking-widest">{turma}</span>
                </button>
              ))}

              {viewMode === 'ALUNOS' && alunosDaTurma.map(aluno => (
                <button key={aluno.id} onClick={() => entrarAluno(aluno)} className="flex flex-col items-center gap-4 group">
                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                        <Folder size={48} className="text-primary fill-primary/10 group-hover:fill-primary transition-all" />
                    </div>
                    <span className="text-[9px] font-black text-white/40 group-hover:text-white text-center leading-tight line-clamp-2 px-2 uppercase tracking-tighter">{aluno.nome}</span>
                </button>
              ))}

              {viewMode === 'DOCUMENTOS' && documentosDoAluno.map(doc => (
                <button key={doc.id} onClick={() => setVisualizandoDoc(doc)} className="flex flex-col items-center gap-4 group">
                    <div className="w-24 h-24 bg-black border border-white/10 rounded-[2rem] flex flex-col items-center justify-center group-hover:border-red-500/50 transition-all relative overflow-hidden">
                        <FileText size={40} className="text-red-500" />
                        <div className="absolute bottom-0 left-0 right-0 bg-red-500/10 py-1.5 text-[7px] font-black text-red-500 uppercase">OFFICIAL PDF</div>
                    </div>
                    <div className="text-center">
                        <span className="text-[10px] font-black text-white block uppercase tracking-widest">Ocorrência</span>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">
                          {new Date(doc.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>

          {viewMode === 'DOCUMENTOS' && documentosDoAluno.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-5">
              <FileSearch size={100} />
              <p className="font-black uppercase tracking-[0.5em] mt-6">Arquivo Vazio</p>
            </div>
          )}
        </main>
      </div>

      {/* Footer Info */}
      <div className="bg-white/5 px-10 py-4 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
        <div className="flex gap-8">
            <span>{alunosDaTurma.length} Itens na Turma</span>
            <span>{ocorrencias.length} Registros Totais</span>
        </div>
        <div className="flex items-center gap-3 text-primary">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Sincronizado com Supabase
        </div>
      </div>

      <AnimatePresence>
        {visualizandoDoc && (
          <FichaOcorrencia ocorrencia={visualizandoDoc} onClose={() => setVisualizandoDoc(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
