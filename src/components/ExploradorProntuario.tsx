import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, FileText, ChevronRight, Search, ArrowLeft, 
  Monitor, HardDrive, Download, Trash2, Printer, X, DoorOpen 
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
  const [caminho, setCaminho] = useState<string[]>(['Este Computador', 'Alunos']);
  const [viewMode, setViewMode] = useState<ViewMode>('UNIDADES');
  const [selecao, setSelecao] = useState<{ unidade?: string; turma?: string; aluno?: Aluno }>({});
  const [busca, setBusca] = useState('');
  const [visualizandoDoc, setVisualizandoDoc] = useState<RegistroOcorrencia | null>(null);
  const [carregando, setCarregando] = useState(false);

  const ANOS = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º EM', '2º EM', '3º EM'];

  // Navegação
  const entrarUnidade = (ano: string) => {
    setSelecao({ unidade: ano });
    setCaminho(['Este Computador', 'Alunos', ano]);
    setViewMode('TURMAS');
  };

  const entrarTurma = (turma: string) => {
    setSelecao(prev => ({ ...prev, turma }));
    setCaminho(['Este Computador', 'Alunos', selecao.unidade!, turma]);
    setViewMode('ALUNOS');
  };

  const entrarAluno = (aluno: Aluno) => {
    setSelecao(prev => ({ ...prev, aluno }));
    setCaminho(['Este Computador', 'Alunos', selecao.unidade!, selecao.turma!, aluno.nome]);
    setViewMode('DOCUMENTOS');
  };

  const voltar = () => {
    if (viewMode === 'DOCUMENTOS') {
        setViewMode('ALUNOS');
        setCaminho(['Este Computador', 'Alunos', selecao.unidade!, selecao.turma!]);
    } else if (viewMode === 'ALUNOS') {
        setViewMode('TURMAS');
        setCaminho(['Este Computador', 'Alunos', selecao.unidade!]);
    } else if (viewMode === 'TURMAS') {
        setViewMode('UNIDADES');
        setCaminho(['Este Computador', 'Alunos']);
    }
  };

  // Filtros
  const turmasDaUnidade = useMemo(() => {
    if (!selecao.unidade) return [];
    return Array.from(new Set(alunos.filter(a => a.ano === selecao.unidade).map(a => a.turma))).sort();
  }, [alunos, selecao.unidade]);

  const alunosDaTurma = useMemo(() => {
    if (!selecao.turma) return [];
    return alunos.filter(a => a.turma === selecao.turma && a.nome.toLowerCase().includes(busca.toLowerCase())).sort((a,b) => a.nome.localeCompare(b.nome));
  }, [alunos, selecao.turma, busca]);

  const documentosDoAluno = useMemo(() => {
    if (!selecao.aluno) return [];
    return ocorrencias.filter(o => o.nomeAluno === selecao.aluno?.nome).sort((a,b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [ocorrencias, selecao.aluno]);

  const handleArquivar = async () => {
    const mes = new Date().getMonth();
    const ano = new Date().getFullYear();
    const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

    if (confirm(`DESEJA FECHAR O MÊS DE ${nomeMes.toUpperCase()}?\n\nIsso irá:\n1. Gerar os PDFs de backup (Simulado)\n2. APAGAR todos os registros deste mês do Supabase.\n\nESTA AÇÃO É IRREVERSÍVEL.`)) {
        setCarregando(true);
        const ok = await arquivarELimparMes(mes, ano);
        if (ok) {
            alert('Mês arquivado e limpo com sucesso!');
            atualizar();
        }
        setCarregando(false);
    }
  };

  return (
    <div className="bg-[#f3f3f3] text-[#333] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[800px] border border-white/20 font-sans">
      
      {/* Barra de Título Windows */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-300">
        <div className="flex items-center gap-3">
          <Folder size={18} className="text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Explorador de Arquivos - SESI Connect</span>
        </div>
        <div className="flex gap-4">
            <div className="w-4 h-4 rounded-full bg-gray-200" />
            <div className="w-4 h-4 rounded-full bg-gray-200" />
            <div className="w-4 h-4 rounded-full bg-red-400/50" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 flex items-center gap-6 border-b border-gray-200">
        <div className="flex gap-2">
          <button onClick={voltar} disabled={viewMode === 'UNIDADES'} className="p-2.5 hover:bg-gray-100 rounded-xl disabled:opacity-30 transition-all">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-gray-500">
          {caminho.map((p, i) => (
            <React.Fragment key={p}>
              <span className="hover:text-blue-600 cursor-pointer transition-colors">{p}</span>
              {i < caminho.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
        <div className="relative w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={`Pesquisar em ${caminho[caminho.length-1]}...`}
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-12 py-2.5 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Estilo Windows */}
        <aside className="w-72 bg-white border-r border-gray-200 p-6 space-y-8 overflow-y-auto">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Acesso Rápido</p>
            <div className="space-y-1.5">
                <button className="w-full flex items-center gap-3 p-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all text-left">
                    <Monitor size={18} className="text-blue-500" /> Este Computador
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all text-left">
                    <HardDrive size={18} className="text-gray-400" /> Disco Local (C:)
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-sm font-black bg-blue-100 text-blue-600 rounded-2xl transition-all text-left">
                    <Folder size={18} className="text-yellow-500 fill-yellow-500" /> Prontuário Alunos
                </button>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-100">
             <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-4 ml-2">Manutenção</p>
             <button onClick={handleArquivar} className="w-full flex items-center gap-3 p-4 text-xs font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-100 group shadow-sm">
                <Trash2 size={18} className="group-hover:scale-110 transition-transform" /> Fechar Mês
             </button>
             <p className="text-[10px] font-bold text-gray-400 mt-4 italic px-2 leading-relaxed">
                Recomendado baixar os PDFs antes de limpar o banco de dados.
             </p>
          </div>
        </aside>

        {/* Grid de Arquivos */}
        <main className="flex-1 bg-white p-10 overflow-y-auto custom-scrollbar relative">
          
          {/* Header da Pasta Atual */}
          {viewMode === 'DOCUMENTOS' && (
            <div className="mb-10 flex items-center justify-between bg-gray-50 p-6 rounded-[2rem] border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-2xl">
                        <Folder size={40} className="text-yellow-500 fill-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-800">{selecao.aluno?.nome}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{documentosDoAluno.length} Documentos Virtuais</p>
                    </div>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-3 px-6 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-500/20"
                >
                    <Download size={18} /> Baixar / Imprimir Pasta Completa
                </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            
            <AnimatePresence mode="wait">
              {viewMode === 'UNIDADES' && ANOS.map(ano => (
                <motion.button
                    key={ano}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => entrarUnidade(ano)}
                    className="flex flex-col items-center gap-4 group"
                >
                    <div className="w-24 h-24 flex items-center justify-center relative">
                        <Folder size={96} className="text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-yellow-800 mt-3">{ano.split(' ')[0]}</span>
                    </div>
                    <span className="text-sm font-black text-gray-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{ano}</span>
                </motion.button>
              ))}

              {viewMode === 'TURMAS' && turmasDaUnidade.map(turma => (
                <motion.button
                    key={turma}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => entrarTurma(turma)}
                    className="flex flex-col items-center gap-4 group"
                >
                    <div className="w-24 h-24 flex items-center justify-center">
                        <Folder size={96} className="text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
                    </div>
                    <span className="text-sm font-black text-gray-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{turma}</span>
                </motion.button>
              ))}

              {viewMode === 'ALUNOS' && alunosDaTurma.map(aluno => (
                <motion.button
                    key={aluno.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => entrarAluno(aluno)}
                    className="flex flex-col items-center gap-4 group"
                >
                    <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center border-2 border-transparent group-hover:border-blue-400 group-hover:bg-blue-100 transition-all shadow-sm">
                        <Folder size={56} className="text-yellow-500 fill-yellow-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[11px] font-black text-gray-700 group-hover:text-blue-600 text-center leading-tight line-clamp-2 px-2 uppercase tracking-tighter">{aluno.nome}</span>
                </motion.button>
              ))}

              {viewMode === 'DOCUMENTOS' && documentosDoAluno.map(doc => (
                <motion.button
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setVisualizandoDoc(doc)}
                    className="flex flex-col items-center gap-4 group"
                >
                    <div className="w-24 h-24 bg-white border-2 border-gray-100 shadow-sm rounded-3xl flex flex-col items-center justify-center group-hover:border-red-400 group-hover:shadow-xl transition-all relative">
                        <FileText size={48} className="text-red-500" />
                        <div className="absolute bottom-0 left-0 right-0 bg-red-500 py-1 text-[8px] font-black text-white uppercase rounded-b-[22px]">
                            PDF VIRTUAL
                        </div>
                    </div>
                    <div className="text-center">
                        <span className="text-xs font-black text-gray-800 group-hover:text-red-600 block leading-tight uppercase tracking-widest">Ocorrência</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {new Date(doc.criadoEm).toLocaleDateString('pt-BR')} — {new Date(doc.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </motion.button>
              ))}
            </AnimatePresence>

            {viewMode === 'DOCUMENTOS' && documentosDoAluno.length === 0 && (
                <div className="col-span-full py-32 text-center opacity-10">
                    <FileText size={96} className="mx-auto mb-6" />
                    <p className="font-black uppercase text-sm tracking-[0.3em]">Nenhum documento nesta pasta</p>
                </div>
            )}
          </div>
        </main>
      </div>

      {/* Barra de Status */}
      <div className="bg-[#f3f3f3] px-6 py-3 border-t border-gray-300 flex items-center justify-between text-xs font-bold text-gray-500">
        <div className="flex gap-6">
            <span>{alunosDaTurma.length} itens encontrados</span>
            <span className="opacity-30">|</span>
            <span>{ocorrencias.length} registros no sistema</span>
        </div>
        <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2 text-green-600"><Printer size={14} /> Sistema de Impressão Online</span>
            <div className="flex gap-1">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-blue-500 animate-pulse" />
                </div>
            </div>
        </div>
      </div>

      {/* Visualizador de Documento (Modal) */}
      <AnimatePresence>
        {visualizandoDoc && (
          <FichaOcorrencia 
            ocorrencia={visualizandoDoc} 
            onClose={() => setVisualizandoDoc(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Seção Oculta para Impressão em Lote */}
      <div className="hidden print:block absolute inset-0 bg-white z-[999]">
         {documentosDoAluno.map((doc, idx) => (
            <div key={doc.id} className={cn(idx > 0 && "break-before-page pt-10")}>
                <FichaOcorrencia 
                    ocorrencia={doc} 
                    onClose={() => {}} 
                    isPrintOnly={true}
                />
            </div>
         ))}
      </div>

    </div>
  );
}
