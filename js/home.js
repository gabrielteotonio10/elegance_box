/* ==========================================================================
   HOME.JS

   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const grid = document.getElementById("featuredProductsGrid");

  // Se o elemento não existir, não há nada a fazer.
  if (!grid) {
    return;
  }

  /**
   * Embaralha uma CÓPIA do array recebido (algoritmo Fisher-Yates) sem alterar o array original 
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

  // Dois "pools" separados: marmitas normais e Frios/Antepastos (sob
  // consulta). Sorteados independentemente para garantir que a vitrine
  // sempre tenha pelo menos 1 frio/antepasto — um sorteio único misturando
  // os dois grupos poderia, por azar, nunca sortear nenhum.
  const eligibleMarmitas = EB.data.PRODUCTS.filter(function (product) {
    return product.featured && product.category.indexOf("frios-antepastos") === -1;
  });
  const eligibleFrios = EB.data.PRODUCTS.filter(function (product) {
    return product.featured && product.category.indexOf("frios-antepastos") !== -1;
  });

  // 3 marmitas no total, mas a 3ª só aparece no mobile (via
  // .product-card--mobile-only, escondida em telas >=768px por CSS — ver
  // home.css). No tablet/desktop isso deixa 2 marmitas + 1 frio = 3
  // cards, preenchendo a linha inteira do grid de 3 colunas; no mobile,
  // as 4 aparecem em um grid 2x2.
  const marmitas = shuffle(eligibleMarmitas).slice(0, 3);
  const frio = shuffle(eligibleFrios).slice(0, 1);

  marmitas.forEach(function (product, index) {
    const card = EB.components.createProductCard(product, {
      detailsAsLink: true,
      featuredStyle: true,
      mobileOnly: index === 2,
    });
    grid.appendChild(card);
  });
  frio.forEach(function (product) {
    const card = EB.components.createProductCard(product, { detailsAsLink: true, featuredStyle: true });
    grid.appendChild(card);
  });
});
