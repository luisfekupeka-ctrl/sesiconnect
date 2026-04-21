import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, UserCheck, Download, BarChart3, Plus, X, ChevronDown, Calendar, Filter, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { Aluno, ModeloFormulario, CampoFormulario, RegistroOcorrencia } from '../types';
import { 
  salvarOcorrencia, 
  salvarModeloFormulario, 
  excluirModeloFormulario 
} from '../services/dataService';

// === Componente de Autopreenchimento de Aluno ===
function AutocompleteAluno({
  alunos,
  valor,
  aoSelecionar,
}: {
  alunos: Aluno[];
  valor: string;
  aoSelecionar: (aluno: Aluno) => void;
}) {
  const [busca, setBusca] = useState(valor);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sugestoes = busca.length >= 2
    ? alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    setBusca(valor);
  }, [valor]);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={16} />
        <input
          type="text"
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          placeholder="Digite o nome do aluno..."
          className="w-full pl-12 pr-5 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm placeholder:text-outline"
        />
      </div>

      <AnimatePresence>
        {aberto && sugestoes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            className="absolute z-50 w-full mt-2 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden max-h-72 overflow-y-auto"
          >
            {sugestoes.map((aluno) => (
              <button
                key={aluno.id}
                onClick={() => {
                  aoSelecionar(aluno);
                  setBusca(aluno.nome);
                  setAberto(false);
                }}
                className="w-full px-5 py-3.5 text-left hover:bg-primary/5 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{aluno.nome}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold">{aluno.turma} • Sala {aluno.numeroSala.toString().padStart(2, '0')}</p>
                </div>
                <span className="text-[9px] font-black text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg">{aluno.ano}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === Página Principal de Formulários ===
const SERIES = [
  '6º Ano Fundamental', '7º Ano Fundamental', '8º Ano Fundamental', '9º Ano Fundamental',
  '1º Ano Médio', '2º Ano Médio', '3º Ano Médio'
];

export default function FormsPage() {
  const { 
    alunos, modelosFormulario, ocorrencias, 
    adicionarOcorrencia, atualizar, professoresCMS 
  } = useEscola();

  const [abaAtiva, setAbaAtiva] = useState<'nova' | 'relatorios'>('nova');
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloFormulario | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [dadosFormulario, setDadosFormulario] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filtroRelatorio, setFiltroRelatorio] = useState<'diario' | 'semanal' | 'quinzenal' | 'mensal'>('diario');

  // Estado do Construtor
  const [editandoModelo, setEditandoModelo] = useState<Partial<ModeloFormulario> | null>(null);

  useEffect(() => {
    if (modelosFormulario.length > 0 && !modeloSelecionado) {
      setModeloSelecionado(modelosFormulario[0]);
    }
  }, [modelosFormulario, modeloSelecionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeloSelecionado || !alunoSelecionado) return;

    setSalvando(true);
    const ok = await salvarOcorrencia({
      modeloFormularioId: modeloSelecionado.id,
      nomeModelo: modeloSelecionado.nome,
      dados: dadosFormulario,
      nomeAluno: alunoSelecionado.nome,
      turmaAluno: alunoSelecionado.turma,
      anoAluno: alunoSelecionado.ano,
      salaAluno: alunoSelecionado.numeroSala,
      professorAtual: 'A DEFINIR', // Poderia vir do contexto se logado
    });

    if (ok) {
      atualizar();
      setEnviado(true);
    }
    setSalvando(false);
  };

  const limparFormulario = () => {
    setAlunoSelecionado(null);
    setDadosFormulario({});
    setEnviado(false);
  };

  // Filtrar ocorrências por período (Defensivo)
  const agora = new Date();
  const ocorrenciasBase = Array.isArray(ocorrencias) ? ocorrencias : [];
  
  const ocorrenciasFiltradas = ocorrenciasBase.filter(oc => {
    if (!oc.criadoEm) return false;
    const dataOc = new Date(oc.criadoEm);
    if (isNaN(dataOc.getTime())) return false;
    
    const diff = agora.getTime() - dataOc.getTime();
    const dias = diff / (1000 * 60 * 60 * 24);

    switch (filtroRelatorio) {
      case 'diario': return dias <= 1;
      case 'semanal': return dias <= 7;
      case 'quinzenal': return dias <= 15;
      case 'mensal': return dias <= 30;
      default: return true;
    }
  });

  const contagemPorTipo = ocorrenciasFiltradas.reduce((acc, oc) => {
    const nome = oc.nomeModelo || 'Desconhecido';
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alunosRecorrentes = ocorrenciasFiltradas.reduce((acc, oc) => {
    const nome = oc.nomeAluno || 'Desconhecido';
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alunosOrdenados = Object.entries(alunosRecorrentes)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3">Comando Central: Forms</h1>
          <p className="text-on-surface-variant text-lg font-medium leading-relaxed">
            Crie formulários dinâmicos e visualize relatórios em tempo real.
          </p>
        </div>
        <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
          {([
            { id: 'nova', rotulo: 'Registrar' },
            { id: 'relatorios', rotulo: 'Dashboards' },
          ] as const).map((aba) => (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
              className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                abaAtiva === aba.id ? "bg-surface-container-low text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface")}>
              {aba.rotulo}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* === ABA: NOVA OCORRÊNCIA === */}
        {abaAtiva === 'nova' && (
          <motion.div key="nova" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {Array.isArray(modelosFormulario) && modelosFormulario.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {modelosFormulario.map(modelo => (
                  <button key={modelo.id} onClick={() => { setModeloSelecionado(modelo); limparFormulario(); }}
                    className={cn("flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black transition-all border-2",
                      modeloSelecionado?.id === modelo.id ? "bg-primary text-on-surface-bright border-primary" : "bg-surface-container-lowest text-on-surface-variant border-transparent hover:border-primary/10")}>
                    {modelo.nome}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center bg-surface-container-lowest rounded-[2.5rem] editorial-shadow border-2 border-dashed border-primary/10">
                <FileSpreadsheet size={48} className="text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-black mb-2">Nenhum formulário ativo</h3>
                <p className="text-on-surface-variant text-sm mb-6 max-w-sm mx-auto">Solicite ao administrador a criação de um novo formulário dinâmico.</p>
              </div>
            )}

            {modeloSelecionado && !enviado && (
              <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] editorial-shadow border border-outline-variant/10">
                <div className="mb-8">
                  <h2 className="text-xl font-black text-on-surface mb-1">{modeloSelecionado.nome}</h2>
                  <p className="text-on-surface-variant font-medium text-sm">{modeloSelecionado.descricao}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {modeloSelecionado.campos.map(campo => (
                    <div key={campo.id} className="space-y-3">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 flex items-center gap-1">
                        {campo.rotulo} {campo.obrigatorio && <span className="text-red-500">*</span>}
                      </label>
                      {campo.tipo === 'autocomplete_aluno' && (
                        <div className="space-y-3">
                          <AutocompleteAluno alunos={alunos} valor={alunoSelecionado?.nome || ''} aoSelecionar={setAlunoSelecionado} />
                          {alunoSelecionado && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-3 gap-3">
                              {[
                                { rotulo: 'Turma', valor: alunoSelecionado.turma },
                                { rotulo: 'Ano', valor: alunoSelecionado.ano },
                                { rotulo: 'Sala', valor: `Sala ${alunoSelecionado.numeroSala.toString().padStart(2, '0')}` },
                              ].map(info => (
                                <div key={info.rotulo} className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                  <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">{info.rotulo}</p>
                                  <p className="text-xs font-black text-on-surface">{info.valor}</p>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}
                      {campo.tipo === 'texto' && <input type="text" required={campo.obrigatorio} value={dadosFormulario[campo.rotulo] || ''} onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} className="campo-input-base" />}
                      
                      {campo.tipo === 'selecao' && campo.opcoes && (
                        <select required={campo.obrigatorio} value={dadosFormulario[campo.rotulo] || ''} onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} className="campo-input-base">
                          <option value="">Selecione uma opção...</option>
                          {campo.opcoes.map(opcao => <option key={opcao} value={opcao}>{opcao}</option>)}
                        </select>
                      )}

                      {campo.tipo === 'radio' && campo.opcoes && (
                        <div className="flex flex-wrap gap-3">
                          {campo.opcoes.map(opcao => (
                            <label key={opcao} className="cursor-pointer">
                              <input type="radio" name={campo.id} required={campo.obrigatorio} className="sr-only peer" onChange={() => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: opcao }))} checked={dadosFormulario[campo.rotulo] === opcao} />
                              <div className="px-5 py-3 rounded-2xl bg-surface-container-low text-on-surface-variant peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:ring-2 peer-checked:ring-primary font-bold text-sm">
                                {opcao}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {campo.tipo === 'checkbox' && campo.opcoes && (
                        <div className="flex flex-wrap gap-3">
                          {campo.opcoes.map(opcao => {
                            const valores = dadosFormulario[campo.rotulo] || [];
                            const estaSelecionado = valores.includes(opcao);
                            return (
                              <label key={opcao} className="cursor-pointer">
                                <input type="checkbox" className="sr-only peer" 
                                  onChange={e => {
                                    const novosValores = e.target.checked 
                                      ? [...valores, opcao]
                                      : valores.filter((v: string) => v !== opcao);
                                    setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: novosValores }));
                                  }} checked={estaSelecionado} />
                                <div className="px-5 py-3 rounded-2xl bg-surface-container-low text-on-surface-variant peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:ring-2 peer-checked:ring-primary font-bold text-sm">
                                  {opcao}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {campo.tipo === 'serie_escolar' && (
                        <select required={campo.obrigatorio} value={dadosFormulario[campo.rotulo] || ''} onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} className="campo-input-base">
                          <option value="">Selecione a série...</option>
                          {SERIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}

                      {campo.tipo === 'area_texto' && <textarea required={campo.obrigatorio} value={dadosFormulario[campo.rotulo] || ''} onChange={e => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))} rows={3} className="campo-input-base resize-none" placeholder="Detalhes..." />}
                    </div>
                  ))}
                  <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={limparFormulario} className="px-8 py-4 text-on-surface-variant font-bold text-sm">Limpar</button>
                    <button type="submit" disabled={!alunoSelecionado || salvando} className="btn-primary !px-12 !py-4">
                      {salvando ? 'Salvando...' : 'Registrar'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {enviado && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-container-lowest p-16 rounded-[2.5rem] editorial-shadow text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto"><UserCheck size={40} /></div>
                <h2 className="text-2xl font-black">Registrado com Sucesso!</h2>
                <p className="text-on-surface-variant font-medium">{alunoSelecionado?.nome}</p>
                <button onClick={limparFormulario} className="btn-primary">Novo Registro</button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* === ABA: RELATÓRIOS (DASHBOARDS) === */}
        {abaAtiva === 'relatorios' && (
          <motion.div key="relatorios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex gap-2 p-1.5 bg-surface-container-low rounded-2xl w-fit">
              {['diario', 'semanal', 'quinzenal', 'mensal'].map(f => (
                <button key={f} onClick={() => setFiltroRelatorio(f as any)}
                  className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroRelatorio === f ? "bg-surface-container-low text-primary shadow-sm" : "text-on-surface-variant")}>{f}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <CardResumoMini titulo="Total" valor={ocorrenciasFiltradas.length} cor="primary" icone={FileText} />
              <CardResumoMini titulo="Frequente" valor={alunosOrdenados[0]?.[1] || 0} subtitulo={alunosOrdenados[0]?.[0] || '—'} cor="tertiary" icone={UserCheck} />
              <CardResumoMini titulo="Top Evento" valor={Object.entries(contagemPorTipo).sort((a,b)=>b[1]-a[1])[0]?.[1] || 0} subtitulo={Object.entries(contagemPorTipo).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'} cor="indigo" icone={BarChart3} />
            </div>

            <div className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="font-black">Eventos Recentes</h3>
                    <div className="flex gap-2">
                      {ocorrenciasFiltradas.length > 0 && <button className="btn-mini"><Download size={12}/> XLS</button>}
                    </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {ocorrenciasFiltradas.length === 0 ? (
                      <div className="p-20 text-center space-y-3">
                        <BarChart3 size={40} className="text-on-surface-variant/20 mx-auto" />
                        <p className="text-on-surface-variant text-sm italic">Nenhum registro encontrado para este período.</p>
                      </div>
                    ) : (
                      ocorrenciasFiltradas.map(oc => (
                          <div key={oc.id} className="p-4 border-b border-surface-container-low flex items-center gap-4 hover:bg-primary/5 transition-all">
                              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center"><FileText size={16}/></div>
                              <div className="flex-1">
                                  <p className="text-sm font-black">{oc.nomeAluno}</p>
                                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">{oc.nomeModelo} · {oc.turmaAluno}</p>
                              </div>
                              <p className="text-[10px] font-bold text-on-surface-variant">{new Date(oc.criadoEm).toLocaleDateString()}</p>
                          </div>
                      ))
                    )}
                </div>
            </div>
          </motion.div>
        )}

        {/* Construtor removido desta página a pedido do usuário - Movido para Painel Admin */}
      </AnimatePresence>
    </motion.div>
  );
}

function CardResumoMini({ titulo, valor, subtitulo, cor, icone: Icone }: { titulo: string; valor: number; subtitulo?: string; cor: string; icone: any }) {
  const cores: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    tertiary: 'bg-emerald-500/10 text-emerald-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
  };
  return (
    <div className="bg-surface-container-low p-6 rounded-[1.5rem] editorial-shadow flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", cores[cor])}><Icone size={24}/></div>
      <div>
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{titulo}</p>
        <p className="text-3xl font-black leading-none my-1">{valor}</p>
        {subtitulo && <p className="text-[9px] font-bold text-on-surface-variant truncate max-w-[120px]">{subtitulo}</p>}
      </div>
    </div>
  );
}

