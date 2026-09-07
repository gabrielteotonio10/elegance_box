/* ==========================================================================
   FRIOS.JS
   Lógica específica da página Frios e Antepastos (frios-antepastos.html):
   renderiza os exemplos (EB.data.PRODUCTS filtrado por category
   "frios-antepastos") e o modal de detalhes de cada um. Bem mais simples
   que marmitas.js — não tem filtro, combo nem "monte seu combo", já que
   nenhum desses itens tem preço fixo.

   Depende de data.js e main.js já terem sido carregados antes.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const grid = document.getElementById("friosGrid");
  const productModalOverlay = document.getElementById("productModal");
  const productModalBody = document.getElementById("productModalBody");

  if (!grid || !productModalOverlay) {
    return;
  }

  function findProductById(id) {
    return EB.data.PRODUCTS.find(function (product) {
      return product.id === id;
    });
  }

  /**
   * Abre o modal de detalhes de UM exemplo. Nunca passa
   * returnToComboId — Frios e Antepastos não entra em combos, então
   * EB.components.buildProductModalBody (main.js) nunca mostra o botão
   * "Voltar para o combo" aqui.
   */
  function openProductModal(productId, trigger) {
    const product = findProductById(productId);
    productModalBody.innerHTML = EB.components.buildProductModalBody(product, {});
    EB.modal.open(productModalOverlay, trigger);
  }

  EB.modal.initClosers(productModalOverlay);

  const friosProducts = EB.data.PRODUCTS.filter(function (product) {
    return product.category.indexOf("frios-antepastos") !== -1;
  });

  friosProducts.forEach(function (product) {
    grid.appendChild(EB.components.createProductCard(product));
  });

  // Delegação de clique no grid inteiro para "Ver mais" (mesmo padrão de
  // marmitas.js).
  grid.addEventListener("click", function (event) {
    const detailsBtn = event.target.closest('[data-action="open-product"]');
    if (detailsBtn) {
      openProductModal(detailsBtn.dataset.productId, detailsBtn);
    }
  });

  // Mesmo suporte a link direto da Home que marmitas.js tem — ver
  // resolveProductPageUrl em main.js.
  const requestedProductId = new URLSearchParams(window.location.search).get("produto");
  if (requestedProductId && findProductById(requestedProductId)) {
    openProductModal(requestedProductId);
  }
});
