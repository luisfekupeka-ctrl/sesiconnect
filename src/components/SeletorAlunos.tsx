import React, { useState, useMemo } from 'react';
import { Users, Search, Check, X, ClipboardList } from 'lucide-react';
import { useEscola } from '../context/ContextoEscola';
import { salvarAluno } from '../services/dataService';
import { cn } from '../lib/utils';

interface SeletorAlunosProps {
  alunos: any[];
  selecionados: string[];
  onChange: (selecionados: string[]) => void;
  turmaAlvo?: string;
}

export default function SeletorAlunos({ alunos, selecionados, onChange, turmaAlvo }: SeletorAlunosProps) {
  const { atualizar } = useEscola();
  const [busca, setBusca] = useState('');
  const [mostrarTodos, setMostrarTodos] = useState(!turmaAlvo);
  const [modoPaste, setModoPaste] = useState(false);
  const [conteudoPaste, setConteudoPaste] = useState('');
  const [resultadoValidacao, setResultadoValidacao] = useState<{ id_temp: string; nome: string; encontrado: boolean; aluno?: any; buscaManual?: boolean }[]>([]);
  const [carregandoInterno, setCarregandoInterno] = useState(false);

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();

  const handleValidarPaste = () => {
    const linhas = conteudoPaste.split('\n').map(l => l.trim()).filter(l => l);
    const validacao = linhas.map((nomeOriginal, idx) => {
      const nomeNorm = normalize(nomeOriginal);
      
      // 1. Busca Exata
      let aluno = alunos.find(a => normalize(a.nome) === nomeNorm);
      
      // 2. Busca por Palavras-Chave (Fallback)
      if (!aluno) {
        const palavrasBusca = nomeNorm.split(' ').filter(p => p.length > 2);
        if (palavrasBusca.length > 0) {
          aluno = alunos.find(a => {
            const nomeAlunoNorm = normalize(a.nome);
            return palavrasBusca.every(palavra => nomeAlunoNorm.includes(palavra));
          });
        }
      }

      return {
        id_temp: `${idx}-${Date.now()}`,
        nome: nomeOriginal,
        encontrado: !!aluno,
        aluno: aluno,
        buscaManual: false
      };
    });
    setResultadoValidacao(validacao);
  };

  const handleVincularManual = (id_temp: string, alunoSelecionado: any) => {
    setResultadoValidacao(prev => prev.map(item => 
      item.id_temp === id_temp 
        ? { ...item, encontrado: true, aluno: alunoSelecionado, buscaManual: false } 
        : item
    ));
  };

  const handleCadastrarRapido = async (id_temp: string, nome: string) => {
    setCarregandoInterno(true);
    const novoAluno = { 
      nome, 
      turma: turmaAlvo || '6º Ano', 
      ano: turmaAlvo || '6º Ano', 
      numeroSala: 0 
    };
    
    const sucesso = await salvarAluno(novoAluno);
    if (sucesso) {
      await atualizar();
      setResultadoValidacao(prev => prev.map(item => 
        item.id_temp === id_temp 
          ? { ...item, encontrado: true, aluno: { ...novoAluno, id: 'temp-' + Date.now() } } 
          : item
      ));
    }
    setCarregandoInterno(false);
  };

  const handleConfirmarPaste = () => {
    const nomesEncontrados = resultadoValidacao
      .filter(r => r.encontrado && r.aluno)
      .map(r => r.aluno.nome);
    
    const novosSelecionados = Array.from(new Set([...selecionados, ...nomesEncontrados]));
    onChange(novosSelecionados);
    setModoPaste(false);
    setConteudoPaste('');
    setResultadoValidacao([]);
  };

  const alunosFiltrados = useMemo(() => {
    return alunos.filter(a => {
      const matchesBusca = !busca || normalize(a.nome).includes(normalize(busca));
      const matchesTurma = mostrarTodos || (turmaAlvo && (a.turma === turmaAlvo || a.ano === turmaAlvo));
      return matchesBusca && matchesTurma;
    }).sort((a,b) => a.nome.localeCompare(b.nome));
  }, [alunos, busca, mostrarTodos, turmaAlvo]);

  const toggleAluno = (nome: string) => {
    if (selecionados.includes(nome)) {
      onChange(selecionados.filter(s => s !== nome));
    } else {
      onChange([...selecionados, nome]);
    }
  };

  return (
    <div className="border-2 border-white/5 rounded-[2.5rem] overflow-hidden bg-[#050505] shadow-2xl">
      <div className="p-8 border-b border-white/5 bg-[#42a0f5]/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <label className="text-[10px] font-black text-[#42a0f5] uppercase tracking-[0.4em] flex items-center gap-2 mb-1">
              <Users size={16} /> Ensalamento Nominal
            </label>
            <p className="text-xs font-bold text-on-surface-variant italic opacity-60">
              {selecionados.length} aluno(s) selecionado(s)
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              type="button"
              onClick={() => {
                setModoPaste(!modoPaste);
                setResultadoValidacao([]);
              }} 
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                modoPaste ? "bg-[#fbbf24] border-[#fbbf24] text-black" : "bg-white/5 border-white/10 text-on-surface-variant"
              )}>
              {modoPaste ? 'Voltar para Lista' : 'Colar Ensalamento'}
            </button>
            {!modoPaste && turmaAlvo && (
              <button 
                type="button"
                onClick={() => setMostrarTodos(!mostrarTodos)} 
                className={cn(
                  "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                  mostrarTodos ? "bg-white/5 border-white/10 text-on-surface-variant" : "bg-[#42a0f5]/10 border-[#42a0f5]/20 text-[#42a0f5]"
                )}>
                {mostrarTodos ? 'Filtrar ' + turmaAlvo : 'Ver Todos'}
              </button>
            )}
          </div>
        </div>

        {!modoPaste && (
          <div className="relative group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#42a0f5] transition-all" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-surface-container-high/40 p-5 pl-14 rounded-[1.5rem] text-sm font-black outline-none border border-transparent focus:border-[#42a0f5]/30 transition-all shadow-inner" 
            />
          </div>
        )}
      </div>
      
      <div className="max-h-[450px] overflow-y-auto p-4 custom-scrollbar bg-black/20">
        {modoPaste ? (
          <div className="space-y-4 p-2">
            {resultadoValidacao.length === 0 ? (
              <div className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 mb-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={14} /> Modo Ensalamento em Massa
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-1">Cole nomes de PDF, Excel ou Word. O sistema buscará correspondências exatas e por palavras-chave.</p>
                </div>
                <textarea 
                  value={conteudoPaste}
                  onChange={e => setConteudoPaste(e.target.value)}
                  placeholder="Cole os nomes aqui (um por linha)..."
                  className="w-full h-48 bg-black border border-white/10 p-5 rounded-2xl text-sm font-medium text-white focus:border-[#fbbf24]/50 outline-none transition-all shadow-inner resize-none"
                />
                <button 
                  type="button"
                  onClick={handleValidarPaste}
                  disabled={!conteudoPaste.trim()}
                  className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-[#fbbf24]/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30"
                >
                  Validar Nomes e Buscar no Banco
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Revisão de Correspondência:</p>
                   <button onClick={() => setResultadoValidacao([])} className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest hover:underline">Limpar Lista</button>
                </div>
                <div className="space-y-3">
                  {resultadoValidacao.map((r) => (
                    <div key={r.id_temp} className={cn(
                      "flex flex-col p-4 rounded-2xl border transition-all",
                      r.encontrado ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                    )}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            r.encontrado ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                          )}>
                            {r.encontrado ? <Check size={16} /> : <X size={16} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Colado:</span>
                            <span className="text-xs font-black truncate text-white">{r.nome}</span>
                          </div>
                        </div>

                        {r.encontrado ? (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-black text-emerald-500 uppercase block tracking-tighter">Match: {r.aluno.nome}</span>
                            <span className="text-[8px] font-black uppercase text-on-surface-variant opacity-60 italic">{r.aluno.turma}</span>
                          </div>
                        ) : (
                          <div className="flex gap-2 shrink-0">
                            <button 
                              type="button"
                              onClick={() => setResultadoValidacao(prev => prev.map(it => it.id_temp === r.id_temp ? {...it, buscaManual: !it.buscaManual} : it))}
                              className="px-3 py-2 bg-white/5 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10"
                            >
                              {r.buscaManual ? 'Fechar' : 'Buscar'}
                            </button>
                            <button 
                              type="button"
                              disabled={carregandoInterno}
                              onClick={() => handleCadastrarRapido(r.id_temp, r.nome)}
                              className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20"
                            >
                              {carregandoInterno ? '...' : '+ Novo'}
                            </button>
                          </div>
                        )}
                      </div>

                      {r.buscaManual && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2 animate-in slide-in-from-top-2 duration-200">
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Pesquise o nome correto no banco..."
                            className="w-full bg-black/40 p-3 rounded-xl text-xs font-medium border border-white/10 outline-none focus:border-primary/40"
                            onChange={(e) => setBusca(e.target.value)}
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                            {alunos.filter(a => normalize(a.nome).includes(normalize(busca))).slice(0, 5).map(a => (
                              <button key={a.id} type="button" onClick={() => handleVincularManual(r.id_temp, a)}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-left transition-colors">
                                <span className="text-xs font-bold text-white/80">{a.nome}</span>
                                <span className="text-[8px] font-black uppercase text-on-surface-variant">{a.turma}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 sticky bottom-0 bg-black/60 backdrop-blur-md pb-2">
                  <button 
                    type="button"
                    onClick={handleConfirmarPaste}
                    className="w-full py-4 bg-primary text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    Confirmar Ensalamento ({resultadoValidacao.filter(r => r.encontrado).length} alunos)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {alunosFiltrados.length === 0 ? (
              <div className="py-20 text-center opacity-20 italic text-xs uppercase font-black tracking-widest">
                Nenhum aluno encontrado
              </div>
            ) : (
              alunosFiltrados.map(a => {
                const isSelected = selecionados.includes(a.nome);
                return (
                  <button 
                    key={a.id} 
                    type="button"
                    onClick={() => toggleAluno(a.nome)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left group",
                      isSelected 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-white/5"
                    )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all", 
                        isSelected ? "bg-primary border-primary text-black" : "border-white/10 group-hover:border-white/30"
                      )}>
                        {isSelected && <Check size={12} strokeWidth={4} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-black truncate", isSelected ? "text-primary" : "text-white")}>{a.nome}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{a.turma}</span>
                      </div>
                    </div>
                    {isSelected && <span className="text-[8px] font-black text-primary uppercase tracking-widest">Selecionado</span>}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
         <button 
            type="button"
            onClick={() => onChange([])}
            className="text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors tracking-[0.2em]"
         >
            Limpar Seleção
         </button>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase opacity-20 tracking-widest italic">SESI Connect Ensalamento</span>
         </div>
      </div>
    </div>
  );
}
