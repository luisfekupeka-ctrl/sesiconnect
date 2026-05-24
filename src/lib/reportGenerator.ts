import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { DailyOccurrenceRecord, RegistroOcorrencia } from '../types';

import papelTimbradoImg from '../assets/papel_timbrado.png';

// Function to load the image as base64 so jsPDF can use it
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } else {
        reject(new Error('Canvas context is null'));
      }
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

export const generateOccurrencesPDF = async (records: DailyOccurrenceRecord[]) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  try {
    const bgBase64 = await loadImageAsBase64(papelTimbradoImg);

    // Add background to the first page
    doc.addImage(bgBase64, 'PNG', 0, 0, pageWidth, pageHeight);
    
    // Configs for where to start drawing the table
    let currentY = 50;

    doc.setFontSize(16);
    doc.text('Relatório Diário de Ocorrências', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    const tableData = records.map(record => [
      new Date(record.created_at || '').toLocaleDateString('pt-BR'),
      record.student_name,
      record.school_year.toString(),
      record.occurrence_type,
      record.report
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Aluno', 'Ano', 'Tipo', 'Relato']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Tailwind blue-500 approx
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 15 },
        3: { cellWidth: 35 },
        4: { cellWidth: 'auto' }
      },
      didDrawPage: (data) => {
        // Add background to every new page created by autoTable
        if (data.pageNumber > 1) {
          doc.addImage(bgBase64, 'PNG', 0, 0, pageWidth, pageHeight);
        }
      }
    });

    doc.save('relatorio_ocorrencias.pdf');

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
  }
};

export const generateOccurrencesExcel = (records: DailyOccurrenceRecord[]) => {
  const formattedData = records.map(record => ({
    'Data': new Date(record.created_at || '').toLocaleDateString('pt-BR'),
    'Aluno': record.student_name,
    'Ano Letivo': record.school_year,
    'Tipo': record.occurrence_type,
    'Relato': record.report
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ocorrencias');

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 12 }, // Data
    { wch: 30 }, // Aluno
    { wch: 10 }, // Ano
    { wch: 25 }, // Tipo
    { wch: 60 }  // Relato
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, 'relatorio_ocorrencias.xlsx');
};

export const buildFichaOcorrenciaDoc = async (
  ocorrencia: any,
  configAssinaturas: any,
  assinaturasExtras: any[],
  bgBase64?: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (!bgBase64) {
    try {
      bgBase64 = await loadImageAsBase64(papelTimbradoImg);
    } catch (e) {
      console.error(e);
    }
  }

  if (bgBase64) {
    doc.addImage(bgBase64, 'PNG', 0, 0, pageWidth, pageHeight);
  }

  const marginX = 25;
  let currentY = 55;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Nome do Aluno:', marginX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(configAssinaturas.nomeAluno || ocorrencia.nomeAluno, marginX + 35, currentY);
    
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Ano:', marginX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(ocorrencia.anoAluno || ocorrencia.turmaAluno || 'Não informado', marginX + 10, currentY);

    const profs = [];
    if (configAssinaturas.nomeEmissor) profs.push(configAssinaturas.nomeEmissor);
    if (configAssinaturas.nomeResponsavel) profs.push(configAssinaturas.nomeResponsavel);
    const extraProfs = assinaturasExtras.filter(e => e.papel.toLowerCase().includes('professor')).map(e => e.nome);
    const profsText = [...profs, ...extraProfs].join(', ');

    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Professor/Responsável:', marginX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(profsText || 'Administração', marginX + 45, currentY);

    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Data:', marginX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(ocorrencia.dataOcorrencia || '').toLocaleDateString('pt-BR'), marginX + 12, currentY);

    const numAtaKey = Object.keys(ocorrencia.dados || {}).find(k => k.toLowerCase().includes('número da ata') || k.toLowerCase().includes('numero da ata') || k.toLowerCase() === 'ata');
    if (numAtaKey && ocorrencia.dados[numAtaKey]) {
      currentY += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Número da Ata:', marginX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(ocorrencia.dados[numAtaKey]), marginX + 30, currentY);
    }

    currentY += 15;
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(12, 35, 64);
    doc.text('REGISTRO DE ATA', marginX, currentY);
    
    currentY += 8;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(ocorrencia.nomeModelo.toUpperCase(), marginX, currentY);
    
    currentY += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIÇÃO', marginX, currentY);
    
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    // Ensure all checks inside report are correctly formatted
    const relatoRaw = ocorrencia.relato || '';
    const cleanRelato = relatoRaw.replace(/\[ \]/g, '\u25A1').replace(/\[x\]/g, '\u25A3');
    
    const splitText = doc.splitTextToSize(cleanRelato, pageWidth - marginX * 2);
    doc.text(splitText, marginX, currentY);
    
    // Signatures
    const sigY = pageHeight - 50;
    doc.setDrawColor(0, 0, 0);
    
    // Collect signatures
    const allSigs = [];
    if (configAssinaturas.mostrarAluno) allSigs.push({ label: 'ASSINATURA DO ALUNO', name: configAssinaturas.nomeAluno || ocorrencia.nomeAluno });
    if (configAssinaturas.mostrarResponsavel) allSigs.push({ label: 'ASSINATURA DO RESPONSÁVEL', name: configAssinaturas.nomeResponsavel || '' });
    if (configAssinaturas.mostrarEmissor) allSigs.push({ label: 'PROFESSOR / COORDENAÇÃO', name: configAssinaturas.nomeEmissor || '' });
    assinaturasExtras.forEach(e => allSigs.push({ label: e.papel.toUpperCase(), name: e.nome }));

    let sigX = marginX;
    let currentSigY = sigY;
    const sigWidth = 60;
    const sigSpacing = 15;

    // We can fit up to 2 per row
    allSigs.forEach((sig, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = col === 0 ? marginX : pageWidth - marginX - sigWidth;
      const y = sigY + (row * 30);
      
      doc.setDrawColor(0, 0, 0);
      doc.line(x, y, x + sigWidth, y);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(sig.label, x + (sigWidth / 2), y + 5, { align: 'center' });
      
      if (sig.name) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(sig.name.toUpperCase(), x + (sigWidth / 2), y + 10, { align: 'center' });
      }
      doc.setTextColor(0, 0, 0);
    });

  return doc;
};

export const generateFichaOcorrenciaPDF = async (
  ocorrencia: any,
  configAssinaturas: any,
  assinaturasExtras: any[]
) => {
  try {
    const doc = await buildFichaOcorrenciaDoc(ocorrencia, configAssinaturas, assinaturasExtras);
    doc.save(`Ata_${ocorrencia.nomeAluno.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erro ao gerar PDF.');
  }
};

export const generateBackupZip = async (ocorrencias: RegistroOcorrencia[], mes: string) => {
  try {
    const zip = new JSZip();
    const bgBase64 = await loadImageAsBase64(papelTimbradoImg).catch(() => undefined);
    
    // Default configs for backup where specific signatures aren't provided
    const defaultConfig = {
      mostrarAluno: true,
      mostrarResponsavel: true,
      mostrarEmissor: true,
      nomeEmissor: 'Administração',
      nomeAluno: '',
      nomeResponsavel: ''
    };

    for (const oc of ocorrencias) {
      // Group by Ano/Turma -> Aluno
      const anoFold = oc.anoAluno || oc.turmaAluno || 'Sem_Turma';
      const alunoFold = oc.nomeAluno || 'Desconhecido';
      
      const doc = await buildFichaOcorrenciaDoc(oc, { ...defaultConfig, nomeAluno: oc.nomeAluno }, [], bgBase64);
      const pdfBuffer = doc.output('arraybuffer');
      
      const dateStr = new Date(oc.criadoEm).toLocaleDateString('pt-BR').replace(/\//g, '-');
      const filename = `Ata_${oc.nomeModelo.replace(/\s+/g, '_')}_${dateStr}.pdf`;
      
      zip.folder(anoFold)?.folder(alunoFold)?.file(filename, pdfBuffer);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `Backup_Ocorrencias_${mes.replace(/\s+/g, '_')}.zip`);
    return true;
  } catch (error) {
    console.error('Error generating ZIP backup:', error);
    return false;
  }
};

export const generateSingleOccurrencePDF = async (record: DailyOccurrenceRecord) => {
  try {
    const ocorrencia = {
      nomeAluno: record.student_name,
      anoAluno: record.school_year,
      dataOcorrencia: record.created_at || new Date().toISOString(),
      nomeModelo: record.occurrence_type,
      relato: record.report,
      dados: {}
    };

    const configAssinaturas = {
      mostrarAluno: true,
      mostrarResponsavel: true,
      mostrarEmissor: true,
      nomeEmissor: 'Administração',
      nomeAluno: record.student_name,
      nomeResponsavel: ''
    };

    const doc = await buildFichaOcorrenciaDoc(ocorrencia, configAssinaturas, []);
    doc.save(`Ocorrencia_${record.student_name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erro ao gerar PDF.');
  }
};
