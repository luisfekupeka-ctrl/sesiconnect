import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { DailyOccurrenceRecord, RegistroOcorrencia } from '../types';
import { montarEstruturaAta } from './ataUtils';

export const generateWordOccurrence = async (record: DailyOccurrenceRecord | RegistroOcorrencia, emissorName: string = 'Guilherme Juliano de Freitas Silva') => {
  const isDaily = 'student_name' in record;
  const studentName = isDaily ? record.student_name : record.nomeAluno;
  const report = isDaily ? record.report : (record.dados?.['Descrição'] || record.dados?.['descricao'] || record.dados?.['relato'] || '');
  const rawDate = isDaily ? record.created_at : (record.dados?.['Data'] || record.criadoEm);

  const numAta = !isDaily && record.dados ? (record.dados['Número da Ata'] || record.dados['numero da ata'] || '') : '';

  const estrutura = montarEstruturaAta({
    numeroAta: numAta,
    dataStr: rawDate,
    nomeAluno: studentName,
    nomeEmissor: emissorName,
    relato: report
  });

  const childrenParagraphs: Paragraph[] = [
    new Paragraph({
      text: "COLÉGIO SESI INTERNACIONAL",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 }
    }),
    new Paragraph({
      text: estrutura.tituloAta,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 400 },
    }),
    new Paragraph({
      text: estrutura.textoCorridoCompleto,
      spacing: { after: 800, line: 360 },
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      text: "",
      spacing: { before: 600, after: 200 }
    })
  ];

  // Assinaturas
  estrutura.assinaturas.forEach(ass => {
    childrenParagraphs.push(
      new Paragraph({
        text: "__________________________________________________",
        alignment: AlignmentType.LEFT,
        spacing: { before: 400, after: 80 },
      }),
      new Paragraph({
        text: ass.nome,
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
  saveAs(blob, `Ata_${cleanName}.docx`);
};
