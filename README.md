# WhatsAgent COD 🤖💬

Agente automático de atendimento e vendas pelo WhatsApp, especializado em
produtos vendidos no modelo **pagamento na entrega (Cash on Delivery / COD)**.

O cliente conversa pelo WhatsApp, a IA apresenta o produto, responde dúvidas e
objeções, deixa claro que **o pagamento é feito só na entrega**, coleta os dados
e cria o pedido automaticamente no seu painel.

---

## ✨ O que este sistema faz

- Cadastro completo do produto, ofertas, imagens, regiões e formas de pagamento.
- Treinamento do agente: perguntas frequentes, objeções e personalidade.
- Conexão com o **WhatsApp Cloud API oficial da Meta**.
- IA (OpenAI) que conversa, vende e conduz até o pedido.
- Consulta automática de **CEP** e validação de **região de entrega**.
- Criação de pedidos **somente após confirmação real do cliente**.
- Painel para acompanhar conversas e pedidos, e **assumir o atendimento** quando quiser.

---

## 🧭 Guia passo a passo (para quem nunca programou)

> Leia com calma. É só seguir na ordem. Não precisa saber programar.
> Você vai criar contas em 3 serviços (todos têm plano gratuito para começar):
> **Supabase** (banco de dados), **OpenAI** (a inteligência) e **Meta/WhatsApp**.
> Depois publica tudo na **Vercel** (também gratuito para começar).

### PARTE 1 — Supabase (banco de dados e login)

**1. Criar conta no Supabase**
1. Acesse **https://supabase.com** e clique em **Start your project**.
2. Faça login com o GitHub ou com e-mail.

**2. Criar o projeto**
1. Clique em **New project**.
2. Dê um nome (ex: `whatsagent`).
3. Crie uma senha para o banco (anote em algum lugar seguro).
4. Escolha a região mais perto de você (ex: São Paulo).
5. Clique em **Create new project** e aguarde ~2 minutos.

**3. Executar o SQL (criar as tabelas)**
1. No menu à esquerda, clique em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo **`supabase/schema.sql`** deste projeto, copie **TODO** o conteúdo.
4. Cole na tela do SQL Editor.
5. Clique em **Run** (ou aperte Ctrl+Enter). Deve aparecer "Success".
   - Esse script cria todas as tabelas, a segurança (RLS) e o local das imagens.

**4. Storage (imagens) — já foi criado pelo SQL**
- O script já cria automaticamente o "bucket" chamado `product-images`.
- Para conferir: menu **Storage** → você deve ver `product-images` na lista.

**5. Autenticação (login por e-mail e senha)**
1. Menu **Authentication** → **Providers** → confirme que **Email** está ativado.
2. Menu **Authentication** → **Sign In / Providers** (ou **Settings**):
   - Para facilitar os testes, você pode **desativar a confirmação de e-mail**
     ("Confirm email"). Assim você já entra direto após se cadastrar.
   - Depois, se quiser mais segurança, pode reativar.

**6. Pegar as chaves do Supabase**
1. Menu **Project Settings** (ícone de engrenagem) → **API**.
2. Anote os 3 valores (vamos usar depois na Vercel):
   - **Project URL** → vira `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → vira `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (clique em "Reveal") → vira `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ A chave **service_role** é secreta. Nunca compartilhe nem coloque em telas públicas.

---

### PARTE 2 — OpenAI (a inteligência do agente)

**7. Criar a chave da OpenAI**
1. Acesse **https://platform.openai.com** e faça login/cadastro.
2. Adicione um método de pagamento em **Settings → Billing** (a IA é cobrada por uso; comece com pouco crédito).
3. Vá em **https://platform.openai.com/api-keys**.
4. Clique em **Create new secret key**, dê um nome e **copie a chave** (começa com `sk-...`).
   - Essa chave vira `OPENAI_API_KEY`. Guarde bem — ela não aparece de novo.

---

### PARTE 3 — WhatsApp Cloud API (Meta)

> Este é o passo mais trabalhoso, mas é só seguir.

**8. Criar app na Meta**
1. Acesse **https://developers.facebook.com** e faça login com sua conta do Facebook.
2. Clique em **My Apps** → **Create App**.
3. Escolha o tipo **Business** e avance.
4. Dê um nome ao app e crie.
5. Na tela do app, procure **WhatsApp** e clique em **Set up**.

**9. Pegar o Phone Number ID e o token de teste**
1. No menu do app: **WhatsApp → API Setup**.
2. Você verá um número de teste já disponível.
3. Anote o **Phone number ID** → vira `META_WHATSAPP_PHONE_NUMBER_ID`.
4. Anote o **WhatsApp Business Account ID** → vira `META_WHATSAPP_BUSINESS_ACCOUNT_ID`.
5. Copie o **Temporary access token** (validade curta) → vira `META_WHATSAPP_ACCESS_TOKEN`.
   - Para testes, o token temporário serve. Para produção, gere um token permanente (passo 10).
6. Em **API Setup**, adicione o SEU número de celular em "To" para poder testar recebendo mensagens.

**10. (Produção) Gerar um token permanente**
1. Menu **Business Settings** (business.facebook.com) → **Users → System Users**.
2. Crie um System User, dê a ele acesso ao seu app do WhatsApp.
3. Clique em **Generate new token**, escolha o app, marque as permissões
   `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Copie o token gerado (esse é permanente) → use como `META_WHATSAPP_ACCESS_TOKEN`.

**11. Criar o Verify Token**
- Este valor **você inventa**. Pode ser qualquer texto secreto,
  ex: `minha-chave-secreta-123`.
- Ele vira `META_WHATSAPP_VERIFY_TOKEN`.
- Guarde, pois vamos usar em dois lugares (Vercel e painel da Meta).

> O **Webhook** (passo 20) será configurado só depois que o site estiver publicado,
> porque precisamos do endereço `https://...vercel.app/api/whatsapp/webhook`.

---

### PARTE 4 — Colocar o projeto no ar (GitHub + Vercel)

**12. Enviar o projeto para o GitHub**
1. Crie uma conta em **https://github.com** (se ainda não tiver).
2. Este projeto já é um repositório Git. Basta publicá-lo no seu GitHub
   (pelo próprio GitHub, botão "New repository", e seguir as instruções de
   "push an existing repository", ou usando o GitHub Desktop).

**13. Criar conta na Vercel e importar**
1. Acesse **https://vercel.com** e faça login **com o GitHub**.
2. Clique em **Add New → Project**.
3. Selecione o repositório do WhatsAgent COD e clique em **Import**.

**14. Configurar as variáveis de ambiente na Vercel**
1. Na tela de importação (ou depois em **Settings → Environment Variables**),
   adicione cada variável abaixo (nome e valor), uma por uma:

| Nome | De onde vem |
|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project URL (passo 6) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → anon public (passo 6) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → service_role (passo 6) |
| `OPENAI_API_KEY` | OpenAI (passo 7) |
| `OPENAI_MODEL` | `gpt-4o-mini` (recomendado) |
| `META_WHATSAPP_ACCESS_TOKEN` | Meta (passo 9 ou 10) |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Meta (passo 9) |
| `META_WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta (passo 9) |
| `META_WHATSAPP_VERIFY_TOKEN` | o texto que você inventou (passo 11) |
| `NEXT_PUBLIC_APP_URL` | preencha depois com a URL da Vercel (passo 16) |

> Dica: você pode usar o arquivo **`.env.example`** como referência dos nomes.

**15. Publicar**
1. Clique em **Deploy**. Aguarde alguns minutos.
2. Quando terminar, a Vercel mostra a URL do seu site, algo como
   `https://seu-projeto.vercel.app`.

**16. Atualizar a URL do app**
1. Volte em **Settings → Environment Variables**.
2. Edite `NEXT_PUBLIC_APP_URL` colocando a URL real (ex: `https://seu-projeto.vercel.app`).
3. Vá em **Deployments** e clique em **Redeploy** para aplicar.

---

### PARTE 5 — Conectar o WhatsApp ao site publicado

**17. Criar sua conta no sistema**
1. Acesse `https://seu-projeto.vercel.app`.
2. Clique em **Criar conta**, cadastre e-mail e senha, e entre.

**18. Cadastrar o produto e treinar o agente**
1. No menu **Produto**: preencha nome, descrição, preços, ofertas, regiões,
   formas de pagamento e a mensagem sobre pagamento na entrega. Adicione imagens.
2. No menu **Treinamento**: cadastre perguntas frequentes, objeções e ajuste a
   personalidade e o tom do agente.

**19. Informar o Phone Number ID**
1. No menu **WhatsApp** do site: cole o **Phone Number ID** (passo 9),
   o **Business Account ID**, e o mesmo **Verify Token** que você definiu.
2. Clique em **Salvar e conectar**. O status deve virar **CONECTADO**.
   - Copie também a **URL do Webhook** que aparece nessa tela.

**20. Configurar o Webhook no painel da Meta**
1. No painel da Meta: **WhatsApp → Configuration** (ou **Webhooks**).
2. Em **Callback URL**, cole: `https://seu-projeto.vercel.app/api/whatsapp/webhook`.
3. Em **Verify token**, cole o **mesmo** `META_WHATSAPP_VERIFY_TOKEN` (passo 11).
4. Clique em **Verify and save**. Se der certo, aparece confirmado.
5. Em **Webhook fields**, clique em **Manage** e ative (**Subscribe**) o campo **messages**.

**21. Ativar o agente**
1. No menu **Dashboard** do site, clique em **Ativar agente**.
2. Pronto! Agora as mensagens recebidas serão respondidas automaticamente.

---

## 🧪 Como testar

**22. Testar uma mensagem real**
1. Envie uma mensagem do seu WhatsApp para o número de teste da Meta
   (ou peça para alguém enviar, se estiver em produção).
2. Em segundos, o agente deve responder.
3. No menu **Conversas** do site, a conversa aparece em tempo (quase) real.

**23. Testar a criação de um pedido**
1. Converse como se fosse um cliente: pergunte o preço, diga que quer comprar.
2. O agente vai pedir o **CEP**, depois número da casa, etc.
3. No final ele mostra um **resumo** e pede confirmação.
4. Responda **"sim"**. O agente confirma e o pedido aparece em **Pedidos**
   com status **Confirmado**.

**24. Assumir uma conversa manualmente**
1. Em **Conversas**, abra uma conversa e clique em **Assumir conversa**.
2. O agente para de responder e você pode escrever manualmente.
3. Para voltar ao automático, clique em **Devolver para o agente**.

---

## 🩺 Como identificar erros

- **O agente não responde:**
  - O agente está **ativado** no Dashboard?
  - O Webhook foi **verificado** e o campo **messages** está **subscrito** na Meta?
  - As variáveis `OPENAI_API_KEY` e `META_WHATSAPP_*` estão corretas na Vercel?
  - Veja os **logs**: Vercel → seu projeto → **Deployments** → **Functions/Logs**.
    Procure por linhas começando com `[WhatsAgent]`.
- **"CONECTADO/DESCONECTADO" errado:** confirme o **Phone Number ID** na página WhatsApp.
- **Não cria pedido:** o pedido só é criado quando **todos os dados** estão
  preenchidos, a **região é atendida** e o cliente **confirma o resumo**. Isso é
  proposital, para não gerar pedidos falsos.
- **CEP não encontrado:** o agente pedirá o endereço manualmente. Normal.
- **Erro de token/permissão:** o token temporário da Meta expira rápido; gere um
  token permanente (passo 10).

---

## 🔐 Segurança

- Cada usuário só vê os próprios dados (Row Level Security ativado no banco).
- Tokens secretos (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `META_WHATSAPP_ACCESS_TOKEN`) ficam **apenas no servidor** e nunca vão para o navegador.
- O webhook evita processar a mesma mensagem duas vezes (índice único).

---

## 💻 Rodar no seu computador (opcional, para desenvolvedores)

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de variáveis
cp .env.example .env.local
# edite .env.local preenchendo os valores

# 3. Rodar em modo desenvolvimento
npm run dev
# abre em http://localhost:3000

# Verificações
npm run typecheck   # checa TypeScript
npm run build       # simula o build de produção
```

> Para testar o webhook localmente, use uma ferramenta como o **ngrok** para
> expor `http://localhost:3000` em uma URL `https://...` e use-a como Callback URL.

---

## 🏗️ Tecnologias

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth,
Storage) · OpenAI · WhatsApp Cloud API · Vercel.

## 🗺️ Preparado para crescer

A arquitetura já está organizada para, no futuro, suportar vários produtos,
vários números de WhatsApp, rastreamento, follow-up, upsell, relatórios e CRM —
sem precisar reescrever a base.
