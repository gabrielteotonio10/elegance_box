/* Lógica da Home: sorteia os produtos exibidos na vitrine de destaques. */

document.addEventListener("DOMContentLoaded", function () {
  const grid = document.getElementById("featuredProductsGrid");

  if (!grid) {
    return;
  }

  // Fisher-Yates sobre uma cópia, sem alterar o array original.
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

  // Sorteios separados para a vitrine sempre ter ao menos 1 frio/antepasto.
  const eligibleMarmitas = EB.data.PRODUCTS.filter(function (product) {
    return product.featured && product.category.indexOf("frios-antepastos") === -1;
  });
  const eligibleFrios = EB.data.PRODUCTS.filter(function (product) {
    return product.featured && product.category.indexOf("frios-antepastos") !== -1;
  });

  // A 3ª marmita só aparece no mobile, completando o grid 2x2.
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
