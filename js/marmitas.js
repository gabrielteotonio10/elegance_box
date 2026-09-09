/* Lógica da página Marmitas: grid com filtros, combos prontos, modais de
   produto e de combo, e o modal "Monte seu combo" com cálculo de desconto.
   Depende de data.js e main.js. */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // SVGs em texto porque são inseridos via innerHTML montado dinamicamente.
  const ICONS = {
    plus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    minus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  };

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
  const builderTopTotalSavings = document.getElementById("builderTopTotalSavings");
  const builderProductList = document.getElementById("builderProductList");
  const builderSummaryItems = document.getElementById("builderSummaryItems");
  const builderSummaryEmpty = document.getElementById("builderSummaryEmpty");
  const builderSummaryTotals = document.getElementById("builderSummaryTotals");
  const builderSavingsRow = document.getElementById("builderSavingsRow");
  const builderSendOrderBtn = document.getElementById("builderSendOrderBtn");

  // Os combos guardam só o id de cada marmita; estes helpers resolvem o objeto.
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

  function pluralizeMarmita(count) {
    return count === 1 ? "marmita" : "marmitas";
  }

  /* 1) GRID DE PRODUTOS + FILTROS */

  // Redesenha o grid conforme o filtro ("todas" mostra tudo).
  function renderProductsGrid(filterTag) {
    productsGrid.innerHTML = "";

    // Frios e Antepastos têm página própria, nunca aparecem aqui.
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
      productsGrid.appendChild(EB.components.createProductCard(product));
    });
  }

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

  // Delegação no container: os cards são recriados a cada troca de filtro.
  productsGrid.addEventListener("click", function (event) {
    const detailsBtn = event.target.closest('[data-action="open-product"]');
    if (detailsBtn) {
      openProductModal(detailsBtn.dataset.productId, {}, detailsBtn);
    }
  });

  /* 2) GRID DE COMBOS */

  // Card de um combo pronto (só existe nesta página, por isso não fica em main.js).
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

  // Mensagem de WhatsApp de um combo pronto.
  function buildComboWhatsAppMessage(combo) {
    const itemLines = combo.items
      .map(function (item) {
        const product = findProductById(item.productId);
        return item.qty + "x " + product.name;
      })
      .join("\n");

    return "Olá! Gostaria de pedir o " + combo.name + ":\n" + itemLines + "\n\nTotal: " + EB.utils.formatPrice(combo.finalPrice);
  }

  // Combos prontos + o card "Monte seu combo" sempre por último.
  function renderCombosGrid() {
    EB.data.COMBOS.forEach(function (combo) {
      combosGrid.appendChild(createComboCard(combo));
    });

    const template = document.getElementById("customComboCardTemplate");
    combosGrid.appendChild(template.content.cloneNode(true));
  }

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

  /* 3) MODAL: DETALHES DA MARMITA */

  // De onde o modal de produto foi aberto, para X/clique fora/Esc voltarem
  // para lá em vez de fechar tudo (null quando aberto direto do grid).
  let productModalReturnContext = null;

  function openProductModal(productId, options, trigger) {
    options = options || {};
    const product = findProductById(productId);
    productModalBody.innerHTML = EB.components.buildProductModalBody(product, options);

    if (options.returnToComboId) {
      productModalReturnContext = { type: "combo", comboId: options.returnToComboId };
    } else if (options.returnToBuilder) {
      productModalReturnContext = { type: "builder" };
    } else {
      productModalReturnContext = null;
    }

    EB.modal.open(productModalOverlay, trigger);
  }

  // Fecha o modal de produto voltando para o combo/builder de onde veio;
  // sem contexto, fecha normalmente. Usada tanto pelo botão "Voltar"
  // quanto por X/clique fora/Esc (ver overlay._onRequestClose abaixo).
  function closeProductModalToContext() {
    if (productModalReturnContext && productModalReturnContext.type === "combo") {
      const comboId = productModalReturnContext.comboId;
      EB.modal.closeInstantly(productModalOverlay);
      openComboModal(comboId);
    } else if (productModalReturnContext && productModalReturnContext.type === "builder") {
      EB.modal.closeInstantly(productModalOverlay);
      EB.modal.open(builderModalOverlay);
    } else {
      EB.modal.close(productModalOverlay);
    }
  }

  productModalOverlay._onRequestClose = closeProductModalToContext;

  // Os dois botões "Voltar" só existem em tempo de execução, daí a delegação.
  productModalOverlay.addEventListener("click", function (event) {
    const backToComboBtn = event.target.closest('[data-action="back-to-combo"]');
    if (backToComboBtn) {
      closeProductModalToContext();
      return;
    }

    const backToBuilderBtn = event.target.closest('[data-action="back-to-builder"]');
    if (backToBuilderBtn) {
      closeProductModalToContext();
    }
  });

  /* 4) MODAL: DETALHES DO COMBO */

  // Conteúdo do modal: descrição, itens (cada um com "Ver mais") e preço.
  function buildComboModalBody(combo) {
    const totalMarmitas = combo.items.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);

    const itemsHtml = combo.items
      .map(function (item) {
        const product = findProductById(item.productId);
        return (
          '<li class="combo-modal__item">' +
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
          '<button type="button" class="btn btn--outline combo-modal__item-btn" data-action="open-product-from-combo" data-product-id="' +
          product.id +
          '" data-combo-id="' +
          combo.id +
          '">Ver mais</button>' +
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

  comboModalOverlay.addEventListener("click", function (event) {
    const itemBtn = event.target.closest('[data-action="open-product-from-combo"]');
    if (!itemBtn) {
      return;
    }
    EB.modal.closeInstantly(comboModalOverlay);
    openProductModal(itemBtn.dataset.productId, { returnToComboId: itemBtn.dataset.comboId });
  });

  /* 5) MODAL: MONTE SEU COMBO */

  // Estado do combo personalizado: { idDoProduto: quantidade }, só em memória.
  const cart = {};

  // Faixa de desconto que se aplica a uma quantidade (0% se nenhuma bater).
  function findDiscountTier(tiers, quantity) {
    return (
      tiers.find(function (tier) {
        return quantity >= tier.min && quantity <= tier.max;
      }) || { percent: 0 }
    );
  }

  /**
   * Calcula o preço do combo por grupos. Cada marmita entra em exatamente
   * um grupo, então os descontos nunca se empilham na mesma marmita:
   *   1) Grupo de bulk: item cuja própria quantidade bate uma faixa de
   *      FLAVOR_DISCOUNT_TIERS (5+ do mesmo sabor) é descontado sozinho.
   *   2) Grupo variado: todo o resto, descontado conforme a quantidade
   *      TOTAL do grupo em QUANTITY_DISCOUNT_TIERS.
   * Função pura, sem arredondamento (só na exibição, via formatPrice).
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
      finalTotal: Math.max(0, finalTotal),
      totalSavings: originalTotal - finalTotal,
    };
  }

  // Lista as faixas de desconto lendo direto de data.js (0% não é exibido).
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

  // Linha de uma marmita na lista do builder, com o seletor zerado.
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
      '<div class="builder__row-footer">' +
      '<span class="builder__row-price">' +
      EB.utils.formatPrice(product.price) +
      "</span>" +
      '<button type="button" class="builder__row-details" data-action="open-product-details" data-product-id="' +
      product.id +
      '">Ver mais</button>' +
      "</div>" +
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

  // Itens "sob consulta" (sem preço) ficam de fora: o desconto precisa de preço unitário.
  EB.data.PRODUCTS.filter(function (product) {
    return product.price != null;
  }).forEach(function (product) {
    builderProductList.appendChild(createBuilderRow(product));
  });

  // Sincroniza o número e o botão "-" de uma linha com o estado do carrinho.
  function syncBuilderRow(productId) {
    const row = builderProductList.querySelector('.builder__row[data-product-id="' + productId + '"]');
    if (!row) {
      return;
    }
    const quantity = cart[productId] || 0;
    row.querySelector("[data-quantity-value]").textContent = quantity;
    row.querySelector('[data-action="decrease"]').disabled = quantity === 0;
  }

  function formatQuantityAndName(item) {
    return item.quantity + "x " + item.name;
  }

  // Redesenha o resumo do combo do zero a partir do carrinho atual.
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
      builderTopTotalSavings.hidden = true;
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

    // Com 1 item só não faz sentido chamar de "grupo variado".
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

    // Total repetido no topo: no mobile o resumo da direita só aparece
    // depois de rolar a lista inteira.
    builderTopTotalValue.textContent = EB.utils.formatPrice(result.finalTotal);
    if (result.totalSavings > 0) {
      builderTopTotalSavings.hidden = false;
      builderTopTotalSavings.textContent = "economia de " + EB.utils.formatPrice(result.totalSavings);
    } else {
      builderTopTotalSavings.hidden = true;
    }

    builderSendOrderBtn.removeAttribute("aria-disabled");
    builderSendOrderBtn.href = EB.utils.buildWhatsAppLink(buildBuilderWhatsAppMessage(result));
  }

  // Mensagem de WhatsApp do combo personalizado, item a item.
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

  // Altera a quantidade de um produto (delta +1/-1) e atualiza a interface.
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

  builderProductList.addEventListener("click", function (event) {
    const detailsBtn = event.target.closest('[data-action="open-product-details"]');
    if (detailsBtn) {
      // Fecha o builder antes para não deixar dois overlays abertos; o
      // carrinho fica em memória e o botão "Voltar" reabre tudo como estava.
      EB.modal.closeInstantly(builderModalOverlay);
      openProductModal(detailsBtn.dataset.productId, { returnToBuilder: true }, detailsBtn);
      return;
    }

    const button = event.target.closest('[data-action="increase"], [data-action="decrease"]');
    if (!button) {
      return;
    }
    const row = button.closest(".builder__row");
    const delta = button.dataset.action === "increase" ? 1 : -1;
    updateQuantity(row.dataset.productId, delta);
  });

  // O aria-disabled já bloqueia o clique via CSS; isto cobre o teclado.
  builderSendOrderBtn.addEventListener("click", function (event) {
    if (builderSendOrderBtn.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });

  /* INICIALIZAÇÃO */

  [productModalOverlay, comboModalOverlay, builderModalOverlay].forEach(function (overlay) {
    EB.modal.initClosers(overlay);
  });

  renderProductsGrid("todas");
  renderCombosGrid();
  renderDiscountTiersInfo();
  renderBuilderSummary();

  // "marmitas.html?produto=<id>" (link vindo da Home) abre o modal direto.
  const requestedProductId = new URLSearchParams(window.location.search).get("produto");
  if (requestedProductId && findProductById(requestedProductId)) {
    openProductModal(requestedProductId, {});
  }
});
