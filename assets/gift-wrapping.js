class GiftWrapping extends HTMLElement {
  constructor() {
    super();

    this.giftWrapId = this.dataset.giftWrapId;
    this.giftWrapping = this.dataset.giftWrapping;
    this.cartItemsSize = parseInt(this.getAttribute("cart-items-size"));
    this.giftWrapsInCart = parseInt(this.getAttribute("gift-wraps-in-cart"));
    this.itemsInCart = parseInt(this.getAttribute("items-in-cart"));
    this.querySelector("[add-gift-product]").addEventListener(
      "click",
      (event) => {
        this.setGiftWrap();
      },
    );
  }

  setGiftWrap() {
    const sections = this.getSectionsToRender().map(
      (section) => section.section,
    );
    const body = JSON.stringify({
      updates: {
        [this.giftWrapId]: this.itemsInCart,
      },
      attributes: {
        "gift-wrapping": true,
      },
      sections: sections,
      sections_url: window.location.pathname,
    });

    fetch(`${window.routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((response) => {
        const resultState = JSON.parse(response);
        this.getSectionsToRender().forEach((section) => {
          if (document.getElementById(section.id)) {
            const elementToReplace = document.getElementById(section.id);
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              resultState.sections[section.section],
              section.selector,
            );
          }
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }
  getSectionsToRender() {
    let maincartID = "#main-cart";
    let maincartfooter = "#main-cart";
    if (document.getElementById("main-cart")) {
      maincartID = document.getElementById("main-cart").dataset.id;
    }
    if (document.getElementById("main-cart-summary")) {
      maincartfooter = document.getElementById("main-cart-summary").dataset.id;
    }
    return [
      {
        id: "mini-cart",
        section: "mini-cart",
        selector: ".minicart",
      },
      {
        id: "main-cart",
        section: maincartID,
        selector: ".cart-content",
      },
      {
        id: "main-cart-summary",
        section: maincartfooter,
        selector: ".js-contents",
      },
    ];
  }
  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }
}
customElements.define("gift-wrapping", GiftWrapping);
