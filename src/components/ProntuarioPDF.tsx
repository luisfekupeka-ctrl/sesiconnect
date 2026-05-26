import React from 'react';
import { RegistroOcorrencia } from '../types';
import { Printer, X } from 'lucide-react';
import { cn } from '../lib/utils';

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
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-4 bg-[#0c2340] text-white rounded-2xl text-xs font-black uppercase hover:bg-gray-800 transition-all shadow-lg">
              <Printer size={16} /> Imprimir Dossiê
            </button>
            <button onClick={onClose} className="p-4 bg-gray-200 text-gray-600 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
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
              const key = Object.keys(ocorrencia.dados).find(k => k.toLowerCase() === chave.toLowerCase());
              return key ? ocorrencia.dados[key] : null;
            };

            const profResp = getDado('responsável') || getDado('responsavel') || getDado('Professor') || ocorrencia.professorAtual || 'Administração';
            const rawDate = getDado('Data') || ocorrencia.criadoEm;
            let dataFormatada = rawDate;
            if (rawDate && rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [y, m, d] = rawDate.split('-');
              dataFormatada = `${d}/${m}/${y}`;
            } else if (rawDate) {
              dataFormatada = new Date(rawDate).toLocaleDateString('pt-BR');
            }

            const tipoOcorrencia = getDado('Tipo de Ocorrência') || getDado('Tipo de Ocorrencia') || ocorrencia.nomeModelo;

            return (
              <div key={ocorrencia.id} className={cn("w-full max-w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none relative flex flex-col print:w-[210mm] print:min-h-[297mm] shrink-0", idx < ocorrencias.length - 1 ? "page-break" : "")}>
                {/* Header Sesi */}
                <div className="relative w-full h-[140px] bg-white border-b-4 border-[#0c2340] overflow-hidden flex items-center justify-between px-8 select-none shrink-0">
                  <div className="absolute top-0 left-0 w-[300px] h-full pointer-events-none">
                    <div className="absolute top-0 left-0 w-[200px] h-[120px] bg-[#e2e8f0]" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 80%)' }} />
                    <div className="absolute top-0 left-0 w-[160px] h-[100px] bg-[#cbd5e1] opacity-40" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 60%)' }} />
                    <div className="absolute top-[20px] left-0 w-[40px] h-[100px] bg-[#fbbf24]" style={{ clipPath: 'polygon(0 0, 100% 30%, 80% 90%, 0 100%)' }} />
                  </div>
                  <div className="flex-1" />
                  <div className="relative z-10 select-none scale-105">
                    <div className="flex flex-col items-end mr-4">
                      <div className="flex items-center gap-2 mr-1">
                        <span className="text-[11px] font-extrabold text-[#0c2340] lowercase tracking-normal">colégio</span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0c2340]" />
                          <div className="w-2 h-3.5 rounded-full bg-[#0c2340]" />
                        </div>
                      </div>
                      <div className="text-[42px] font-bold text-[#0c2340] leading-none tracking-tight -mt-1 font-serif italic mr-6 relative">
                        Ses<span className="relative">ı</span>
                      </div>
                      <div className="bg-[#fbbf24] text-[#0c2340] text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 mt-1.5 rounded-[8px] transform -skew-x-12 leading-none">
                        internacional
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 px-12 pt-12 pb-20 space-y-10 flex flex-col">
                  {/* Cabeçalho */}
                  <div className="space-y-1.5 text-sm text-[#0c2340] font-medium border-b border-gray-200 pb-6 shrink-0">
                    <p><span className="font-bold mr-2">Nome do Aluno:</span> {ocorrencia.nomeAluno}</p>
                    <p><span className="font-bold mr-2">Ano:</span> {ocorrencia.anoAluno || ocorrencia.turmaAluno}</p>
                    <p><span className="font-bold mr-2">Professor/Responsável:</span> {profResp}</p>
                    <p><span className="font-bold mr-2">Data:</span> {dataFormatada}</p>
                  </div>

                  {/* Título */}
                  <div className="shrink-0">
                    <h1 className="text-2xl font-black text-[#0c2340] uppercase tracking-tight">Registro de Ocorrência</h1>
                    <p className="text-sm font-bold text-gray-500 uppercase mt-1">{tipoOcorrencia}</p>
                  </div>

                  {/* Descrição */}
                  <div className="flex-1 space-y-6 text-sm text-gray-800 leading-relaxed text-justify pt-4">
                    {Object.entries(ocorrencia.dados || {})
                      .filter(([key]) => !['responsável', 'responsavel', 'professor', 'data', 'tipo de ocorrência', 'tipo de ocorrencia'].includes(key.toLowerCase()))
                      .map(([key, value]) => (
                      <div key={key}>
                        <p className="font-bold mb-1 uppercase text-xs text-[#0c2340]">{key}</p>
                        <p className="whitespace-pre-wrap text-gray-700">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Assinaturas Fixas no Fundo */}
                  <div className="pt-20 grid grid-cols-2 gap-x-12 gap-y-16 shrink-0 mt-auto">
                    <div className="text-center">
                      <div className="w-full border-b border-gray-900 mb-2"></div>
                      <p className="text-xs font-bold text-gray-900 uppercase">Assinatura do Aluno</p>
                      <p className="text-[10px] text-gray-500 uppercase mt-1">{ocorrencia.nomeAluno}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-full border-b border-gray-900 mb-2"></div>
                      <p className="text-xs font-bold text-gray-900 uppercase">Assinatura do Responsável</p>
                    </div>
                    <div className="text-center col-span-2 max-w-sm mx-auto w-full">
                      <div className="w-full border-b border-gray-900 mb-2"></div>
                      <p className="text-xs font-bold text-gray-900 uppercase">Professor / Coordenação</p>
                      <p className="text-[10px] text-gray-500 uppercase mt-1">{profResp}</p>
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
