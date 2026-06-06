import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FileText, ChevronRight, Search, ArrowLeft, 
  Trash2, Download, X, LayoutGrid, ShieldAlert, FileSearch,
  HardDrive
} from 'lucide-react';
import { Aluno, RegistroOcorrencia, DailyOccurrenceRecord } from '../types';
import { cn } from '../lib/utils';
import { arquivarELimparMes } from '../services/dataService';
import { generateBackupZip } from '../lib/reportGenerator';
import { occurrenceService } from '../services/occurrenceService';
import FichaOcorrencia from './FichaOcorrencia';
import ProntuarioPDF from './ProntuarioPDF';

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
  const [dossieAberto, setDossieAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Estado para armazenar as ocorrências diárias trazidas do Supabase
  const [registrosDiarios, setRegistrosDiarios] = useState<DailyOccurrenceRecord[]>([]);

  useEffect(() => {
    async function carregarRegistrosDiarios() {
      try {
        // Traz todas as ocorrências diárias (tratadas e não tratadas) para o prontuário permanente do aluno
        const records = await occurrenceService.fetchRecords();
        setRegistrosDiarios(records);
      } catch (e) {
        console.error('Erro ao buscar registros diários no Prontuário:', e);
      }
    }
    carregarRegistrosDiarios();
  }, [ocorrencias]); // Recarrega quando a lista de ocorrências formais sofrer atualização

  const ANOS_ORIGINAL = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º EM', '2º EM', '3º EM'];
  
  // Mapeia anos baseados tanto em atas quanto em ocorrências diárias
  const ANOS = useMemo(() => {
    const anosAtivos = new Set<string>();
    
    ocorrencias.forEach(o => {
      const match = ANOS_ORIGINAL.find(ano => (o.anoAluno || '').includes(ano.split(' ')[0]));
      if (match) anosAtivos.add(match);
    });
    
    registrosDiarios.forEach(r => {
      const match = ANOS_ORIGINAL.find(ano => (r.school_year || '').includes(ano.split(' ')[0]));
      if (match) anosAtivos.add(match);
    });

    return ANOS_ORIGINAL.filter(ano => anosAtivos.has(ano));
  }, [ocorrencias, registrosDiarios]);

  // Mapeia as turmas da unidade (ex: "1º Ano EM", "9º Ano A") unificando as duas fontes
  const turmasDaUnidade = useMemo(() => {
    if (!selecao.unidade) return [];
    const prefix = selecao.unidade.split(' ')[0]; // pega "6º" ou "1º", por exemplo
    const turmasValidas = new Set<string>();
    
    ocorrencias
      .filter(o => (o.anoAluno || '').includes(prefix))
      .forEach(o => {
        if (o.turmaAluno) turmasValidas.add(o.turmaAluno);
      });
      
    registrosDiarios
      .filter(r => (r.school_year || '').includes(prefix))
      .forEach(r => {
        if (r.school_year) turmasValidas.add(r.school_year);
      });

    return Array.from(turmasValidas).sort();
  }, [ocorrencias, registrosDiarios, selecao.unidade]);

  // Filtra e junta os alunos daquela turma que possuem atas ou ocorrências diárias registradas
  const alunosDaTurma = useMemo(() => {
    if (!selecao.turma) return [];
    const nomesValidos = new Set<string>();
    
    ocorrencias
      .filter(o => o.turmaAluno === selecao.turma)
      .forEach(o => {
        if (o.nomeAluno) nomesValidos.add(o.nomeAluno.trim().toLowerCase());
      });
      
    registrosDiarios
      .filter(r => r.school_year === selecao.turma)
      .forEach(r => {
        if (r.student_name) nomesValidos.add(r.student_name.trim().toLowerCase());
      });

    const list = alunos.filter(a => nomesValidos.has(a.nome.trim().toLowerCase()) && a.turma === selecao.turma);

    // Adiciona alunos virtuais / temporários que não estão na lista de alunos estáticos do CMS mas possuem registros ativados
    nomesValidos.forEach(nome => {
      const exists = list.some(a => a.nome.trim().toLowerCase() === nome);
      if (!exists) {
        const matchOco = ocorrencias.find(o => o.nomeAluno?.trim().toLowerCase() === nome);
        const matchDia = registrosDiarios.find(r => r.student_name?.trim().toLowerCase() === nome);
        const displayName = matchOco?.nomeAluno || matchDia?.student_name || nome;
        
        list.push({
          id: 'virtual-' + nome,
          nome: displayName,
          turma: selecao.turma!,
          ano: selecao.unidade!,
          numeroSala: 0
        });
      }
    });

    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, ocorrencias, registrosDiarios, selecao.turma, selecao.unidade]);

  // Unifica Atas e Registros Diários do aluno selecionado em uma lista de documentos ordenada
  const documentosDoAluno = useMemo(() => {
    if (!selecao.aluno) return [];
    const studentNameLower = selecao.aluno.nome.trim().toLowerCase();
    
    const docs: {
      id: string;
      tipo: 'ata' | 'diario';
      titulo: string;
      data: Date;
      dadosOriginais: any;
    }[] = [];

    // Adiciona as atas formais
    ocorrencias
      .filter(o => o.nomeAluno?.trim().toLowerCase() === studentNameLower)
      .forEach(o => {
        docs.push({
          id: o.id || '',
          tipo: 'ata',
          titulo: o.nomeModelo || 'Ata de Orientação',
          data: o.criadoEm ? new Date(o.criadoEm) : new Date(),
          dadosOriginais: o
        });
      });

    // Adiciona as ocorrências diárias do registro diário
    registrosDiarios
      .filter(r => r.student_name?.trim().toLowerCase() === studentNameLower)
      .forEach(r => {
        docs.push({
          id: r.id || '',
          tipo: 'diario',
          titulo: r.occurrence_type || 'Ocorrência Diária',
          data: r.created_at ? new Date(r.created_at) : new Date(),
          dadosOriginais: r
        });
      });

    return docs.sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [ocorrencias, registrosDiarios, selecao.aluno]);

  // Mapeia a lista combinada de documentos para o formato RegistroOcorrencia oficial para o ProntuarioPDF
  const mappedDossieOcorrencias = useMemo(() => {
    return documentosDoAluno.map(doc => {
      if (doc.tipo === 'ata') {
        return doc.dadosOriginais as RegistroOcorrencia;
      } else {
        const rec = doc.dadosOriginais as DailyOccurrenceRecord;
        return {
          id: rec.id || '',
          modeloFormularioId: 'diario',
          nomeModelo: rec.occurrence_type,
          nomeAluno: rec.student_name,
          turmaAluno: rec.school_year,
          anoAluno: rec.school_year,
          professorAtual: 'Administração',
          criadoEm: rec.created_at || new Date().toISOString(),
          dados: {
            'Tipo de Ocorrência': rec.occurrence_type,
            'Descrição': rec.report
          }
        };
      }
    });
  }, [documentosDoAluno]);

  // Abre visualização de documento formatando ocorrência diária para ficha de atas se necessário
  const handleVerDocumento = (doc: any) => {
    if (doc.tipo === 'ata') {
      setVisualizandoDoc(doc.dadosOriginais);
    } else {
      const rec = doc.dadosOriginais as DailyOccurrenceRecord;
      const mapped: RegistroOcorrencia = {
        id: rec.id || '',
        modeloFormularioId: 'diario',
        nomeModelo: rec.occurrence_type,
        nomeAluno: rec.student_name,
        turmaAluno: rec.school_year,
        anoAluno: rec.school_year,
        professorAtual: 'Administração',
        criadoEm: rec.created_at || new Date().toISOString(),
        dados: {
          'Tipo de Ocorrência': rec.occurrence_type,
          'Descrição': rec.report
        }
      };
      setVisualizandoDoc(mapped);
    }
  };

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

    if (confirm(`DESEJA FECHAR O MÊS DE ${nomeMes.toUpperCase()}?\n\nIsso irá:\n1. Gerar um arquivo ZIP com todos os PDFs de backup divididos por pastas (Aluno > Tipo de Ocorrência)\n2. APAGAR todas as atas e ocorrências diárias deste mês do sistema.\n\nESTA AÇÃO É IRREVERSÍVEL.`)) {
        setCarregando(true);
        
        try {
          // Filtra as atas do mês atual em memória
          const ocorrenciasDoMes = ocorrencias.filter(o => {
            const data = new Date(o.criadoEm);
            return data.getMonth() === mes && data.getFullYear() === ano;
          });

          // Filtra as ocorrências diárias do mês atual
          const diariasDoMes = registrosDiarios.filter(r => {
            if (!r.created_at) return false;
            const data = new Date(r.created_at);
            return data.getMonth() === mes && data.getFullYear() === ano;
          });

          // Mapeia todas as ocorrências diárias para formato RegistroOcorrencia para gerar os PDFs no backup
          const mappedDiarias: RegistroOcorrencia[] = diariasDoMes.map(rec => ({
            id: rec.id || '',
            modeloFormularioId: 'diario',
            nomeModelo: rec.occurrence_type,
            nomeAluno: rec.student_name,
            turmaAluno: rec.school_year,
            anoAluno: rec.school_year,
            professorAtual: 'Administração',
            criadoEm: rec.created_at || new Date().toISOString(),
            dados: {
              'Tipo de Ocorrência': rec.occurrence_type,
              'Descrição': rec.report
            }
          }));

          const todasDoMes = [...ocorrenciasDoMes, ...mappedDiarias];

          if (todasDoMes.length > 0) {
            alert(`Gerando backup de ${todasDoMes.length} registros (Atas + Ocorrências Diárias)... Por favor, aguarde.`);
            const zipGerado = await generateBackupZip(todasDoMes, nomeMes);
            if (!zipGerado) {
              alert('Falha ao gerar arquivo ZIP de backup. A exclusão foi cancelada por segurança.');
              setCarregando(false);
              return;
            }
          } else {
            alert(`Nenhum registro encontrado em ${nomeMes} para gerar backup. Continuando para a exclusão.`);
          }

          const ok = await arquivarELimparMes(mes, ano);
          if (ok) {
              alert('Mês arquivado com sucesso!');
              atualizar();
          }
        } catch (e) {
          console.error('Erro no processo de arquivamento:', e);
          alert('Ocorreu um erro no arquivamento. Tente novamente.');
        }

        setCarregando(false);
    }
  };

  return (
    <div className="bg-[#050505] text-white rounded-[3.5rem] overflow-hidden shadow-3xl flex flex-col h-[750px] border border-white/5 font-sans">
      
      {/* Top Header Toolbar */}
      <div className="bg-white/5 p-4 md:p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-6 border-b border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button onClick={voltar} disabled={viewMode === 'UNIDADES'} 
            className="p-3 hover:bg-white/10 rounded-2xl disabled:opacity-10 transition-all text-primary shrink-0 cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-2.5 flex items-center flex-wrap gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant overflow-hidden">
            {caminho.map((p, i) => (
              <React.Fragment key={p}>
                <span className={cn("hover:text-primary cursor-pointer transition-colors truncate max-w-[80px] sm:max-w-none", i === caminho.length - 1 && "text-white")}>{p}</span>
                {i < caminho.length - 1 && <ChevronRight size={10} className="text-white/10 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="relative w-full sm:w-72 shrink-0">
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

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        
        {/* Sidebar Simplificada */}
        <aside className="w-full sm:w-64 bg-black/20 border-b sm:border-b-0 sm:border-r border-white/5 p-4 sm:p-6 md:p-8 flex flex-row sm:flex-col justify-between items-center sm:items-stretch gap-4 shrink-0">
          <div className="flex sm:flex-col gap-2 items-center sm:items-stretch">
            <span className="hidden sm:block text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 ml-2">Acesso Direto</span>
            <div className="flex sm:flex-col gap-2">
                <button className="flex items-center gap-2.5 p-3 sm:p-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-primary text-black rounded-xl sm:rounded-2xl transition-all text-left">
                    <Folder size={16} className="shrink-0" /> <span className="truncate">Prontuário</span>
                </button>
                <button className="flex items-center gap-2.5 p-3 sm:p-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white rounded-xl sm:rounded-2xl transition-all text-left">
                    <FileSearch size={16} className="shrink-0" /> <span className="truncate">Relatórios</span>
                </button>
            </div>
          </div>

          <div className="pt-0 sm:pt-6 border-t-0 sm:border-t border-white/5 shrink-0">
             <button onClick={handleArquivar} className="flex items-center gap-2 p-3 sm:p-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-50 hover:text-black rounded-xl sm:rounded-2xl transition-all group cursor-pointer">
                <Trash2 size={16} className="group-hover:scale-110 transition-transform shrink-0" /> <span className="truncate">{carregando ? '...' : 'Fechar Mês'}</span>
             </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar bg-black/10">
          
          {viewMode === 'DOCUMENTOS' && documentosDoAluno.length > 0 && (
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/5 p-4 md:p-6 rounded-[2rem] border border-white/5">
              <div>
                <h3 className="text-xl font-black text-white">{selecao.aluno?.nome}</h3>
                <p className="text-[10px] text-primary uppercase tracking-widest font-bold mt-1">
                  {documentosDoAluno.length} Registros no Histórico (Atas + Diários)
                </p>
              </div>
              <button onClick={() => setDossieAberto(true)} className="flex items-center gap-2 px-6 py-4 bg-primary text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:scale-105 transition-all shadow-xl shadow-primary/20 cursor-pointer">
                <Download size={16} /> Dossiê Completo (PDF)
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8"
            >
              {viewMode === 'UNIDADES' && ANOS.map(ano => (
                <button key={ano} onClick={() => entrarUnidade(ano)} className="flex flex-col items-center gap-4 group cursor-pointer">
                    <div className="w-24 h-24 flex items-center justify-center relative">
                        <Folder size={80} className="text-primary fill-primary/10 group-hover:scale-110 group-hover:fill-primary transition-all duration-300" />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mt-2">{ano.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] font-black text-white/40 group-hover:text-primary transition-colors uppercase tracking-widest">{ano}</span>
                </button>
              ))}

              {viewMode === 'TURMAS' && turmasDaUnidade.map(turma => (
                <button key={turma} onClick={() => entrarTurma(turma)} className="flex flex-col items-center gap-4 group cursor-pointer">
                    <div className="w-24 h-24 flex items-center justify-center">
                        <Folder size={80} className="text-primary fill-primary/10 group-hover:scale-110 group-hover:fill-primary transition-all" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 group-hover:text-primary transition-colors uppercase tracking-widest">{turma}</span>
                </button>
              ))}

              {viewMode === 'ALUNOS' && alunosDaTurma.map(aluno => (
                <button key={aluno.id} onClick={() => entrarAluno(aluno)} className="flex flex-col items-center gap-4 group cursor-pointer">
                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                        <Folder size={48} className="text-primary fill-primary/10 group-hover:fill-primary transition-all" />
                    </div>
                    <span className="text-[9px] font-black text-white/40 group-hover:text-white text-center leading-tight line-clamp-2 px-2 uppercase tracking-tighter">{aluno.nome}</span>
                </button>
              ))}

              {viewMode === 'DOCUMENTOS' && documentosDoAluno.map(doc => (
                <button key={doc.id} onClick={() => handleVerDocumento(doc)} className="flex flex-col items-center gap-4 group cursor-pointer">
                    <div className={cn(
                      "w-24 h-24 border rounded-[2rem] flex flex-col items-center justify-center transition-all relative overflow-hidden",
                      doc.tipo === 'ata' 
                        ? "bg-black border-red-500/20 group-hover:border-red-500/60" 
                        : "bg-black border-blue-500/20 group-hover:border-blue-500/60"
                    )}>
                        <FileText size={40} className={doc.tipo === 'ata' ? "text-red-500" : "text-blue-500"} />
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 py-1 text-[7px] font-black uppercase text-center",
                          doc.tipo === 'ata' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {doc.tipo === 'ata' ? 'ATA OFICIAL' : 'REG. DIÁRIO'}
                        </div>
                    </div>
                    <div className="text-center w-full">
                        <span className="text-[9px] font-black text-white block uppercase tracking-wide truncate px-1">
                          {doc.titulo}
                        </span>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">
                          {doc.data.toLocaleDateString('pt-BR')}
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
        <div className="flex gap-4 md:gap-8">
            <span>{alunosDaTurma.length} Itens na Turma</span>
            <span>{ocorrencias.length + registrosDiarios.length} Registros Totais</span>
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
        {dossieAberto && mappedDossieOcorrencias.length > 0 && (
          <ProntuarioPDF ocorrencias={mappedDossieOcorrencias} onClose={() => setDossieAberto(false)} alunoNome={selecao.aluno?.nome || ''} />
        )}
      </AnimatePresence>
    </div>
  );
}
