/* ==========================================================================
   HOME.JS
   Lógica específica da página Home (index.html): renderiza 3 produtos
   sorteados aleatoriamente na seção "Conheça algumas das nossas opções",
   usando os mesmos dados (EB.data.PRODUCTS) exibidos por completo no
   Cardápio. O sorteio roda de novo a cada carregamento da página, então a
   vitrine muda a cada visita em vez de mostrar sempre as mesmas marmitas.

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

  /**
   * Embaralha uma CÓPIA do array recebido (algoritmo Fisher-Yates) sem
   * alterar o array original — EB.data.PRODUCTS é compartilhado com
   * cardapio.js, então nunca deve ser reordenado no próprio lugar.
   */
  function shuffle(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled;
  }

  // Filtra apenas os produtos marcados como "featured: true" em data.js —
  // esse é o "pool" elegível para a vitrine da Home (permite ao cliente
  // excluir algum prato do sorteio marcando featured:false, se um dia
  // quiser). Do pool elegível, sorteia 3 para exibir nesta visita.
  const eligibleProducts = EB.data.PRODUCTS.filter(function (product) {
    return product.featured;
  });
  const featuredProducts = shuffle(eligibleProducts).slice(0, 3);

  // Para cada produto sorteado, cria o card (componente reaproveitado do
  // Cardápio) e insere no grid. detailsAsLink:true faz o botão "Ver mais"
  // apontar para a página cardapio.html em vez de tentar abrir um modal
  // que não existe no HTML da Home.
  featuredProducts.forEach(function (product) {
    const card = EB.components.createProductCard(product, { detailsAsLink: true, featuredStyle: true });
    grid.appendChild(card);
  });
});
