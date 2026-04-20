# 📂 Modelos de Planilha para o SESI Connect

Para alimentar o aplicativo com dados dinamicos, você deve preparar seus arquivos Excel seguindo as colunas e formatos abaixo. Após preparar as planilhas, os dados podem ser convertidos para JSON e colados no serviço de dados do app.

---

## 1. ABA: Professores (`professores.xlsx`)
| Coluna | Descrição | Exemplo |
| :--- | :--- | :--- |
| **id** | Identificador único | 101 |
| **name** | Nome completo do professor | Alex Rivera |
| **subject** | Matéria principal | Matemática |
| **status** | Status atual | `present`, `in_class` ou `away` |
| **currentRoom** | Sala onde está agora | Sala 402 |
| **nextClassTime** | Horário da próxima aula | 14:00 |

---

## 2. ABA: Salas (`salas.xlsx`)
| Coluna | Descrição | Exemplo |
| :--- | :--- | :--- |
| **id** | Número da sala (2 dígitos) | 01 |
| **name** | Nome da sala ou laboratório | Smart Lab Alpha |
| **floor** | Pavimento/Andar | Térreo |
| **segment** | Fundamental ou Médio | `Fundamental` |
| **year** | Ano específico | `6º Ano` |
| **isAvailable** | Está livre? (Sim/Não) | TRUE / FALSE |
| **currentClass** | Nome da aula ocorrendo | Cálculo Avançado |
| **currentTeacher**| Professor na sala | Alex Rivera |
| **endTime** | Quando a aula termina | 11:30 |

---

## 3. ABA: Language Lab (`idiomas.xlsx`)
| Coluna | Descrição | Exemplo |
| :--- | :--- | :--- |
| **id** | Identificador único | L01 |
| **level** | Nível da turma de inglês | Inglês Iniciante (A1) |
| **teacher** | Professor de idiomas | Robert Smith |
| **room** | Sala designada | Sala 05 |
| **time** | Janela de horário | 14:00 - 15:30 |

---

## 4. ABA: After School (`extra.xlsx`)
| Coluna | Descrição | Exemplo |
| :--- | :--- | :--- |
| **id** | Identificador único | E01 |
| **name** | Nome da atividade | Robótica |
| **category** | Categoria (Esporte, Tec...) | Tecnologia |
| **time** | Horário | 14:00 - 16:00 |
| **location** | Local (Quadra, Lab...) | Laboratório 04 |
| **days** | Dias (Separados por vírgula) | Segunda, Quarta |
| **description** | Breve resumo | Aprenda programação... |

---

## 5. ABA: Monitores (`monitores.xlsx`)
| Coluna | Descrição | Exemplo |
| :--- | :--- | :--- |
| **id** | Identificador único | M01 |
| **name** | Nome do aluno monitor | Ricardo Silva |
| **subject** | Matéria da monitoria | Física |
| **shift** | Turno | `manha`, `tarde` ou `noite` |
| **time** | Horário do plantão | 08:00 - 10:00 |
| **status** | Status | `active` ou `inactive` |
