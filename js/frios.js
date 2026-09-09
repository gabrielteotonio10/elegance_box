/* Lógica da página Frios e Antepastos: renderiza os exemplos e o modal de
   detalhes. Não tem filtro nem combo — nenhum item tem preço fixo.
   Depende de data.js e main.js. */

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

  grid.addEventListener("click", function (event) {
    const detailsBtn = event.target.closest('[data-action="open-product"]');
    if (detailsBtn) {
      openProductModal(detailsBtn.dataset.productId, detailsBtn);
    }
  });

  // "frios-antepastos.html?produto=<id>" (link vindo da Home) abre o modal direto.
  const requestedProductId = new URLSearchParams(window.location.search).get("produto");
  if (requestedProductId && findProductById(requestedProductId)) {
    openProductModal(requestedProductId);
  }
});
