/* Funções compartilhadas por todas as páginas: utilitários, modais, menu
   mobile, navegação e componentes de UI montados via JS. */

window.EB = window.EB || {};

(function () {
  "use strict";

  const utils = {
    // Formata um número como moeda brasileira (21.9 -> "R$ 21,90").
    formatPrice(value) {
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    },

    // Monta a URL do WhatsApp com a mensagem já preenchida.
    buildWhatsAppLink(message) {
      const base = "https://wa.me/" + EB.data.WHATSAPP_NUMBER;
      return message ? base + "?text=" + encodeURIComponent(message) : base;
    },

    // Preenche o href dos links de WhatsApp fixos do HTML ([data-wa-cta]).
    wireStaticWhatsAppLinks() {
      const links = document.querySelectorAll("[data-wa-cta]");
      links.forEach(function (link) {
        const message = link.getAttribute("data-wa-message") || "";
        link.setAttribute("href", utils.buildWhatsAppLink(message));
      });
    },
  };

  /* Abrir/fechar modal, reaproveitado pelos 3 modais do Cardápio. */
  const modal = {
    // Abre o modal, trava a rolagem da página e move o foco para dentro dele.
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

    // Fecha o modal e devolve o foco a quem o abriu.
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

    // Fecha sem transição, para quando outro modal abre logo em seguida.
    closeInstantly(overlay) {
      overlay.classList.add("is-closing-instant");
      void overlay.offsetWidth;
      modal.close(overlay);
      requestAnimationFrame(function () {
        overlay.classList.remove("is-closing-instant");
      });
    },

    // Fecha qualquer modal aberto (usado pelo Esc).
    closeAny() {
      const openOverlay = document.querySelector(".modal-overlay.is-open");
      if (openOverlay) {
        modal.requestClose(openOverlay);
      }
    },

    // Fechamento "pedido pelo usuário" (X, clique fora, Esc): se a página
    // registrou overlay._onRequestClose (ex: voltar para o combo/builder
    // em vez de fechar tudo), usa isso; senão fecha normalmente.
    requestClose(overlay) {
      if (typeof overlay._onRequestClose === "function") {
        overlay._onRequestClose();
      } else {
        modal.close(overlay);
      }
    },

    // Liga o fechamento por botão X e por clique no fundo.
    initClosers(overlay) {
      overlay.querySelectorAll("[data-modal-close]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          modal.requestClose(overlay);
        });
      });

      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          modal.requestClose(overlay);
        }
      });
    },
  };

  /* Menu mobile (hambúrguer). */
  const menu = {
    init() {
      const toggle = document.getElementById("mobileMenuToggle");
      const overlay = document.getElementById("mobileMenu");
      const closeBtn = document.getElementById("mobileMenuClose");

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

      overlay.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", close);
      });

      menu.closeIfOpen = function () {
        if (overlay.classList.contains("is-open")) {
          close();
        }
      };
    },

    closeIfOpen() {},
  };

  /* Marca com .is-active o link do menu da página atual. */
  const nav = {
    highlightActiveLink() {
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

  /* Componentes de UI montados via JS e usados em mais de uma página. */

  const ICONS = {
    chevronLeft:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
  };

  // Cada produto tem sua página de detalhes conforme a categoria.
  function resolveProductPageUrl(product) {
    return product.category.indexOf("frios-antepastos") !== -1 ? "frios-antepastos.html" : "marmitas.html";
  }

  const components = {
    /**
     * Cria o card de um produto (.product-card).
     *
     * @param {object} product - item de EB.data.PRODUCTS.
     * @param {object} [options]
     * @param {boolean} [options.detailsAsLink] - "Ver mais" vira link para a
     *   página de detalhes (usado na Home) em vez de abrir o modal.
     * @param {boolean} [options.featuredStyle] - sombra de destaque.
     * @param {boolean} [options.mobileOnly] - esconde o card acima de 768px.
     */
    createProductCard(product, options) {
      options = options || {};
      const isQuote = product.price == null; // sem preço fixo (Frios e Antepastos)
      const article = document.createElement("article");
      article.className =
        "product-card" +
        (options.featuredStyle ? " product-card--featured" : "") +
        (options.mobileOnly ? " product-card--mobile-only" : "") +
        (isQuote ? " product-card--quote" : "");

      const badgeHtml = product.badge
        ? '<span class="badge badge--' + product.badge.variant + '">' + product.badge.label + "</span>"
        : "";

      // ?produto=id faz a página de destino abrir o modal sozinha ao carregar.
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

      // Produtos sem foto caem no placeholder padrão.
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
     * Monta o conteúdo do modal de detalhes de um produto.
     * options.returnToComboId mostra "Voltar para o combo";
     * options.returnToBuilder mostra "Voltar para o combo personalizado".
     * Os dois são mutuamente exclusivos.
     */
    buildProductModalBody(product, options) {
      options = options || {};
      const isQuote = product.price == null;

      let backButtonHtml = "";
      if (options.returnToComboId) {
        backButtonHtml =
          '<button type="button" class="modal__back" data-action="back-to-combo" data-combo-id="' +
          options.returnToComboId +
          '">' +
          ICONS.chevronLeft +
          "Voltar para o combo</button>";
      } else if (options.returnToBuilder) {
        backButtonHtml =
          '<button type="button" class="modal__back" data-action="back-to-builder">' +
          ICONS.chevronLeft +
          "Voltar para o combo personalizado</button>";
      }

      const badgeHtml = product.badge ? '<span class="badge badge--' + product.badge.variant + '">' + product.badge.label + "</span>" : "";

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

  window.EB.utils = utils;
  window.EB.modal = modal;
  window.EB.menu = menu;
  window.EB.nav = nav;
  window.EB.components = components;

  /* Roda em toda página que inclui main.js. */
  document.addEventListener("DOMContentLoaded", function () {
    utils.wireStaticWhatsAppLinks();
    menu.init();
    nav.highlightActiveLink();

    const currentYearEl = document.getElementById("currentYear");
    if (currentYearEl) {
      currentYearEl.textContent = new Date().getFullYear();
    }

    // Esc fecha o modal aberto ou, se não houver, o menu mobile.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }
      const openOverlay = document.querySelector(".modal-overlay.is-open");
      if (openOverlay) {
        modal.requestClose(openOverlay);
      } else {
        menu.closeIfOpen();
      }
    });
  });
})();
