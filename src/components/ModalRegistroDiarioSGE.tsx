import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, Check, FileText, User, Calendar, Clock, 
  Trash2, Pencil, X, AlertCircle, Share2, Printer, 
  Sparkles, CheckCircle2, ChevronRight, Shield
} from 'lucide-react';
import type { DailyOccurrenceRecord, RegistroOcorrencia } from '../types';
import { 
  gerarCabecalhoOficialSesi, 
  extrairRelatoSucinto, 
  gerarTextoCompletoSGE, 
  gerarMensagemResponsaveis,
  ENCAMINHAMENTOS_PADRAO_ATA,
  FECHAMENTO_PADRAO_ATA_ABNT
} from '../lib/ataUtils';
import { useAuth } from '../context/AuthContext';
import { occurrenceService } from '../services/occurrenceService';
import FichaOcorrencia from './FichaOcorrencia';

interface Props {
  record: DailyOccurrenceRecord;
  onClose: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export default function ModalRegistroDiarioSGE({
  record,
  onClose,
  onUpdate,
  onDelete
}: Props) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const [copiadoSGE, setCopiadoSGE] = useState(false);
  const [copiadoMensagem, setCopiadoMensagem] = useState(false);
  const [copiadoRelato, setCopiadoRelato] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [relatoEditado, setRelatoEditado] = useState(record.report);
  const [salvando, setSalvando] = useState(false);
  const [mostrandoFichaA4, setMostrandoFichaA4] = useState(false);

  const dataStr = record.created_at || new Date().toISOString();
  
  // Extrai horário se presente
  let horarioStr = '';
  const timeMatch = record.report?.match(/\b\d{1,2}:\d{2}\b/);
  if (timeMatch) horarioStr = timeMatch[0];

  const { cabecalho, dataFormatada, horarioFormatado } = useMemo(() => {
    return gerarCabecalhoOficialSesi({
      dataStr,
      horarioStr,
      nomeAluno: record.student_name,
      turmaAluno: record.school_year
    });
  }, [dataStr, horarioStr, record.student_name, record.school_year]);

  const relatoSucinto = useMemo(() => {
    return extrairRelatoSucinto(modoEdicao ? relatoEditado : record.report, record.occurrence_type);
  }, [record.report, record.occurrence_type, modoEdicao, relatoEditado]);

  const textoCompletoSGE = useMemo(() => {
    return relatoSucinto;
  }, [relatoSucinto]);

  const mensagemResponsaveis = useMemo(() => {
    return gerarMensagemResponsaveis({
      nomeAluno: record.student_name,
      turmaAluno: record.school_year,
      tipoOcorrencia: record.occurrence_type,
      relato: record.report,
      emissor: record.created_by || profile?.full_name,
      dataStr
    });
  }, [record, profile, dataStr]);

  const handleCopiarSGE = async () => {
    try {
      await navigator.clipboard.writeText(textoCompletoSGE);
      setCopiadoSGE(true);
      setTimeout(() => setCopiadoSGE(false), 2500);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  };

  const handleCopiarMensagem = async () => {
    try {
      await navigator.clipboard.writeText(mensagemResponsaveis);
      setCopiadoMensagem(true);
      setTimeout(() => setCopiadoMensagem(false), 2500);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  };

  const handleCopiarRelato = async () => {
    try {
      await navigator.clipboard.writeText(relatoSucinto);
      setCopiadoRelato(true);
      setTimeout(() => setCopiadoRelato(false), 2500);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  };

  const handleSalvarEdicao = async () => {
    if (!record.id) return;
    setSalvando(true);
    try {
      await occurrenceService.updateRecord(record.id, { report: relatoEditado });
      record.report = relatoEditado;
      setModoEdicao(false);
      onUpdate?.();
    } catch (e) {
      alert('Erro ao salvar alterações do registro.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!record.id) return;
    if (window.confirm('Tem certeza que deseja apagar este registro diário permanentemente?')) {
      try {
        await occurrenceService.deleteRecord(record.id);
        onDelete?.();
        onClose();
      } catch (e) {
        alert('Erro ao excluir registro.');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#0f172a] text-slate-100 rounded-[2.5rem] border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Top Bar Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500" />

          {/* Modal Header */}
          <div className="p-6 md:p-8 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" />
                  Registro Diário · Formato SGE
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {dataFormatada} às {horarioFormatado}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                {record.student_name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  Turma: <strong className="text-white">{record.school_year}</strong>
                </span>
                <span>•</span>
                <span className="text-amber-400 font-bold">
                  {record.occurrence_type}
                </span>
                {record.created_by && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">Registrado por: {record.created_by}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            
            {/* Action Banner: Copy to SGE Direct */}
            <div className="p-4 bg-gradient-to-r from-blue-900/30 to-slate-800/40 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Texto Pronto para o SGE Oficial
                </h4>
                <p className="text-xs text-slate-400">
                  Clique no botão abaixo para copiar a ocorrência com cabeçalho padrão e relato sucinto.
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleCopiarSGE}
                className={cn(
                  "px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-lg cursor-pointer",
                  copiadoSGE
                    ? "bg-emerald-500 text-black shadow-emerald-500/20"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                )}
              >
                {copiadoSGE ? <Check size={16} /> : <Copy size={16} />}
                {copiadoSGE ? 'Copiado para o SGE!' : 'Copiar para SGE'}
              </button>
            </div>

            {/* Caixa do Texto Formatado */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-400" />
                  Visualização do Documento
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarRelato}
                    className="text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copiar apenas o relato resumido"
                  >
                    {copiadoRelato ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiadoRelato ? 'Relato copiado!' : 'Copiar só relato'}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setModoEdicao(!modoEdicao)}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil size={12} />
                      {modoEdicao ? 'Cancelar Edição' : 'Editar Relato'}
                    </button>
                  )}
                </div>
              </div>

              {modoEdicao ? (
                <div className="space-y-3">
                  <textarea
                    value={relatoEditado}
                    onChange={e => setRelatoEditado(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-900 border border-amber-400/30 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-amber-400 transition-colors leading-relaxed"
                    placeholder="Edite o relato da ocorrência..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModoEdicao(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvarEdicao}
                      disabled={salvando}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {salvando ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 text-xs md:text-sm leading-relaxed text-slate-200 font-sans shadow-inner select-text">
                  {/* Relato Sucinto Destacado */}
                  <div className="font-semibold text-white space-y-1">
                    <p className="leading-relaxed">
                      {relatoSucinto}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mensagem para Responsáveis (WhatsApp / Notificação) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Share2 size={14} className="text-emerald-400" />
                  Mensagem para os Responsáveis (WhatsApp / E-mail)
                </label>
                <button
                  type="button"
                  onClick={handleCopiarMensagem}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1 rounded-lg bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiadoMensagem ? <Check size={12} /> : <Copy size={12} />}
                  {copiadoMensagem ? 'Mensagem copiada!' : 'Copiar Mensagem'}
                </button>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {mensagemResponsaveis}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 md:p-6 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleExcluir}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
              )}
              <button
                type="button"
                onClick={() => setMostrandoFichaA4(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Abrir modelo A4 com assinaturas se precisar imprimir formalmente"
              >
                <Printer size={14} />
                Ver Ata Formal A4
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleCopiarSGE}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {copiadoSGE ? <Check size={14} /> : <Copy size={14} />}
                {copiadoSGE ? 'Copiado!' : 'Copiar para SGE'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fallback para Ficha A4 completa se o usuário clicar explicitamente */}
      <AnimatePresence>
        {mostrandoFichaA4 && (
          <FichaOcorrencia
            ocorrencia={{
              id: record.id || '',
              modeloFormularioId: 'diario',
              nomeModelo: record.occurrence_type,
              nomeAluno: record.student_name,
              turmaAluno: record.school_year,
              anoAluno: record.school_year,
              professorAtual: record.created_by || 'Administração',
              criadoEm: record.created_at || new Date().toISOString(),
              dados: {
                'Tipo de Ocorrência': record.occurrence_type,
                'Descrição': record.report
              }
            }}
            onClose={() => setMostrandoFichaA4(false)}
            onEditSuccess={() => {
              setMostrandoFichaA4(false);
              onUpdate?.();
            }}
            onDeleteSuccess={() => {
              setMostrandoFichaA4(false);
              onDelete?.();
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
