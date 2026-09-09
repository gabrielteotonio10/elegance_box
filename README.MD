# Elegance Box

Site institucional e catálogo digital da **Elegance Box**, marca de marmitas congeladas gourmet que também oferece frios, antepastos e box de presente. O site apresenta o cardápio, permite montar combos personalizados com desconto calculado automaticamente e direciona todo pedido para o WhatsApp da marca.

**Site no ar:** https://elegance-box.vercel.app/

---

## Sobre o projeto

A Elegance Box não tem carrinho de compras nem checkout próprio — o papel do site é **apresentar bem o produto e facilitar o pedido pelo WhatsApp**. Por isso ele foi construído como um site estático simples (sem back-end, sem banco de dados, sem build), com foco em:

- Um catálogo de marmitas navegável e filtrável por categoria.
- Um "monte seu combo" onde o cliente escolhe as marmitas que quiser e vê, em tempo real, o total e o desconto por quantidade.
- Combos prontos com preço fechado, para quem prefere não montar do zero.
- Uma página separada de Frios e Antepastos (itens sob consulta, sem preço fixo).
- Botões de pedido que já abrem o WhatsApp com a mensagem preenchida.

## Stack técnica

- **HTML, CSS e JavaScript puros** — sem framework, sem bundler, sem etapa de build.
- **Vercel** para deploy (site estático servido diretamente).
- Estado da UI (carrinho do combo personalizado, filtros, modais) mantido em JavaScript no navegador, via um namespace global `EB` (`window.EB`) compartilhado entre as páginas.

Não há dependências de terceiros para instalar — abrir os arquivos `.html` (ou servi-los por um servidor estático simples) já é suficiente para rodar o projeto localmente.

## Estrutura do projeto

```
├── index.html                 → Home institucional
├── marmitas.html               → Cardápio de marmitas + monte seu combo + combos prontos
├── frios-antepastos.html       → Catálogo de frios e antepastos (sob consulta)
├── contato.html                → Página de contato
│
├── css/
│   ├── reset.css               → Reset de estilos base
│   ├── variables.css           → Tokens de design (cores, tipografia, espaçamento, breakpoints)
│   ├── global.css              → Componentes reaproveitados em todas as páginas (header, footer,
│   │                              botões, cards de produto/combo, modais)
│   ├── home.css                → Estilos específicos da Home
│   ├── marmitas.css             → Estilos específicos do Cardápio/monte seu combo
│   ├── frios.css               → Estilos específicos de Frios e Antepastos
│   └── contato.css              → Estilos específicos do Contato
│
├── js/
│   ├── data.js                  → Fonte única de dados: produtos, combos, preços e regras de desconto
│   ├── main.js                  → Funções compartilhadas entre páginas (cards, modais, WhatsApp, menu)
│   ├── home.js                  → Lógica específica da Home
│   ├── marmitas.js              → Lógica do Cardápio, do "monte seu combo" e dos combos prontos
│   └── frios.js                 → Lógica da página de Frios e Antepastos
│
├── img/                          → Fotos de produtos, logo e imagens institucionais
└── others/                       → Referências de layout/planejamento (PDFs e anotações), fora do site
```

## Como funciona o "monte seu combo"

O desconto do combo personalizado é calculado por **grupos**, não empilhando percentuais:

1. Cada marmita do carrinho entra em exatamente um grupo: **grupos de quantidade** (mesmo sabor, N unidades) ganham desconto por quantidade; o restante cai no **grupo variado** (sabores diferentes), que ganha desconto por variedade.
2. Cada grupo tem sua própria faixa de desconto conforme o total de marmitas nele.
3. O total final é a soma dos grupos já com desconto aplicado — sem dupla contagem.

As faixas de desconto e os combos prontos (preço fixo) ficam centralizados em `js/data.js`, então qualquer ajuste de preço ou de regra de desconto é feito em um único lugar.

## Deploy

O projeto está publicado na Vercel como site estático (sem configuração de build necessária — a Vercel serve os arquivos `.html`/`.css`/`.js` diretamente). Qualquer push para a branch principal gera um novo deploy automaticamente.
