import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, ImageRun, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { DailyOccurrenceRecord } from '../types';

export const generateWordOccurrence = async (record: DailyOccurrenceRecord, emissorName: string) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Colégio Sesi Internacional",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            text: "Registro Diário de Ocorrência",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Nome do Aluno: ", bold: true }),
              new TextRun(record.student_name),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Ano Letivo: ", bold: true }),
              new TextRun(record.school_year),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Data: ", bold: true }),
              new TextRun(new Date(record.created_at || '').toLocaleDateString('pt-BR')),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tipo de Ocorrência: ", bold: true }),
              new TextRun(record.occurrence_type),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Relato:", bold: true })
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: record.report,
            spacing: { after: 800 },
            alignment: AlignmentType.JUSTIFIED,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Responsável pelo Registro: ", bold: true }),
              new TextRun(emissorName),
            ],
            spacing: { after: 800 },
          }),
          new Paragraph({
            text: "__________________________________________________",
            alignment: AlignmentType.CENTER,
            spacing: { before: 800, after: 100 },
          }),
          new Paragraph({
            text: "Assinatura",
            alignment: AlignmentType.CENTER,
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Ocorrencia_${record.student_name.replace(/\s+/g, '_')}.docx`);
};
