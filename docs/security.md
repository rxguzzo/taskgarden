# Estratégia de Segurança do TaskGarden (M8 Hardening)

Este documento descreve a arquitetura e as estratégias de segurança implementadas no aplicativo **TaskGarden** para garantir a proteção de dados dos usuários e preparar o projeto para publicação como portfólio público.

---

## 1. Estratégia de Autenticação e Sessão
O TaskGarden utiliza o **Supabase SSR (@supabase/ssr)** acoplado com o fluxo de autenticação segura **PKCE (Proof Key for Code Exchange)**.
* **Callback Seguro:** O fluxo de login e recuperação de senha utiliza a rota `/auth/callback` para trocar códigos temporários de forma segura por sessões persistidas em cookies encriptados.
* **Fail-Closed no Middleware (Proxy):** O arquivo `src/proxy.ts` atua como guardião interceptando todas as rotas privadas. Se as credenciais do Supabase estiverem ausentes ou o usuário não possuir um token válido de autenticação obtido via `supabase.auth.getUser()`, o acesso é sumariamente bloqueado e redirecionado para `/login`.
* **Redirecionamento Protegido contra Open Redirect:** O utilitário `getSafeRedirectUrl` valida recursivamente caminhos fornecidos no parâmetro `?next=`, barrando tentativas de injeção de links externos, protocolos maliciosos (como `javascript:` ou `data:`) e caracteres de escape (como `\\` ou `//`).

---

## 2. RLS (Row Level Security)
Row Level Security está habilitado e configurado no nível do banco de dados (PostgreSQL) para garantir que cada usuário autenticado manipule estritamente seus próprios registros.

As políticas implementadas cobrem as seguintes tabelas:
* **`profiles`**:
  * SELECT: apenas o dono (`auth.uid() = id`).
  * UPDATE: apenas o dono (`auth.uid() = id` com validação `WITH CHECK`).
  * INSERT: não permitido diretamente. Os perfis são criados de forma segura pelo banco através de uma trigger de criação de usuário (`on_auth_user_created` rodando com `SECURITY DEFINER` qualificado).
* **`life_areas`**, **`tasks`**, **`work_sessions`** e **`subtasks`**:
  * SELECT: permitido apenas se `auth.uid() = user_id`.
  * INSERT: permitido apenas se `auth.uid() = user_id` (com validação `WITH CHECK`).
  * UPDATE: permitido apenas se `auth.uid() = user_id` (com validação `USING` e `WITH CHECK`).
  * DELETE: privilégio de DELETE físico **não concedido** à role `authenticated`. O sistema realiza soft-deletes (exclusão lógica) alterando o campo `deleted_at`. As políticas de UPDATE impedem o usuário de forçar a alteração de dados estruturais no momento da exclusão lógica.

---

## 3. Isolamento e Defense-in-Depth
Embora o Supabase RLS barre qualquer requisição indevida no nível do banco de dados, o TaskGarden aplica uma segunda camada de defesa no servidor Next.js:
* **Autenticação via Servidor:** Nenhuma Server Action aceita o identificador do usuário (`user_id` / `userId`) a partir dos dados submetidos pelo cliente (`formData` ou argumentos). O identificador é sempre obtido no servidor consultando `supabase.auth.getUser()`.
* **Filtragem Explícita:** Todas as consultas no servidor adicionam filtros explícitos `.eq('user_id', user.id)` para garantir que a aplicação nunca dependa apenas da configuração do RLS.

---

## 4. Variáveis de Ambiente e Ausência de `service_role`
* **Sem chaves confidenciais commitadas:** O repositório contém apenas o arquivo `.env.example`. O arquivo `.env.local` que contém as chaves locais reais do desenvolvedor está explicitamente bloqueado no `.gitignore` através da regra `.env*`.
* **Uso exclusivo de chaves públicas:** A aplicação utiliza somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
* **Sem uso de `service_role`:** Em nenhuma parte do aplicativo Next.js (seja cliente ou servidor) é inicializado um cliente Supabase com privilégios de administrador (`service_role`). Isso impede que qualquer ataque de injeção contorne o RLS.

---

## 5. Tratamento de Erros e Vazamento de Dados
* Todas as Server Actions possuem blocos `try/catch` genéricos.
* Erros do PostgreSQL (como violações de chave estrangeira, constraints não cumpridas) e stack traces técnicos são capturados e logados silenciosamente no servidor via `console.error`.
* Para o usuário final no frontend, é exibida uma mensagem amigável e segura (por exemplo, *"Falha ao registrar sessão de trabalho."*), impedindo o vazamento de estruturas internas de banco de dados ou detalhes de segurança do Supabase.

---

## 6. Como testar o isolamento de dados
Para garantir que o isolamento esteja funcionando adequadamente, você pode realizar testes manuais ou executar o script automatizado do projeto.

### Teste Manual (Dois Usuários)
1. **Preparação:** Crie duas contas no aplicativo (ex: `userA@test.com` e `userB@test.com`).
2. **Login do Usuário A:** Em uma janela de navegador comum, faça login como Usuário A e plante uma nova Área da Vida (ex: "Trabalho") e adicione uma Tarefa ativa. Copie o ID da área a partir da URL (ex: `/garden/d3b07384-d113...`).
3. **Login do Usuário B:** Abra uma janela Anônima (Incognito) e faça login como Usuário B.
4. **Tentativa de Acesso Indireto:** No navegador do Usuário B, tente acessar diretamente a URL da área do Usuário A digitando `/garden/d3b07384-d113...` na barra de endereços.
   * **Resultado Esperado:** O sistema deve exibir a tela `404 - Not Found` (não localizada), provando que a query foi protegida contra IDOR (Insecure Direct Object Reference) e RLS.

### Teste Automatizado de RLS
Criamos um script utilitário de teste de RLS localizado em `tests/security/test-rls-isolation.mjs`.

Para rodá-lo:
1. Certifique-se de que o arquivo `.env.local` contém chaves válidas.
2. Defina as credenciais de dois usuários de teste cadastrados no Supabase Auth em seu arquivo `.env.local` (ou no ambiente):
   ```env
   TASKGARDEN_TEST_USER_A_EMAIL=usuario_a@teste.com
   TASKGARDEN_TEST_USER_A_PASSWORD=senha_secura
   TASKGARDEN_TEST_USER_B_EMAIL=usuario_b@teste.com
   TASKGARDEN_TEST_USER_B_PASSWORD=senha_secura
   ```
3. Execute o comando:
   ```bash
   node tests/security/test-rls-isolation.mjs
   ```
4. O script executará o **Smoke Test Anônimo** e o **Teste Real A vs B** (se as credenciais acima estiverem preenchidas), validando que o Usuário B não consegue visualizar ou alterar os dados criados pelo Usuário A.
