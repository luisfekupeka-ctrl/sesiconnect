// ============================================================
// SESI Connect — Serviço de Importação de Planilhas Excel
// Lê arquivos .xlsx e transforma nos tipos internos do sistema
// ============================================================

import * as XLSX from 'xlsx';
import { EntradaGradeSala, Aluno, AtividadeAfter, Monitor, LanguageLabRecord } from '../types';

export type TipoImportacao = 'grades_salas' | 'alunos' | 'atividades_after' | 'monitores' | 'laboratorio_idiomas';

export interface ResultadoImportacao<T> {
  sucesso: boolean;
  dados: T[];
  erros: string[];
  totalLinhas: number;
  linhasImportadas: number;
}

// Ler arquivo Excel e retornar JSON cru
function lerExcel(arquivo: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = (e) => {
      try {
        const dados = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dados, { type: 'array' });
        const primeiraPlanilha = workbook.SheetNames[0];
        const planilha = workbook.Sheets[primeiraPlanilha];
        const json = XLSX.utils.sheet_to_json(planilha);
        resolve(json);
      } catch (erro) {
        reject(new Error('Erro ao ler arquivo Excel. Verifique o formato.'));
      }
    };
    leitor.onerror = () => reject(new Error('Erro ao carregar arquivo.'));
    leitor.readAsArrayBuffer(arquivo);
  });
}

// --- Importadores específicos ---

export async function importarGradesSalas(arquivo: File): Promise<ResultadoImportacao<EntradaGradeSala>> {
  const erros: string[] = [];
  try {
    const raw = await lerExcel(arquivo);
    const dados: EntradaGradeSala[] = [];

    raw.forEach((linha: any, i: number) => {
      const numeroSala = Number(linha['numero_sala'] || linha['sala'] || linha['Sala']);
      const diaSemana = String(linha['dia_semana'] || linha['dia'] || linha['Dia']);
      const horario = String(linha['horario'] || linha['Horário'] || linha['horario']);
      const nomeProfessor = String(linha['nome_professor'] || linha['professor'] || linha['Professor'] || '');
      const turma = String(linha['turma'] || linha['Turma'] || '');
      const materia = String(linha['materia'] || linha['Matéria'] || linha['Materia'] || '');
      const tipo = String(linha['tipo'] || linha['Tipo'] || 'regular') as 'regular' | 'laboratorio_idiomas' | 'after';

      if (!numeroSala || !diaSemana || !horario) {
        erros.push(`Linha ${i + 2}: faltando sala, dia ou horário`);
        return;
      }
      if (!nomeProfessor) {
        erros.push(`Linha ${i + 2}: faltando professor`);
        return;
      }

      dados.push({
        id: `gs-imp-${i + 1}`,
        numeroSala,
        nomeSala: `Sala ${numeroSala}`,
        anoTurma: turma,
        diaSemana,
        horario,
        nomeProfessor,
        turma,
        materia,
        tipo,
      });
    });

    return { sucesso: true, dados, erros, totalLinhas: raw.length, linhasImportadas: dados.length };
  } catch (erro: any) {
    return { sucesso: false, dados: [], erros: [erro.message], totalLinhas: 0, linhasImportadas: 0 };
  }
}

export async function importarAlunos(arquivo: File): Promise<ResultadoImportacao<Aluno>> {
  const erros: string[] = [];
  try {
    const raw = await lerExcel(arquivo);
    const dados: Aluno[] = [];

    raw.forEach((linha: any, i: number) => {
      const nome = String(linha['nome'] || linha['Nome'] || '');
      const turma = String(linha['turma'] || linha['Turma'] || '');
      const ano = String(linha['ano'] || linha['Ano'] || '');
      const numeroSala = Number(linha['numero_sala'] || linha['sala'] || linha['Sala'] || 0);

      if (!nome) {
        erros.push(`Linha ${i + 2}: faltando nome do aluno`);
        return;
      }

      dados.push({
        id: `aluno-imp-${i + 1}`,
        nome,
        turma,
        ano,
        numeroSala,
      });
    });

    return { sucesso: true, dados, erros, totalLinhas: raw.length, linhasImportadas: dados.length };
  } catch (erro: any) {
    return { sucesso: false, dados: [], erros: [erro.message], totalLinhas: 0, linhasImportadas: 0 };
  }
}

export async function importarAtividadesAfter(arquivo: File): Promise<ResultadoImportacao<AtividadeAfter>> {
  const erros: string[] = [];
  try {
    const raw = await lerExcel(arquivo);
    const dados: AtividadeAfter[] = [];

    raw.forEach((linha: any, i: number) => {
      const nome = String(linha['nome'] || linha['Nome'] || linha['Atividade'] || '');
      if (!nome) { erros.push(`Linha ${i + 2}: faltando nome`); return; }

      dados.push({
        id: `after-imp-${i + 1}`,
        nome,
        categoria: String(linha['categoria'] || linha['Categoria'] || ''),
        horarioInicio: String(linha['horario_inicio'] || linha['Início'] || linha['Inicio'] || ''),
        horarioFim: String(linha['horario_fim'] || linha['Fim'] || linha['Término'] || ''),
        local: String(linha['local'] || linha['Local'] || linha['Sala'] || ''),
        dias: String(linha['dias'] || linha['Dias'] || '').split(',').map((d: string) => d.trim()).filter(Boolean),
        nomeProfessor: String(linha['nome_professor'] || linha['Professor'] || ''),
        descricao: String(linha['descricao'] || linha['Descrição'] || linha['Descricao'] || ''),
        quantidadeAlunos: Number(linha['quantidade_alunos'] || linha['Alunos'] || 0),
        grupoAlunos: String(linha['grupo_alunos'] || linha['Grupo'] || ''),
        listaAlunos: [],
      });
    });

    return { sucesso: true, dados, erros, totalLinhas: raw.length, linhasImportadas: dados.length };
  } catch (erro: any) {
    return { sucesso: false, dados: [], erros: [erro.message], totalLinhas: 0, linhasImportadas: 0 };
  }
}

export async function importarMonitores(arquivo: File): Promise<ResultadoImportacao<Monitor>> {
  const erros: string[] = [];
  try {
    const raw = await lerExcel(arquivo);
    const dados: Monitor[] = [];

    raw.forEach((linha: any, i: number) => {
      const nome = String(linha['nome'] || linha['Nome'] || '');
      if (!nome) { erros.push(`Linha ${i + 2}: faltando nome`); return; }

      dados.push({
        id: `mon-imp-${i + 1}`,
        nome,
        materia: String(linha['materia'] || linha['Matéria'] || linha['Materia'] || ''),
        turno: (String(linha['turno'] || linha['Turno'] || 'manha') as 'manha' | 'tarde' | 'noite'),
        horarioInicio: String(linha['horario_inicio'] || linha['Início'] || linha['Inicio'] || ''),
        horarioFim: String(linha['horario_fim'] || linha['Fim'] || linha['Término'] || ''),
        status: 'ativo',
        localPermanencia: '',
        localAlmoco: '',
        tipo: 'fixo',
      });
    });

    return { sucesso: true, dados, erros, totalLinhas: raw.length, linhasImportadas: dados.length };
  } catch (erro: any) {
    return { sucesso: false, dados: [], erros: [erro.message], totalLinhas: 0, linhasImportadas: 0 };
  }
}

export async function importarLaboratorioIdiomas(arquivo: File): Promise<ResultadoImportacao<LanguageLabRecord>> {
  const erros: string[] = [];
  try {
    const raw = await lerExcel(arquivo);
    const dados: LanguageLabRecord[] = [];

    raw.forEach((linha: any, i: number) => {
      const nivel = String(linha['nivel'] || linha['Nível'] || linha['Nivel'] || '');
      if (!nivel) { erros.push(`Linha ${i + 2}: faltando nível`); return; }

      dados.push({
        id: `li-imp-${i + 1}`,
        turma: String(linha['turma'] || linha['Turma'] || ''),
        nivel,
        professor: String(linha['nome_professor'] || linha['Professor'] || ''),
        sala: String(linha['numero_sala'] || linha['Sala'] || ''),
        horarioInicio: String(linha['horario_inicio'] || linha['Início'] || linha['Inicio'] || ''),
        horarioFim: String(linha['horario_fim'] || linha['Fim'] || linha['Término'] || ''),
        diaSemana: String(linha['dia_semana'] || linha['Dia'] || ''),
        listaAlunos: [],
      });
    });

    return { sucesso: true, dados, erros, totalLinhas: raw.length, linhasImportadas: dados.length };
  } catch (erro: any) {
    return { sucesso: false, dados: [], erros: [erro.message], totalLinhas: 0, linhasImportadas: 0 };
  }
}

// Estrutura esperada de cada planilha (para exibir no admin)
export const ESTRUTURA_PLANILHAS: Record<TipoImportacao, { nome: string; descricao: string; colunas: { nome: string; obrigatoria: boolean; exemplo: string }[] }> = {
  grades_salas: {
    nome: 'Grade de Salas',
    descricao: 'Horários de cada sala por dia da semana e bloco de 45 minutos. Esta é a base principal do sistema.',
    colunas: [
      { nome: 'numero_sala', obrigatoria: true, exemplo: '1' },
      { nome: 'dia_semana', obrigatoria: true, exemplo: '1 (1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex)' },
      { nome: 'indice_bloco', obrigatoria: true, exemplo: '1 (1ª aula 08:00, 2ª aula 08:45, ..., 9ª aula 15:20)' },
      { nome: 'nome_professor', obrigatoria: true, exemplo: 'Ana Beatriz Silva' },
      { nome: 'turma', obrigatoria: false, exemplo: '6º Ano A' },
      { nome: 'materia', obrigatoria: false, exemplo: 'Matemática' },
      { nome: 'tipo', obrigatoria: false, exemplo: 'regular (ou laboratorio_idiomas)' },
    ],
  },
  alunos: {
    nome: 'Base de Alunos',
    descricao: 'Lista completa de alunos para autopreenchimento nos formulários de ocorrência.',
    colunas: [
      { nome: 'nome', obrigatoria: true, exemplo: 'João Pedro Silva' },
      { nome: 'turma', obrigatoria: false, exemplo: '6º Ano A' },
      { nome: 'ano', obrigatoria: false, exemplo: '6º Ano' },
      { nome: 'numero_sala', obrigatoria: false, exemplo: '5' },
    ],
  },
  atividades_after: {
    nome: 'Atividades After School',
    descricao: 'Atividades extracurriculares após 15:35.',
    colunas: [
      { nome: 'nome', obrigatoria: true, exemplo: 'Clube de Robótica' },
      { nome: 'categoria', obrigatoria: false, exemplo: 'Tecnologia' },
      { nome: 'horario_inicio', obrigatoria: false, exemplo: '15:45' },
      { nome: 'horario_fim', obrigatoria: false, exemplo: '17:30' },
      { nome: 'local', obrigatoria: false, exemplo: 'Laboratório 04' },
      { nome: 'dias', obrigatoria: false, exemplo: 'Segunda, Quarta' },
      { nome: 'nome_professor', obrigatoria: false, exemplo: 'André Nascimento' },
      { nome: 'descricao', obrigatoria: false, exemplo: 'Programação e automação' },
    ],
  },
  monitores: {
    nome: 'Escala de Monitores',
    descricao: 'Monitores de plantão por turno e horário.',
    colunas: [
      { nome: 'nome', obrigatoria: true, exemplo: 'Ricardo Silva' },
      { nome: 'materia', obrigatoria: false, exemplo: 'Matemática e Física' },
      { nome: 'turno', obrigatoria: false, exemplo: 'manha (ou tarde, noite)' },
      { nome: 'horario_inicio', obrigatoria: false, exemplo: '08:00' },
      { nome: 'horario_fim', obrigatoria: false, exemplo: '12:00' },
    ],
  },
  laboratorio_idiomas: {
    nome: 'Laboratório de Idiomas',
    descricao: 'Ensalamento especial por nível de idioma.',
    colunas: [
      { nome: 'nivel', obrigatoria: true, exemplo: 'Inglês Iniciante (A1)' },
      { nome: 'nome_professor', obrigatoria: false, exemplo: 'Patrícia Santos' },
      { nome: 'numero_sala', obrigatoria: false, exemplo: '5' },
      { nome: 'horario_inicio', obrigatoria: false, exemplo: '14:00' },
      { nome: 'horario_fim', obrigatoria: false, exemplo: '15:30' },
      { nome: 'dia_semana', obrigatoria: true, exemplo: 'SEGUNDA' },
    ],
  },
};