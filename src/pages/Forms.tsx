import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, UserCheck, Download, BarChart3, Plus, X, ChevronDown, Calendar, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import { Aluno, ModeloFormulario, CampoFormulario, RegistroOcorrencia } from '../types';

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
export default function FormsPage() {
  const { alunos, modelosFormulario, ocorrencias, adicionarOcorrencia, estadoEscola, professores } = useEscola();
  const [abaAtiva, setAbaAtiva] = useState<'nova' | 'relatorios' | 'admin'>('nova');
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloFormulario | null>(modelosFormulario[0] || null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [dadosFormulario, setDadosFormulario] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState(false);
  const [filtroRelatorio, setFiltroRelatorio] = useState<'diario' | 'semanal' | 'quinzenal' | 'mensal'>('diario');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modeloSelecionado || !alunoSelecionado) return;

    // Encontrar professor atual baseado no estado da escola
    const salaProfAtual = estadoEscola.salas.find(s => s.numeroSala === alunoSelecionado.numeroSala);

    const novaOcorrencia: RegistroOcorrencia = {
      id: `oc-${Date.now()}`,
      modeloFormularioId: modeloSelecionado.id,
      nomeModelo: modeloSelecionado.nome,
      dados: dadosFormulario,
      nomeAluno: alunoSelecionado.nome,
      turmaAluno: alunoSelecionado.turma,
      anoAluno: alunoSelecionado.ano,
      salaAluno: alunoSelecionado.numeroSala,
      professorAtual: salaProfAtual?.professorAtual,
      criadoEm: new Date().toISOString(),
    };

    adicionarOcorrencia(novaOcorrencia);
    setEnviado(true);
  };

  const limparFormulario = () => {
    setAlunoSelecionado(null);
    setDadosFormulario({});
    setEnviado(false);
  };

  // Filtrar ocorrências por período
  const agora = new Date();
  const ocorrenciasFiltradas = ocorrencias.filter(oc => {
    const dataOc = new Date(oc.criadoEm);
    const diff = agora.getTime() - dataOc.getTime();
    const dias = diff / (1000 * 60 * 60 * 24);

    switch (filtroRelatorio) {
      case 'diario': return dias <= 1;
      case 'semanal': return dias <= 7;
      case 'quinzenal': return dias <= 15;
      case 'mensal': return dias <= 30;
    }
  });

  // Contagens para relatório
  const contagemPorTipo = ocorrenciasFiltradas.reduce((acc, oc) => {
    acc[oc.nomeModelo] = (acc[oc.nomeModelo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alunosRecorrentes = ocorrenciasFiltradas.reduce((acc, oc) => {
    acc[oc.nomeAluno] = (acc[oc.nomeAluno] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alunosOrdenados = Object.entries(alunosRecorrentes).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-10"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3">Formulários</h1>
          <p className="text-on-surface-variant text-lg font-medium leading-relaxed">
            Registro de ocorrências com autopreenchimento inteligente e relatórios automáticos.
          </p>
        </div>
        <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl">
          {([
            { id: 'nova', rotulo: 'Nova Ocorrência' },
            { id: 'relatorios', rotulo: 'Relatórios' },
            { id: 'admin', rotulo: 'Modelos' },
          ] as const).map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                abaAtiva === aba.id ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {aba.rotulo}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* === ABA: NOVA OCORRÊNCIA === */}
        {abaAtiva === 'nova' && (
          <motion.div
            key="nova"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Seletor de modelo */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {modelosFormulario.map(modelo => (
                <button
                  key={modelo.id}
                  onClick={() => { setModeloSelecionado(modelo); limparFormulario(); }}
                  className={cn(
                    "flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black transition-all border-2",
                    modeloSelecionado?.id === modelo.id
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-container-lowest text-on-surface-variant border-transparent hover:border-primary/10"
                  )}
                >
                  {modelo.nome}
                </button>
              ))}
            </div>

            {modeloSelecionado && !enviado && (
              <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] editorial-shadow">
                <div className="mb-8">
                  <h2 className="text-xl font-black text-on-surface mb-1">{modeloSelecionado.nome}</h2>
                  <p className="text-on-surface-variant font-medium text-sm">{modeloSelecionado.descricao}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {modeloSelecionado.campos.map(campo => (
                    <div key={campo.id} className="space-y-3">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 flex items-center gap-1">
                        {campo.rotulo}
                        {campo.obrigatorio && <span className="text-red-500">*</span>}
                      </label>

                      {campo.tipo === 'autocomplete_aluno' && (
                        <div className="space-y-3">
                          <AutocompleteAluno
                            alunos={alunos}
                            valor={alunoSelecionado?.nome || ''}
                            aoSelecionar={(aluno) => {
                              setAlunoSelecionado(aluno);
                            }}
                          />
                          {/* Campos autopreenchidos */}
                          {alunoSelecionado && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="grid grid-cols-3 gap-3"
                            >
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

                      {campo.tipo === 'texto' && (
                        <input
                          type="text"
                          required={campo.obrigatorio}
                          value={dadosFormulario[campo.rotulo] || ''}
                          onChange={(e) => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))}
                          className="w-full px-5 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                        />
                      )}

                      {campo.tipo === 'selecao' && campo.opcoes && (
                        <div className="flex flex-wrap gap-3">
                          {campo.opcoes.map(opcao => (
                            <label key={opcao} className="cursor-pointer">
                              <input
                                type="radio"
                                name={campo.id}
                                required={campo.obrigatorio}
                                className="sr-only peer"
                                onChange={() => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: opcao }))}
                                checked={dadosFormulario[campo.rotulo] === opcao}
                              />
                              <div className="px-5 py-3 rounded-2xl bg-surface-container-low text-on-surface-variant peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:ring-2 peer-checked:ring-primary transition-all font-bold text-sm">
                                {opcao}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {campo.tipo === 'area_texto' && (
                        <textarea
                          required={campo.obrigatorio}
                          value={dadosFormulario[campo.rotulo] || ''}
                          onChange={(e) => setDadosFormulario(prev => ({ ...prev, [campo.rotulo]: e.target.value }))}
                          rows={3}
                          className="w-full p-5 bg-surface-container-low border-none rounded-2xl text-on-surface focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none"
                          placeholder="Detalhes adicionais..."
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={limparFormulario} className="px-8 py-4 text-on-surface-variant font-bold text-sm hover:text-on-surface">Limpar</button>
                    <button
                      type="submit"
                      disabled={!alunoSelecionado}
                      className="px-12 py-4 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Registrar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {enviado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-container-lowest p-16 rounded-[2.5rem] editorial-shadow text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <UserCheck size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black">Ocorrência Registrada!</h2>
                <p className="text-on-surface-variant font-medium">
                  {alunoSelecionado?.nome} — {modeloSelecionado?.nome}
                </p>
                <button onClick={limparFormulario} className="px-8 py-3 bg-primary text-white rounded-full font-black text-sm">Novo Registro</button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* === ABA: RELATÓRIOS === */}
        {abaAtiva === 'relatorios' && (
          <motion.div
            key="relatorios"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Filtros de período */}
            <div className="flex gap-2 p-1.5 bg-surface-container-low rounded-2xl w-fit">
              {([
                { id: 'diario', rotulo: 'Diário' },
                { id: 'semanal', rotulo: 'Semanal' },
                { id: 'quinzenal', rotulo: 'Quinzenal' },
                { id: 'mensal', rotulo: 'Mensal' },
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltroRelatorio(f.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroRelatorio === f.id ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {f.rotulo}
                </button>
              ))}
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-surface-container-lowest p-6 rounded-2xl editorial-shadow">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Total de Ocorrências</p>
                <p className="text-4xl font-black text-primary">{ocorrenciasFiltradas.length}</p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-2xl editorial-shadow">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Tipo Mais Comum</p>
                <p className="text-lg font-black text-on-surface">
                  {Object.entries(contagemPorTipo).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '—'}
                </p>
                <p className="text-sm text-on-surface-variant font-bold">
                  {Object.entries(contagemPorTipo).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[1] || 0} registros
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-2xl editorial-shadow">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Alunos Recorrentes</p>
                <p className="text-lg font-black text-on-surface">{alunosOrdenados[0]?.[0] || '—'}</p>
                <p className="text-sm text-on-surface-variant font-bold">{alunosOrdenados[0]?.[1] || 0} ocorrências</p>
              </div>
            </div>

            {/* Barras por tipo */}
            <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow">
              <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Ocorrências por Tipo
              </h3>
              <div className="space-y-4">
                {Object.entries(contagemPorTipo).map(([tipo, qtd]) => {
                  const vals = Object.values(contagemPorTipo) as number[];
                  const max = Math.max(...vals);
                  return (
                    <div key={tipo} className="flex items-center gap-4">
                      <span className="text-xs font-black text-on-surface w-48 truncate">{tipo}</span>
                      <div className="flex-1 bg-surface-container-low rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((qtd as number) / max) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                      <span className="text-xs font-black text-primary w-8 text-right">{qtd}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista de ocorrências */}
            <div className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow overflow-hidden">
              <div className="p-6 border-b border-surface-container-low flex items-center justify-between">
                <h3 className="font-black text-on-surface flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  Registros Recentes
                </h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-colors">PDF</button>
                  <button className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors">Excel</button>
                </div>
              </div>

              <div className="divide-y divide-surface-container-low max-h-96 overflow-y-auto">
                {ocorrenciasFiltradas.map(oc => (
                  <div key={oc.id} className="px-6 py-4 hover:bg-primary/5 transition-colors flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-on-surface truncate">{oc.nomeAluno}</p>
                      <p className="text-[10px] text-on-surface-variant font-bold">{oc.nomeModelo} • {oc.turmaAluno}</p>
                    </div>
                    <span className="text-[9px] font-black text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-lg shrink-0">
                      {new Date(oc.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* === ABA: ADMIN (MODELOS) === */}
        {abaAtiva === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-on-surface">Modelos de Formulário</h2>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Plus size={16} />
                Novo Modelo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {modelosFormulario.map(modelo => (
                <div key={modelo.id} className="bg-surface-container-lowest p-7 rounded-[2rem] editorial-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-on-surface mb-1">{modelo.nome}</h3>
                      <p className="text-sm text-on-surface-variant font-medium">{modelo.descricao}</p>
                    </div>
                    <span className="text-[9px] font-black text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-lg">{modelo.campos.length} campos</span>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-surface-container-low">
                    {modelo.campos.map(campo => (
                      <div key={campo.id} className="flex items-center gap-3 text-xs">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          campo.tipo === 'autocomplete_aluno' ? "bg-primary/10 text-primary" :
                          campo.tipo === 'selecao' ? "bg-tertiary-container/10 text-tertiary-container" :
                          "bg-surface-container-high text-on-surface-variant"
                        )}>
                          {campo.tipo === 'autocomplete_aluno' ? 'Auto' :
                           campo.tipo === 'selecao' ? 'Seleção' :
                           campo.tipo === 'area_texto' ? 'Texto' : 'Campo'}
                        </span>
                        <span className="font-bold text-on-surface">{campo.rotulo}</span>
                        {campo.obrigatorio && <span className="text-red-500 text-[10px]">*</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
