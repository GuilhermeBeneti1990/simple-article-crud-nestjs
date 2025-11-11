# Teste Sistema Simples de Artigos - NestJS

Este repositório contém um projeto NestJS minimalista que implementa:
- Cadastro, edição, exclusão e leitura de usuários
- Cadastro, edição, exclusão e leitura de artigos
- Autenticação via JWT (rota /auth/login)
- Permissões (ADMIN, EDITOR, READER) criadas via seed
- Usuário root criado via seed (ver .env for credentials)

Como executar:
1. Copie `.env.example` para `.env` e ajuste se necessário.
2. Execute `docker compose up --build`
3. A API estará disponível em `http://localhost:3000/api`

Endpoints principais:
- POST /api/auth/login  { email, password } -> { access_token }
- POST /api/users       -> criar usuário (público)
- GET /api/users        -> lista usuários (ADMIN)
- CRUD /api/articles    -> leitura pública, escrever/editar/apagar para EDITOR/ADMIN

Observações:
- Use o token Bearer retornado por /auth/login nas requisições autenticadas.
- O projeto foi implementado com TypeORM e utiliza sincronização automática para facilidade (synchronize: true).
- Seeds e permissões são criadas automaticamente no startup (script dist/seed.js é executado antes de iniciar o app no Dockerfile).
