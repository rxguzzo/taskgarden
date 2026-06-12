# Documentação de Fundação — TaskGarden MVP

Este documento registra o escopo técnico, decisões de arquitetura e validações realizadas para consolidar a **Fase 1: Fundação Estrutural** do TaskGarden.

---

## 1. Escopo Implementado
- **Bootstrap do Next.js**: Inicializado na raiz do projeto com TypeScript, Tailwind CSS v4, ESLint, diretório `src/` e suporte a App Router.
- **Estrutura de Rotas e Layouts**:
  - Layout isolado para fluxos de autenticação em `(auth)`.
  - Layout consolidado para o painel em `(dashboard)` unificando menus de navegação.
  - Rotas provisórias e navegáveis: `/`, `/garden`, `/tasks`, `/focus`, `/greenhouse`, `/statistics` e `/settings`.
- **Navegação Responsiva**:
  - Configuração centralizada de navegação em `src/config/navigation.ts`.
  - Componente `Sidebar` visível exclusivamente em telas de desktop.
  - Componente `BottomNav` visível exclusivamente em telas de celulares/tablets.
- **Componentização de Plantas (`PlantVisual`)**:
  - Componente visual baseado em SVGs dinâmicos inline representando os estágios: `SEED`, `SPROUT`, `SAPLING`, `TREE` e `MATURE`.
  - Controle de tamanho visual baseado em enums estáticos (`SMALL`, `MEDIUM`, `LARGE`).
  - Suporte de acessibilidade (ARIA labels) e conformidade de movimentos (`prefers-reduced-motion` no CSS).
- **Estrutura de Integração com Supabase Cloud**:
  - Instalação estrutural das dependências `@supabase/supabase-js` e `@supabase/ssr`.
  - Configuração do cliente de browser, servidor e validador de chaves de ambiente com suporte a fallbacks seguros (sem crash do app).
- **Dados Demonstrativos**:
  - Isolamento de tarefas e estados mockados no arquivo `src/mocks/demo-tasks.ts`.

---

## 2. Arquitetura Criada

A fundação adota uma arquitetura Next.js modularizada, dividida em camadas lógicas simples:

```text
C:\Projetos\taskgarden
├── src/
│   ├── app/                    # Rotas, Layouts Globais e CSS
│   ├── components/             # Componentes React Reutilizáveis
│   │   ├── layout/             # Sidebar e BottomNav
│   │   ├── plants/             # PlantVisual (SVGs)
│   │   └── ui/                 # Elementos básicos (Card)
│   ├── config/                 # Arquivo central de rotas de navegação
│   ├── domain/                 # Camada de regras e tipos puras do motor de crescimento
│   ├── mocks/                  # Dados estáticos simulados para demonstração
│   └── services/               # Clientes e utilitários de integração do Supabase
```

---

## 3. Versões Principais
- **Next.js:** `16.2.9`
- **React / React DOM:** `19.2.4`
- **Tailwind CSS:** `v4.0.0`
- **TypeScript:** `^5.0.0`
- **@supabase/supabase-js:** `^2.49.0`
- **@supabase/ssr:** `^0.5.2`

---

## 4. Decisões Técnicas
- **Tailwind v4:** Adoção da versão mais recente utilizando a nova sintaxe nativa `@import "tailwindcss";` no arquivo CSS principal.
- **Isolamento de Regras do Componente SVG:** O componente `PlantVisual` é puramente opinativo em termos visuais e apenas renderiza as imagens dependendo das propriedades recebidas, mantendo as regras de negócio no domínio (`src/domain/growth`).
- **Resiliência de Integração:** O aplicativo é preparado para funcionar de forma demonstrativa local e sem credenciais na inicialização das páginas estáticas. Caso alguma chamada futura tente utilizar o Supabase sem variáveis de ambiente, o instanciador do cliente intercepta a chamada e dispara uma exceção clara alertando o desenvolvedor no console.

---

## 5. Comandos de Validação
Os seguintes comandos devem ser executados na raiz do projeto para assegurar a integridade do código antes de novas implementações:

- **Linting**:
  ```bash
  npm run lint
  ```
- **Typecheck**:
  ```bash
  npx tsc --noEmit
  ```
- **Build**:
  ```bash
  npm run build
  ```

---

## 6. Limitações Atuais & Próximos Módulos
Nesta etapa de fundação estrutural, não estão disponíveis:
- Conexão e sincronização ativa com banco de dados Supabase Cloud.
- Migrations de tabelas do PostgreSQL e regras RLS.
- Validação funcional de sessões de usuário no Middleware do Next.js.
- Cronômetro Pomodoro interativo persistindo dados.
- Regras complexas e dinâmicas de evolução de XP.

Essas funcionalidades serão desenvolvidas nos módulos subsequentes do roadmap de desenvolvimento.
