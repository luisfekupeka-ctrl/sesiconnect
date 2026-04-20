import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Upload, FileSpreadsheet, Check, AlertTriangle, X,
  DoorOpen, Users, Sparkles, BookOpen, Languages, RefreshCw,
  Download, Table, Eye, Trash2, ChevronDown, Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEscola } from '../context/ContextoEscola';
import {
  TipoImportacao,
  ESTRUTURA_PLANILHAS,
  importarGradesSalas,
  importarAlunos,
  importarAtividadesAfter,
  importarMonitores,
  importarLaboratorioIdiomas,
  ResultadoImportacao,
} from '../services/importadorExcel';

type AbaAdmin = 'importar' | 'dados' | 'configuracoes';

const MODULOS_IMPORTACAO: { tipo: TipoImportacao; icone: any; cor: string }[] = [
  { tipo: 'grades_salas', icone: DoorOpen, cor: 'primary' },
  { tipo: 'alunos', icone: Users, cor: 'tertiary-container' },
  { tipo: 'atividades_after', icone: Sparkles, cor: 'primary' },
  { tipo: 'monitores', icone: BookOpen, cor: 'tertiary-container' },
  { tipo: 'laboratorio_idiomas', icone: Languages, cor: 'primary' },
];

export default function Admin() {
  const { salas, alunos, atividadesAfter, monitores, laboratorioIdiomas, gradeCompleta } = useEscola();
  const [abaAtiva, setAbaAtiva] = useState<AbaAdmin>('importar');
  const [moduloSelecionado, setModuloSelecionado] = useState<TipoImportacao>('grades_salas');
  const [resultado, setResultado] = useState<ResultadoImportacao<any> | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [previewDados, setPreviewDados] = useState<any[] | null>(null);
  const [estruturaAberta, setEstruturaAberta] = useState<TipoImportacao | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const estrutura = ESTRUTURA_PLANILHAS[moduloSelecionado];

  const handleArquivoSelecionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setCarregando(true);
    setResultado(null);
    setPreviewDados(null);

    try {
      let res: ResultadoImportacao<any>;

      switch (moduloSelecionado) {
        case 'grades_salas':
          res = await importarGradesSalas(arquivo);
          break;
        case 'alunos':
          res = await importarAlunos(arquivo);
          break;
        case 'atividades_after':
          res = await importarAtividadesAfter(arquivo);
          break;
        case 'monitores':
          res = await importarMonitores(arquivo);
          break;
        case 'laboratorio_idiomas':
          res = await importarLaboratorioIdiomas(arquivo);
          break;
        default:
          res = { sucesso: false, dados: [], erros: ['Tipo desconhecido'], totalLinhas: 0, linhasImportadas: 0 };
      }

      setResultado(res);
      if (res.sucesso && res.dados.length > 0) {
        setPreviewDados(res.dados.slice(0, 10));
      }
    } catch (err: any) {
      setResultado({ sucesso: false, dados: [], erros: [err.message], totalLinhas: 0, linhasImportadas: 0 });
    } finally {
      setCarregando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmarImportacao = () => {
    if (!resultado?.dados.length) return;
    // Em produção: enviar para Supabase via servicoSupabase
    // Por agora: os dados ficam no resultado para preview
    alert(`✅ ${resultado.linhasImportadas} registros prontos para sincronizar!\n\nQuando o banco de dados estiver conectado, esses dados serão enviados automaticamente para o Supabase.`);
  };

  // Dados atuais do sistema para a aba "Dados"
  const resumoDados = [
    { tipo: 'grades_salas' as TipoImportacao, total: gradeCompleta.length, rotulo: 'Entradas na Grade', icone: DoorOpen },
    { tipo: 'alunos' as TipoImportacao, total: alunos.length, rotulo: 'Alunos Cadastrados', icone: Users },
    { tipo: 'atividades_after' as TipoImportacao, total: atividadesAfter.length, rotulo: 'Atividades After', icone: Sparkles },
    { tipo: 'monitores' as TipoImportacao, total: monitores.length, rotulo: 'Monitores', icone: BookOpen },
    { tipo: 'laboratorio_idiomas' as TipoImportacao, total: laboratorioIdiomas.length, rotulo: 'Níveis de Idioma', icone: Languages },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* Cabeçalho */}
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full mb-4">
          <Shield size={14} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Área Restrita</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-2">Painel Administrativo</h1>
        <p className="text-on-surface-variant text-lg font-medium leading-relaxed max-w-2xl">
          Importe planilhas Excel para alimentar o sistema. Cada módulo possui uma estrutura específica de colunas.
        </p>
      </header>

      {/* Abas */}
      <div className="flex gap-1 p-1.5 bg-surface-container-low rounded-2xl w-fit">
        {([
          { id: 'importar' as AbaAdmin, rotulo: 'Importar Dados', icone: Upload },
          { id: 'dados' as AbaAdmin, rotulo: 'Dados Atuais', icone: Table },
          { id: 'configuracoes' as AbaAdmin, rotulo: 'Estrutura Excel', icone: FileSpreadsheet },
        ]).map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              abaAtiva === aba.id ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <aba.icone size={14} />
            {aba.rotulo}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ============ ABA: IMPORTAR DADOS ============ */}
        {abaAtiva === 'importar' && (
          <motion.div
            key="importar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Seletor de módulo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {MODULOS_IMPORTACAO.map(({ tipo, icone: Icone, cor }) => {
                const info = ESTRUTURA_PLANILHAS[tipo];
                const selecionado = moduloSelecionado === tipo;
                return (
                  <button
                    key={tipo}
                    onClick={() => { setModuloSelecionado(tipo); setResultado(null); setPreviewDados(null); }}
                    className={cn(
                      "p-5 rounded-2xl text-left transition-all border-2",
                      selecionado
                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/10"
                        : "bg-surface-container-lowest border-transparent hover:border-primary/10 editorial-shadow"
                    )}
                  >
                    <Icone size={20} className={cn(selecionado ? "text-primary" : "text-on-surface-variant")} />
                    <p className={cn("text-xs font-black mt-3 leading-tight", selecionado ? "text-primary" : "text-on-surface")}>{info.nome}</p>
                    <p className="text-[8px] text-on-surface-variant font-bold mt-1 uppercase tracking-widest">{info.colunas.length} colunas</p>
                  </button>
                );
              })}
            </div>

            {/* Zona de Upload */}
            <div className="bg-surface-container-lowest rounded-[2.5rem] editorial-shadow p-8 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                {(() => { const Ic = MODULOS_IMPORTACAO.find(m => m.tipo === moduloSelecionado)?.icone || DoorOpen; return <Ic size={24} className="text-primary" />; })()}
                <div>
                  <h2 className="text-xl font-black text-on-surface">{estrutura.nome}</h2>
                  <p className="text-sm text-on-surface-variant font-medium">{estrutura.descricao}</p>
                </div>
              </div>

              {/* Tabela de colunas esperadas */}
              <div className="overflow-hidden rounded-2xl border border-surface-container-low">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Coluna</th>
                      <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Obrigatória</th>
                      <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Exemplo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estrutura.colunas.map((col, i) => (
                      <tr key={i} className="border-t border-surface-container-low hover:bg-primary/5">
                        <td className="px-5 py-2.5 font-mono text-xs font-black text-primary">{col.nome}</td>
                        <td className="px-5 py-2.5">
                          {col.obrigatoria ? (
                            <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase">Sim</span>
                          ) : (
                            <span className="text-[8px] font-black text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded uppercase">Não</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-on-surface-variant font-medium">{col.exemplo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botão de upload */}
              <label className={cn(
                "flex flex-col items-center justify-center w-full p-12 rounded-3xl border-2 border-dashed cursor-pointer transition-all",
                carregando
                  ? "border-primary/30 bg-primary/5"
                  : "border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5"
              )}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleArquivoSelecionado}
                  className="hidden"
                  disabled={carregando}
                />
                {carregando ? (
                  <RefreshCw size={36} className="text-primary animate-spin mb-4" />
                ) : (
                  <Upload size={36} className="text-on-surface-variant/30 mb-4" />
                )}
                <p className="text-sm font-black text-on-surface">
                  {carregando ? 'Processando...' : 'Arraste ou clique para selecionar'}
                </p>
                <p className="text-[10px] text-on-surface-variant font-bold mt-1">Formatos aceitos: .xlsx, .xls, .csv</p>
              </label>

              {/* Resultado da importação */}
              {resultado && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Status */}
                  <div className={cn(
                    "p-5 rounded-2xl flex items-center gap-4",
                    resultado.sucesso ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"
                  )}>
                    {resultado.sucesso ? (
                      <Check size={24} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle size={24} className="text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className={cn("text-sm font-black", resultado.sucesso ? "text-emerald-600" : "text-red-500")}>
                        {resultado.sucesso
                          ? `✅ ${resultado.linhasImportadas} de ${resultado.totalLinhas} linhas importadas com sucesso`
                          : '❌ Erro na importação'}
                      </p>
                      {resultado.erros.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {resultado.erros.slice(0, 5).map((erro, i) => (
                            <p key={i} className="text-[10px] text-on-surface-variant font-bold">⚠️ {erro}</p>
                          ))}
                          {resultado.erros.length > 5 && (
                            <p className="text-[10px] text-on-surface-variant font-bold">... e mais {resultado.erros.length - 5} avisos</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview dos dados */}
                  {previewDados && previewDados.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                          <Eye size={12} /> Pré-visualização (primeiras 10 linhas)
                        </p>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-surface-container-low">
                        <table className="w-full text-left text-xs min-w-[600px]">
                          <thead>
                            <tr className="bg-surface-container-low/50">
                              {Object.keys(previewDados[0]).filter(k => k !== 'id').map(col => (
                                <th key={col} className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewDados.map((linha, i) => (
                              <tr key={i} className="border-t border-surface-container-low hover:bg-primary/5">
                                {Object.entries(linha).filter(([k]) => k !== 'id').map(([k, v], j) => (
                                  <td key={j} className="px-4 py-2 font-medium text-on-surface whitespace-nowrap">{String(v)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Botão confirmar */}
                      <div className="flex justify-end gap-4 mt-6">
                        <button
                          onClick={() => { setResultado(null); setPreviewDados(null); }}
                          className="px-6 py-3 text-on-surface-variant font-bold text-sm hover:text-on-surface"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={confirmarImportacao}
                          className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Check size={16} />
                          Confirmar Importação ({resultado.linhasImportadas} registros)
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ============ ABA: DADOS ATUAIS ============ */}
        {abaAtiva === 'dados' && (
          <motion.div
            key="dados"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {resumoDados.map(({ tipo, total, rotulo, icone: Icone }) => (
                <div key={tipo} className="bg-surface-container-lowest p-6 rounded-2xl editorial-shadow">
                  <Icone size={20} className="text-primary mb-3" />
                  <p className="text-3xl font-black text-on-surface">{total.toLocaleString('pt-BR')}</p>
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mt-1">{rotulo}</p>
                </div>
              ))}
            </div>

            {/* Resumo detalhado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Salas */}
              <div className="bg-surface-container-lowest p-7 rounded-[2rem] editorial-shadow space-y-4">
                <div className="flex items-center gap-3">
                  <DoorOpen size={20} className="text-primary" />
                  <h3 className="font-black text-lg">Salas (1–31)</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest">Total de Salas</p>
                    <p className="text-xl font-black text-on-surface">{salas.length}</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest">Entradas na Grade</p>
                    <p className="text-xl font-black text-on-surface">{gradeCompleta.length.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold">
                  {gradeCompleta.length} entradas = {salas.length} salas × 5 dias × 9 blocos
                </p>
              </div>

              {/* Alunos */}
              <div className="bg-surface-container-lowest p-7 rounded-[2rem] editorial-shadow space-y-4">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-tertiary-container" />
                  <h3 className="font-black text-lg">Alunos</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-tertiary-container/5 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-tertiary-container uppercase tracking-widest">Total Cadastrados</p>
                    <p className="text-xl font-black text-on-surface">{alunos.length}</p>
                  </div>
                  <div className="bg-tertiary-container/5 p-3 rounded-xl">
                    <p className="text-[8px] font-black text-tertiary-container uppercase tracking-widest">Turmas</p>
                    <p className="text-xl font-black text-on-surface">{new Set(alunos.map(a => a.turma)).size}</p>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="bg-surface-container-lowest p-7 rounded-[2rem] editorial-shadow space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-primary" />
                  <h3 className="font-black text-lg">After School</h3>
                </div>
                <p className="text-3xl font-black text-on-surface">{atividadesAfter.length} <span className="text-sm text-on-surface-variant font-bold">atividades</span></p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(atividadesAfter.map(a => a.categoria))].map(cat => (
                    <span key={cat} className="text-[8px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">{cat}</span>
                  ))}
                </div>
              </div>

              {/* Monitores */}
              <div className="bg-surface-container-lowest p-7 rounded-[2rem] editorial-shadow space-y-4">
                <div className="flex items-center gap-3">
                  <BookOpen size={20} className="text-tertiary-container" />
                  <h3 className="font-black text-lg">Monitores</h3>
                </div>
                <p className="text-3xl font-black text-on-surface">{monitores.length} <span className="text-sm text-on-surface-variant font-bold">monitores</span></p>
                <p className="text-xs text-on-surface-variant font-bold">
                  {monitores.filter(m => m.status === 'ativo').length} ativos • {monitores.filter(m => m.status === 'inativo').length} inativos
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ ABA: ESTRUTURA EXCEL ============ */}
        {abaAtiva === 'configuracoes' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4">
              <Info size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-on-surface mb-1">Como funciona a logística</p>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Prepare sua planilha Excel (.xlsx) com as colunas listadas abaixo. As colunas marcadas como <strong className="text-red-500">obrigatórias</strong> devem estar preenchidas em todas as linhas. 
                  Nomes de colunas não diferenciam maiúsculas/minúsculas e aceitam variações (ex: "nome_professor" ou "Professor").
                  Após importar, os dados substituem os atuais no sistema em tempo real.
                </p>
              </div>
            </div>

            {Object.entries(ESTRUTURA_PLANILHAS).map(([tipo, info]) => {
              const aberta = estruturaAberta === tipo;
              const Icone = MODULOS_IMPORTACAO.find(m => m.tipo === tipo)?.icone || DoorOpen;

              return (
                <div key={tipo} className="bg-surface-container-lowest rounded-[2rem] editorial-shadow overflow-hidden">
                  <button
                    onClick={() => setEstruturaAberta(aberta ? null : tipo as TipoImportacao)}
                    className="w-full p-6 flex items-center justify-between hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icone size={22} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black text-on-surface">{info.nome}</h3>
                        <p className="text-xs text-on-surface-variant font-medium">{info.descricao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg">{info.colunas.length} colunas</span>
                      <ChevronDown className={cn("text-on-surface-variant transition-transform", aberta && "rotate-180")} size={18} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {aberta && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <div className="overflow-hidden rounded-2xl border border-surface-container-low">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-surface-container-low/50">
                                  <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Nome da Coluna</th>
                                  <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Obrigatória</th>
                                  <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Exemplo de Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {info.colunas.map((col, i) => (
                                  <tr key={i} className="border-t border-surface-container-low hover:bg-primary/5 transition-colors">
                                    <td className="px-5 py-3 font-mono text-sm font-black text-primary">{col.nome}</td>
                                    <td className="px-5 py-3">
                                      {col.obrigatoria ? (
                                        <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase">Obrigatória</span>
                                      ) : (
                                        <span className="text-[8px] font-black text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded uppercase">Opcional</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-on-surface-variant font-medium">{col.exemplo}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
