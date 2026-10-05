import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SolicitacaoCFTV } from '../types';

export function gerarPdfSolicitacaoCFTV(solicitacao: SolicitacaoCFTV) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 16;

  // Cabeçalho institucional
  doc.setFillColor(20, 20, 20);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'F');

  // Letra S amarela / ícone
  doc.setFillColor(251, 191, 36);
  doc.roundedRect(margin + 4, currentY + 4, 16, 16, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('S', margin + 9.5, currentY + 15);

  // Título do cabeçalho
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SESI CONNECT — SISTEMA DE SEGURANÇA ESCOLAR', margin + 24, currentY + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text('Relatório Oficial de Solicitação de Imagens (CFTV)', margin + 24, currentY + 17);

  // Protocolo & Status
  const statusColorMap: Record<string, [number, number, number]> = {
    'Em Espera': [234, 179, 8],
    'Em Análise': [59, 130, 246],
    'Atendido': [16, 185, 129],
    'Finalizado': [147, 51, 234],
    'Cancelado': [239, 68, 68],
  };

  const statusColor = statusColorMap[solicitacao.status] || [100, 100, 100];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - 40, currentY + 5, 36, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(solicitacao.status.toUpperCase(), pageWidth - margin - 22, currentY + 13.5, { align: 'center' });

  currentY += 28;

  // Informações do Protocolo
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`PROTOCOLO: ${solicitacao.numero_protocolo || 'CFTV-PENDENTE'}`, margin + 4, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data do Registro: ${new Date(solicitacao.created_at || Date.now()).toLocaleString('pt-BR')}`, pageWidth - margin - 4, currentY + 8, { align: 'right' });

  currentY += 16;

  const sectionHeaderStyle = { fillColor: [230, 235, 245] as [number, number, number], fontStyle: 'bold' as const };
  const lastSectionStyle = { fillColor: [220, 230, 242] as [number, number, number], fontStyle: 'bold' as const };

  // Tabela de Dados Principais
  const tableData: any[] = [
    [
      { content: '1. SOLICITANTE', colSpan: 2, styles: sectionHeaderStyle }
    ],
    ['Nome Completo:', solicitacao.solicitante_nome],
    ['Cargo / Função:', solicitacao.solicitante_cargo],
    ['E-mail Institucional:', solicitacao.solicitante_email],

    [
      { content: '2. DATA E HORÁRIO DO FATO', colSpan: 2, styles: sectionHeaderStyle }
    ],
    ['Data da Ocorrência:', solicitacao.data_fato ? new Date(solicitacao.data_fato + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/I'],
    ['Tipo de Intervalo:', `${solicitacao.tipo_intervalo} ${solicitacao.tipo_intervalo === 'Amplo' ? '(Intervalo Superior a 1 Hora)' : ''}`],
    ['Horário de Início:', solicitacao.horario_inicio],
    ['Horário de Término:', solicitacao.horario_termino],

    [
      { content: '3. LOCAL DA OCORRÊNCIA', colSpan: 2, styles: sectionHeaderStyle }
    ],
    ['Andar:', solicitacao.andar],
    ['Setor / Ambiente Escolar:', solicitacao.ambiente],
    ['Ponto de Referência Visual:', solicitacao.ponto_referencia || 'Nenhum ponto de referência informado'],

    [
      { content: '4. TIPO DE OCORRÊNCIA', colSpan: 2, styles: sectionHeaderStyle }
    ],
    ['Classificação:', solicitacao.tipo_ocorrencia + (solicitacao.tipo_ocorrencia_outro ? ` - ${solicitacao.tipo_ocorrencia_outro}` : '')],

    [
      { content: '5. DESCRIÇÃO DETALHADA DOS FATOS', colSpan: 2, styles: sectionHeaderStyle }
    ],
    ['Relato do Ocorrido:', solicitacao.descricao_fatos],

    [
      { content: '6. IDENTIFICAÇÃO DOS ENVOLVIDOS E DESLOCAMENTO', colSpan: 2, styles: sectionHeaderStyle }
    ],
    ['Nomes / Turmas dos Envolvidos:', solicitacao.envolvidos_nomes_turmas || 'Não informados / Desconhecidos'],
    ['Características Visuais:', solicitacao.envolvidos_caracteristicas || 'Não informadas'],
    ['Sentido de Movimentação / Fuga:', solicitacao.envolvidos_sentido_fuga || 'Não informado'],
    ['Objetos ou Bens Envolvidos:', solicitacao.objetos_envolvidos || 'Não informados'],

    [
      { content: '7. FINALIDADE / MOTIVO DA SOLICITAÇÃO', colSpan: 2, styles: sectionHeaderStyle }
    ],
    ['Motivo:', solicitacao.motivo_solicitacao + (solicitacao.motivo_outro_descricao ? ` - ${solicitacao.motivo_outro_descricao}` : '')],

    [
      { content: '8. PARECER TÉCNICO E ANÁLISE DE CÂMERAS', colSpan: 2, styles: lastSectionStyle }
    ],
    ['Status Atual:', solicitacao.status],
    ['Câmeras Analisadas:', solicitacao.cameras_analisadas || 'Em levantamento'],
    ['Parecer da Análise / Desfecho:', solicitacao.parecer_analise || (solicitacao.status === 'Em Espera' ? 'Aguardando verificação pela equipe responsável.' : 'Nenhum parecer emitido.')],
    ...(solicitacao.status === 'Cancelado' && solicitacao.justificativa_cancelamento ? [
      ['Justificativa de Cancelamento:', solicitacao.justificativa_cancelamento]
    ] : []),
    ['Analisado por:', solicitacao.analisado_por_nome ? `${solicitacao.analisado_por_nome} em ${solicitacao.analisado_em ? new Date(solicitacao.analisado_em).toLocaleString('pt-BR') : 'data não registrada'}` : 'Pendente de Operador']
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 30, 30],
      lineColor: [210, 215, 220],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      // Rodapé
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `SESI Connect • Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')} • Protocolo ${solicitacao.numero_protocolo}`,
        margin,
        footerY
      );
      doc.text(
        `Página ${data.pageNumber}`,
        pageWidth - margin,
        footerY,
        { align: 'right' }
      );
    }
  });

  // Salvar PDF
  const filename = `CFTV_Solicitacao_${solicitacao.numero_protocolo || 'documento'}.pdf`;
  doc.save(filename);
}
