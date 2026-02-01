# DIRETRIZES DO PROJETO: App de Gestão para Instaladores de Portões (Metal Fly Logic)

Este documento descreve a arquitetura, lógica de negócios e instruções detalhadas para a criação do aplicativo, baseando-se nos arquivos `METAL FLY - Página1.csv` e `para analizar.txt`.

## 1. Visão Geral do Produto
O aplicativo é um SaaS (Software as a Service) voltado para empreendedores de serralheria e instalação de portões automáticos.
-   **Público-alvo**: Instaladores independentes.
-   **Funcionalidade Principal**: Calculadora de orçamentos automática, gestão de pedidos e CRM.
-   **Novos Módulos**: E-commerce B2B (Admin vende para Instalador) e Plataforma de Cursos (Academy).
-   **Diferencial**: Cada usuário (instalador) configura seus próprios preços de material, mão de obra e margens de lucro.
-   **Hierarquia**:
    -   **Admin Master**: O dono do aplicativo. Tem visão total, gerencia planos/usuários, cadastra produtos na loja e aulas na plataforma.
    -   **Usuário (Instalador)**: Tem seu próprio painel, seus clientes, seus orçamentos, compra insumos na loja e assiste aos cursos.

## 2. Análise dos Dados e Lógica de Negócio (Mantido Integralmente)
Baseado no arquivo `para analizar.txt` e no CSV, a lógica de cálculo "Metal Fly" que o sistema deve seguir é:

### Variáveis de Entrada (Input do Usuário por Orçamento)
-   **Largura (L)** e **Altura (H)** da porta.
-   **Adicionais** (Frete, Fechaduras, etc).
-   **Preço do m² da Lâmina** (Opcional: pode vir da config padrão do usuário ou ser manual).

### Fórmulas Automáticas (O Coração do App)
1.  **Área (m²)**: `Largura * Altura`
2.  **Peso da Porta (Estimativa para Motor)**:
    -   Fórmula: `(Área * 10kg) * 1.3`
    -   *Explicação*: Considera 10kg/m² para porta meia cana e adiciona 30% de margem de segurança.
3.  **Seleção Automática do Motor**:
    -   O sistema deve consultar a tabela de preços do usuário e selecionar o motor adequado baseando-se no **Peso**.
    -   *Lógica*:
        -   Se Peso <= 200kg -> Preço Motor A
        -   Se Peso <= 300kg -> Preço Motor B
        -   Se Peso <= 500kg -> Preço Motor C
4.  **Cálculo da Pintura**:
    -   Fórmula: `Área * Preço_Pintura_m2`
    -   *Nota*: O usuário define se o preço cobre os dois lados. O padrão do texto é "Frente e Costa" incluso.
5.  **Preço Total do Orçamento**:
    -   `Total = (Área * Preço_Lâmina_m2) + Preço_Pintura + Preço_Motor + Adicionais`

## 3. Arquitetura do Banco de Dados (Supabase)

O banco de dados deve ser relacional e fortemente protegido por RLS (Row Level Security).

### Tabela: `profiles` (Perfis de Usuário)
Extensão da tabela `auth.users`.
-   `id`: UUID (PK)
-   `role`: 'admin_master' ou 'user'
-   `company_name`: Nome da empresa do instalador
-   `cnpj`: Texto (14 dígitos, obrigatório para contas com país `+55`)
-   `phone_country_code`: Texto (ex.: '+55')
-   `phone_e164`: Texto (E.164, ex.: '+558599999999')
-   `phone_verified_at`: Timestamp (opcional)
-   `subscription_status`: 'free', 'basic', 'pro' (Define acesso aos cursos)
-   `created_at`: Data de cadastro

### Tabela: `pricing_configs` (Configurações de Preço por Usuário)
Cada instalador define seus valores base aqui.
-   `id`: UUID (PK)
-   `user_id`: UUID (FK -> profiles.id)
-   `price_blade_m2`: Decimal (Preço padrão da lâmina/m²)
-   `price_painting_m2`: Decimal (Preço padrão da pintura/m²)
-   `motor_prices`: JSONB
    -   *Exemplo de estrutura JSON*: `{"200kg": 800, "300kg": 1100, "500kg": 1500}`

### Tabela: `clients` (CRM de Clientes)
-   `id`: UUID (PK)
-   `user_id`: UUID (FK -> profiles.id)
-   `name`: Texto
-   `phone`: Texto
-   `address`: Texto (Opcional)

### Tabela: `orders` (Pedidos/Orçamentos)
-   `id`: UUID (PK)
-   `user_id`: UUID (FK -> profiles.id)
-   `client_id`: UUID (FK -> clients.id)
-   `client_name`: Texto
-   `client_phone`: Texto
-   `width`: Decimal
-   `height`: Decimal
-   `area`: Decimal
-   `blade_price_applied`: Decimal
-   `painting_price_total`: Decimal
-   `motor_cost`: Decimal
-   `motor_model`: Texto
-   `additional_cost`: Decimal
-   `total_price`: Decimal
-   `status`: Texto

### Novos Módulos de Dados

#### E-commerce B2B (Loja do Serralheiro)
-   **`products`**: `id`, `name`, `description`, `price`, `category` (laminas, motores, placas, tintas), `image_url`, `stock_quantity`.
-   **`cart_items`**: `id`, `user_id`, `product_id`, `quantity`.
-   **`store_orders`**: `id`, `user_id`, `total_amount`, `status` (pending_payment, shipping, delivered).

#### LMS (Metal Fly Academy)
-   **`courses`**: `id`, `title`, `description`, `thumbnail_url`, `is_published`.
-   **`modules`**: `id`, `course_id`, `title`, `order_index`, `unlock_condition` (ex: finish previous).
-   **`lessons`**: `id`, `module_id`, `title`, `video_url`, `content_text`, `attachment_url` (PDFs/Docs).
-   **`progress`**: `id`, `user_id`, `lesson_id`, `completed_at`.

## 4. Prompt Mestre para Geração (v0.dev / Cursor / Windsurf)

---
**COPIE E COLE O TEXTO ABAIXO NA SUA IA DE DESENVOLVIMENTO:**

```text
Atue como um Engenheiro de Software Sênior especialista em Next.js, Supabase e SaaS B2B.

Crie um aplicativo web completo: "Metal Fly - Gestão & Academy".
O app é um ecossistema para instaladores de portões que inclui: Calculadora de Orçamentos, Loja de Insumos e Plataforma de Cursos.

### TECH STACK
- Framework: Next.js 14 (App Router)
- UI Library: Shadcn/ui + Tailwind CSS
- Backend/Auth: Supabase (Auth + Postgres)
- Ícones: Lucide React
- Cores: Tema Azul (#007AFF) e Laranja (#FF9500) com fundo Dark/Light toggle.

### FLUXO DE AUTENTICAÇÃO INTELIGENTE
1. **Calculadora Pública**: A Home Page mostra a calculadora. O usuário insere as medidas.
2. **Teaser de Resultado**: Ao clicar em "Calcular", o sistema mostra um modal.
   - Se logado: Mostra o resultado completo imediatamente.
   - Se deslogado: Redireciona para /register. Após cadastro sucesso, mostra o resultado do cálculo que ele estava fazendo.
3. **Onboarding**: Primeiro login obriga o usuário a configurar seus preços (Lâmina/Pintura) antes de usar o painel.
 4. **Cadastro Obrigatório (Campos e Validações)**:
    - Campos: Nome/Empresa, CNPJ (BR), País (código +##), Telefone com máscara, Email e Senha.
    - Validação: CNPJ com dígitos verificadores (14 dígitos), telefone salvo em formato E.164 (ex.: +5585...), seleção de país obrigatória.
    - Regra: Se País = '+55', CNPJ é obrigatório; outros países podem usar CNPJ opcional.

### MÓDULOS DO SISTEMA

#### 1. Calculadora & CRM (Core)
- Usuário insere Largura/Altura.
- **Cálculo Automático**:
  - Área = L * H.
  - Peso = (Área * 10) * 1.3.
  - Motor = Seleciona auto pelo peso (ex: <200kg, <300kg) baseado na tabela de preços do usuário.
  - Pintura = Área * Preço_m2 (Se configurado).
- **CRM**: Salvar clientes. Botão "Enviar no WhatsApp" gera mensagem formatada.

#### 2. E-commerce B2B (Loja)
- O Admin Master cadastra produtos: Motores, Placas, Tintas, Lâminas (Categorias e Personalizações).
- O Usuário (Instalador) navega, adiciona ao carrinho e finaliza pedido (que vai para o Admin).

#### 3. Academy (Cursos DIY)
- Área exclusiva para assinantes.
- Listagem de Módulos (Instalação, Manutenção, Elétrica).
- **Gamificação**: Módulos bloqueados liberam conforme progresso.
- **Downloads**: Área para baixar manuais e tabelas.

#### 4. Painel Admin Master
- Gerencia Usuários, Produtos da Loja e Conteúdo dos Cursos.

### DESIGN SYSTEM
- **Cores**: Primária Azul, Secundária Laranja.
- **Modo**: Suporte a Dark Mode e Light Mode (Toggle no menu).
- **Estilo**: Moderno, Cards com sombras suaves, Tipografia Inter/Roboto.

### SQL (SUPABASE)
Gere o SQL para todas as tabelas: `profiles`, `pricing_configs`, `orders`, `clients`, `products`, `store_orders`, `courses`, `lessons`, `progress`.
Inclua RLS para garantir que usuários só vejam seus próprios orçamentos, mas todos vejam os Produtos e Cursos (se assinantes).
 Incluir campos de cadastro obrigatórios:
 - `profiles.cnpj` (obrigatório se `phone_country_code = '+55'`), `profiles.phone_country_code`, `profiles.phone_e164`, `profiles.phone_verified_at`.
```
---

## 5. Próximos Passos
1.  **Configurar Supabase**: Crie as tabelas novas (`products`, `courses`, etc).
2.  **Frontend**: Gere as telas da Loja e da Área de Membros usando o prompt atualizado.
3.  **Fluxo de Auth**: Implemente a lógica de salvar o cálculo no LocalStorage antes do cadastro para recuperá-lo depois.

## 6. Fluxo de Resultados e Autenticação

- Quando o usuário clicar em "Ver Resultado":
  - Se não estiver logado e sem histórico de login: redirecionar para `/register`.
  - Se estiver logado: mostrar resultados imediatamente na mesma tela.
- Persistência do cálculo pendente:
  - Salvar no `localStorage` os inputs (largura, altura, preço-m², adicionais).
  - Após cadastro/login, recuperar e calcular automaticamente.
- Middleware (SSR) com Supabase:
  - Verificar sessão em páginas protegidas e redirecionar conforme necessidade.
- Manter todas as fórmulas atuais e adicionar novas linhas sem remover as existentes.

## 7. E-commerce Completo

- Catálogo de produtos com organização por categorias e modelos:
  - Categorias: Acessórios, Controles, Placas Controladoras, Motores, Tintas, Lubrificantes, Lâminas.
  - Subcategorias e filtros: Marca, capacidade (kg), voltagem, cor, tipo de lâmina, acabamento.
  - Modelos específicos: Variantes com atributos (ex.: Motor 200kg/300kg/500kg).
- Personalização de categorias:
  - Estrutura flexível via tabela de atributos e filtros por categoria.
- Carrinho e Checkout:
  - Adicionar/Remover itens, alterar quantidade, resumo de valores.
  - Checkout com dados de entrega e pagamento.
  - Integração de pagamento (Pix/Cartão) e emissão de comprovante.
  - Histórico de pedidos do usuário e painel de processamento para Admin Master.

## 8. Sistema de Cursos Premium (LMS)

- Assinatura mensal habilita acesso às aulas.
- Estrutura modular (estilo DIO/DEVS): Cursos → Módulos → Aulas.
- Liberação progressiva: concluir aula para liberar a próxima.
- Suporte a documentação técnica e downloads (PDF, manuais, tabelas).
- Área de progresso: mostra aulas concluídas e próximas etapas.
- Painel Admin Master para publicar cursos, módulos, aulas e materiais.

## 9. Personalização Visual

- Esquema de cores:
  - Primárias: Azul (ex.: `#007AFF`) e Laranja (ex.: `#FF9500`).
  - Secundárias: Cinza escuro (ex.: `#1F2937`) e Branco (`#FFFFFF`).
- Temas:
  - Modo escuro e claro com toggle no painel do usuário.
  - Preferências salvas por usuário (configuração persistente).

## 10. Painel de Administração Master

- Gerenciamento completo:
  - Produtos do e-commerce (categorias, modelos, estoque, preços, imagens).
  - Conteúdos dos cursos (cursos, módulos, aulas, anexos).
  - Documentações técnicas (upload/download, versão, publicação).
  - Liberação de módulos e controle de assinaturas.
  - Configurações globais de tema e identidade visual.

## 11. Requisitos Técnicos

- Manter todas as fórmulas matemáticas existentes.
- Adicionar novas linhas de cálculo sem remover as existentes.
- Interface responsiva e intuitiva (mobile-first).
- Sistema de pagamento integrado para assinaturas e pedidos.
- Controle de acesso por níveis de permissão (RBAC) e RLS no banco.

## 12. Tabelas Detalhadas e RLS

- `categories`: id, name, parent_id (subcategorias), is_active.
- `products`: id, category_id, name, description, base_price, image_url, is_active.
- `product_attributes`: id, product_id, key, value (ex.: cor=preto, voltagem=220v).
- `product_variants`: id, product_id, sku, price, stock, attributes_json.
- `filters`: id, category_id, key (ex.: cor, voltagem), type (list/range).
- `cart_items`: id, user_id, product_id (ou variant_id), quantity.
- `store_orders`: id, user_id, total_amount, status, payment_method, payment_status, created_at.
- `store_order_items`: id, order_id, product_id (ou variant_id), quantity, unit_price, subtotal.
- `subscriptions`: id, user_id, plan, status (active/canceled/past_due), current_period_end.
- `payments`: id, user_id, order_id (opcional), amount, method, status, provider_reference, created_at.
- RLS:
  - Produtos/Categorias: leitura pública; escrita restrita ao Admin Master.
  - Carrinho/Pedidos: acesso apenas ao `user_id` dono; Admin Master pode ver todos.
  - Cursos/Conteúdos: leitura por assinantes; escrita restrita ao Admin Master.

## 13. Pagamentos e Assinaturas

- Provedores sugeridos:
  - Pix/Mercado Pago (Brasil) e/ou Stripe (Cartão).
- Fluxo de assinatura:
  - Usuário escolhe plano → checkout → webhook atualiza `subscriptions.status`.
  - Gate de acesso no LMS depende de `subscriptions.status = active`.
- Fluxo de pedido da loja:
  - Confirmar pagamento → atualizar `store_orders.payment_status` e liberar logística.

## 14. Matemática Adicional (Novas Linhas)

- Total com margem de 10%: `Total_Com_10 = Total * 1.10`.
- Custo de materiais (se configurado): `Custo_Total = Custo_Lâmina + Custo_Pintura + Custo_Motor + Custo_Adicionais`.
- Lucro: `Lucro = Total - Custo_Total`.
- Saldo a Pagar: `Saldo = Total - Sinal`.
- Pintura dupla face: `Pintura_Dupla = (Área * 2) * Preço_Pintura_m2` (se aplicável).

## 15. Inovações de Arquitetura e UX

- Fluxos guiados (assistente) para orçamento, compra e estudo.
- Mensagens de WhatsApp automáticas com resumo de orçamento/pedido.
- Offline-first para anotações e orçamento básico em campo.
- Auditoria: logs de ações críticas (criação de pedido, publicação de aula).
- Consistência visual: layouts e componentes compartilhados entre módulos.

## 16. Guia de Implementação e UI/UX por Tópico

### 16.1 Fluxo de Resultados e Autenticação

- Páginas e Rotas:
  - `app/page.tsx`: Calculadora pública (inputs de Largura, Altura, Valor/m², Adicionais).
  - `app/register/page.tsx` e `app/login/page.tsx`: Cadastro/Login.
  - `app/dashboard/page.tsx`: Resultado e gestão de pedidos.
- Comportamento (Regra):
  - Botão `Calcular` valida inputs e calcula Área, Peso, Subtotal e Total.
  - Ao clicar em `Ver Resultado`:
    - Se não logado (sem sessão e sem histórico): abrir modal com call-to-action e redirecionar para `/register`.
    - Se logado: exibir resultado imediatamente na mesma página (sem navegação).
  - Persistência: salvar os inputs em `localStorage` antes de redirecionar. Após cadastro/login, recuperar e mostrar o resultado.
- UI/UX:
  - Layout centralizado com formulário em coluna única.
  - Microcopy clara: "Para ver o resultado completo, crie sua conta. Leva menos de 30 segundos."
  - Feedback imediato: usar `skeleton` para o bloco de resultado; `toast` para erros.
  - Acessibilidade: modal com `focus trap`, navegação por teclado, rótulos de inputs e contraste AA.
  - Estados vazios: quando faltar preço configurado, mostrar card de onboarding com botão "Configurar Preços".

### 16.8 Cadastro e Validações (CNPJ & Telefone com País)

- Campos obrigatórios:
  - Empresa/Nome.
  - CNPJ (Brasil) com validação de dígitos verificadores.
  - Seleção de País (combo com códigos +## e bandeiras).
  - Telefone (input com máscara do país; armazenar em E.164).
  - Email e Senha.
- Regras de validação:
  - CNPJ: remover não dígitos, exigir 14 dígitos, rejeitar sequências repetidas, calcular dois dígitos verificadores conforme regra oficial.
  - País: obrigatório; define máscara de telefone e prefixo.
  - Telefone: converter para E.164 (`+<código><número>`), sem espaços; validar comprimento mínimo por país.
  - Email/Senha: políticas de força mínima (8+ caracteres, mistura de tipos).
- UX de formulário:
  - Input de país com busca (tipo select com bandeiras).
  - Mask dinâmica do telefone ao trocar país.
  - Mensagens inline e resumo de erros no topo.
  - Botão "Criar Conta" desabilitado até todas as validações passarem.
- Persistência:
  - Salvar `cnpj`, `phone_country_code` e `phone_e164` em `profiles`.
  - Opcional: `phone_verified_at` após verificação via OTP/WhatsApp.

### 16.2 E-commerce Completo

- Páginas:
  - `app/store/page.tsx`: Catálogo com grid responsivo.
  - `app/store/[category]/page.tsx`: Lista filtrada por categoria.
  - `app/product/[id]/page.tsx`: Detalhe do produto com variantes.
  - `app/cart/page.tsx` e `app/checkout/page.tsx`.
- Catálogo e Filtros:
  - Sidebar (desktop) com filtros: Categoria, Subcategoria, Marca, Capacidade (kg), Voltagem, Cor, Tipo de Lâmina, Acabamento.
  - No mobile, abrir filtros em `sheet` deslizante.
  - Cards com imagem, nome, preço, badge de estoque e CTA "Adicionar ao Carrinho".
  - Variantes (ex.: 200kg/300kg/500kg) em `segmented control`/`chips` com preço dinâmico.
- Carrinho e Checkout:
  - Resumo fixo (desktop) à direita com subtotal, frete, total.
  - Ajuste de quantidade com botões `+/-` e remoção por ícone.
  - Checkout em etapas: Endereço → Pagamento → Revisão.
  - Confirmação com recibo (número do pedido) e opção "Enviar no WhatsApp" com resumo do pedido.
- UI/UX:
  - Grid 2–4 colunas (dependendo do breakpoint), espaçamento consistente.
  - Cores: Azul para CTAs principais, Laranja para ênfases (promoções/estoque baixo).
  - Skeletons em carregamento de lista e detalhe.
  - Notificações (toast) após adicionar ao carrinho e finalizar compra.

### 16.3 Sistema de Cursos Premium (LMS)

- Páginas:
  - `app/academy/page.tsx`: Lista de cursos com progresso.
  - `app/academy/[course]/page.tsx`: Módulos do curso com lock progressivo.
  - `app/lesson/[id]/page.tsx`: Página da aula com vídeo, conteúdo e anexos.
- Gating e Assinatura:
  - Usuário não assinante vê um banner com benefícios e CTA "Assinar".
  - Assinantes veem módulos com `progress bar` e ícones de concluído.
- Aula:
  - Player 16:9 responsivo com controles simples.
  - Botão "Marcar como concluída" atualiza `progress` e libera a próxima aula.
  - Área de anexos com lista de downloads (PDFs, planilhas, checklists).
- UI/UX:
  - Gamificação leve: badges ao concluir módulos.
  - Navegação "Continuar de onde parei" em destaque.
  - Foco em legibilidade: tipografia Inter/Roboto, espaçamento generoso.

### 16.4 Personalização Visual

- Paleta e Tokens:
  - Primária Azul (`#007AFF`), Secundária Laranja (`#FF9500`).
  - Secundárias: Cinza escuro (`#1F2937`) e Branco (`#FFFFFF`).
  - Definir tokens no CSS/Tailwind (ex.: `--color-primary`, `--color-secondary`).
- Temas:
  - Toggle de tema (dark/light) persistido por usuário.
  - Garantir contraste AA/AAA nos principais elementos.
- Componentes:
  - Botões sólidos (Azul) e contornos (Laranja) para ações secundárias.
  - Cards com bordas sutis e sombras leves.
  - Estados focados e `hover` consistentes.

### 16.5 Painel de Administração Master

- Navegação:
  - Sidebar com seções: Usuários, Produtos, Pedidos Loja, Cursos, Módulos, Aulas, Documentações, Temas.
  - Breadcrumbs e busca global.
- CRUDs:
  - Tabelas com filtros e paginação.
  - Edição inline e modais para criação.
  - Upload de imagens com preview e validação.
- Fluxos:
  - Publicar/Despublicar cursos e produtos.
  - Liberação de módulos por turma/usuário.
  - Exportação CSV/XLS de pedidos e assinaturas.
- UI/UX:
  - Densidade adequada para admin (linhas compactas).
  - Confirmações para ações destrutivas; feedback claro de sucesso/erro.

### 16.6 Pagamentos e Assinaturas (UI)

- Página de Preços:
  - Cards de planos com benefícios, preço, CTA.
  - Perguntas frequentes (FAQ) e garantias.
- Checkout:
  - Seleção de método (Pix/Cartão), status em tempo real.
  - Mensagens de sucesso e falha; reintentar pagamento.
- Pós-pagamento:
  - Atualizar `subscriptions.status` e redirecionar para Academy.
  - E-mail/WhatsApp com recibo e orientações.
 - Pré-requisito de acesso:
   - Exigir cadastro completo com CNPJ (se Brasil) e telefone validado antes de permitir assinatura ou acesso aos cursos/pedidos.

### 16.7 Consistência e Navegação

- Header global com logo, links e status de login.
- Breadcrumbs em páginas internas.
- Componentes reutilizáveis (inputs, tabelas, cards, toasts, modals).
- Documentar padrões de espaçamento e tipografia.
