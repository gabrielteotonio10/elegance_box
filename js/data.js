/* ==========================================================================
   DATA.JS
   Fonte única de verdade dos dados de produtos, combos, descontos e canais
   de contato do site. Nenhuma página deve escrever preço/descrição de
   produto diretamente no HTML — tanto a Home (destaques) quanto o
   Cardápio (grid completo + combos) leem estes mesmos objetos, para que
   uma alteração de preço precise ser feita em UM lugar só.

   Este arquivo só declara dados (nenhuma manipulação de DOM acontece
   aqui) e deve ser carregado ANTES de main.js/home.js/cardapio.js no
   <script> de cada página HTML.
   ========================================================================== */

// Cria (ou reaproveita, se já existir) o namespace global "EB" (Elegance
// Box), usado por todos os arquivos .js do projeto para evitar poluir o
// escopo global com dezenas de variáveis soltas (window.PRODUCTS,
// window.formatPrice, etc.). Cada arquivo só acrescenta uma propriedade
// nova a este mesmo objeto.
window.EB = window.EB || {};

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONTATO
     Números/handles de contato usados em todos os botões "Peça agora",
     "Pedir agora via WhatsApp", ícones do header/footer, etc.
     ------------------------------------------------------------------ */
  const WHATSAPP_NUMBER = "5531992990564"; // formato internacional (DDI+DDD+número), exigido pelo link wa.me
  const WHATSAPP_DISPLAY = "(31) 99299-0564"; // formato exibido para humanos nos cards/footer
  const INSTAGRAM_HANDLE = "@eboxcestas";
  const INSTAGRAM_URL =
    "https://www.instagram.com/eboxcestas?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==&igsi=ZDNlZDc0MzIxNw==";

  /* ------------------------------------------------------------------
     PRODUTOS
     Cada marmita do cardápio. Campos:
       id           — identificador único, usado para relacionar produtos
                      dentro dos combos (combo.items) e para abrir o modal
                      de detalhes correto a partir de um clique.
       category     — array de tags usadas pelo filtro do Cardápio (uma
                      marmita pode responder a mais de um filtro, ex: uma
                      marmita de frango que também é "mais vendida").
       badge        — selo mostrado sobre a foto do card ({label, variant}).
                      variant corresponde a uma classe .badge--* do CSS.
       featured     — true para os produtos exibidos em destaque na Home.
       nutrition    — tabela nutricional do modal de detalhes. Campos nulos
                      indicam valor NÃO confirmado pelo cliente: o modal
                      exibe um traço ("—") em vez de um número inventado
                      (só a marmita "frango-fit-classico" tem a tabela
                      completa, retirada diretamente do Figma).
       ingredients  — para "frango-fit-classico", veio pronta do Figma; nas
                      demais, foi derivada reformatando a própria descrição
                      de cada prato (sem inventar nenhum ingrediente novo),
                      então vale confirmar com o cliente antes de publicar.
       preparo      — instrução de preparo. O tempo "5 a 7 minutos" veio do
                      Figma para o Frango Fit Clássico; como o tamanho da
                      embalagem é o mesmo para toda a linha, reaplicamos a
                      mesma faixa como estimativa inicial nos demais pratos
                      (ajustável facilmente aqui caso o tempo real varie).
       conservacao  — igual para todos os produtos por ser um padrão do
                      processo de congelamento da empresa, não um dado
                      específico de cada prato.
     ------------------------------------------------------------------ */
  const PRODUCTS = [
    {
      id: "frango-fit-classico",
      name: "Frango Fit Clássico",
      category: ["frango", "mais-vendidas"],
      badge: { label: "Mais vendida", variant: "accent" },
      featured: true,
      description:
        "Peito de frango grelhado ao limão e ervas finas, arroz integral soltinho, feijão caseiro e mix de legumes frescos cozidos no vapor.",
      weight: "400g",
      kcal: 380,
      price: 21.9,
      imageLabel: "Foto: Frango Fit Clássico",
      ingredients:
        "Peito de frango, arroz integral, feijão carioca, abóbora cabotiá, brócolis, cenoura, azeite extra virgem, alho, ervas finas, sal marinho.",
      nutrition: {
        portion: "400g",
        kcal: 380,
        carbs: "28g",
        protein: "32g",
        totalFat: "6.5g",
        satFat: null,
        fiber: null,
        sodium: "140mg",
      },
      preparo: "5 a 7 minutos no micro-ondas.",
      conservacao: "Freezer a -18°C (validade de 6 meses).",
    },
    {
      id: "almondegas-molho-rustico",
      name: "Almôndegas ao Molho Rústico",
      category: ["carnes", "novidades"],
      badge: { label: "Novidade", variant: "primary" },
      featured: true,
      description:
        "Almôndegas de patinho artesanais ao molho de tomates frescos, acompanhado de arroz integral e purê de abóbora cabotiá.",
      weight: "420g",
      kcal: 420,
      price: 24.9,
      imageLabel: "Foto: Almôndegas ao Molho Rústico",
      ingredients: "Almôndegas de patinho, molho de tomates frescos, arroz integral, purê de abóbora cabotiá, temperos e ervas.",
      nutrition: {
        portion: "420g",
        kcal: 420,
        carbs: null,
        protein: null,
        totalFat: null,
        satFat: null,
        fiber: null,
        sodium: null,
      },
      preparo: "5 a 7 minutos no micro-ondas.",
      conservacao: "Freezer a -18°C (validade de 6 meses).",
    },
    {
      id: "strogonoff-cogumelos",
      name: "Strogonoff de Cogumelos",
      category: ["vegetarianas"],
      badge: { label: "Opção Vegana", variant: "soft" },
      featured: true,
      description:
        "Mix de cogumelos frescos ao creme vegetal leve, arroz integral com grãos selecionados e batata doce rústica assada.",
      weight: "380g",
      kcal: 340,
      price: 23.9,
      imageLabel: "Foto: Strogonoff de Cogumelos",
      ingredients: "Mix de cogumelos frescos, creme vegetal leve, arroz integral com grãos selecionados, batata doce assada.",
      nutrition: {
        portion: "380g",
        kcal: 340,
        carbs: null,
        protein: null,
        totalFat: null,
        satFat: null,
        fiber: null,
        sodium: null,
      },
      preparo: "5 a 7 minutos no micro-ondas.",
      conservacao: "Freezer a -18°C (validade de 6 meses).",
    },
    {
      id: "escondidinho-carne-seca",
      name: "Escondidinho de Carne Seca",
      category: ["carnes"],
      badge: { label: "Favorito do Chef", variant: "primary" },
      featured: false,
      description:
        "Carne seca desfiada e temperada, sob uma camada cremosa de purê de mandioca gratinado com queijo coalho.",
      weight: "400g",
      kcal: 460,
      price: 25.9,
      imageLabel: "Foto: Escondidinho de Carne Seca",
      ingredients: "Carne seca desfiada, purê de mandioca, queijo coalho gratinado, temperos.",
      nutrition: {
        portion: "400g",
        kcal: 460,
        carbs: null,
        protein: null,
        totalFat: null,
        satFat: null,
        fiber: null,
        sodium: null,
      },
      preparo: "5 a 7 minutos no micro-ondas.",
      conservacao: "Freezer a -18°C (validade de 6 meses).",
    },
    {
      id: "salmao-crosta-ervas",
      name: "Salmão com Crosta de Ervas",
      category: ["peixes"],
      badge: { label: "Premium", variant: "accent" },
      featured: false,
      description: "Filé de salmão grelhado com crosta aromática de ervas finas, arroz de brócolis e purê de batata baroa.",
      weight: "350g",
      kcal: 410,
      price: 29.9,
      imageLabel: "Foto: Salmão com Crosta de Ervas",
      ingredients: "Filé de salmão, crosta de ervas finas, arroz com brócolis, purê de batata baroa.",
      nutrition: {
        portion: "350g",
        kcal: 410,
        carbs: null,
        protein: null,
        totalFat: null,
        satFat: null,
        fiber: null,
        sodium: null,
      },
      preparo: "5 a 7 minutos no micro-ondas.",
      conservacao: "Freezer a -18°C (validade de 6 meses).",
    },
    {
      id: "lasanha-berinjela-light",
      name: "Lasanha de Berinjela Light",
      category: ["vegetarianas"],
      badge: { label: "Baixo Carbo", variant: "soft" },
      featured: false,
      description: "Fatias de berinjela grelhada intercaladas com molho bolonhesa artesanal e muçarela light, finalizado com parmesão.",
      weight: "400g",
      kcal: 310,
      price: 22.9,
      imageLabel: "Foto: Lasanha de Berinjela Light",
      ingredients: "Berinjela grelhada, molho bolonhesa artesanal, muçarela light, parmesão.",
      nutrition: {
        portion: "400g",
        kcal: 310,
        carbs: null,
        protein: null,
        totalFat: null,
        satFat: null,
        fiber: null,
        sodium: null,
      },
      preparo: "5 a 7 minutos no micro-ondas.",
      conservacao: "Freezer a -18°C (validade de 6 meses).",
    },
  ];

  /* ------------------------------------------------------------------
     COMBOS PRONTOS
     items: lista de { productId, qty } que referencia PRODUCTS por id —
     o preço/nome de cada item é sempre lido de PRODUCTS na hora de
     renderizar, nunca duplicado aqui, para não haver risco de os dois
     números ficarem dessincronizados.
     originalPrice / finalPrice vêm do Figma (já conferi que batem com a
     soma dos itens x quantidade); "savings" é o texto pronto mostrado no
     card.
     ------------------------------------------------------------------ */
  const COMBOS = [
    {
      id: "combo-semanal-equilibrio",
      name: "Combo Semanal Equilíbrio",
      badge: { label: "12% OFF", variant: "accent" },
      description: "5 refeições variadas ideais para almoços práticos e saudáveis de segunda a sexta.",
      imageLabel: "Foto: Combo Semanal Equilíbrio",
      items: [
        { productId: "frango-fit-classico", qty: 1 },
        { productId: "almondegas-molho-rustico", qty: 1 },
        { productId: "escondidinho-carne-seca", qty: 1 },
        { productId: "strogonoff-cogumelos", qty: 1 },
        { productId: "lasanha-berinjela-light", qty: 1 },
      ],
      originalPrice: 119.5,
      finalPrice: 104.9,
      savingsLabel: "Você economiza R$ 14,60",
    },
    {
      id: "combo-super-proteico",
      name: "Combo Super Proteico",
      badge: { label: "R$ 24,40 de desconto", variant: "accent" },
      description: "7 refeições focadas em ganho de massa, com porções extras de frango, carne e peixe.",
      imageLabel: "Foto: Combo Super Proteico",
      items: [
        { productId: "frango-fit-classico", qty: 3 },
        { productId: "almondegas-molho-rustico", qty: 2 },
        { productId: "salmao-crosta-ervas", qty: 2 },
      ],
      originalPrice: 174.3,
      finalPrice: 149.9,
      savingsLabel: "Você economiza R$ 24,40",
    },
    {
      id: "combo-veggie-nutri",
      name: "Combo Veggie Nutri",
      badge: { label: "15% OFF", variant: "accent" },
      description: "6 refeições 100% plant based cheias de sabor e nutrientes para toda a sua semana.",
      imageLabel: "Foto: Combo Veggie Nutri",
      items: [
        { productId: "strogonoff-cogumelos", qty: 3 },
        { productId: "lasanha-berinjela-light", qty: 3 },
      ],
      originalPrice: 140.4,
      finalPrice: 119.9,
      savingsLabel: "Você economiza R$ 20,50",
    },
  ];

  /* ------------------------------------------------------------------
     DESCONTO PROGRESSIVO DO "MONTE SEU COMBO"
     Cada faixa define quanto desconto (percent, de 0 a 1) o cliente
     recebe sobre o subtotal, de acordo com o total de marmitas
     escolhidas. A faixa "6 a 8 marmitas = 15%" é o único ponto de dado
     confirmado no Figma (protótipo mostra 2+3+1=6 marmitas, subtotal
     R$141,40, desconto de 15% = R$21,21, total R$120,19 — todos os
     valores batem exatamente com PRODUCTS acima). As demais faixas foram
     desenhadas para criar um incentivo progressivo coerente com esse
     ponto; ajuste aqui caso o cliente defina uma régua de desconto
     diferente.
     ------------------------------------------------------------------ */
  const DISCOUNT_TIERS = [
    { min: 1, max: 3, percent: 0 },
    { min: 4, max: 5, percent: 0.1 },
    { min: 6, max: 8, percent: 0.15 },
    { min: 9, max: Infinity, percent: 0.2 },
  ];

  // Publica os dados no namespace global para os demais arquivos .js
  // (main.js, home.js, cardapio.js) lerem via EB.data.*.
  window.EB.data = {
    WHATSAPP_NUMBER,
    WHATSAPP_DISPLAY,
    INSTAGRAM_HANDLE,
    INSTAGRAM_URL,
    PRODUCTS,
    COMBOS,
    DISCOUNT_TIERS,
  };
})();
