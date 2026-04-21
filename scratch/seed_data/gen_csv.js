const fs = require('fs');

const generateCSV = (filename, headers, rows) => {
  const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(filename, content);
  console.log(`Generated ${filename}`);
};

// 1. Professores
const professores = [
  ['Andressa Silva'],
  ['Carlos Oliveira'],
  ['Daniele Santos'],
  ['Felipe Rocha'],
  ['Gisele Lima'],
  ['Henrique Souza'],
  ['Isabela Costa'],
  ['João Pereira'],
  ['Kleber Dias'],
  ['Luciana Mello']
];
generateCSV('scratch/seed_data/professores.csv', ['nome'], professores);

// 2. Alunos (distributed)
const alunos = [];
const anos = ['6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º Ano EM', '2º Ano EM', '3º Ano EM'];
let count = 1;
anos.forEach(ano => {
  for(let i=1; i<=5; i++) {
    alunos.push([`Aluno Ficticio ${count++}`, ano]);
  }
});
generateCSV('scratch/seed_data/alunos.csv', ['nome', 'turma'], alunos);

// 3. Monitores
const monitores = [
  ['Monitor Pedro'],
  ['Monitora Ana'],
  ['Monitor Bruno'],
  ['Monitora Clara']
];
generateCSV('scratch/seed_data/monitores.csv', ['nome'], monitores);
