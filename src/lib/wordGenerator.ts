import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { DailyOccurrenceRecord, RegistroOcorrencia } from '../types';
import { montarEstruturaAta } from './ataUtils';

export const generateWordOccurrence = async (record: DailyOccurrenceRecord | RegistroOcorrencia, emissorName: string = 'Guilherme Juliano de Freitas Silva') => {
  const isDaily = 'student_name' in record;
  const studentName = isDaily ? record.student_name : record.nomeAluno;
  const turma = isDaily ? record.school_year : (record.turmaAluno || record.anoAluno || '1º Ano EM');
  const report = isDaily ? record.report : (record.dados?.['Descrição'] || record.dados?.['descricao'] || record.dados?.['relato'] || '');
  const rawDate = isDaily ? record.created_at : (record.dados?.['Data'] || record.criadoEm);

  const numAta = !isDaily && record.dados ? (record.dados['Número da Ata'] || record.dados['numero da ata'] || '') : '';
  const tipoDoc: 'ata' | 'diario' = !isDaily && numAta ? 'ata' : 'diario';

  const estrutura = montarEstruturaAta({
    tipoDocumento: tipoDoc,
    numeroAta: tipoDoc === 'ata' ? numAta : '',
    dataStr: rawDate,
    nomeAluno: studentName,
    turmaAluno: turma,
    nomeEmissor: emissorName,
    mostrarResponsavel: true,
    relato: report
  });

  const childrenParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "COLÉGIO SESI INTERNACIONAL",
          font: "Arial",
          size: 20,
          bold: true
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 }
    }),
    // TÍTULO EM FORMATO DE TÍTULO ANTES DE COMEÇAR A FRASE E EM NEGRITO
    new Paragraph({
      children: [
        new TextRun({
          text: estrutura.tituloAta,
          font: "Arial",
          size: 28, // 14pt
          bold: true
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 400 },
    })
  ];

  // Adiciona cada parágrafo com Arial 12pt, espaçamento 1,5 (line: 360) e Justificado (ABNT)
  estrutura.paragrafos.forEach(p => {
    childrenParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: p,
            font: "Arial",
            size: 24 // 12pt
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 360 } // Espaçamento 1,5 linha
      })
    );
  });

  // Espaçamento antes das assinaturas
  childrenParagraphs.push(
    new Paragraph({
      text: "",
      spacing: { before: 500, after: 100 }
    })
  );

  // Assinaturas
  estrutura.assinaturas.forEach(ass => {
    childrenParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "__________________________________________________",
            font: "Arial",
            size: 24
          })
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 300, after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: ass.nome,
            font: "Arial",
            size: 22,
            bold: true
          }),
          ...(ass.papel ? [
            new TextRun({
              text: ` (${ass.papel})`,
              font: "Arial",
              size: 18,
              italics: true
            })
          ] : [])
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 300 },
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: childrenParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = studentName.replace(/\s+/g, '_');
  const prefix = tipoDoc === 'ata' ? 'Ata' : 'Registro_Diario';
  saveAs(blob, `${prefix}_${cleanName}.docx`);
};
