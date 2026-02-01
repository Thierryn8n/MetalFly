# Análise do Banco de Dados e Modelagem

Este documento detalha a estrutura do banco de dados, os relacionamentos entre as entidades e as adaptações necessárias para suportar as funcionalidades de recomendação e integração entre calculadora, cursos e e-commerce.

## 1. Estrutura Atual e Relacionamentos

### 1.1. Módulo Academy (Cursos)

A estrutura de cursos segue uma hierarquia padrão de plataforma de ensino (LMS).

*   **Tabelas Principais:**
    *   `courses` (Cursos): Tabela raiz.
        *   `id`: UUID (PK)
        *   `title`: Título do curso
        *   `required_subscription`: Nível de acesso ('free', 'basic', 'pro')
    *   `modules` (Módulos): Agrupadores de aulas.
        *   `course_id`: FK para `courses`
    *   `lessons` (Aulas): Conteúdo final (vídeo).
        *   `module_id`: FK para `modules`
        *   `video_url`: URL do vídeo (YouTube/Vimeo/Storage)
    *   `course_enrollments` (Matrículas): Relaciona usuários a cursos.
        *   `user_id`: FK para `profiles`
        *   `course_id`: FK para `courses`
    *   `progress` (Progresso): Rastreia aulas assistidas.
        *   `user_id`: FK para `profiles`
        *   `lesson_id`: FK para `lessons`

*   **Relacionamentos:**
    *   `courses` 1:N `modules` 1:N `lessons`
    *   `profiles` N:N `courses` (via `course_enrollments`)
    *   `profiles` N:N `lessons` (via `progress`)

### 1.2. Módulo E-commerce (Loja)

O e-commerce gerencia produtos, estoque e carrinho de compras.

*   **Tabelas Principais:**
    *   `products` (Produtos): Itens vendíveis.
        *   `id`: UUID (PK)
        *   `name`: Nome do produto
        *   `category`: Categoria ('laminas', 'motores', 'acessorios', etc.)
        *   `price`: Preço unitário
        *   `stock_quantity`: Estoque atual
    *   `product_categories` (Categorias): (Opcional, visto no código da loja, mas `products` tem coluna `category` texto no schema inicial. O código da loja usa `category_id` FK, sugerindo uma normalização que deve ser respeitada).
    *   `cart_items` (Carrinho): Itens no carrinho do usuário.
        *   `user_id`: FK para `profiles`
        *   `product_id`: FK para `products`
        *   `quantity`: Quantidade

*   **Relacionamentos:**
    *   `products` N:1 `product_categories` (se tabela existir) ou campo ENUM.
    *   `profiles` 1:N `cart_items` N:1 `products`

### 1.3. Módulo Calculadora (Orçamentos)

A calculadora usa configurações personalizadas do usuário e dados de referência de produtos.

*   **Tabelas Principais:**
    *   `pricing_configs`: Configurações de margem e custo do usuário.
        *   `user_id`: FK para `profiles`
    *   `motor_models`: Dados técnicos de motores para cálculo.
        *   `weight_min_kg`, `weight_max_kg`: Faixa de operação.
    *   `products`: Usada para buscar preços atuais de insumos.

## 2. Adaptações e Requisitos para Novas Funcionalidades

### 2.1. Recomendação Baseada em Orçamento

Para implementar a recomendação automática ("Se o portão pesa X kg, recomende o Motor Y"), precisamos mapear o resultado do cálculo aos produtos da loja.

*   **Lógica de Mapeamento:**
    *   **Motores:** A tabela `motor_models` é usada para o cálculo técnico. Para vender, precisamos garantir que cada `motor_model` tenha um correspondente na tabela `products` ou que `motor_models` seja fundida/vinculada a `products`.
        *   *Recomendação:* Adicionar uma coluna `product_id` em `motor_models` que aponte para a tabela `products`. Isso permite que, ao selecionar o motor técnico, o sistema saiba qual produto adicionar ao carrinho.
    *   **Lâminas/Perfis:** O cálculo gera uma área (m²). O produto é vendido por metro ou barra.
        *   *Recomendação:* Criar uma lógica de conversão (Ex: Área * Fator de Perda = Qtd de Lâminas) no frontend e buscar produtos da categoria 'laminas'.

### 2.2. Fluxo "Vídeo Gratuito -> Assinatura"

*   Não requer alteração estrutural no banco.
*   Utilizará a tabela `courses` para buscar um curso relacionado (ex: "Curso de Montagem de Portão Basculante").
*   O frontend deve filtrar aulas marcadas como "amostra" ou simplesmente exibir vídeos hardcoded/promocionais se não houver flag específica no banco ainda.
*   *Sugestão:* Adicionar flag `is_preview` na tabela `lessons` futuramente para gerenciar quais vídeos são gratuitos dinamicamente.

### 2.3. Integração Calculadora -> Carrinho

*   O fluxo será totalmente no frontend:
    1.  Calculadora define os itens necessários.
    2.  Usuário confirma seleção.
    3.  Sistema chama endpoint/função Supabase para inserir em `cart_items`.
    4.  Redirecionamento para `/dashboard/store/cart`.

## 3. Estrutura de Dados para o Componente de Recomendação

O componente de recomendação (Slide-up) receberá um objeto JSON estruturado:

```json
{
  "recommendations": [
    {
      "type": "motor",
      "reason": "Ideal para portão de 350kg",
      "product": { ...dados_do_produto_da_tabela_products }
    },
    {
      "type": "accessory",
      "reason": "Kit de instalação padrão",
      "product": { ...dados_do_produto_da_tabela_products }
    }
  ]
}
```

Esta estrutura desacopla a lógica de cálculo da lógica de apresentação e venda.
