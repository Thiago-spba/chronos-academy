# Chronos Academy — PWA de Apoio Escolar com IA

Plataforma educacional progressiva (PWA) para o Novo Ensino Médio, unindo Ciências Humanas (História) e Ciências Exatas/Tecnologia (Desenvolvimento de Sistemas e Carreira e Competências). O professor publica as aulas em um painel administrativo próprio, com apoio de Inteligência Artificial para transformar o material bruto em conteúdo simplificado, ilustrado e pronto para o aluno estudar — sempre com revisão humana antes de publicar.

🔗 **Site:** [chronos-umber-sigma.vercel.app](https://chronos-umber-sigma.vercel.app)

## 🚀 Funcionalidades

### Para o aluno (site público)
- **Painel de Turmas** com cards por disciplina/série, sem necessidade de login.
- **Aulas organizadas por bimestre**, com busca instantânea por assunto, palavra-chave, semana ou ano.
- **Material de Estudo gerado por IA**: contexto introdutório, seções explicativas, comparações lado a lado, palavras-chave com definição simples e ilustração temática — tudo revisado pelo professor antes de ir ao ar.
- **Vídeos do YouTube** com carregamento sob demanda (lazy loading) e retomada automática de onde o aluno parou.
- **PDFs de apoio** (material original e, quando existir, versão simplificada).
- **Progressive Web App**: instalável no celular/computador, com cache local para acesso a aulas já abertas mesmo sem internet.
- **Modo claro/escuro** com identidade visual própria para cada área do conhecimento.

### Para o professor (painel administrativo)
- **Login restrito** via Google (Firebase Authentication).
- **Preencher aula com IA**: anexa até 5 PDFs (ou cola texto) e a IA gera título, introdução, utilidade prática, resumo e o Material de Estudo completo — com destaque visual para qualquer trecho que a IA tenha complementado (fora do material original), para revisão obrigatória antes de publicar.
- **Sugestão de vídeos com IA**: busca e filtra vídeos do YouTube relevantes para o conteúdo da aula.
- **Mensagem motivacional da semana**, gerada por IA para a página inicial.
- **Registro da Aula**: campo interno (nunca visível ao aluno) com resumo pronto para colar em sistemas de registro de aula, com atalhos para atividades comuns em sala.
- **Gestão de turmas, avisos e ferramentas de prática**, com sincronização automática entre turmas que compartilham o mesmo conteúdo.
- Interface de confirmações e notificações totalmente própria (sem pop-ups nativos do navegador).

## 🛠️ Stack Tecnológica

**Frontend**
- React 19 + Vite
- React Router
- Tailwind CSS v4
- Lucide React (ícones)
- react-youtube
- Vite PWA Plugin (manifest + service worker)

**Backend / IA**
- Vercel Functions (funções serverless em `api/`)
- API da Anthropic (Claude) para geração e curadoria de conteúdo
- YouTube Data API v3 para busca de vídeos

**Dados e infraestrutura**
- Firebase Firestore (banco de dados)
- Firebase Storage (arquivos PDF)
- Firebase Authentication (login do professor)
- Hospedagem e deploy contínuo na Vercel

## 📦 Como rodar o projeto localmente

1. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente necessárias (crie um arquivo `.env.local` na raiz — ele já está no `.gitignore` e nunca deve ser commitado):

   | Variável | Para que serve |
   |---|---|
   | `ANTHROPIC_API_KEY` | Chave da API da Anthropic, usada pelas funções de IA em `api/`. |
   | `YOUTUBE_API_KEY` | Chave da YouTube Data API v3, usada na sugestão de vídeos. |

   As credenciais do Firebase (projeto, autenticação e banco de dados) ficam configuradas em `src/firebase.js` e são protegidas pelas regras de segurança do próprio Firebase, não por segredo de código.

3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Outros scripts disponíveis:
   ```bash
   npm run build     # build de produção
   npm run preview   # pré-visualiza o build de produção
   npm run lint      # checagem de código (oxlint)
   ```

## 📁 Estrutura do projeto

```
api/            → funções serverless de IA (Vercel Functions)
src/pages/      → páginas do site (públicas e administrativas)
src/components/ → componentes reutilizáveis de interface
src/utils/      → funções auxiliares (bimestres, temas visuais, catálogo de ícones)
src/firebase.js → inicialização do Firebase (Firestore, Auth, Storage)
```

## 🚢 Deploy

O deploy é automático: a cada `push` na branch `main`, a Vercel gera uma nova build (`vite build`) e publica em produção.

## 👤 Autor

Desenvolvido e mantido por **Prof. Thiago Fernando** — Engenheiro da Computação, licenciado em Matemática e História, pós-graduado em Metodologia da Educação.

---

Projeto de uso educacional privado. Todos os direitos reservados.
