/* Fonte única de dados do site: contato, produtos, combos prontos e as
   faixas de desconto. Lido pelos demais scripts via EB.data.* */

window.EB = window.EB || {};

(function () {
  "use strict";

  /* CONTATO */
  const WHATSAPP_NUMBER = "5531992990564"; // formato internacional, exigido pelo wa.me
  const WHATSAPP_DISPLAY = "(31) 99299-0564";
  const INSTAGRAM_HANDLE = "@eboxcestas";
  const INSTAGRAM_URL =
    "https://www.instagram.com/eboxcestas?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==&igsi=ZDNlZDc0MzIxNw==";

  /* PRODUTOS */
  const PRODUCTS = [
    {
      id: "nhoque-a-bolonhesa",
      name: "Nhoque à Bolonhesa",
      category: ["massas"],
      badge: { label: "Massa", variant: "accent" },
      featured: true,
      description:
        "Delicioso nhoque de massa artesanal servido com molhos à bolonhesa e de queijo, finalizado com queijo mussarela.",
      weight: "450g",
      price: 21.99,
      image: "img/nhoque_abolonhesa.jpg",
      imageLabel: "Foto: Nhoque à Bolonhesa",
      ingredients:
        "Massa artesanal, molho à bolonhesa, molho de queijo e mussarela.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    {
      id: "escondidinho-carne-moida",
      name: "Escondidinho de Carne Moída",
      category: ["carnes"],
      badge: { label: "Carnes", variant: "accent" },
      featured: true,
      description:
        "Escondidinho de carne moída com azeitonas e requeijão, coberto com purê de batatas e queijo mussarela gratinado.",
      weight: "450g",
      price: 21.99,
      image: "img/escondidinho_carne_moida.jpg",
      imageLabel: "Foto: Escondidinho de Carne Moída",
      ingredients:
        "Carne moída, azeitonas, requeijão, cebola, alho, tomate, purê de batatas com manteiga e creme de leite, mussarela.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    {
      id: "bobo-de-camarao",
      name: "Bobó de Camarão",
      category: ["peixes"],
      badge: { label: "peixes", variant: "accent" },
      featured: true,
      description:
        "Delicioso bobó de camarão feito com creme de mandioca, azeite de dendê, leite de coco e um toque de coentro.",
      weight: "450g",
      price: 31.99,
      image: "img/bobo_camarao.jpg",
      imageLabel: "Foto: Bobó de Camarão",
      ingredients:
        "Mandioca, azeite de dendê, cebola, alho, camarão para molho, camarão médio, leite de coco e coentro.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    {
      id: "escondidinho-frango-com-palmito",
      name: "Escondidinho de Frango com Palmito",
      category: ["frango"],
      badge: { label: "Frango", variant: "accent" },
      featured: true,
      description:
        "Escondidinho de frango desfiado com palmito e requeijão, coberto com purê de batatas e queijo mussarela.",
      weight: "450g",
      price: 21.99,
      image: "img/escondidinho_frango_palmito.jpg",
      imageLabel: "Foto: Escondidinho de Frango com Palmito",
      ingredients:
        "Frango desfiado, palmito, requeijão, cebola, alho, tomate, purê de batatas com manteiga e creme de leite, mussarela.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    {
      id: "parmegiana-de-frango",
      name: "Parmegiana de Frango",
      category: ["frango"],
      badge: { label: "Frango", variant: "accent" },
      featured: true,
      description:
        "Suculento filé de peito de frango empanado, coberto com molho ao sugo artesanal, presunto e mussarela, acompanhado de um cremoso purê de batatas.",
      weight: "500g",
      price: 26.99,
      image: "img/parmegiana_frango.jpg",
      imageLabel: "Foto: Parmegiana de Frango",
      ingredients:
        "Filé de peito frango empanado, molho ao sugo artesanal, presunto, mussarela e purê de batatas com manteiga e creme de leite.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    {
      id: "panqueca-de-frango",
      name: "Panqueca de Frango",
      category: ["frango"],
      badge: { label: "Frango", variant: "accent" },
      featured: true,
      description:
        "Panqueca de massa artesanal recheada com frango desfiado e requeijão, coberta com molho bechamel e mussarela ralada.",
      weight: "500g",
      price: 26.99,
      image: "img/panqueca_frango.jpg",
      imageLabel: "Foto: Panqueca de Frango",
      ingredients:
        "Massa artesanal, fatia de mussarela, frango desfiado, requeijão, molho bechamel e mussarela ralada.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    {
      id: "lasanha-a-bolonhesa",
      name: "Lasanha à Bolonhesa",
      category: ["massas", "carnes"],
      badge: { label: "Massas", variant: "accent" },
      featured: true,
      description:
        "Tradicional lasanha à bolonhesa com molho de carne e queijo artesanais, presunto e queijo mussarela.",
      weight: "450g",
      price: 21.99,
      image: "img/lasanha_abolonhesa.jpg",
      imageLabel: "Foto: Lasanha à Bolonhesa",
      ingredients:
        "Massa, molho à bolonhesa artesanal, molho de queijo artesanal, presunto e mussarela.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    {
      id: "panqueca-de-carne",
      name: "Panqueca de Carne",
      category: ["carnes"],
      badge: { label: "Carnes", variant: "accent" },
      featured: true,
      description:
        "Panqueca de massa artesanal recheada com carne moída, azeitonas e requeijão, coberta com molho ao sugo caseiro e mussarela ralada.",
      weight: "500g",
      price: 26.99,
      image: "img/panqueca_carne.jpg",
      imageLabel: "Foto: Panqueca de Carne",
      ingredients:
        "Massa artesanal, fatia de mussarela, carne moída, azeitonas, requeijão, molho ao sugo caseiro e mussarela ralada.",
      preparo: "6 a 8 minutos no micro-ondas.",
      conservacao: "No freezer tem validade de 6 meses.",
    },
    /* FRIOS E ANTEPASTOS — "price: null" é o sinal usado em todo o site
       para trocar o preço por "sob consulta"; "image" omitido cai no
       placeholder até chegarem as fotos reais. */
    {
      id: "tabua-de-frios-premium",
      name: "Tábua de Frios Premium",
      category: ["frios-antepastos"],
      badge: { label: "Sob consulta", variant: "soft" },
      featured: true,
      description:
        "Seleção de queijos e frios nobres, azeitonas e geleia artesanal — ideal para receber com elegância ou presentear.",
      weight: "Tamanho sob consulta",
      price: null,
      imageLabel: "Foto: Tábua de Frios Premium",
      ingredients:
        "Queijos e frios selecionados, azeitonas, geleia artesanal e torradas.",
      preparo: "Sirva gelada, direto da geladeira.",
      conservacao: "Consumir em até 3 dias após a entrega, mantida refrigerada.",
    },
    {
      id: "antepasto-mediterraneo",
      name: "Antepasto Mediterrâneo",
      category: ["frios-antepastos"],
      badge: { label: "Sob consulta", variant: "soft" },
      featured: true,
      description:
        "Legumes marinados, azeitonas, queijo feta e ervas frescas — um antepasto leve para começar bem qualquer ocasião.",
      weight: "Tamanho sob consulta",
      price: null,
      imageLabel: "Foto: Antepasto Mediterrâneo",
      ingredients:
        "Legumes marinados, azeitonas, queijo feta, azeite extra virgem e ervas frescas.",
      preparo: "Sirva gelado, direto da geladeira.",
      conservacao: "Consumir em até 3 dias após a entrega, mantido refrigerado.",
    },
  ];

  /* COMBOS PRONTOS — os preços são a soma real dos itens já com o
     desconto do "monte seu combo", para o builder nunca dar um valor
     diferente do anunciado aqui. Mexeu nos itens? Recalcule à mão. */
  const COMBOS = [
    {
      id: "combo-carne-frango",
      name: "Combo: Carne + Frango",
      badge: { label: "4% OFF", variant: "accent" },
      description:
        "5 refeições com carne e frango para almoços práticos de segunda a sexta.",
      items: [
        { productId: "parmegiana-de-frango", qty: 1 },
        { productId: "escondidinho-carne-moida", qty: 1 },
        { productId: "escondidinho-frango-com-palmito", qty: 1 },
        { productId: "panqueca-de-frango", qty: 1 },
        { productId: "panqueca-de-carne", qty: 1 },
      ],
      originalPrice: 124.95,
      finalPrice: 119.95,
      savingsLabel: "Você economiza R$ 5,00",
    },
    {
      id: "combo-massas-e-peixes",
      name: "Combo: Massas e Bobo",
      badge: { label: "R$ 6,96 de desconto", variant: "accent" },
      description:
        "7 refeições robustas, com porções extras de nhoque, bobo de camarão e lasanha.",
      items: [
        { productId: "bobo-de-camarao", qty: 2 },
        { productId: "nhoque-a-bolonhesa", qty: 2 },
        { productId: "lasanha-a-bolonhesa", qty: 3 },
      ],
      originalPrice: 173.93,
      finalPrice: 166.97,
      savingsLabel: "Você economiza R$ 6,96",
    },
    {
      id: "panquecas",
      name: "Combo: Panquecas",
      badge: { label: "4% OFF", variant: "accent" },
      description:
        "6 refeições para quem ama panquecas.",
      items: [
        { productId: "panqueca-de-carne", qty: 3 },
        { productId: "panqueca-de-frango", qty: 3 },
      ],
      originalPrice: 161.94,
      finalPrice: 155.46,
      savingsLabel: "Você economiza R$ 6,48",
    },
  ];

  /* DESCONTOS DO "MONTE SEU COMBO" — cada marmita recebe uma das duas
     regras, nunca as duas: FLAVOR vale para 5+ do mesmo sabor; QUANTITY
     vale para o grupo variado com todo o resto. Ver
     calculateComboDiscount em marmitas.js. */
  const QUANTITY_DISCOUNT_TIERS = [
    { min: 1, max: 4, percent: 0 },
    { min: 5, max: 9, percent: 0.04 },
    { min: 10, max: Infinity, percent: 0.08 },
  ];

  const FLAVOR_DISCOUNT_TIERS = [
    { min: 1, max: 4, percent: 0 },
    { min: 5, max: 9, percent: 0.06 },
    { min: 10, max: Infinity, percent: 0.1 },
  ];

  window.EB.data = {
    WHATSAPP_NUMBER,
    WHATSAPP_DISPLAY,
    INSTAGRAM_HANDLE,
    INSTAGRAM_URL,
    PRODUCTS,
    COMBOS,
    QUANTITY_DISCOUNT_TIERS,
    FLAVOR_DISCOUNT_TIERS,
  };
})();