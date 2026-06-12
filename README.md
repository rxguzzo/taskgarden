# TaskGarden — Gestão de Tarefas Gamificada

O **TaskGarden** é uma aplicação web de gestão de tarefas com uma interface gamificada baseada no crescimento de plantas. Cada tarefa criada representa uma semente que cresce de semente a árvore madura de acordo com o progresso registrado, tempo dedicado e foco em sessões Pomodoro.

Esta é a **Fase 1: Fundação Estrutural** do MVP, contendo a modelagem de domínio inicial, estruturas de rotas protegidas responsivas (desktop/mobile), integração do cliente do Supabase de forma isolada, e o componente visual de renderização dinâmica das plantas (`PlantVisual`) usando SVGs inline.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js instalado (v18+)
- Gerenciador de pacotes `npm`

### 1. Clonar ou Acessar a Raiz do Projeto
Acesse o diretório do projeto no terminal:
```bash
cd C:\Projetos\taskgarden
```

### 2. Instalar as Dependências
Como esta etapa já foi bootstrapeada, você pode restaurar ou verificar as dependências rodando:
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente (Supabase Cloud)
Por padrão, o projeto inicia com **dados demonstrativos mockados** sem necessidade de chaves. Para conectar o seu banco de dados definitivo do Supabase Cloud futuramente:

1. Crie um arquivo chamado `.env.local` na raiz do projeto (`C:\Projetos\taskgarden\.env.local`).
2. Copie o conteúdo de `.env.example` e preencha com as suas chaves do projeto Supabase Cloud:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-anonima-publica
   ```

*Nota: Se o arquivo `.env.local` estiver ausente ou vazio, a aplicação entrará em modo de demonstração local e não tentará realizar conexões com a API.*

### 4. Rodar o Servidor de Desenvolvimento
Inicie o servidor local:
```bash
npm run dev
```
Acesse a aplicação no navegador em [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Comandos de Verificação e Qualidade

Antes de enviar alterações para produção, execute os comandos de qualidade do código:

- **Linting**: Validação de estilo e checagem estática com ESLint:
  ```bash
  npm run lint
  ```
- **Typecheck**: Verificação estática de tipos do TypeScript:
  ```bash
  npx tsc --noEmit
  ```
- **Compilação**: Executar o build completo do Next.js de produção para garantir integridade:
  ```bash
  npm run build
  ```

---

## 📂 Estrutura de Pastas Implementada

```text
src/
├── app/                      # Rotas e Páginas do Next.js App Router
│   ├── (auth)/               # Grupo de rotas de login/cadastro
│   │   ├── cadastro/         # Página de cadastro provisória
│   │   ├── login/            # Página de login provisória
│   │   └── layout.tsx        # Layout isolado de autenticação
│   ├── (dashboard)/          # Grupo de rotas do painel
│   │   ├── focus/            # Tela de cronômetro Pomodoro (provisória)
│   │   ├── garden/           # Dashboard principal do Jardim Digital
│   │   ├── greenhouse/       # Estufa de histórico (tarefas arquivadas/podadas)
│   │   ├── settings/         # Configurações de tema e chaves do Supabase
│   │   ├── statistics/       # Gráficos de tempo focado e progresso
│   │   ├── tasks/            # Página para plantar novas tarefas
│   │   └── layout.tsx        # Layout principal com Sidebar e BottomNav responsivo
│   ├── globals.css           # Estilização global e animações (Sway do vento)
│   ├── layout.tsx            # Layout raiz global (Head e body)
│   └── page.tsx              # Redirecionador inicial (/ -> /garden)
├── components/               # Componentes React Reutilizáveis
│   ├── layout/               # Elementos de navegação responsivos
│   │   ├── BottomNav.tsx     # Menu de navegação mobile
│   │   └── Sidebar.tsx       # Menu de navegação desktop
│   ├── plants/               # Componente de representação dinâmica
│   │   └── PlantVisual.tsx   # SVG inline dinâmico isolado de lógica
│   └── ui/                   # Wrappers e elementos gráficos base
│       └── Card.tsx          # Card com efeito Glassmorphism
├── config/                   # Configurações globais e centrais
│   └── navigation.ts         # Lista centralizada de rotas de navegação
├── domain/                   # Camada de Regras e Modelagem de Negócio
│   └── growth/               # Lógica pura de crescimento e mapeamento de estágios
│       ├── rules.ts          # Funções puras (Progresso -> Estágio -> Tamanho)
│       └── types.ts          # Tipos (PlantStage, PlantVisualSize)
├── mocks/                    # Dados para demonstração visual
│   └── demo-tasks.ts         # Lista estática de tarefas no Jardim, Estufa e Podas
└── services/                 # Serviços de Integração Externa
    └── supabase/             # Clientes Supabase com verificação segura
        ├── browser.ts        # Cliente do lado do navegador
        ├── server.ts         # Cliente do lado do servidor
        └── config.ts         # Validador de variáveis de ambiente
```
