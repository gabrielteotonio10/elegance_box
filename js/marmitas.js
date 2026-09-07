/* ==========================================================================
   MARMITAS.JS
   Lógica específica da página Marmitas (marmitas.html):
     1) grid de produtos com filtro por categoria (só marmitas — Frios e
        Antepastos tem página própria, ver frios.js);
     2) grid de combos prontos + card "monte seu combo";
     3) modal de detalhes da marmita;
     4) modal de detalhes do combo (com navegação para o modal de produto);
     5) modal "Monte seu combo", com seletor de quantidade por marmita e
        cálculo em tempo real dos dois descontos que se acumulam
        (por sabor repetido + por quantidade total — ver
        calculateComboDiscount).

   Depende de data.js e main.js já terem sido carregados antes.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /* ======================================================================
     ÍCONES REAPROVEITADOS NOS TEMPLATES GERADOS VIA JS
     Guardados como texto (string de SVG) porque, ao contrário dos ícones
     escritos direto no HTML, estes são inseridos dentro de innerHTML
     montado dinamicamente pelas funções abaixo.
     ====================================================================== */
  const ICONS = {
    plus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    minus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  };

  /* ======================================================================
     ELEMENTOS DO DOM usados em várias funções abaixo — buscados uma única
     vez aqui em vez de repetir document.getElementById em cada função.
     ====================================================================== */
  const filterBar = document.getElementById("filterBar");
  const productsGrid = document.getElementById("productsGrid");
  const combosGrid = document.getElementById("combosGrid");

  const productModalOverlay = document.getElementById("productModal");
  const productModalBody = document.getElementById("productModalBody");

  const comboModalOverlay = document.getElementById("comboModal");
  const comboModalBody = document.getElementById("comboModalBody");

  const builderModalOverlay = document.getElementById("builderModal");
  const builderDiscountTiersList = document.getElementById("builderDiscountTiers");
  const builderTopTotalValue = document.getElementById("builderTopTotalValue");
  const builderProductList = document.getElementById("builderProductList");
  const builderSummaryItems = document.getElementById("builderSummaryItems");
  const builderSummaryEmpty = document.getElementById("builderSummaryEmpty");
  const builderSummaryTotals = document.getElementById("builderSummaryTotals");
  const builderSavingsRow = document.getElementById("builderSavingsRow");
  const builderSendOrderBtn = document.getElementById("builderSendOrderBtn");

  /* ======================================================================
     HELPERS DE BUSCA
     Os combos guardam apenas o "id" de cada marmita (ver data.js); estas
     funções resolvem o id para o objeto completo do produto/combo sempre
     que uma função de renderização precisa do nome/preço/foto reais.
     ====================================================================== */
  function findProductById(id) {
    return EB.data.PRODUCTS.find(function (product) {
      return product.id === id;
    });
  }

  function findComboById(id) {
    return EB.data.COMBOS.find(function (combo) {
      return combo.id === id;
    });
  }

  // "1 marmita" vs "2 marmitas" — evita o plural incorreto quando o total é 1.
  function pluralizeMarmita(count) {
    return count === 1 ? "marmita" : "marmitas";
  }

  /* ======================================================================
     1) GRID DE PRODUTOS + FILTROS
     ====================================================================== */

  /**
   * Redesenha o grid de produtos de acordo com o filtro selecionado.
   * "todas" mostra tudo; qualquer outro valor mostra só os produtos cujo
   * array `category` (definido em data.js) contém aquela tag.
   */
  function renderProductsGrid(filterTag) {
    productsGrid.innerHTML = "";

    // Frios e Antepastos têm página própria (frios-antepastos.html) —
    // nunca aparecem aqui, nem com o filtro "todas".
    const marmitaProducts = EB.data.PRODUCTS.filter(function (product) {
      return product.category.indexOf("frios-antepastos") === -1;
    });

    const filteredProducts =
      filterTag === "todas"
        ? marmitaProducts
        : marmitaProducts.filter(function (product) {
            return product.category.indexOf(filterTag) !== -1;
          });

    filteredProducts.forEach(function (product) {
      // Sem a opção detailsAsLink: aqui "Ver mais" vira um <button> que
      // abre o modal de detalhes via JS (ver delegação de clique abaixo),
      // diferente da Home, que linka direto para esta página.
      productsGrid.appendChild(EB.components.createProductCard(product));
    });
  }

  // Clique em qualquer chip do filtro: activa aquele chip (via
  // aria-pressed, que já é o que o CSS usa para o estilo "ativo") e
  // desativa todos os outros, então redesenha o grid.
  filterBar.addEventListener("click", function (event) {
    const chip = event.target.closest(".filter-chip");
    if (!chip) {
      return;
    }

    filterBar.querySelectorAll(".filter-chip").forEach(function (otherChip) {
      otherChip.setAttribute("aria-pressed", "false");
    });
    chip.setAttribute("aria-pressed", "true");

    renderProductsGrid(chip.dataset.filter);
  });

  // Delegação de clique no grid inteiro (em vez de um listener por card):
  // como os cards são recriados a cada troca de filtro, um listener fixo
  // no container pai continua funcionando mesmo depois do grid ser
  // redesenhado, sem precisar religar eventos toda vez.
  productsGrid.addEventListener("click", function (event) {
    const detailsBtn = event.target.closest('[data-action="open-product"]');
    if (detailsBtn) {
      openProductModal(detailsBtn.dataset.productId, {}, detailsBtn);
    }
  });

  /* ======================================================================
     2) GRID DE COMBOS
     ====================================================================== */

  /**
   * Cria o card de UM combo pronto. Ao contrário do product-card (que
   * mora em main.js por ser usado em 2 páginas), este componente só
   * existe no Cardápio, então fica local a este arquivo.
   */
  function createComboCard(combo) {
    const article = document.createElement("article");
    article.className = "combo-card";

    const totalMarmitas = combo.items.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);

    const itemsListHtml = combo.items
      .map(function (item) {
        const product = findProductById(item.productId);
        return "<li>" + item.qty + "x " + product.name + "</li>";
      })
      .join("");

    article.innerHTML =
      '<div class="combo-card__body">' +
      '<span class="badge badge--' +
      combo.badge.variant +
      ' combo-card__badge">' +
      combo.badge.label +
      "</span>" +
      '<div class="combo-card__title-row">' +
      '<h3 class="combo-card__name">' +
      combo.name +
      "</h3>" +
      '<span class="combo-card__count">' +
      totalMarmitas +
      " " +
      pluralizeMarmita(totalMarmitas) +
      "</span>" +
      "</div>" +
      '<p class="combo-card__description">' +
      combo.description +
      "</p>" +
      '<ul class="combo-card__items">' +
      itemsListHtml +
      "</ul>" +
      '<div class="combo-card__footer">' +
      '<div class="price"><span class="price__old">' +
      EB.utils.formatPrice(combo.originalPrice) +
      '</span><span class="price__value">' +
      EB.utils.formatPrice(combo.finalPrice) +
      "</span></div>" +
      '<p class="combo-card__savings">' +
      combo.savingsLabel +
      "</p>" +
      '<div class="combo-card__actions">' +
      '<a class="btn btn--primary" target="_blank" rel="noopener" href="' +
      EB.utils.buildWhatsAppLink(buildComboWhatsAppMessage(combo)) +
      '">Quero este combo</a>' +
      '<button type="button" class="btn btn--outline" data-action="open-combo" data-combo-id="' +
      combo.id +
      '">Ver itens</button>' +
      "</div>" +
      "</div>" +
      "</div>";

    return article;
  }

  /**
   * Monta a mensagem de WhatsApp para um combo PRONTO: nome do combo,
   * cada marmita com sua quantidade, e o preço final.
   */
  function buildComboWhatsAppMessage(combo) {
    const itemLines = combo.items
      .map(function (item) {
        const product = findProductById(item.productId);
        return item.qty + "x " + product.name;
      })
      .join("\n");

    return "Olá! Gostaria de pedir o " + combo.name + ":\n" + itemLines + "\n\nTotal: " + EB.utils.formatPrice(combo.finalPrice);
  }

  /**
   * Renderiza os 3 combos prontos (a partir de EB.data.COMBOS) e, por
   * último, clona o template do card "Monte seu combo" para dentro do
   * mesmo grid — assim ele sempre aparece como o 4º card, depois dos
   * combos prontos, conforme o briefing (seção 22).
   */
  function renderCombosGrid() {
    EB.data.COMBOS.forEach(function (combo) {
      combosGrid.appendChild(createComboCard(combo));
    });

    const template = document.getElementById("customComboCardTemplate");
    combosGrid.appendChild(template.content.cloneNode(true));
  }

  // Delegação de clique no grid de combos: trata tanto "Ver itens" (abre
  // modal de combo) quanto "Simular preço" do card clonado do template
  // (abre o modal do combo personalizado).
  combosGrid.addEventListener("click", function (event) {
    const comboBtn = event.target.closest('[data-action="open-combo"]');
    if (comboBtn) {
      openComboModal(comboBtn.dataset.comboId, comboBtn);
      return;
    }

    const builderBtn = event.target.closest('[data-action="open-builder"]');
    if (builderBtn) {
      EB.modal.open(builderModalOverlay, builderBtn);
    }
  });

  /* ======================================================================
     3) MODAL: DETALHES DA MARMITA
     ====================================================================== */

  /**
   * Abre o modal de detalhes de UMA marmita. `trigger` é o elemento que
   * disparou a abertura (para o foco voltar a ele ao fechar — ver
   * EB.modal.open em main.js); `options.returnToComboId` é repassado
   * para EB.components.buildProductModalBody (main.js) definir se o
   * botão "Voltar" aparece. A função em si é compartilhada com
   * frios.js — ver o comentário dela em main.js.
   */
  function openProductModal(productId, options, trigger) {
    const product = findProductById(productId);
    productModalBody.innerHTML = EB.components.buildProductModalBody(product, options || {});
    EB.modal.open(productModalOverlay, trigger);
  }

  // Delegação de clique dentro do modal de produto: só existe UM botão
  // que pode aparecer aqui dinamicamente ("Voltar para o combo"), então
  // um único listener no overlay cobre qualquer marmita que for exibida.
  productModalOverlay.addEventListener("click", function (event) {
    const backBtn = event.target.closest('[data-action="back-to-combo"]');
    if (!backBtn) {
      return;
    }
    const comboId = backBtn.dataset.comboId;
    EB.modal.closeInstantly(productModalOverlay);
    openComboModal(comboId);
  });

  /* ======================================================================
     4) MODAL: DETALHES DO COMBO
     ====================================================================== */

  /**
   * Monta o HTML interno do modal de combo: descrição, lista de marmitas
   * incluídas (cada uma clicável) e o resumo de preço/economia.
   */
  function buildComboModalBody(combo) {
    const totalMarmitas = combo.items.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);

    const itemsHtml = combo.items
      .map(function (item) {
        const product = findProductById(item.productId);
        return (
          "<li>" +
          '<button type="button" class="combo-modal__item-btn" data-action="open-product-from-combo" data-product-id="' +
          product.id +
          '" data-combo-id="' +
          combo.id +
          '">' +
          '<img class="media-placeholder media-placeholder--square combo-modal__item-media" src="' +
          product.image +
          '" alt="" aria-hidden="true" loading="lazy" />' +
          '<span class="combo-modal__item-info">' +
          '<span class="combo-modal__item-name">' +
          product.name +
          "</span>" +
          '<span class="combo-modal__item-qty">' +
          item.qty +
          " " +
          (item.qty === 1 ? "unidade" : "unidades") +
          "</span>" +
          "</span>" +
          "</button>" +
          "</li>"
        );
      })
      .join("");

    return (
      '<div class="modal__header">' +
      '<span class="badge badge--' +
      combo.badge.variant +
      '">' +
      combo.badge.label +
      "</span>" +
      '<h2 class="modal__title" id="comboModalTitle">' +
      combo.name +
      "</h2>" +
      '<p class="modal__subtitle">' +
      combo.description +
      "</p>" +
      "</div>" +
      '<ul class="combo-modal__items">' +
      itemsHtml +
      "</ul>" +
      '<div class="combo-modal__footer">' +
      "<div>" +
      '<span class="combo-card__count">' +
      totalMarmitas +
      " " +
      pluralizeMarmita(totalMarmitas) +
      "</span>" +
      '<div class="price"><span class="price__old">' +
      EB.utils.formatPrice(combo.originalPrice) +
      '</span><span class="price__value">' +
      EB.utils.formatPrice(combo.finalPrice) +
      "</span></div>" +
      '<p class="combo-card__savings">' +
      combo.savingsLabel +
      "</p>" +
      "</div>" +
      '<a class="btn btn--primary" target="_blank" rel="noopener" href="' +
      EB.utils.buildWhatsAppLink(buildComboWhatsAppMessage(combo)) +
      '">Pedir este combo via WhatsApp</a>' +
      "</div>"
    );
  }

  function openComboModal(comboId, trigger) {
    const combo = findComboById(comboId);
    comboModalBody.innerHTML = buildComboModalBody(combo);
    EB.modal.open(comboModalOverlay, trigger);
  }

  // Delegação de clique dentro do modal de combo: clicar numa marmita da
  // lista fecha este modal e abre o modal daquela marmita, já com o
  // botão "Voltar" habilitado para retornar a este mesmo combo.
  comboModalOverlay.addEventListener("click", function (event) {
    const itemBtn = event.target.closest('[data-action="open-product-from-combo"]');
    if (!itemBtn) {
      return;
    }
    EB.modal.closeInstantly(comboModalOverlay);
    openProductModal(itemBtn.dataset.productId, { returnToComboId: itemBtn.dataset.comboId });
  });

  /* ======================================================================
     5) MODAL: MONTE SEU COMBO
     ====================================================================== */

  // Estado do combo personalizado: objeto simples { idDoProduto: quantidade }.
  // Existe só em memória (não usa localStorage) — reinicia ao recarregar a
  // página, mas persiste enquanto o usuário navega/fecha e reabre o modal
  // na mesma visita, permitindo o botão "Continuar escolhendo" fazer sentido.
  const cart = {};

  /**
   * Retorna a faixa de desconto de um array de faixas (EB.data.
   * QUANTITY_DISCOUNT_TIERS ou EB.data.FLAVOR_DISCOUNT_TIERS) que se
   * aplica a uma determinada quantidade. Se nenhuma faixa bater (não
   * deveria acontecer, já que a última faixa de cada array vai até
   * Infinity), retorna 0% como segurança.
   */
  function findDiscountTier(tiers, quantity) {
    return (
      tiers.find(function (tier) {
        return quantity >= tier.min && quantity <= tier.max;
      }) || { percent: 0 }
    );
  }

  /**
   * Calcula o preço de um combo (pronto ou personalizado) por "grupos"
   * (buckets), sem misturar o desconto de um grupo com o de outro. Cada
   * marmita do carrinho entra em EXATAMENTE um grupo — nunca nos dois,
   * nunca em nenhum:
   *
   *   1) GRUPOS DE BULK (mesmo sabor) — todo item cuja PRÓPRIA
   *      quantidade já bate uma faixa de EB.data.FLAVOR_DISCOUNT_TIERS
   *      (5-9 unidades = 6%; 10+ = 10%) vira o seu próprio grupo,
   *      descontado sozinho, sobre o subtotal só daquele item.
   *   2) GRUPO VARIADO (leftover) — todo item que NÃO bateu nenhuma
   *      faixa de bulk (menos de 5 unidades) cai neste grupo único,
   *      compartilhado com qualquer outro item também "pequeno demais"
   *      para ter seu próprio grupo. O desconto deste grupo depende da
   *      quantidade TOTAL do grupo (soma de todos os itens que caíram
   *      nele), buscada em EB.data.QUANTITY_DISCOUNT_TIERS (5-9 = 4%;
   *      10+ = 8%) — NUNCA da quantidade total do carrinho inteiro.
   *
   * Isso é diferente de "aplicar desconto por sabor e depois um desconto
   * por quantidade total por cima de tudo": aqui, um item que já virou
   * grupo de bulk (grupo 1) NÃO participa do desconto do grupo variado
   * — os dois descontos nunca se empilham na mesma marmita.
   *
   * Função pura (não lê `cart` nem toca no DOM) de propósito, para poder
   * ser chamada tanto pelo carrinho ao vivo (renderBuilderSummary)
   * quanto, se um dia for preciso, por um script à parte que só recalcule
   * os valores dos combos prontos em EB.data.COMBOS. Nenhum valor é
   * arredondado aqui dentro — os subtotais/totais ficam em ponto
   * flutuante "cru" e só viram centavos na hora de exibir (ver
   * EB.utils.formatPrice), para não acumular erro de arredondamento em
   * cálculos intermediários.
   *
   * @param {Array<{id: string, name: string, price: number, quantity: number}>} cartItems
   * @returns {{
   *   bulkGroups: Array<{id, name, quantity, subtotal, discountPercent, total}>,
   *   leftoverItems: Array<{id, name, price, quantity}>,
   *   leftoverSubtotal: number,
   *   leftoverTotalQty: number,
   *   leftoverDiscountPercent: number,
   *   leftoverTotal: number,
   *   totalQuantity: number,
   *   originalTotal: number,
   *   finalTotal: number,
   *   totalSavings: number
   * }}
   */
  function calculateComboDiscount(cartItems) {
    const bulkGroups = [];
    const leftoverItems = [];

    cartItems.forEach(function (item) {
      const flavorTier = findDiscountTier(EB.data.FLAVOR_DISCOUNT_TIERS, item.quantity);
      if (flavorTier.percent > 0) {
        const subtotal = item.price * item.quantity;
        bulkGroups.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          subtotal: subtotal,
          discountPercent: flavorTier.percent,
          total: subtotal * (1 - flavorTier.percent),
        });
      } else {
        leftoverItems.push(item);
      }
    });

    const leftoverTotalQty = leftoverItems.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
    const leftoverSubtotal = leftoverItems.reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
    const leftoverTier = findDiscountTier(EB.data.QUANTITY_DISCOUNT_TIERS, leftoverTotalQty);
    const leftoverTotal = leftoverSubtotal * (1 - leftoverTier.percent);

    const bulkSubtotal = bulkGroups.reduce(function (sum, group) {
      return sum + group.subtotal;
    }, 0);
    const bulkTotal = bulkGroups.reduce(function (sum, group) {
      return sum + group.total;
    }, 0);

    const totalQuantity = cartItems.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
    const originalTotal = bulkSubtotal + leftoverSubtotal;
    const finalTotal = bulkTotal + leftoverTotal;

    return {
      bulkGroups: bulkGroups,
      leftoverItems: leftoverItems,
      leftoverSubtotal: leftoverSubtotal,
      leftoverTotalQty: leftoverTotalQty,
      leftoverDiscountPercent: leftoverTier.percent,
      leftoverTotal: leftoverTotal,
      totalQuantity: totalQuantity,
      originalTotal: originalTotal,
      // Matematicamente finalTotal nunca fica negativo aqui (todo
      // discountPercent está entre 0 e 1, aplicado sobre subtotais que
      // nunca são negativos) — o Math.max(0, ...) é só uma segunda trava
      // de segurança explícita, caso price/quantity um dia venham
      // inválidos de algum lugar inesperado.
      finalTotal: Math.max(0, finalTotal),
      totalSavings: originalTotal - finalTotal,
    };
  }

  /**
   * Preenche a lista de faixas de desconto acima do builder, lida direto
   * de EB.data.QUANTITY_DISCOUNT_TIERS/FLAVOR_DISCOUNT_TIERS (as faixas
   * de 0% não são exibidas, já que não são um desconto). Roda uma única
   * vez, no carregamento da página — se a régua de desconto mudar em
   * data.js, o texto acompanha automaticamente, sem precisar editar nada
   * aqui.
   */
  function renderDiscountTiersInfo() {
    const quantityBadges = EB.data.QUANTITY_DISCOUNT_TIERS.filter(function (tier) {
      return tier.percent > 0;
    }).map(function (tier) {
      const range = tier.max === Infinity ? tier.min + "+ marmitas" : tier.min + " a " + tier.max + " marmitas";
      return '<li class="badge badge--soft">' + range + " do grupo variado: " + Math.round(tier.percent * 100) + "% OFF</li>";
    });

    const flavorBadges = EB.data.FLAVOR_DISCOUNT_TIERS.filter(function (tier) {
      return tier.percent > 0;
    }).map(function (tier) {
      const range = tier.max === Infinity ? tier.min + "+" : tier.min + " a " + tier.max;
      return '<li class="badge badge--soft">' + range + " do mesmo sabor: " + Math.round(tier.percent * 100) + "% OFF</li>";
    });

    builderDiscountTiersList.innerHTML = quantityBadges.concat(flavorBadges).join("");
  }

  /**
   * Cria a linha (.builder__row) de UMA marmita na coluna esquerda do
   * modal, já com o seletor de quantidade zerado. Chamada uma única vez
   * por produto, na inicialização da página.
   */
  function createBuilderRow(product) {
    const row = document.createElement("div");
    row.className = "builder__row";
    row.dataset.productId = product.id;

    row.innerHTML =
      '<img class="media-placeholder media-placeholder--square builder__row-media" src="' +
      product.image +
      '" alt="" aria-hidden="true" loading="lazy" />' +
      '<div class="builder__row-info">' +
      '<h3 class="builder__row-name">' +
      product.name +
      "</h3>" +
      '<p class="builder__row-description">' +
      product.description +
      "</p>" +
      '<span class="builder__row-price">' +
      EB.utils.formatPrice(product.price) +
      "</span>" +
      "</div>" +
      '<div class="quantity-selector">' +
      '<button type="button" class="quantity-selector__btn" data-action="decrease" aria-label="Diminuir quantidade de ' +
      product.name +
      '" disabled>' +
      ICONS.minus +
      "</button>" +
      '<span class="quantity-selector__value" data-quantity-value>0</span>' +
      '<button type="button" class="quantity-selector__btn" data-action="increase" aria-label="Aumentar quantidade de ' +
      product.name +
      '">' +
      ICONS.plus +
      "</button>" +
      "</div>";

    return row;
  }

  // Preenche a coluna esquerda do modal com uma linha para cada marmita
  // do cardápio. Roda uma única vez, no carregamento da página. Produtos
  // "sob consulta" (price null — ex: Frios e Antepastos) ficam de fora:
  // o desconto progressivo é calculado em cima de um preço por unidade,
  // que esses itens não têm.
  EB.data.PRODUCTS.filter(function (product) {
    return product.price != null;
  }).forEach(function (product) {
    builderProductList.appendChild(createBuilderRow(product));
  });

  /**
   * Atualiza o número exibido e o estado do botão "-" de UMA linha da
   * lista, para refletir a quantidade atual daquele produto no `cart`.
   * Chamada sempre que a quantidade de um produto específico muda.
   */
  function syncBuilderRow(productId) {
    const row = builderProductList.querySelector('.builder__row[data-product-id="' + productId + '"]');
    if (!row) {
      return;
    }
    const quantity = cart[productId] || 0;
    row.querySelector("[data-quantity-value]").textContent = quantity;
    row.querySelector('[data-action="decrease"]').disabled = quantity === 0;
  }

  /**
   * Monta o texto (sem HTML) de UM item do "grupo variado" para a lista
   * do resumo — reaproveitado tanto para o único item (nenhum "Grupo
   * variado" quando só sobrou 1 sabor pequeno, não faz sentido chamar de
   * "variado" um grupo de 1 item só) quanto dentro da lista de nomes do
   * grupo combinado.
   */
  function formatQuantityAndName(item) {
    return item.quantity + "x " + item.name;
  }

  /**
   * Redesenha toda a coluna direita (resumo do combo) a partir do estado
   * atual de `cart`, usando calculateComboDiscount(): um <li> por grupo
   * de bulk (mesmo sabor, 5+ unidades, com seu desconto próprio) e, se
   * houver, um <li> a mais para o grupo variado (todo o resto, com o
   * desconto — se houver — da faixa de EB.data.QUANTITY_DISCOUNT_TIERS
   * que bater a quantidade TOTAL desse grupo). Chamada sempre que uma
   * quantidade muda, para o preço acompanhar o clique em tempo real —
   * por isso é recalculado do zero a cada chamada, em vez de
   * guardado/atualizado incrementalmente (o cálculo é barato e assim não
   * há risco de o valor exibido "desviar" do valor real depois de várias
   * mudanças seguidas).
   */
  function renderBuilderSummary() {
    const selectedProductIds = Object.keys(cart).filter(function (productId) {
      return cart[productId] > 0;
    });

    if (selectedProductIds.length === 0) {
      builderSummaryItems.innerHTML = "";
      builderSummaryEmpty.hidden = false;
      builderSummaryTotals.hidden = true;
      builderSendOrderBtn.setAttribute("aria-disabled", "true");
      builderSendOrderBtn.href = "#";
      builderTopTotalValue.textContent = EB.utils.formatPrice(0);
      return;
    }

    builderSummaryEmpty.hidden = true;
    builderSummaryTotals.hidden = false;

    const cartItems = selectedProductIds.map(function (productId) {
      const product = findProductById(productId);
      return { id: product.id, name: product.name, price: product.price, quantity: cart[productId] };
    });
    const result = calculateComboDiscount(cartItems);

    const bulkLinesHtml = result.bulkGroups
      .map(function (group) {
        return (
          "<li><span>" +
          formatQuantityAndName(group) +
          ' <span class="builder__summary-item-discount">-' +
          Math.round(group.discountPercent * 100) +
          "%</span></span><span>" +
          EB.utils.formatPrice(group.total) +
          "</span></li>"
        );
      })
      .join("");

    // Grupo variado: com 1 item só, mostra a linha normal (sem "Grupo
    // variado (...)" em volta — não tem nada "variado" num grupo de 1);
    // com 2+ itens, combina tudo numa única linha, no mesmo padrão dos
    // grupos de bulk acima (nome do grupo + desconto, se houver + total
    // já descontado do grupo inteiro).
    let leftoverLineHtml = "";
    if (result.leftoverItems.length === 1) {
      const item = result.leftoverItems[0];
      leftoverLineHtml =
        "<li><span>" + formatQuantityAndName(item) + "</span><span>" + EB.utils.formatPrice(item.price * item.quantity) + "</span></li>";
    } else if (result.leftoverItems.length > 1) {
      const names = result.leftoverItems.map(formatQuantityAndName).join(", ");
      const discountBadge =
        result.leftoverDiscountPercent > 0
          ? ' <span class="builder__summary-item-discount">-' + Math.round(result.leftoverDiscountPercent * 100) + "%</span>"
          : "";
      leftoverLineHtml =
        "<li><span>Grupo variado (" +
        names +
        ")" +
        discountBadge +
        "</span><span>" +
        EB.utils.formatPrice(result.leftoverTotal) +
        "</span></li>";
    }

    builderSummaryItems.innerHTML = bulkLinesHtml + leftoverLineHtml;

    document.getElementById("builderSubtotalLabel").textContent =
      "Subtotal (" + result.totalQuantity + " " + pluralizeMarmita(result.totalQuantity) + "):";
    document.getElementById("builderSubtotalValue").textContent = EB.utils.formatPrice(result.originalTotal);

    if (result.totalSavings > 0) {
      builderSavingsRow.hidden = false;
      document.getElementById("builderSavingsValue").textContent = EB.utils.formatPrice(result.totalSavings);
    } else {
      builderSavingsRow.hidden = true;
    }

    document.getElementById("builderTotalValue").textContent = EB.utils.formatPrice(result.finalTotal);
    // Mesmo valor repetido no topo do modal (ver builder__top-total em
    // marmitas.html) — no mobile/tablet o resumo da direita vira estático
    // e só aparece depois de rolar a lista inteira de marmitas; este
    // segundo total, logo abaixo do cabeçalho, evita que o cliente
    // precise rolar para acompanhar o preço se formando.
    builderTopTotalValue.textContent = EB.utils.formatPrice(result.finalTotal);

    builderSendOrderBtn.removeAttribute("aria-disabled");
    builderSendOrderBtn.href = EB.utils.buildWhatsAppLink(buildBuilderWhatsAppMessage(result));
  }

  /**
   * Monta a mensagem de WhatsApp do combo personalizado a partir do
   * resultado de calculateComboDiscount(): cada marmita escolhida (item
   * a item, tanto os que viraram grupo de bulk quanto os do grupo
   * variado) com seu preço já descontado quando aplicável, seguido do
   * resumo financeiro completo.
   */
  function buildBuilderWhatsAppMessage(result) {
    const bulkLines = result.bulkGroups.map(function (group) {
      return formatQuantityAndName(group) + " (-" + Math.round(group.discountPercent * 100) + "%) — " + EB.utils.formatPrice(group.total);
    });
    const leftoverLines = result.leftoverItems.map(function (item) {
      return formatQuantityAndName(item) + " — " + EB.utils.formatPrice(item.price * item.quantity);
    });

    let message = "Olá! Quero montar o seguinte combo personalizado:\n" + bulkLines.concat(leftoverLines).join("\n");

    if (result.leftoverItems.length > 1 && result.leftoverDiscountPercent > 0) {
      message +=
        "\n\nDesconto de " +
        Math.round(result.leftoverDiscountPercent * 100) +
        "% aplicado no grupo variado (" +
        result.leftoverTotalQty +
        " " +
        pluralizeMarmita(result.leftoverTotalQty) +
        ").";
    }

    message += "\n\nTotal de marmitas: " + result.totalQuantity;
    message += "\nSubtotal: " + EB.utils.formatPrice(result.originalTotal);
    if (result.totalSavings > 0) {
      message += "\nVocê economiza: " + EB.utils.formatPrice(result.totalSavings);
    }
    message += "\nTotal final: " + EB.utils.formatPrice(result.finalTotal);

    return message;
  }

  /**
   * Altera a quantidade de UM produto no carrinho (delta é +1 ou -1) e
   * atualiza a interface. Math.max(0, ...) é o que impede a quantidade de
   * ficar negativa ao clicar em "-" quando já está em 0 (nesse caso o
   * próprio botão já está desabilitado, mas a checagem aqui garante que
   * o estado nunca fique inconsistente).
   */
  function updateQuantity(productId, delta) {
    const currentQuantity = cart[productId] || 0;
    const nextQuantity = Math.max(0, currentQuantity + delta);

    if (nextQuantity === 0) {
      delete cart[productId];
    } else {
      cart[productId] = nextQuantity;
    }

    syncBuilderRow(productId);
    renderBuilderSummary();
  }

  // Delegação de clique nos botões +/- de qualquer linha da lista de
  // marmitas do combo personalizado.
  builderProductList.addEventListener("click", function (event) {
    const button = event.target.closest('[data-action="increase"], [data-action="decrease"]');
    if (!button) {
      return;
    }
    const row = button.closest(".builder__row");
    const delta = button.dataset.action === "increase" ? 1 : -1;
    updateQuantity(row.dataset.productId, delta);
  });

  // Bloqueio extra de segurança: além do aria-disabled (que já remove o
  // link do fluxo de clique via CSS pointer-events:none — ver
  // global.css), este listener impede a navegação também em caso de
  // ativação por teclado enquanto o carrinho estiver vazio.
  builderSendOrderBtn.addEventListener("click", function (event) {
    if (builderSendOrderBtn.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });

  /* ======================================================================
     INICIALIZAÇÃO DA PÁGINA
     ====================================================================== */

  // Liga o fechamento padrão (botão X + clique fora) aos 3 modais desta
  // página — o comportamento em si está centralizado em EB.modal (main.js).
  [productModalOverlay, comboModalOverlay, builderModalOverlay].forEach(function (overlay) {
    EB.modal.initClosers(overlay);
  });

  renderProductsGrid("todas");
  renderCombosGrid();
  renderDiscountTiersInfo();
  renderBuilderSummary(); // estado inicial: carrinho vazio, botão de enviar desabilitado

  // O "Ver mais" de um product-card na Home linka para
  // "marmitas.html?produto=<id>" (ver resolveProductPageUrl em main.js)
  // em vez de só trazer o visitante para cá e deixá-lo procurar a
  // marmita de novo no grid. Se a URL trouxer esse parâmetro e o produto
  // existir, abre o modal de detalhes direto ao carregar a página.
  const requestedProductId = new URLSearchParams(window.location.search).get("produto");
  if (requestedProductId && findProductById(requestedProductId)) {
    openProductModal(requestedProductId, {});
  }
});
