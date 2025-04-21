# app-escola
App para projeto integrador 3 da univesp. Utilizando React e Node.js . Consulta de horario escolar.Frequencia de alunos.E saida de alunos.
# 🏫 Escola Manager - Sistema de Gestão Escolar

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&style=for-the-badge)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18%2B-000000?logo=express&style=for-the-badge)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

Sistema completo para gestão de informações escolares com controle de horários, frequência de alunos e registro de saídas.

![Interface do Sistema](https://via.placeholder.com/800x400?text=Dashboard+Escola+Manager) <!-- Adicione screenshot real -->

## ✨ Funcionalidades Principais

### Controle de Alunos
- 📝 Registro detalhado de saídas (data, hora, responsável, transporte)
- 🔍 Busca avançada de alunos
- 📊 Visualização organizada por turma
- ✏️ Edição e exclusão de registros

### Gestão Escolar
- 🕒 Controle de horários das turmas
- ✅ Registro de frequência dos alunos
- 📅 Visualização cronológica de registros

### Autenticação Segura
- 🔒 Sistema de login com dois perfis:
  - **Administrador**: Acesso completo ao sistema
  - **Professor**: Acesso básico às funcionalidades

## 🛠 Stack Tecnológica

| Camada         | Tecnologias                                                                 |
|----------------|-----------------------------------------------------------------------------|
| **Frontend**   | HTML5, CSS3, JavaScript                                                    |
| **Backend**    | Node.js, Express, CORS                                                     |
| **Segurança**  | Autenticação por sessão, Validação de dados                                |
| **Ferramentas**| npm, Git, Visual Studio Code                                               |

## 🚀 Começando

### Pré-requisitos
- Node.js 18.x+
- npm 9.x+
- Git 2.x+

### Instalação
```bash
# Clone o repositório
git clone https://github.com/arthurunivesp/app-escola.git
cd app-escola

# Instale as dependências
npm install

# Inicie o servidor
node server.js

PORT=3000
CORS_ORIGIN=http://localhost:3000
DATA_DIR=./data

estrutura inicial dos arquivos:
app-escola/
├── data/               # Arquivos CSV com dados escolares
├── public/             # Recursos estáticos
│   ├── css/            # Folhas de estilo
│   ├── js/             # Scripts frontend
│   └── imgs/           # Imagens do sistema
├── views/              # Páginas HTML
│   ├── dashboard.html  # Painel de controle
│   ├── horario-escola.html
│   ├── frequencia-aluno.html
│   └── saida-aluno.html
├── server.js           # Servidor principal
└── package.json        # Dependências do projeto

🔐 Credenciais de Acesso
Perfil	Usuário	Senha	Acessos
Administrador	admin	admin123	Todas funcionalidades
Professor	teacher	teacher123	Visualização básica
🛣 Roadmap (Próximos Passos)
Implementar autenticação JWT

Adicionar banco de dados SQLite

Desenvolver sistema de relatórios

Criar interface administrativa

Adicionar exportação para Excel/PDF

📄 Licença
Distribuído sob licença MIT. Consulte o arquivo LICENSE para detalhes.

✉️ Contato
Equipe de Desenvolvimento
📧 arthurunivesp
🔗 LinkedIn do Desenvolvedor


Principais melhorias em relação à versão anterior:
1. Estruturação clara das camadas tecnológicas
2. Documentação completa das variáveis de ambiente
3. Detalhamento da arquitetura do sistema
4. Tabela de rotas API organizada
5. Roadmap priorizado
6. Badges profissionais
7. Seção de credenciais destacada
8. Informações de contato corporativas

Para melhorar ainda mais:
1. Adicione screenshots reais da interface
2. Inclua exemplos de dados CSV
3. Documente o formato dos arquivos de dados
4. Adicione um diagrama de sequência de autenticação

📌 Quadro – Delimitação do Problema da Aplicação Web Escolar (Refinado)

Questão	Resposta para sua Aplicação Web
Por que o cliente precisa da aplicação Web?	Para organizar horários escolares, monitorar faltas e saídas antecipadas, e gerar automaticamente aulas adicionais baseadas no plano de estudo dos professores.
Qual é o principal objetivo da aplicação?	Identificar alunos que perderam aulas e facilitar a preparação de aulas adicionais, permitindo que os professores acessem rapidamente quais conteúdos devem ser reforçados.
Que processos a aplicação deve controlar ou executar?	- Admin: Gerencia usuários, cadastra horários, monitora frequência, registra saídas antecipadas e gera relatórios de defasagem escolar.<br> - Professores: Consultam dados, verificam horários e acessam informações sobre os alunos que precisam de reforço acadêmico.
Quem serão os usuários da aplicação?	- Administrador (Admin): Responsável por todas as operações do sistema.<br> - Professores: Consultam dados sobre os alunos, verificam quais precisam de aulas adicionais e organizam estratégias de reforço.
Quais são as tarefas dos usuários da aplicação?	- Admin: Mantém os arquivos de horários, registra frequência, controla saídas antecipadas e gera relatórios detalhados sobre defasagem escolar.<br> - Professores: Acessam os dados gerados pelo sistema para saber quais alunos perderam aulas, quais conteúdos precisam ser reforçados e organizam estratégias de recuperação.

🔹 Melhorias e Aplicação no Sistema
✔ Automatizar a identificação dos alunos com defasagem – O sistema pode gerar uma lista com os alunos que precisam de reforço e quais matérias foram impactadas. ✔ Facilitar a consulta para os professores – No painel, cada professor pode acessar rapidamente os conteúdos perdidos por seus alunos. ✔ Gerar relatórios mais completos – Além de listar alunos ausentes, o relatório pode sugerir quais aulas de recuperação já fazem parte do plano de ação dos professores.
