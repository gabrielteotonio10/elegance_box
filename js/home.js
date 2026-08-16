/* ==========================================================================
   HOME.JS
   Lógica específica da página Home (index.html): renderiza os produtos em
   destaque na seção "Conheça algumas das nossas opções", usando os mesmos
   dados (EB.data.PRODUCTS) exibidos por completo no Cardápio.

   Depende de data.js e main.js já terem sido carregados antes (usa
   EB.data e EB.components.createProductCard).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const grid = document.getElementById("featuredProductsGrid");

  // Se o elemento não existir (ex: este script foi acidentalmente
  // incluído em outra página), não há nada a fazer.
  if (!grid) {
    return;
  }

  // Filtra apenas os produtos marcados como "featured: true" em data.js —
  // são os mesmos 3 pratos usados como vitrine no Figma da Home.
  const featuredProducts = EB.data.PRODUCTS.filter(function (product) {
    return product.featured;
  });

  // Para cada produto em destaque, cria o card (componente reaproveitado
  // do Cardápio) e insere no grid. detailsAsLink:true faz o botão "Ver
  // mais" apontar para a página cardapio.html em vez de tentar abrir um
  // modal que não existe no HTML da Home.
  featuredProducts.forEach(function (product) {
    const card = EB.components.createProductCard(product, { detailsAsLink: true });
    grid.appendChild(card);
  });
});
