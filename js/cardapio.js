/* ==========================================================================
   CARDAPIO.JS
   Lógica específica da página Cardápio (cardapio.html):
     1) grid de produtos com filtro por categoria;
     2) grid de combos prontos + card "monte seu combo";
     3) modal de detalhes da marmita;
     4) modal de detalhes do combo (com navegação para o modal de produto);
     5) modal "Monte seu combo", com seletor de quantidade por marmita e
        cálculo de desconto progressivo em tempo real.

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
    chevronLeft:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
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
  const builderProductList = document.getElementById("builderProductList");
  const builderSummaryItems = document.getElementById("builderSummaryItems");
  const builderSummaryEmpty = document.getElementById("builderSummaryEmpty");
  const builderSummaryTotals = document.getElementById("builderSummaryTotals");
  const builderDiscountRow = document.getElementById("builderDiscountRow");
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

    const filteredProducts =
      filterTag === "todas"
        ? EB.data.PRODUCTS
        : EB.data.PRODUCTS.filter(function (product) {
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
      '<div class="combo-card__media">' +
      '<span class="badge badge--' +
      combo.badge.variant +
      '">' +
      combo.badge.label +
      "</span>" +
      '<div class="media-placeholder media-placeholder--card"><span class="media-placeholder__label">' +
      combo.imageLabel +
      "</span></div>" +
      "</div>" +
      '<div class="combo-card__body">' +
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
   * Monta o HTML interno do modal de produto para UMA marmita específica.
   * `options.returnToComboId`, quando presente, faz aparecer o botão
   * "Voltar para o combo" (o id fica guardado no próprio botão via
   * data-combo-id, para o clique saber para qual combo voltar sem
   * depender de nenhuma variável externa/compartilhada).
   */
  function buildProductModalBody(product, options) {
    const nutrition = product.nutrition;

    // Uma linha da tabela nutricional: mostra "—" quando o valor ainda
    // não foi confirmado pelo cliente, em vez de inventar um número.
    function nutritionRow(label, value) {
      return "<tr><td>" + label + "</td><td>" + (value || "—") + "</td></tr>";
    }

    const nutritionRowsHtml =
      nutritionRow("Porção", nutrition.portion) +
      nutritionRow("Valor Energético", nutrition.kcal ? nutrition.kcal + " kcal" : null) +
      nutritionRow("Carboidratos", nutrition.carbs) +
      nutritionRow("Proteínas", nutrition.protein) +
      nutritionRow("Gorduras Totais", nutrition.totalFat) +
      nutritionRow("Gorduras Saturadas", nutrition.satFat) +
      nutritionRow("Fibra Alimentar", nutrition.fiber) +
      nutritionRow("Sódio", nutrition.sodium);

    // Enquanto QUALQUER campo da tabela não estiver confirmado, mostramos
    // a nota avisando o cliente/visitante que aquele número é provisório.
    const hasMissingNutritionValue = [
      nutrition.carbs,
      nutrition.protein,
      nutrition.totalFat,
      nutrition.satFat,
      nutrition.fiber,
      nutrition.sodium,
    ].some(function (value) {
      return !value;
    });

    const backButtonHtml = options.returnToComboId
      ? '<button type="button" class="modal__back" data-action="back-to-combo" data-combo-id="' +
        options.returnToComboId +
        '">' +
        ICONS.chevronLeft +
        "Voltar para o combo</button>"
      : "";

    const badgeHtml = product.badge ? '<span class="badge badge--' + product.badge.variant + '">' + product.badge.label + "</span>" : "";

    const orderMessage = "Olá! Gostaria de pedir: " + product.name + " (" + EB.utils.formatPrice(product.price) + ").";

    return (
      backButtonHtml +
      '<div class="modal__header">' +
      badgeHtml +
      '<h2 class="modal__title" id="productModalTitle">' +
      product.name +
      "</h2>" +
      "</div>" +
      '<div class="media-placeholder media-placeholder--wide product-modal__media"><span class="media-placeholder__label">' +
      product.imageLabel +
      "</span></div>" +
      '<p class="product-modal__description">' +
      product.description +
      "</p>" +
      '<div class="product-modal__grid">' +
      '<div><h3 class="product-modal__label">Ingredientes</h3><p class="product-modal__text">' +
      product.ingredients +
      "</p></div>" +
      '<div><h3 class="product-modal__label">Preparo e conservação</h3><p class="product-modal__text">' +
      product.preparo +
      '</p><p class="product-modal__text">' +
      product.conservacao +
      "</p></div>" +
      "</div>" +
      '<table class="nutrition-table"><caption>Informação Nutricional (' +
      product.weight +
      ")</caption><tbody>" +
      nutritionRowsHtml +
      "</tbody></table>" +
      (hasMissingNutritionValue
        ? '<span class="nutrition-table__note">*Alguns valores nutricionais ainda não foram confirmados pelo cliente e serão atualizados em breve.</span>'
        : "") +
      '<div class="product-modal__footer">' +
      '<div class="price"><span class="price__value">' +
      EB.utils.formatPrice(product.price) +
      "</span></div>" +
      '<a class="btn btn--primary" target="_blank" rel="noopener" href="' +
      EB.utils.buildWhatsAppLink(orderMessage) +
      '">Peça esta marmita</a>' +
      "</div>"
    );
  }

  /**
   * Abre o modal de detalhes de UMA marmita. `trigger` é o elemento que
   * disparou a abertura (para o foco voltar a ele ao fechar — ver
   * EB.modal.open em main.js); `options.returnToComboId` é repassado
   * para buildProductModalBody definir se o botão "Voltar" aparece.
   */
  function openProductModal(productId, options, trigger) {
    const product = findProductById(productId);
    productModalBody.innerHTML = buildProductModalBody(product, options || {});
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
          '<span class="media-placeholder media-placeholder--square combo-modal__item-media" aria-hidden="true"></span>' +
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

  function getCartTotalMarmitas() {
    return Object.keys(cart).reduce(function (sum, productId) {
      return sum + cart[productId];
    }, 0);
  }

  /**
   * Retorna a faixa de desconto (ver EB.data.DISCOUNT_TIERS) que se
   * aplica a um determinado total de marmitas. Se nenhuma faixa bater
   * (não deveria acontecer, já que a última faixa vai até Infinity),
   * retorna 0% como segurança.
   */
  function getDiscountTier(totalMarmitas) {
    return (
      EB.data.DISCOUNT_TIERS.find(function (tier) {
        return totalMarmitas >= tier.min && totalMarmitas <= tier.max;
      }) || { percent: 0 }
    );
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
      '<div class="media-placeholder media-placeholder--square builder__row-media" aria-hidden="true"></div>' +
      '<div class="builder__row-info">' +
      '<h4 class="builder__row-name">' +
      product.name +
      "</h4>" +
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
  // do cardápio. Roda uma única vez, no carregamento da página.
  EB.data.PRODUCTS.forEach(function (product) {
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
   * Redesenha toda a coluna direita (resumo do combo) a partir do estado
   * atual de `cart`: lista de itens escolhidos, subtotal, desconto
   * progressivo (calculado com base no total de marmitas) e total final.
   * Chamada sempre que uma quantidade muda, para o preço acompanhar o
   * clique em tempo real — por isso o desconto é recalculado do zero a
   * cada chamada, em vez de guardado/atualizado incrementalmente (o
   * cálculo é barato e assim não há risco de o valor exibido "desviar"
   * do valor real depois de várias mudanças seguidas).
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
      return;
    }

    builderSummaryEmpty.hidden = true;
    builderSummaryTotals.hidden = false;

    let subtotal = 0;
    builderSummaryItems.innerHTML = selectedProductIds
      .map(function (productId) {
        const product = findProductById(productId);
        const quantity = cart[productId];
        const lineTotal = product.price * quantity;
        subtotal += lineTotal;
        return "<li><span>" + quantity + "x " + product.name + "</span><span>" + EB.utils.formatPrice(lineTotal) + "</span></li>";
      })
      .join("");

    const totalMarmitas = getCartTotalMarmitas();
    const tier = getDiscountTier(totalMarmitas);
    const discountValue = subtotal * tier.percent;
    const total = subtotal - discountValue;

    document.getElementById("builderSubtotalLabel").textContent = "Subtotal (" + totalMarmitas + " " + pluralizeMarmita(totalMarmitas) + "):";
    document.getElementById("builderSubtotalValue").textContent = EB.utils.formatPrice(subtotal);

    if (tier.percent > 0) {
      builderDiscountRow.hidden = false;
      document.getElementById("builderDiscountLabel").textContent = "Desconto Progressivo (" + Math.round(tier.percent * 100) + "%):";
      document.getElementById("builderDiscountValue").textContent = "- " + EB.utils.formatPrice(discountValue);
    } else {
      builderDiscountRow.hidden = true;
    }

    document.getElementById("builderTotalValue").textContent = EB.utils.formatPrice(total);

    builderSendOrderBtn.removeAttribute("aria-disabled");
    builderSendOrderBtn.href = EB.utils.buildWhatsAppLink(
      buildBuilderWhatsAppMessage(selectedProductIds, subtotal, discountValue, total, totalMarmitas)
    );
  }

  /**
   * Monta a mensagem de WhatsApp do combo personalizado: cada marmita
   * escolhida com sua quantidade e subtotal, seguido do resumo
   * financeiro completo (subtotal, desconto se houver, e total final).
   */
  function buildBuilderWhatsAppMessage(selectedProductIds, subtotal, discountValue, total, totalMarmitas) {
    const itemLines = selectedProductIds
      .map(function (productId) {
        const product = findProductById(productId);
        const quantity = cart[productId];
        return quantity + "x " + product.name + " — " + EB.utils.formatPrice(product.price * quantity);
      })
      .join("\n");

    let message = "Olá! Quero montar o seguinte combo personalizado:\n" + itemLines;
    message += "\n\nTotal de marmitas: " + totalMarmitas;
    message += "\nSubtotal: " + EB.utils.formatPrice(subtotal);
    if (discountValue > 0) {
      message += "\nDesconto progressivo: -" + EB.utils.formatPrice(discountValue);
    }
    message += "\nTotal final: " + EB.utils.formatPrice(total);

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
  renderBuilderSummary(); // estado inicial: carrinho vazio, botão de enviar desabilitado
});
