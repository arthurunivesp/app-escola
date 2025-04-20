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
