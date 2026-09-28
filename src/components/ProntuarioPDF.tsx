import React from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { montarEstruturaAta } from '../lib/ataUtils';

interface Props {
  ocorrencias: RegistroOcorrencia[];
  onClose: () => void;
  alunoNome: string;
}

export default function ProntuarioPDF({ ocorrencias, onClose, alunoNome }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white w-full max-w-5xl flex flex-col print:shadow-none print:max-h-none print:rounded-none max-h-[95vh] overflow-hidden rounded-[2.5rem] shadow-2xl">
        
        {/* Painel de Controle Flutuante (oculto na impressão) */}
        <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden shrink-0">
          <div>
            <h3 className="font-black text-lg mb-1 text-gray-900">Dossiê do Aluno</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{alunoNome} · {ocorrencias.length} Documentos</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-4 bg-[#0c2340] text-white rounded-2xl text-xs font-black uppercase hover:bg-gray-800 transition-all shadow-lg cursor-pointer">
              <Printer size={16} /> Imprimir Dossiê
            </button>
            <button onClick={onClose} className="p-4 bg-gray-200 text-gray-600 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo Rolável / Impressão */}
        <div id="printable-dossie" className="flex-1 overflow-y-auto bg-slate-100 print:bg-white print:overflow-visible custom-scrollbar relative flex flex-col items-center py-8 print:py-0 gap-8 print:gap-0">
          
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { size: A4; margin: 0; }
              body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              body * { visibility: hidden; }
              #printable-dossie, #printable-dossie * { visibility: visible; }
              #printable-dossie {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 0 !important;
                background: white !important;
              }
              .page-break { page-break-after: always; break-after: page; }
              .print\\:hidden { display: none !important; }
            }
          `}} />

          {ocorrencias.map((ocorrencia, idx) => {
            const getDado = (chave: string) => {
              const key = Object.keys(ocorrencia.dados || {}).find(k => k.toLowerCase() === chave.toLowerCase());
              return key ? ocorrencia.dados[key] : null;
            };

            const profResp = getDado('responsável') || getDado('responsavel') || getDado('Professor') || ocorrencia.professorAtual || 'Guilherme Juliano de Freitas Silva';
            const rawDate = getDado('Data') || ocorrencia.criadoEm;
            const rawRelato = getDado('Descrição') || getDado('descricao') || getDado('relato') || (ocorrencia as any).relato || '';
            const numAta = getDado('Número da Ata') || getDado('numero da ata') || getDado('ata') || '';

            const estrutura = montarEstruturaAta({
              numeroAta: numAta,
              dataStr: rawDate,
              nomeAluno: ocorrencia.nomeAluno,
              nomeEmissor: profResp,
              relato: rawRelato
            });

            return (
              <div key={ocorrencia.id || idx} className={cn("w-full max-w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none relative flex flex-col print:w-[210mm] print:min-h-[297mm] shrink-0", idx < ocorrencias.length - 1 ? "page-break" : "")}>
                {/* Header Sesi */}
                <div className="relative w-full h-[100px] md:h-[140px] bg-white border-b-4 border-[#0c2340] overflow-hidden flex items-center justify-between px-4 md:px-8 select-none shrink-0">
                  {/* Polígonos Geométricos */}
                  <div className="absolute top-0 left-0 w-[180px] md:w-[300px] h-full pointer-events-none">
                    <div className="absolute top-0 left-0 w-[200px] h-[120px] bg-[#e2e8f0]" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 80%)' }} />
                    <div className="absolute top-0 left-0 w-[160px] h-[100px] bg-[#cbd5e1] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 60%)' }} />
                    <div className="absolute top-[20px] left-0 w-[40px] h-[100px] bg-[#fbbf24]" style={{ clipPath: 'polygon(0 0, 100% 30%, 80% 90%, 0 100%)' }} />
                  </div>
                  <div className="flex-1" />
                  {/* Logo Sesi */}
                  <div className="relative z-10">
                    <div className="flex flex-col items-end mr-2 md:mr-4">
                      <div className="flex items-center gap-1 md:gap-2 mr-1">
                        <span className="text-[9px] md:text-[11px] font-extrabold text-[#0c2340] lowercase tracking-normal">colégio</span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-[#0c2340]" />
                          <div className="w-1 md:w-2 h-2.5 md:h-3.5 rounded-full bg-[#0c2340]" />
                        </div>
                      </div>
                      <div className="text-[28px] md:text-[42px] font-bold text-[#0c2340] leading-none tracking-tight -mt-0.5 md:-mt-1 font-serif italic mr-2 md:mr-6 relative">
                        Ses<span className="relative">ı</span>
                      </div>
                      <div className="bg-[#fbbf24] text-[#0c2340] text-[7px] md:text-[9px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] px-2.5 md:px-4 py-1 md:py-2 mt-1 rounded-[6px] md:rounded-[8px] transform -skew-x-12 leading-none">
                        internacional
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 px-8 sm:px-14 md:px-20 pt-8 md:pt-14 pb-12 md:pb-20 flex flex-col justify-between">
                  <div>
                    {/* Título Oficial da ATA */}
                    <div className="mb-6">
                      <h1 className="text-xl md:text-2xl font-black text-[#0c2340] tracking-tight uppercase">
                        {estrutura.tituloAta}
                      </h1>
                    </div>

                    {/* Texto Corrido Contínuo da ATA */}
                    <div className="text-sm md:text-[15px] text-gray-900 leading-[1.8] text-justify font-normal space-y-4 font-sans">
                      <p>
                        <span>{estrutura.textoAbertura} </span>
                        {estrutura.textoRelato && (
                          <span>{estrutura.textoRelato} </span>
                        )}
                        <span>{estrutura.textoFechamento}</span>
                      </p>
                    </div>
                  </div>

                  {/* Assinaturas */}
                  <div className="pt-16 print:pt-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-12 max-w-3xl">
                      {estrutura.assinaturas.map((ass, aIdx) => (
                        <div key={aIdx} className="flex flex-col items-center text-center">
                          <div className="w-full max-w-[240px] border-b border-gray-900 mb-2"></div>
                          <p className="text-xs font-bold text-gray-900 tracking-wide">
                            {ass.nome}
                          </p>
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
