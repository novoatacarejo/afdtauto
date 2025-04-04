# Estrutura do Projeto

```plaintext
project-root/
├── backend/
│   ├── controllers/       # Lógica de controle (ex.: FilesService, StationService)
│   ├── middleware/        # Middlewares (ex.: Logger)
│   ├── routes/            # Rotas da API (ex.: clocks.js, info.js)
│   ├── services/          # Lógica de negócios (ex.: WebService, NetworkService)
│   ├── utils/             # Funções utilitárias (ex.: Utils.js)
│   ├── app.js             # Ponto de entrada do backend
│   └── server.js          # Configuração do servidor Express
├── database/
│   ├── migrations/        # Scripts de criação e atualização do banco de dados
│   ├── seeds/             # Dados iniciais para popular o banco
│   ├── database.js        # Configuração do banco de dados SQLite
│   └── clocks.db          # Arquivo do banco de dados SQLite
├── frontend/
│   ├── assets/            # Arquivos estáticos (CSS, JS, imagens, fontes)
│   ├── components/        # Componentes reutilizáveis (se usar frameworks como React/Vue)
│   ├── pages/             # Páginas HTML (ex.: index.html)
│   ├── index.html         # Página inicial
│   └── index.js           # Lógica do frontend
├── .env                   # Variáveis de ambiente
├── .gitignore             # Arquivos e pastas a serem ignorados pelo Git
├── [package.json](http://_vscodecontentref_/0)           # Dependências do projeto
└── README.md              # Documentação do projeto
```

# Detalhes da Estrutura

## 1. backend

Contém toda a lógica do servidor e da API.

**controllers:** Lógica de controle, como manipulação de dados e chamadas de serviços.
**middleware:** Middlewares, como autenticação, logs, etc.
**routes:** Define as rotas da API (ex.: /clocks, /info).
**services:** Contém a lógica de negócios, como NetworkService e WebService.
**utils:** Funções utilitárias, como formatação de datas e validações.
**app.js:** Ponto de entrada do backend.
**server.js:** Configuração do servidor Express.

## 2. database

Contém tudo relacionado ao banco de dados.

**migrations:** Scripts para criar ou alterar tabelas no banco de dados.
**seeds:** Dados iniciais para popular o banco (opcional).
**database.js:** Configuração da conexão com o banco de dados.
**clocks.db:** Arquivo do banco de dados SQLite.

## 3. frontend

Contém os arquivos do frontend.

**assets:** Arquivos estáticos, como CSS, JavaScript, imagens e fontes.
**components:** Componentes reutilizáveis (se usar frameworks como React ou Vue).
**pages:** Páginas HTML, como index.html.
**index.html:** Página inicial.
**index.js:** Lógica do frontend.

## 4. Arquivos na Raiz

**.env:** Variáveis de ambiente, como configurações do banco de dados e porta do servidor.
**.gitignore:** Arquivos e pastas a serem ignorados pelo Git (ex.: node_modules, clocks.db).
**package.json:** Gerenciamento de dependências do projeto.
**README.md:** Documentação do projeto.
