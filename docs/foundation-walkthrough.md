# Documentação de Fundação — TaskGarden MVP

Este documento registra o escopo técnico, decisões de arquitetura, novos conceitos e validações realizadas para consolidar a **Fase 1: Fundação Estrutural** do TaskGarden.

---

## 1. Modelo Conceitual do Jardim

No TaskGarden, a gamificação é regida pelos seguintes princípios de cultivo:
- **Uma árvore representa uma área da vida.** (Ex: Igreja, Trabalho, Academia, Estudos, Vida pessoal, Projetos).
- **As tarefas pertencem a essa área** por meio da relação do atributo `life_area_id`.
- **A árvore cresce com o tempo e os resultados acumulados.** O estágio da árvore (`stage`) e seu tamanho visual (`visualSize`) representam o investimento de tempo total focado e tarefas concluídas historicamente.
- **Criar novas tarefas não reduz a árvore.** O progresso das tarefas abertas atuais (`currentProgress`) é exibido como um indicador horizontal secundário. Adicionar novas tarefas reduz temporariamente a porcentagem da barra de progresso, mas a árvore no Jardim preserva seu tamanho e estágio integralmente, pois o esforço histórico acumulado é permanente e nunca decresce.

---

## 2. Lógica de Evolução e Mapeamento

### Árvores das Áreas da Vida (`life_areas`)
- **Estágio da árvore (`PlantStage`)**: `SEED` (Semente), `SPROUT` (Broto), `SAPLING` (Muda), `TREE` (Árvore) e `MATURE` (Árvore Madura). Representa a dedicação histórica acumulada da área.
- **Tamanho da árvore (`PlantVisualSize`)**: `SMALL` (Pequena), `MEDIUM` (Média) e `LARGE` (Grande). Representa a intensidade dessa dedicação acumulada.
- **Saúde da área (`healthStatus`)**: Representa a atividade recente daquela área:
  - `HEALTHY` (Saudável): Atualizado recentemente e frequência em dia.
  - `THIRSTY` (Com sede): Sem atividades registradas há alguns dias.
  - `IDLE` (Parada): Sem nenhuma atividade recente.
  - `OVERLOADED` (Sobrecarregada): Excesso de tarefas ativas simultâneas.

### Tarefas (`tasks`)
- Cada tarefa possui atributos como `progress` (0 a 100%), `difficulty` (EASY, MEDIUM, HARD, VERY_HARD) e `priority` (LOW, MEDIUM, HIGH, URGENT).
- As estatísticas da área de vida no painel principal são calculadas dinamicamente via funções puras:
  - **Progresso Médio**: Média aritmética do progresso das tarefas ativas da área. Se não houver tarefas ativas, retorna `null` e a interface exibe o texto informativo `"Sem tarefas ativas"` (evitando barras vazias ou porcentagens ambíguas).

---

## 3. Estrutura e Arquitetura Criada

O projeto Next.js modularizado adota as seguintes pastas na raiz `C:\Projetos\taskgarden`:

```text
C:\Projetos\taskgarden
├── docs/                     # Documentação técnica oficial do repositório
│   └── foundation-walkthrough.md
├── src/
│   ├── app/                  # Roteamento e Páginas (App Router)
│   │   ├── (auth)/           # Grupo de login/cadastro
│   │   ├── (dashboard)/      # Grupo do Jardim, Detalhes de Área, Foco, etc.
│   │   │   └── garden/
│   │   │       ├── [areaId]/ # Rota dinâmica de detalhes da área
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/           # Componentes React Reutilizáveis
│   │   ├── layout/           # Sidebar e BottomNav responsivos
│   │   ├── plants/           # PlantVisual (SVGs)
│   │   └── ui/               # Componente Card (Glassmorphism)
│   ├── config/               # Configuração centralizada de navegação
│   ├── domain/               # Lógica pura de regras do motor de crescimento
│   │   └── growth/
│   │       ├── rules.ts      # Cálculo dinâmico e helpers de labels
│   │       └── types.ts      # Interfaces das Áreas e Tarefas
│   ├── mocks/                # Dados estáticos simulados
│   │   ├── demo-life-areas.ts
│   │   └── demo-area-tasks.ts
│   ├── services/             # Integração com Supabase Cloud (estrutura)
│   └── utils/                # Utilitários genéricos
│       └── date.ts           # Formatação de datas em padrão brasileiro
```

---

## 4. Decisões Técnicas Principais
- **Suporte ao Next.js 16/15 (Params Assíncronos)**: Na rota `/garden/[areaId]`, o objeto `params` é tratado como uma `Promise` (`Promise<{ areaId: string }>`) e resolvido via `await params`. A função `generateStaticParams()` foi implementada para garantir a pré-geração estática das rotas mockadas na compilação.
- **Tratamento de Área Inexistente**: Caso o ID acessado na rota `/garden/[areaId]` seja inválido, o Next.js dispara imediatamente `notFound()` (redirecionando para um layout 404 personalizado e coerente).
- **Responsividade Ultrawide**: Configuração da grade de jardim com largura flexível até `max-w-[1600px]`, permitindo visualização de 5 colunas em resoluções de 2560px, 4 colunas em 1920px, 3 colunas em 1366px, 2 colunas em tablets e 1 coluna em celulares.

---

## 5. Comandos de Validação e Qualidade
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
