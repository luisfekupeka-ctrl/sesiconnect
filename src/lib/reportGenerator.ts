import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DailyOccurrenceRecord } from '../types';

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
