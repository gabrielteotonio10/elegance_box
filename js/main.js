/* ==========================================================================
   MAIN.JS
   Comportamento compartilhado por TODAS as páginas: utilitários (preço,
   link do WhatsApp), o mecanismo genérico de abrir/fechar modais, o menu
   mobile (hambúrguer) e a marcação automática do link de navegação ativo.

   Lógica que só existe em UMA página (renderizar o grid do Cardápio, os
   3 modais de produto/combo, os destaques da Home) fica em cardapio.js /
   home.js — este arquivo não conhece produtos nem combos.

   Depende de data.js já ter sido carregado antes (usa EB.data.WHATSAPP_NUMBER).
   ========================================================================== */

window.EB = window.EB || {};

(function () {
  "use strict";

  /* ======================================================================
     EB.utils — funções puras de formatação/link, sem efeito colateral no
     DOM. Reaproveitadas por home.js e cardapio.js.
     ====================================================================== */
  const utils = {
    /**
     * Formata um número (ex: 21.9) como moeda brasileira (ex: "R$ 21,90").
     * Centralizado aqui para todo preço do site usar exatamente o mesmo
     * formato, em vez de cada arquivo montar a string manualmente.
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
     * encodeURIComponent() é o que permite escrever a mensagem em
     * português normal (com acentos, espaços, R$, etc.) em vez de termos
     * que montar a URL já codificada manualmente.
     */
    buildWhatsAppLink(message) {
      const base = "https://wa.me/" + EB.data.WHATSAPP_NUMBER;
      return message ? base + "?text=" + encodeURIComponent(message) : base;
    },

    /**
     * Liga os botões/links de WhatsApp "estáticos" do HTML (header, hero,
     * CTA final, footer, cards de contato) à mensagem correta.
     * Em vez de escrever a URL do WhatsApp já codificada dentro do
     * atributo href de cada link no HTML (o que exigiria escrever
     * manualmente %20, %C3%A9, etc. e ficaria ilegível/difícil de editar),
     * cada link só precisa do atributo data-wa-message com o texto puro
     * em português. Esta função roda uma vez, ao carregar a página, e
     * transforma esse texto no link final do WhatsApp.
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
     pelos 3 modais do Cardápio (produto, combo, monte-seu-combo). Cada
     modal é um <div class="modal-overlay"> com um <div class="modal">
     dentro; a visibilidade é controlada pela classe .is-open.
     ====================================================================== */
  const modal = {
    /**
     * Abre um modal: mostra o overlay, bloqueia a rolagem da página por
     * trás (para o usuário não rolar o conteúdo "escondido") e move o
     * foco do teclado para dentro do modal — essencial para
     * acessibilidade, já que sem isso um usuário de teclado/leitor de
     * tela continuaria "preso" no conteúdo da página por trás do modal.
     * `trigger` é o elemento que foi clicado para abrir o modal (o botão
     * "Ver mais", por exemplo); guardamos essa referência para devolver o
     * foco a ele quando o modal for fechado.
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
     * originalmente o abriu. Só remove o bloqueio de rolagem do body se
     * não houver NENHUM outro modal (ou o menu mobile) ainda aberto —
     * isso evita que, ao fechar o modal de produto aberto por cima do
     * modal de combo, a página "por trás de tudo" volte a rolar
     * indevidamente.
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
     * produto). Sem isso, o fade-out de ~250ms de um modal se sobrepõe
     * ao fade-in do próximo, e os dois conteúdos ficam visíveis ao mesmo
     * tempo por um instante — a troca fica "suja" em vez de instantânea.
     * A classe .is-closing-instant zera a transição só durante essa
     * remoção específica (ver global.css); o "void overlay.offsetWidth"
     * força o navegador a aplicar esse estilo antes de tirá-lo de novo no
     * próximo frame, senão as duas mudanças de classe aconteceriam rápido
     * demais para o navegador "perceber" que uma transição deveria ser
     * pulada.
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
     * escurecido). Deve ser chamado uma vez por modal, na inicialização
     * da página que o contém (cardapio.js).
     */
    initClosers(overlay) {
      overlay.querySelectorAll("[data-modal-close]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          modal.close(overlay);
        });
      });

      // Fecha ao clicar no overlay, mas SÓ se o clique foi no próprio
      // overlay (o fundo) e não em algum elemento dentro do .modal — por
      // isso a checagem `event.target === overlay`, em vez de reagir a
      // qualquer clique que "borbulhe" (bubble) até o overlay.
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          modal.close(overlay);
        }
      });
    },
  };

  /* ======================================================================
     EB.menu — menu mobile (hambúrguer). Presente em todas as páginas,
     pois o header (com o botão hambúrguer) é duplicado em cada uma.
     ====================================================================== */
  const menu = {
    init() {
      const toggle = document.getElementById("mobileMenuToggle");
      const overlay = document.getElementById("mobileMenu");
      const closeBtn = document.getElementById("mobileMenuClose");

      // Páginas sem os 3 elementos acima simplesmente não têm menu mobile
      // (não deveria acontecer, já que o header é padrão, mas evita erro
      // em tempo de execução caso algum dia um markup fique incompleto).
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
      // WhatsApp) — evita que o menu continue "aberto" visualmente
      // durante a transição para a próxima página.
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
    // menu mobile na página (ver checagem `!toggle || !overlay...` acima).
    closeIfOpen() {},
  };

  /* ======================================================================
     EB.nav — marca automaticamente o link do menu (desktop + mobile)
     correspondente à página atual com a classe .is-active.
     Em vez de exigir que cada página HTML lembre de adicionar essa classe
     manualmente no link certo (fácil de esquecer/errar ao duplicar o
     header em 3 arquivos), comparamos o href de cada link com o nome do
     arquivo atual da URL.
     ====================================================================== */
  const nav = {
    highlightActiveLink() {
      // "index.html" quando a URL termina em "/" (ex: acessando a raiz
      // do site hospedado), senão o nome real do arquivo (ex:
      // "cardapio.html").
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
  const components = {
    /**
     * Cria o card de uma marmita (.product-card), usado tanto na grade
     * completa do Cardápio quanto nos 3 destaques da Home.
     *
     * @param {object} product - um item de EB.data.PRODUCTS.
     * @param {object} [options]
     * @param {boolean} [options.detailsAsLink] - quando true, o botão
     *   "Ver mais" vira um link comum para cardapio.html (usado na Home,
     *   que não tem o modal de detalhes no próprio HTML). Quando
     *   false/omitido, "Ver mais" é um <button> que dispara a abertura do
     *   modal via JS (usado no Cardápio, onde cardapio.js trata o clique
     *   por delegação de evento, procurando por data-action="open-product").
     * @param {boolean} [options.featuredStyle] - aplica a sombra mais forte
     *   de destaque (.product-card--featured). É uma decisão de CONTEXTO
     *   (a Home passa true, pois ali os 3 cards são realmente uma vitrine
     *   selecionada), não uma propriedade do produto em si — por isso não
     *   é lida diretamente de product.featured: no grid completo do
     *   Cardápio, os 6 produtos devem ter o mesmo peso visual, mesmo que
     *   3 deles também estejam marcados como featured em EB.data.PRODUCTS
     *   (campo usado só para a Home saber QUAIS produtos exibir).
     */
    createProductCard(product, options) {
      options = options || {};
      const article = document.createElement("article");
      article.className = "product-card" + (options.featuredStyle ? " product-card--featured" : "");

      const badgeHtml = product.badge
        ? '<span class="badge badge--' + product.badge.variant + '">' + product.badge.label + "</span>"
        : "";

      const detailsButtonHtml = options.detailsAsLink
        ? '<a href="cardapio.html" class="btn btn--outline">Ver mais</a>'
        : '<button type="button" class="btn btn--outline" data-action="open-product" data-product-id="' +
          product.id +
          '">Ver mais</button>';

      const orderMessage = "Olá! Gostaria de pedir: " + product.name + " (" + utils.formatPrice(product.price) + ").";

      article.innerHTML =
        '<div class="product-card__media">' +
        badgeHtml +
        '<div class="media-placeholder media-placeholder--card"><span class="media-placeholder__label">' +
        product.imageLabel +
        "</span></div>" +
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
        "</span><span>" +
        product.kcal +
        ' kcal</span></div>' +
        '<div class="product-card__footer">' +
        '<div class="price"><span class="price__value">' +
        utils.formatPrice(product.price) +
        "</span></div>" +
        '<div class="product-card__actions">' +
        detailsButtonHtml +
        '<a class="btn btn--primary" target="_blank" rel="noopener" href="' +
        utils.buildWhatsAppLink(orderMessage) +
        '">Pedir agora</a>' +
        "</div>" +
        "</div>" +
        "</div>";

      return article;
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
    // aberto). Centralizado aqui em vez de em cada modal individualmente
    // porque o comportamento é idêntico para qualquer um deles.
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
