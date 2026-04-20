// ============================================================
// SESI Connect — Serviço de Dados (Mock)
// Dados fictícios para desenvolvimento. Em produção, virão do Supabase.
// ============================================================

import {
  Sala,
  EntradaGradeSala,
  Aluno,
  NivelIdioma,
  AtividadeAfter,
  Monitor,
  ModeloFormulario,
  RegistroOcorrencia,
  SegmentoEscolar,
} from '../types';

// --- Professores (nomes para usar na grade) ---

const PROFESSORES = [
  'Ana Beatriz Silva', 'Carlos Eduardo Lima', 'Fernanda Oliveira',
  'Ricardo Mendes', 'Juliana Costa', 'Marcos Pereira',
  'Patrícia Santos', 'Roberto Almeida', 'Luciana Ferreira',
  'André Nascimento', 'Daniela Rocha', 'Paulo Henrique',
  'Mariana Souza', 'Gustavo Ribeiro', 'Camila Barros',
];

const MATERIAS = [
  'Matemática', 'Português', 'História', 'Geografia', 'Ciências',
  'Inglês', 'Educação Física', 'Artes', 'Física', 'Química',
  'Biologia', 'Filosofia', 'Sociologia', 'Redação', 'Informática',
];

const TURMAS = [
  '6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B',
  '8º Ano A', '8º Ano B', '9º Ano A', '9º Ano B',
  '1ª Série A', '1ª Série B', '2ª Série A', '2ª Série B',
  '3ª Série A', '3ª Série B',
];

// --- Salas (1 a 31) ---

export const salas: Sala[] = Array.from({ length: 31 }, (_, i) => {
  const num = i + 1;
  const ehFundamental = num <= 16;
  const segmento: SegmentoEscolar = ehFundamental ? 'Fundamental' : 'Médio';
  const anoNum = ehFundamental ? ((i % 4) + 6) : ((i % 3) + 1);
  const anoSufixo = ehFundamental ? 'º Ano' : 'ª Série';

  const nomes = [
    'Lab Inteligente', 'Ateliê de História', 'Hub Criativo',
    'Laboratório Física', 'Sala de Artes', 'Lab Química',
  ];

  return {
    id: num.toString().padStart(2, '0'),
    numero: num,
    nome: i < nomes.length ? nomes[i] : `Sala ${num.toString().padStart(2, '0')}`,
    andar: num <= 10 ? 'Térreo' : num <= 20 ? '1º Andar' : '2º Andar',
    segmento,
    ano: `${anoNum}${anoSufixo}`,
    grade: [],
  };
});

// --- Grade Completa (base do sistema) ---

function gerarGradeCompleta(): EntradaGradeSala[] {
  const entradas: EntradaGradeSala[] = [];
  let idCounter = 1;

  // Para cada dia da semana (1=Seg a 5=Sex)
  for (let dia = 1; dia <= 5; dia++) {
    // Para cada sala (1 a 31)
    for (let sala = 1; sala <= 31; sala++) {
      // Para cada bloco de aula (1 a 9)
      for (let bloco = 1; bloco <= 9; bloco++) {
        // Gerar professor e matéria pseudo-aleatórios baseados nos índices
        const seed = (dia * 100 + sala * 10 + bloco);
        const profIndex = seed % PROFESSORES.length;
        const matIndex = (seed + Math.floor(seed / 3)) % MATERIAS.length;
        const turmaIndex = ((sala - 1) % TURMAS.length);

        entradas.push({
          id: `gs-${idCounter++}`,
          numeroSala: sala,
          diaSemana: dia,
          indiceBlocoHorario: bloco,
          nomeProfessor: PROFESSORES[profIndex],
          turma: TURMAS[turmaIndex],
          materia: MATERIAS[matIndex],
          tipo: 'regular',
        });
      }
    }
  }

  return entradas;
}

export const gradeCompleta: EntradaGradeSala[] = gerarGradeCompleta();

// Vincular grades às salas
salas.forEach(sala => {
  sala.grade = gradeCompleta.filter(e => e.numeroSala === sala.numero);
});

// --- Alunos ---

const NOMES_ALUNOS = [
  'Ana Clara', 'Bruno Henrique', 'Camila Rodrigues', 'Daniel Souza',
  'Eduarda Lima', 'Felipe Costa', 'Gabriela Santos', 'Henrique Alves',
  'Isabela Ferreira', 'João Pedro', 'Karen Oliveira', 'Leonardo Dias',
  'Marina Silva', 'Nicolas Pereira', 'Olívia Nascimento', 'Pedro Lucas',
  'Rafaela Mendes', 'Samuel Ribeiro', 'Thiago Barros', 'Valentina Costa',
  'Willian Rocha', 'Yasmin Nunes', 'Arthur Gomes', 'Beatriz Moraes',
  'Caio Martins', 'Débora Araújo', 'Eduardo Ramos', 'Flávia Cardoso',
  'Gabriel Vieira', 'Helena Teixeira', 'Igor Monteiro', 'Julia Campos',
  'Kauan Freitag', 'Larissa Pinto', 'Mateus Correia', 'Natália Andrade',
  'Otávio Cunha', 'Paloma Duarte', 'Rafael Azevedo', 'Sofia Machado',
];

export const alunos: Aluno[] = NOMES_ALUNOS.map((nome, i) => {
  const turmaIndex = i % TURMAS.length;
  const salaNum = (turmaIndex % 31) + 1;
  const turma = TURMAS[turmaIndex];
  const ano = turma.split(' ').slice(0, 2).join(' ');

  return {
    id: `aluno-${i + 1}`,
    nome,
    turma,
    ano,
    numeroSala: salaNum,
  };
});

// --- Laboratório de Idiomas ---

export const laboratorioIdiomas: NivelIdioma[] = [
  {
    id: 'li-1',
    nivel: 'Inglês Iniciante (A1)',
    nomeProfessor: 'Patrícia Santos',
    numeroSala: 5,
    horarioInicio: '14:00',
    horarioFim: '15:30',
    quantidadeAlunos: 15,
    grupoAlunos: 'Nível Alfa',
    listaAlunos: ['Ana Clara', 'Bruno Henrique', 'Camila Rodrigues', 'Daniel Souza', 'Eduarda Lima', 'Felipe Costa', 'Gabriela Santos'],
  },
  {
    id: 'li-2',
    nivel: 'Inglês Intermediário (B1)',
    nomeProfessor: 'Roberto Almeida',
    numeroSala: 6,
    horarioInicio: '14:00',
    horarioFim: '15:30',
    quantidadeAlunos: 12,
    grupoAlunos: 'Nível Beta',
    listaAlunos: ['Henrique Alves', 'Isabela Ferreira', 'João Pedro', 'Karen Oliveira', 'Leonardo Dias'],
  },
  {
    id: 'li-3',
    nivel: 'Inglês Avançado (C1)',
    nomeProfessor: 'Luciana Ferreira',
    numeroSala: 7,
    horarioInicio: '14:00',
    horarioFim: '15:30',
    quantidadeAlunos: 10,
    grupoAlunos: 'Nível Gama',
    listaAlunos: ['Marina Silva', 'Nicolas Pereira', 'Olívia Nascimento', 'Pedro Lucas', 'Rafaela Mendes'],
  },
];

// --- Atividades After School ---

export const atividadesAfter: AtividadeAfter[] = [
  {
    id: 'after-1',
    nome: 'Clube de Robótica e IA',
    categoria: 'Tecnologia',
    horarioInicio: '15:45',
    horarioFim: '17:30',
    local: 'Laboratório 04',
    dias: ['Segunda', 'Quarta'],
    nomeProfessor: 'André Nascimento',
    descricao: 'Montagem e programação de sistemas autônomos com robótica e inteligência artificial.',
    quantidadeAlunos: 12,
    grupoAlunos: 'Clube Robótica',
    listaAlunos: ['Felipe Costa', 'João Pedro', 'Pedro Lucas', 'Henrique Alves', 'Thiago Barros', 'Caio Martins'],
    vagas: 15,
  },
  {
    id: 'after-2',
    nome: 'Futsal Masculino',
    categoria: 'Esportes',
    horarioInicio: '16:00',
    horarioFim: '17:30',
    local: 'Quadra Poliesportiva',
    dias: ['Segunda', 'Sexta'],
    nomeProfessor: 'Marcos Pereira',
    descricao: 'Treinamento de fundamentos técnicos e táticas de futsal competitivo.',
    quantidadeAlunos: 18,
    grupoAlunos: 'Futsal Sub-17',
    listaAlunos: ['Bruno Henrique', 'Daniel Souza', 'Leonardo Dias', 'Samuel Ribeiro', 'Willian Rocha'],
  },
  {
    id: 'after-3',
    nome: 'Artes Visuais',
    categoria: 'Cultura',
    horarioInicio: '15:45',
    horarioFim: '17:15',
    local: 'Sala de Artes',
    dias: ['Terça', 'Quinta'],
    nomeProfessor: 'Daniela Rocha',
    descricao: 'Expressão criativa através de pintura, escultura e mídias digitais.',
    quantidadeAlunos: 15,
    grupoAlunos: 'Oficina de Artes',
    listaAlunos: ['Ana Clara', 'Gabriela Santos', 'Isabela Ferreira', 'Marina Silva', 'Olívia Nascimento'],
  },
  {
    id: 'after-4',
    nome: 'Xadrez Competitivo',
    categoria: 'Jogos',
    horarioInicio: '15:45',
    horarioFim: '17:00',
    local: 'Sala 12',
    dias: ['Quarta', 'Sexta'],
    nomeProfessor: 'Paulo Henrique',
    descricao: 'Estratégias avançadas e preparação para campeonatos interestaduais.',
    quantidadeAlunos: 10,
    grupoAlunos: 'Equipe Xadrez',
    listaAlunos: ['Nicolas Pereira', 'Rafaela Mendes', 'Arthur Gomes', 'Eduardo Ramos'],
    vagas: 12,
  },
];

// --- Monitores ---

export const monitores: Monitor[] = [
  { id: 'mon-1', nome: 'Ricardo Silva', materia: 'Matemática e Física', turno: 'manha', horarioInicio: '08:00', horarioFim: '12:00', status: 'ativo' },
  { id: 'mon-2', nome: 'Ana Beatriz', materia: 'Língua Portuguesa', turno: 'manha', horarioInicio: '09:30', horarioFim: '11:30', status: 'ativo' },
  { id: 'mon-3', nome: 'Marcos Lima', materia: 'História e Geografia', turno: 'tarde', horarioInicio: '13:30', horarioFim: '17:00', status: 'ativo' },
  { id: 'mon-4', nome: 'Julia Campos', materia: 'Biologia e Química', turno: 'tarde', horarioInicio: '13:00', horarioFim: '15:30', status: 'ativo' },
  { id: 'mon-5', nome: 'Pedro Lucas', materia: 'Redação e Literatura', turno: 'manha', horarioInicio: '10:00', horarioFim: '12:00', status: 'inativo' },
];

// --- Modelos de Formulário ---

export const modelosFormulario: ModeloFormulario[] = [
  {
    id: 'form-1',
    nome: 'Atraso de Aluno',
    descricao: 'Registrar chegada tardia do aluno',
    campos: [
      { id: 'f1-1', rotulo: 'Aluno', tipo: 'autocomplete_aluno', obrigatorio: true },
      { id: 'f1-2', rotulo: 'Horário de Chegada', tipo: 'texto', obrigatorio: true },
      { id: 'f1-3', rotulo: 'Motivo', tipo: 'selecao', obrigatorio: true, opcoes: ['Transporte', 'Saúde', 'Pessoal', 'Outro'] },
      { id: 'f1-4', rotulo: 'Observações', tipo: 'area_texto', obrigatorio: false },
    ],
    criadoEm: '2026-04-01',
  },
  {
    id: 'form-2',
    nome: 'Falta de Uniforme',
    descricao: 'Registrar aluno sem uniforme completo',
    campos: [
      { id: 'f2-1', rotulo: 'Aluno', tipo: 'autocomplete_aluno', obrigatorio: true },
      { id: 'f2-2', rotulo: 'Item Faltante', tipo: 'selecao', obrigatorio: true, opcoes: ['Camiseta', 'Calça', 'Tênis', 'Agasalho', 'Completo'] },
      { id: 'f2-3', rotulo: 'Observações', tipo: 'area_texto', obrigatorio: false },
    ],
    criadoEm: '2026-04-01',
  },
  {
    id: 'form-3',
    nome: 'Ocorrência Disciplinar',
    descricao: 'Registrar comportamento inadequado',
    campos: [
      { id: 'f3-1', rotulo: 'Aluno', tipo: 'autocomplete_aluno', obrigatorio: true },
      { id: 'f3-2', rotulo: 'Tipo', tipo: 'selecao', obrigatorio: true, opcoes: ['Conversa excessiva', 'Uso de celular', 'Desrespeito', 'Briga', 'Outro'] },
      { id: 'f3-3', rotulo: 'Gravidade', tipo: 'selecao', obrigatorio: true, opcoes: ['Leve', 'Moderada', 'Grave'] },
      { id: 'f3-4', rotulo: 'Descrição', tipo: 'area_texto', obrigatorio: true },
    ],
    criadoEm: '2026-04-05',
  },
];

// --- Ocorrências (mock) ---

export const ocorrenciasMock: RegistroOcorrencia[] = [
  {
    id: 'oc-1',
    modeloFormularioId: 'form-1',
    nomeModelo: 'Atraso de Aluno',
    dados: { 'Horário de Chegada': '08:15', 'Motivo': 'Transporte', 'Observações': 'Ônibus atrasou por conta da chuva.' },
    nomeAluno: 'Bruno Henrique',
    turmaAluno: '6º Ano B',
    anoAluno: '6º Ano',
    salaAluno: 2,
    professorAtual: 'Carlos Eduardo Lima',
    criadoEm: '2026-04-20T08:15:00',
  },
  {
    id: 'oc-2',
    modeloFormularioId: 'form-2',
    nomeModelo: 'Falta de Uniforme',
    dados: { 'Item Faltante': 'Camiseta' },
    nomeAluno: 'Isabela Ferreira',
    turmaAluno: '7º Ano A',
    anoAluno: '7º Ano',
    salaAluno: 5,
    criadoEm: '2026-04-20T07:55:00',
  },
  {
    id: 'oc-3',
    modeloFormularioId: 'form-1',
    nomeModelo: 'Atraso de Aluno',
    dados: { 'Horário de Chegada': '08:30', 'Motivo': 'Pessoal' },
    nomeAluno: 'Thiago Barros',
    turmaAluno: '8º Ano A',
    anoAluno: '8º Ano',
    salaAluno: 9,
    professorAtual: 'Fernanda Oliveira',
    criadoEm: '2026-04-19T08:30:00',
  },
  {
    id: 'oc-4',
    modeloFormularioId: 'form-3',
    nomeModelo: 'Ocorrência Disciplinar',
    dados: { 'Tipo': 'Uso de celular', 'Gravidade': 'Leve', 'Descrição': 'Aluno usando celular durante explicação.' },
    nomeAluno: 'Caio Martins',
    turmaAluno: '1ª Série A',
    anoAluno: '1ª Série',
    salaAluno: 17,
    professorAtual: 'Juliana Costa',
    criadoEm: '2026-04-18T10:45:00',
  },
  {
    id: 'oc-5',
    modeloFormularioId: 'form-2',
    nomeModelo: 'Falta de Uniforme',
    dados: { 'Item Faltante': 'Tênis' },
    nomeAluno: 'Ana Clara',
    turmaAluno: '6º Ano A',
    anoAluno: '6º Ano',
    salaAluno: 1,
    criadoEm: '2026-04-18T07:50:00',
  },
];
