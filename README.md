# TaskGarden — Gestão de Tarefas Gamificada

O **TaskGarden** é uma aplicação web de gestão de tarefas com uma interface gamificada baseada no crescimento de plantas.

---

## 🌿 Conceito de Cultivo

Neste projeto, a gamificação é orientada pela seguinte estrutura conceitual:
- **Uma árvore representa uma área da vida.** (Ex: Igreja, Trabalho, Academia, Estudos, Vida pessoal, Projetos).
- **As tarefas pertencem a essa área.** Elas são cadastradas e concluídas de forma vinculada a cada árvore.
- **A árvore cresce com o tempo e os resultados acumulados.** O estágio da árvore (`stage`) e seu tamanho visual (`visualSize`) refletem a dedicação de tempo focado e o histórico acumulado de tarefas colhidas nessa área ao longo dos dias.
- **Criar novas tarefas não reduz a árvore.** O progresso das tarefas abertas atuais (`currentProgress`) é exibido como uma barra horizontal informativa secundária. Adicionar novas tarefas diminui o progresso da barra (já que há mais trabalho pendente), mas a árvore preserva seu tamanho e estágio integralmente, pois o esforço histórico acumulado nunca decresce.

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
Instale os pacotes necessários rodando:
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente (Supabase Cloud)
Por padrão, o projeto inicia em **Modo de Leitura** com **dados demonstrativos mockados** sem necessidade de chaves. O banco de dados Supabase Cloud ainda não está conectado nesta etapa de desenvolvimento.

Caso deseje preparar a conexão do seu banco de dados definitivo futuramente:
1. Crie um arquivo chamado `.env.local` na raiz do projeto (`C:\Projetos\taskgarden\.env.local`).
2. Copie o conteúdo de `.env.example` e preencha com as suas chaves do projeto Supabase Cloud:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-anonima-publica
   ```

*Nota: Se o arquivo `.env.local` estiver ausente ou vazio, a aplicação continuará em modo de demonstração local e não tentará realizar conexões com a API.*

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
│   │   │   ├── [areaId]/     # Detalhe dinâmico da Área da Vida
│   │   │   └── page.tsx      # Jardim exibindo o grid de Áreas
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
│       └── types.ts          # Tipos (DemoLifeArea, DemoAreaTask)
├── mocks/                    # Dados para demonstração visual
│   ├── demo-life-areas.ts    # Lista estática de áreas da vida (Igreja, Trabalho, etc.)
│   └── demo-area-tasks.ts    # Lista estática de tarefas vinculadas às áreas
├── services/                 # Serviços de Integração Externa
│   └── supabase/             # Clientes Supabase com verificação segura
│       ├── browser.ts        # Cliente do lado do navegador
│       ├── server.ts        # Cliente do lado do servidor
│       └── config.ts         # Validador de variáveis de ambiente
└── utils/                    # Utilitários gerais
    └── date.ts               # Formatação de datas em padrão brasileiro
```
