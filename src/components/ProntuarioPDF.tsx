import React, { useState } from 'react';
import { RegistroOcorrencia, DailyOccurrenceRecord } from '../types';
import { Printer, X, Download, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { montarEstruturaAta } from '../lib/ataUtils';
import papelTimbradoImg from '../assets/papel_timbrado.png';
import { generateStudentAllOccurrencesPDF } from '../lib/reportGenerator';

interface Props {
  ocorrencias: (RegistroOcorrencia | DailyOccurrenceRecord)[];
  onClose: () => void;
  alunoNome: string;
}

export default function ProntuarioPDF({ ocorrencias, onClose, alunoNome }: Props) {
  const [baixandoPDF, setBaixandoPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setBaixandoPDF(true);
    try {
      await generateStudentAllOccurrencesPDF(ocorrencias, alunoNome);
    } catch (e) {
      console.error('Erro ao baixar PDF unificado:', e);
    } finally {
      setBaixandoPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl flex flex-col print:shadow-none print:max-h-none print:rounded-none max-h-[96vh] overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Painel de Controle Superior (oculto na impressão) */}
        <div className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/60 p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Dossiê Completo de Ocorrências
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-slate-200">{alunoNome}</span> · <span className="text-blue-600 dark:text-blue-400 font-bold">{ocorrencias.length} {ocorrencias.length === 1 ? 'registro' : 'registros'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={handlePrint} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Printer size={16} /> Imprimir Todos de Uma Vez
            </button>
            <button 
              onClick={handleDownloadPDF} 
              disabled={baixandoPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
            >
              <Download size={16} /> {baixandoPDF ? 'Gerando PDF...' : 'Baixar PDF Único'}
            </button>
            <button 
              onClick={onClose} 
              className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Informação / Dica (oculta na impressão) */}
        <div className="bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 px-6 py-2.5 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-medium print:hidden">
          <span>💡 Todos os registros estão formatados no papel timbrado oficial com quebra de página automática.</span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">{ocorrencias.length} página(s)</span>
        </div>

        {/* Corpo Rolável / Impressão */}
        <div id="printable-dossie" className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950/60 print:bg-white print:overflow-visible custom-scrollbar relative flex flex-col items-center py-6 print:py-0 gap-6 print:gap-0">
          
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { size: A4 portrait; margin: 0; }
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body * { visibility: hidden; }
              #printable-dossie, #printable-dossie * { visibility: visible; }
              #printable-dossie {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
              }
              .page-sheet {
                width: 210mm !important;
                min-height: 297mm !important;
                height: 297mm !important;
                position: relative !important;
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                background: white !important;
              }
              .page-break {
                page-break-after: always !important;
                break-after: page !important;
              }
              .print\\:hidden { display: none !important; }
            }
          `}} />

          {ocorrencias.map((ocorrencia, idx) => {
            const isDaily = 'student_name' in ocorrencia;
            const nomeAluno = isDaily ? (ocorrencia as DailyOccurrenceRecord).student_name : (ocorrencia as RegistroOcorrencia).nomeAluno;
            const turmaAluno = isDaily ? (ocorrencia as DailyOccurrenceRecord).school_year : ((ocorrencia as RegistroOcorrencia).turmaAluno || (ocorrencia as RegistroOcorrencia).anoAluno || '1º Ano EM');
            const relato = isDaily ? (ocorrencia as DailyOccurrenceRecord).report : (((ocorrencia as RegistroOcorrencia).dados?.['Descrição'] || (ocorrencia as RegistroOcorrencia).dados?.['descricao'] || (ocorrencia as any).relato) || '');
            const dataCriacao = isDaily ? (ocorrencia as DailyOccurrenceRecord).created_at : ((ocorrencia as RegistroOcorrencia).dados?.['Data'] || (ocorrencia as RegistroOcorrencia).criadoEm);
            const emissor = isDaily ? ((ocorrencia as DailyOccurrenceRecord).created_by || 'Administração') : ((ocorrencia as RegistroOcorrencia).professorAtual || (ocorrencia as RegistroOcorrencia).dados?.['Responsável'] || 'Guilherme Juliano de Freitas Silva');
            const rawNumAta = !isDaily ? ((ocorrencia as RegistroOcorrencia).dados?.['Número da Ata'] || (ocorrencia as RegistroOcorrencia).dados?.['numero da ata'] || '') : '';
            const tipoDoc: 'ata' | 'diario' = !isDaily && rawNumAta ? 'ata' : 'diario';

            const estrutura = montarEstruturaAta({
              tipoDocumento: tipoDoc,
              numeroAta: tipoDoc === 'ata' ? rawNumAta : '',
              dataStr: dataCriacao,
              nomeAluno,
              turmaAluno,
              nomeEmissor: emissor,
              mostrarResponsavel: true,
              relato
            });

            return (
              <div 
                key={(ocorrencia as any).id || idx} 
                className={cn(
                  "page-sheet w-full max-w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-xl print:shadow-none relative flex flex-col justify-between overflow-hidden shrink-0 print:w-[210mm] print:min-h-[297mm]",
                  idx < ocorrencias.length - 1 ? "page-break" : ""
                )}
              >
                {/* Papel Timbrado Oficial com o Logo do Colégio Sesi Internacional */}
                <img
                  src={papelTimbradoImg}
                  alt="Papel Timbrado Oficial"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-[1]"
                />

                <div className="flex-1 px-8 sm:px-14 md:px-20 pt-[42mm] md:pt-[48mm] pb-10 md:pb-12 space-y-6 print:pt-[48mm] print:px-[25mm] print:pb-[38mm] relative z-10 flex flex-col justify-between">
                  <div>
                    {/* TÍTULO EM FORMATO DE TÍTULO ANTES DE COMEÇAR A FRASE E EM NEGRITO */}
                    <div className="mb-6 flex justify-between items-start">
                      <h1 className="text-xl md:text-2xl font-bold font-sans text-[#0c2340] tracking-tight uppercase">
                        {estrutura.tituloAta}
                      </h1>
                      <span className="print:hidden text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full uppercase">
                        Registro {idx + 1} de {ocorrencias.length}
                      </span>
                    </div>

                    {/* Texto do Documento: Arial 12pt, Espaçamento 1,5, Justificado (ABNT) */}
                    <div
                      className="text-gray-900 text-justify space-y-4"
                      style={{
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        fontSize: '12pt',
                        lineHeight: '1.5'
                      }}
                    >
                      <p className="text-justify indent-0">{estrutura.paragrafoAbertura}</p>
                      {estrutura.paragrafoRelato && (
                        <p className="text-justify whitespace-pre-wrap indent-0">{estrutura.paragrafoRelato}</p>
                      )}
                      <p className="text-justify indent-0">{estrutura.paragrafoEncaminhamentos}</p>
                      <p className="text-justify indent-0">{estrutura.paragrafoFechamento}</p>
                    </div>
                  </div>

                  {/* Assinaturas */}
                  <div className="mt-8 pt-4 pb-2 print:mt-auto print:pt-4 print:pb-0">
                    <div className={cn(
                      "grid gap-x-6 gap-y-6 max-w-3xl",
                      estrutura.assinaturas.length === 2 ? "grid-cols-2" : (estrutura.assinaturas.length === 3 ? "grid-cols-3 print:grid-cols-3" : "grid-cols-2")
                    )}>
                      {estrutura.assinaturas.map((ass, aIdx) => (
                        <div key={aIdx} className="flex flex-col items-center text-center">
                          <div className="w-full max-w-[190px] border-b border-gray-900 mb-1.5"></div>
                          <p className="text-[11px] font-bold text-gray-900 tracking-tight font-sans leading-tight">
                            {ass.nome}
                          </p>
                          {ass.papel && (
                            <p className="text-[9px] text-gray-600 font-sans mt-0.5 leading-tight">
                              {ass.papel}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
