/* ==========================================================================
   MAIN.JS
   ========================================================================== */

window.EB = window.EB || {};

(function () {
  "use strict";

  /* ======================================================================
     EB.utils
     ====================================================================== */
  const utils = {
    /**
     * Formata um número (ex: 21.9) como moeda brasileira (ex: "R$ 21,90").
     */
    formatPrice(value) {
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    },

    /**
     * Monta a URL do WhatsApp (wa.me) para o número da Elegance Box, já
     * com a mensagem pré-preenchida e corretamente codificada.
     */
    buildWhatsAppLink(message) {
      const base = "https://wa.me/" + EB.data.WHATSAPP_NUMBER;
      return message ? base + "?text=" + encodeURIComponent(message) : base;
    },

    /**
     * Liga os botões/links de WhatsApp "estáticos" do HTML (header, hero,
     * CTA final, footer, cards de contato) à mensagem correta.
     */
    wireStaticWhatsAppLinks() {
      const links = document.querySelectorAll("[data-wa-cta]");
      links.forEach(function (link) {
        const message = link.getAttribute("data-wa-message") || "";
        link.setAttribute("href", utils.buildWhatsAppLink(message));
      });
    },
  };

  /* ======================================================================
     EB.modal — mecanismo genérico de abrir/fechar modal, reaproveitado
     pelos 3 modais do Cardápio (produto, combo, monte-seu-combo).
     ====================================================================== */
  const modal = {
    /**
     * Abre um modal: mostra o overlay, bloqueia a rolagem da página por
     * trás (para o usuário não rolar o conteúdo "escondido") e move o
     * foco do teclado para dentro do modal — essencial para
     * acessibilidade.
     */
    open(overlay, trigger) {
      overlay._lastTrigger = trigger || document.activeElement;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");

      const closeButton = overlay.querySelector("[data-modal-close]");
      if (closeButton) {
        closeButton.focus();
      }
    },

    /**
     * Fecha um modal: esconde o overlay e devolve o foco ao elemento que
     * originalmente o abriu. 
     */
    close(overlay) {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");

      const stillOpen = document.querySelector(".modal-overlay.is-open, .mobile-menu.is-open");
      if (!stillOpen) {
        document.body.classList.remove("no-scroll");
      }

      if (overlay._lastTrigger && typeof overlay._lastTrigger.focus === "function") {
        overlay._lastTrigger.focus();
      }
    },

    /**
     * Fecha um modal SEM a transição de fade — usado apenas quando outro
     * modal vai abrir imediatamente em seguida (ex: clicar numa marmita
     * dentro do modal de combo, ou clicar em "Voltar" dentro do modal de
     * produto). 
     */
    closeInstantly(overlay) {
      overlay.classList.add("is-closing-instant");
      void overlay.offsetWidth;
      modal.close(overlay);
      requestAnimationFrame(function () {
        overlay.classList.remove("is-closing-instant");
      });
    },

    /**
     * Fecha qualquer modal que esteja aberto no momento. Usado pelo
     * listener global da tecla Esc (ver bootstrap no final do arquivo).
     */
    closeAny() {
      const openOverlay = document.querySelector(".modal-overlay.is-open");
      if (openOverlay) {
        modal.close(openOverlay);
      }
    },

    /**
     * Liga o comportamento padrão de fechamento de UM modal específico:
     * clique no botão de fechar (X) e clique fora do card (no fundo
     * escurecido). 
     */
    initClosers(overlay) {
      overlay.querySelectorAll("[data-modal-close]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          modal.close(overlay);
        });
      });

      // Fecha ao clicar no overlay, mas SÓ se o clique foi no próprio
      // overlay (o fundo) e não em algum elemento dentro do .modal 
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          modal.close(overlay);
        }
      });
    },
  };

  /* ======================================================================
     EB.menu — menu mobile (hambúrguer).
     ====================================================================== */
  const menu = {
    init() {
      const toggle = document.getElementById("mobileMenuToggle");
      const overlay = document.getElementById("mobileMenu");
      const closeBtn = document.getElementById("mobileMenuClose");

      // Páginas sem os 3 elementos acima simplesmente não têm menu mobile
      if (!toggle || !overlay || !closeBtn) {
        return;
      }

      function open() {
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("no-scroll");
      }

      function close() {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");

        const stillOpen = document.querySelector(".modal-overlay.is-open, .mobile-menu.is-open");
        if (!stillOpen) {
          document.body.classList.remove("no-scroll");
        }
        toggle.focus();
      }

      toggle.addEventListener("click", open);
      closeBtn.addEventListener("click", close);

      // Fecha o menu automaticamente ao clicar em qualquer link dele
      // (navegação para outra página, ícone social, ou o CTA do
      // WhatsApp)
      overlay.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", close);
      });

      // Exposto para o listener global de Esc (bootstrap abaixo) poder
      // fechar o menu mobile do mesmo jeito que fecha um modal.
      menu.closeIfOpen = function () {
        if (overlay.classList.contains("is-open")) {
          close();
        }
      };
    },

    // Sobrescrita em init(); existe aqui só para o listener de Esc ter uma
    // função segura para chamar mesmo se init() não tiver encontrado o
    closeIfOpen() {},
  };

  /* ======================================================================
     EB.nav — marca automaticamente o link do menu (desktop + mobile)
     correspondente à página atual com a classe .is-active.
     ====================================================================== */
  const nav = {
    highlightActiveLink() {
      // "index.html" quando a URL termina em "/" (ex: acessando a raiz
      // do site hospedado), senão o nome real do arquivo (ex:
      // "marmitas.html").
      const currentPage = window.location.pathname.split("/").pop() || "index.html";

      document.querySelectorAll("[data-nav-link]").forEach(function (link) {
        const linkPage = link.getAttribute("href");
        if (linkPage === currentPage) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "page");
        }
      });
    },
  };

  /* ======================================================================
     EB.components — pequenos "componentes" de UI montados via JS e
     reaproveitados em mais de uma página.
     ====================================================================== */

  // Usado só dentro de buildProductModalBody, no botão "Voltar para o
  // combo" — fica aqui (não em marmitas.js/frios.js) porque a função em
  // si também vive aqui, compartilhada pelas duas páginas de produto.
  const ICONS = {
    chevronLeft:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
  };

  /**
   * Cada produto mora em UMA página de detalhes: marmitas comuns em
   * marmitas.html, Frios e Antepastos (category inclui
   * "frios-antepastos") em frios-antepastos.html. Usado tanto para
   * montar o link "Ver mais" da Home quanto, futuramente, por qualquer
   * outro lugar que precise linkar para o produto certo.
   */
  function resolveProductPageUrl(product) {
    return product.category.indexOf("frios-antepastos") !== -1 ? "frios-antepastos.html" : "marmitas.html";
  }

  const components = {
    /**
     * Cria o card de um produto (.product-card) — marmita ou item de
     * Frios e Antepastos —, usado na grade completa de Marmitas, na
     * grade de exemplos de Frios e Antepastos e nos destaques da Home.
     *
     * @param {object} product - um item de EB.data.PRODUCTS.
     * @param {object} [options]
     * @param {boolean} [options.detailsAsLink] - quando true, o botão
     *   "Ver mais" vira um link comum para a página de detalhes do
     *   produto (marmitas.html ou frios-antepastos.html, conforme a
     *   categoria — ver resolveProductPageUrl acima; usado na Home, que
     *   não tem o modal de detalhes no próprio HTML). Quando
     *   false/omitido, "Ver mais" é um <button> que dispara a abertura do
     *   modal via JS (usado nas próprias páginas de produto, que tratam o
     *   clique por delegação de evento, procurando por
     *   data-action="open-product").
     * @param {boolean} [options.featuredStyle] - aplica a sombra mais forte
     *   de destaque (.product-card--featured). É uma decisão de CONTEXTO
     *   (a Home passa true, pois ali os cards são realmente uma vitrine
     *   selecionada), não uma propriedade do produto em si — por isso não
     *   é lida diretamente de product.featured: no grid completo de
     *   Marmitas, os produtos devem ter o mesmo peso visual, mesmo que
     *   também estejam marcados como featured em EB.data.PRODUCTS (campo
     *   usado só para a Home saber QUAIS produtos exibir).
     * @param {boolean} [options.mobileOnly] - aplica .product-card--mobile-only,
     *   que esconde o card em telas >=768px (ver home.css). Usado pela Home
     *   para mostrar 1 marmita a mais só no mobile (ver home.js).
     */
    createProductCard(product, options) {
      options = options || {};
      const isQuote = product.price == null; // "sob consulta" (ex: Frios e Antepastos) — sem preço fixo
      const article = document.createElement("article");
      article.className =
        "product-card" +
        (options.featuredStyle ? " product-card--featured" : "") +
        (options.mobileOnly ? " product-card--mobile-only" : "");

      const badgeHtml = product.badge
        ? '<span class="badge badge--' + product.badge.variant + '">' + product.badge.label + "</span>"
        : "";

      // Home (options.detailsAsLink) linka para a página de detalhes certa
      // (marmitas.html ou frios-antepastos.html, conforme a categoria do
      // produto — ver resolveProductPageUrl) já indicando qual produto
      // abrir (?produto=id). O script daquela página lê esse parâmetro e
      // abre o modal de detalhes sozinho, assim que a página carrega, em
      // vez de deixar o visitante procurar o produto de novo no grid.
      const detailsButtonHtml = options.detailsAsLink
        ? '<a href="' +
          resolveProductPageUrl(product) +
          "?produto=" +
          encodeURIComponent(product.id) +
          '" class="btn btn--outline">Ver mais</a>'
        : '<button type="button" class="btn btn--outline" data-action="open-product" data-product-id="' +
          product.id +
          '">Ver mais</button>';

      const priceHtml = isQuote
        ? '<span class="price__value price__value--quote">Clique para fazer seu orçamento</span>'
        : '<span class="price__value">' + utils.formatPrice(product.price) + "</span>";

      const orderMessage = isQuote
        ? "Olá! Gostaria de fazer um orçamento para: " + product.name + "."
        : "Olá! Gostaria de pedir: " + product.name + " (" + utils.formatPrice(product.price) + ").";
      const orderButtonLabel = isQuote ? "Fazer orçamento" : "Pedir agora";

      // Sem foto definitiva ainda (ex: Frios e Antepastos, campo "image"
      // omitido em data.js): cai no placeholder tracejado padrão do site
      // em vez de um <img> quebrado apontando para um arquivo inexistente.
      const mediaHtml = product.image
        ? '<img class="media-placeholder media-placeholder--card" src="' +
          product.image +
          '" alt="' +
          product.imageLabel +
          '" loading="lazy" />'
        : '<div class="media-placeholder media-placeholder--card"><span class="media-placeholder__label">Foto em breve</span></div>';

      article.innerHTML =
        '<div class="product-card__media">' +
        badgeHtml +
        mediaHtml +
        "</div>" +
        '<div class="product-card__body">' +
        '<h3 class="product-card__name">' +
        product.name +
        "</h3>" +
        '<p class="product-card__description">' +
        product.description +
        "</p>" +
        '<div class="product-card__meta"><span>' +
        product.weight +
        "</span></div>" +
        '<div class="product-card__footer">' +
        '<div class="price">' +
        priceHtml +
        "</div>" +
        '<div class="product-card__actions">' +
        detailsButtonHtml +
        '<a class="btn btn--primary" target="_blank" rel="noopener" href="' +
        utils.buildWhatsAppLink(orderMessage) +
        '">' +
        orderButtonLabel +
        "</a>" +
        "</div>" +
        "</div>" +
        "</div>";

      return article;
    },

    /**
     * Monta o HTML interno do modal de detalhes de UM produto (marmita ou
     * item de Frios e Antepastos) — usado tanto em marmitas.js quanto em
     * frios.js, por isso vive aqui e não em nenhum dos dois.
     * `options.returnToComboId`, quando presente, faz aparecer o botão
     * "Voltar para o combo" (só se aplica a marmitas.html, que tem
     * combos; frios.js nunca passa essa opção). O id fica guardado no
     * próprio botão via data-combo-id, para o clique saber para qual
     * combo voltar sem depender de nenhuma variável externa/compartilhada.
     */
    buildProductModalBody(product, options) {
      options = options || {};
      const isQuote = product.price == null; // "sob consulta" (ex: Frios e Antepastos)

      const backButtonHtml = options.returnToComboId
        ? '<button type="button" class="modal__back" data-action="back-to-combo" data-combo-id="' +
          options.returnToComboId +
          '">' +
          ICONS.chevronLeft +
          "Voltar para o combo</button>"
        : "";

      const badgeHtml = product.badge ? '<span class="badge badge--' + product.badge.variant + '">' + product.badge.label + "</span>" : "";

      // Sem foto definitiva ainda: mesmo placeholder tracejado usado no
      // product-card (ver createProductCard acima).
      const mediaHtml = product.image
        ? '<img class="media-placeholder media-placeholder--wide product-modal__media" src="' +
          product.image +
          '" alt="' +
          product.imageLabel +
          '" loading="lazy" />'
        : '<div class="media-placeholder media-placeholder--wide product-modal__media"><span class="media-placeholder__label">Foto em breve</span></div>';

      const priceHtml = isQuote
        ? '<span class="price__value price__value--quote">Clique para fazer seu orçamento</span>'
        : '<span class="price__value">' + utils.formatPrice(product.price) + "</span>";

      const orderMessage = isQuote
        ? "Olá! Gostaria de fazer um orçamento para: " + product.name + "."
        : "Olá! Gostaria de pedir: " + product.name + " (" + utils.formatPrice(product.price) + ").";
      const orderButtonLabel = isQuote ? "Fazer orçamento" : "Peça esta marmita";

      return (
        backButtonHtml +
        '<div class="modal__header">' +
        badgeHtml +
        '<h2 class="modal__title" id="productModalTitle">' +
        product.name +
        "</h2>" +
        "</div>" +
        mediaHtml +
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
        '<div class="product-modal__footer">' +
        '<div class="price">' +
        priceHtml +
        "</div>" +
        '<a class="btn btn--primary" target="_blank" rel="noopener" href="' +
        utils.buildWhatsAppLink(orderMessage) +
        '">' +
        orderButtonLabel +
        "</a>" +
        "</div>"
      );
    },
  };

  // Publica tudo no namespace global.
  window.EB.utils = utils;
  window.EB.modal = modal;
  window.EB.menu = menu;
  window.EB.nav = nav;
  window.EB.components = components;

  /* ======================================================================
     BOOTSTRAP — roda assim que o HTML termina de carregar, em toda página
     que inclui main.js.
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    utils.wireStaticWhatsAppLinks();
    menu.init();
    nav.highlightActiveLink();

    // Mantém o ano do copyright do footer sempre correto, sem precisar
    // editar manualmente os 3 arquivos HTML a cada virada de ano.
    const currentYearEl = document.getElementById("currentYear");
    if (currentYearEl) {
      currentYearEl.textContent = new Date().getFullYear();
    }

    // Listener global da tecla Esc: fecha o modal aberto (se houver) ou,
    // se não houver modal aberto, fecha o menu mobile (se estiver
    // aberto). 
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }
      const openOverlay = document.querySelector(".modal-overlay.is-open");
      if (openOverlay) {
        modal.close(openOverlay);
      } else {
        menu.closeIfOpen();
      }
    });
  });
})();
