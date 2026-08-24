class CartRemoveItem extends HTMLElement {
  constructor() {
    super();
    this.querySelector("a").addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems = this.closest("cart-items");
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}
customElements.define("cart-remove-item-button", CartRemoveItem);

class CartItemsUpdate extends HTMLElement {
  constructor() {
    super();
    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);
    this.addEventListener("change", debouncedOnChange.bind(this));
  }
  cartUpdateUnsubscriber = undefined;
  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (event) => {
        if (event.source === "cart-items") {
          return;
        }
        this.onCartUpdate();
      },
    );
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }
  onChange(event) {
    this.updateQuantity(
      event.target.dataset.index,
      event.target.value,
      document.activeElement.getAttribute("name"),
    );
  }

  onCartUpdate() {
    const cartType = this.dataset.carttype;

    if (cartType === "mini") {
      // if (this.tagName === 'CART-ITEMS') {
      fetch(`${routes.cart_url}?section_id=mini-cart`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html",
          );
          const selectors = ["cart-items"];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }

          if (document.querySelector("#cart-upsell-product")) {
            themeSlidersInit($("#cart-upsell-product"));
          }
          const element = document.querySelector(
            "#mini-cart .free-shipping-wrapper",
          );
          if (element) {
            element.classList.remove("hidden");
          }
          shippingProgressBar(resultState.total_price);
        })
        .catch((e) => {
          console.error(e);
        });
    } else if (cartType === "main") {
      fetch(`${routes.cart_url}?section_id=main-cart`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html",
          );
          const cartItems = html.querySelector("cart-items");
          this.innerHTML = cartItems.innerHTML;

          const updatedMainCartSummary =
            html.querySelector("#main-cart-summary");
          if (updatedMainCartSummary) {
            document.querySelector("#main-cart-summary").innerHTML =
              updatedMainCartSummary.innerHTML;
          }
          // cartfootertab();
          const element = document.querySelector(
            "#mini-cart .free-shipping-wrapper",
          );
          if (element) {
            element.classList.remove("hidden");
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    const sections = [];
    if (document.getElementById("mini-cart")) {
      sections.push({
        id: "mini-cart",
        section: "mini-cart",
        selector: "mini-cart",
      });
    }
    if (document.getElementById("main-cart")) {
      sections.push({
        id: "main-cart",
        section: document.getElementById("main-cart")?.dataset.id,
        selector: ".cart-content",
      });
    }
    if (document.getElementById("main-cart-summary")) {
      sections.push({
        id: "main-cart-summary",
        section: document.getElementById("main-cart-summary")?.dataset.id,
        selector: ".cart-summary-inner",
      });
    }
    return sections;
  }

  updateQuantity(line, quantity, name) {
    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const resultState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) ||
          document.getElementById(`Drawer-Quantity-${line}`);
        const items = document.querySelectorAll(".product_cart-item");
        if (resultState.errors) {
          quantityElement.value = quantityElement.getAttribute("value");
          this.updateLiveRegions(line, resultState.errors);
          return;
        }
        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document
              .getElementById(section.id)
              .querySelector(section.selector) ||
            document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            resultState.sections[section.section],
            section.selector,
          );
          let totalCount = resultState.item_count;
          if (document.querySelector("#cartDrawer-count")) {
            document.querySelector("#cartDrawer-count").textContent =
              "(" + totalCount + ")";
          }

          if (document.querySelector("[data-header-cart-count]")) {
            if (
              document
                .querySelector("[data-header-cart-count]")
                .classList.contains("hidden")
            ) {
              document
                .querySelector("[data-header-cart-count]")
                .classList.remove("hidden");
            }
            if (totalCount == 0) {
              document
                .querySelector("[data-header-cart-count]")
                .classList.add("hidden");
            } else if (totalCount < 100) {
              document.querySelector("[data-header-cart-count]").textContent =
                totalCount;
            } else {
              document.querySelector("[data-header-cart-count]").textContent =
                "";
            }
          }
          if (document.querySelector("#cart-upsell-product")) {
            themeSlidersInit($("#cart-upsell-product"));
          }
          shippingProgressBar(resultState.total_price);
        });
        this.syncProductCartQuantityLabel();
        // cartfootertab();
        this.updateLiveRegions(line, resultState.errors || "");
      })
      .catch(() => {
        this.querySelectorAll(".loading-overlay").forEach((overlay) =>
          overlay.classList.add("hidden"),
        );
        const errors =
          document.getElementById("cart-errors") ||
          document.getElementById("CartDrawer-CartErrors");
      })
      .finally(() => {});
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) ||
      document.getElementById(`CartDrawer-Line-item-error-${line}`);
    if (lineItemError) {
      lineItemError.querySelector(".cart-item-error").innerHTML = message;
    }
  }

  syncProductCartQuantityLabel() {
    const labelEl = document.querySelector("[data-quantity-label-cart-count]");
    if (!labelEl) return;

    const section = labelEl.closest(
      ".shopify-section, .quickview-body-content, .featured-product-card, .product-view-content",
    );
    if (!section) return;

    const variantInput = section.querySelector('input[name="id"]');
    const variantId = variantInput ? parseInt(variantInput.value, 10) : null;
    if (!variantId) return;

    const inCartText =
      labelEl.closest("quantity-input")?.dataset?.inCartText || "in cart";

    fetch(`${window.routes?.cart_url || "/cart"}.js`)
      .then((res) => res.json())
      .then((cart) => {
        let count = 0;
        if (cart.items && Array.isArray(cart.items)) {
          count = cart.items
            .filter((item) => parseInt(item.variant_id, 10) === variantId)
            .reduce((sum, item) => sum + (item.quantity || 0), 0);
        }

        labelEl.textContent = `(${count} ${inCartText})`;
        labelEl.classList.toggle("hidden", count === 0);

        const qtyInput = section.querySelector(
          'quantity-input input[name="quantity"], input[data-input-quantity]',
        );
        if (qtyInput) {
          qtyInput.setAttribute("data-cart-quantity", String(count));
          var maxRule = qtyInput.getAttribute("data-max-rule");
          if (maxRule) {
            var maxRuleNum = parseInt(maxRule, 10);
            var adjustedMax = maxRuleNum - count;
            if (adjustedMax < 1) adjustedMax = 1;
            qtyInput.setAttribute("max", String(adjustedMax));
            var currentVal = parseInt(qtyInput.value, 10) || 1;
            if (currentVal > adjustedMax) {
              qtyInput.value = adjustedMax;
            }
          }
          qtyInput.dispatchEvent(
            new CustomEvent("change", {
              bubbles: true,
              detail: { syncOnly: true },
            }),
          );
        }

        const pricePerItem = section.querySelector("price-per-item");
        if (
          pricePerItem &&
          typeof pricePerItem.updatePriceDisplay === "function"
        ) {
          pricePerItem.updatePriceDisplay();
        }
      })
      .catch(() => {});
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }
}

customElements.define("cart-items", CartItemsUpdate);

if (!customElements.get("cart-note")) {
  customElements.define(
    "cart-note",
    class CartNote extends HTMLElement {
      constructor() {
        super();
        this.contentItems = this.querySelectorAll(".cart-tools-wrapper");
        this.addEventListener(
          "change",
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, {
              ...fetchConfig(),
              ...{ body },
            });
          }, ON_CHANGE_DEBOUNCE_TIMER),
        );
      }
    },
  );
}

class CartFooterContent extends HTMLElement {
  constructor() {
    super();
    this.dataItems = this.querySelectorAll("[data-details-item]");
    this.dataItemsContents = this.querySelectorAll(".cart-tools-wrapper");
    Array.from(this.dataItems).forEach(function (element, index) {
      if (
        index == 0 &&
        element.closest("li") &&
        !element.closest("mini-cart")
      ) {
        element.closest("li").classList.add("active");
        let firstItem = element.getAttribute("href");
        document.querySelector(firstItem).classList.add("active");
      }
    });
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("[data-details-item]").forEach((openItems) =>
      openItems.addEventListener("click", this.changeItems.bind(this)),
    );
    this.querySelectorAll("[data-close-details]").forEach((close) =>
      close.addEventListener("click", this.closeItems.bind(this)),
    );
  }

  changeItems(event) {
    event.preventDefault();
    const element = event.currentTarget;
    let itemHead = element.getAttribute("href");
    Array.from(this.dataItems).forEach(function (dataitem) {
      dataitem.closest("li").classList.remove("active");
    });
    element.closest("li").classList.add("active");
    Array.from(this.dataItemsContents).forEach(function (dataItemsContent) {
      dataItemsContent.classList.remove("active");
    });
    if (this.querySelector(itemHead).classList.contains("active")) {
      this.querySelector(itemHead).classList.remove("active");
    } else {
      this.querySelector(itemHead).classList.add("active");
    }
  }

  closeItems(event) {
    event.preventDefault();
    const element = event.currentTarget;
    if (this.querySelector("li.active").classList.contains("active")) {
      this.querySelector("li.active").classList.remove("active");
    }
    if (element.closest(".cart-tools-wrapper").classList.contains("active")) {
      element.closest(".cart-tools-wrapper").classList.remove("active");
    }
  }
}
customElements.define("cart-footer-content", CartFooterContent);
class ShippingCalculator extends HTMLElement {
  constructor() {
    super();
    this.setupCountries();
    this.zip = this.querySelector("#shippingZip");
    this.country = this.querySelector("#shippingCountry");
    this.province = this.querySelector("#shippingProvince");
    this.button = this.querySelector("button");
    this.errors = this.querySelector("#shippingErrors");
    this.success = this.querySelector("#shippingResponse");
    this.button.addEventListener("click", this.onSubmitHandler.bind(this));
  }

  setupCountries() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      new Shopify.CountryProvinceSelector(
        "shippingCountry",
        "shippingProvince",
        {
          hideElement: "shipping-province",
        },
      );
    }
  }
  onSubmitHandler(event) {
    event.preventDefault();
    this.errors.classList.add("hidden");
    this.success.classList.add("hidden");
    this.zip.classList.remove("invalid");
    this.country.classList.remove("invalid");
    this.province.classList.remove("invalid");
    this.button.classList.add("loading");
    this.button.setAttribute("disabled", true);

    const body = JSON.stringify({
      shipping_address: {
        zip: this.zip.value,
        country: this.country.value,
        province: this.province.value,
      },
    });
    let sectionUrl = `${window.routes.cart_url}/shipping_rates.json`;
    sectionUrl = sectionUrl.replace("//", "/");

    fetch(sectionUrl, { ...fetchConfig("javascript"), body })
      .then((response) => response.json())
      .then((result) => {
        if (result.shipping_rates) {
          if (result.shipping_rates.length > 0) {
            this.success.classList.remove("hidden");
            this.success.innerHTML = "";
            result.shipping_rates.forEach((rate) => {
              const child = document.createElement("p");
              child.innerHTML = `${rate.name}: ${rate.price} ${Shopify.currency.active}`;
              this.success.appendChild(child);
            });
          } else {
            this.errors.classList.remove("hidden");
            this.errors.innerHTML = "";
            this.errors.querySelector(".errors").textContent =
              "Cart shippings rates not available";
          }
        } else {
          let errors = [];
          Object.entries(result).forEach(([attribute, messages]) => {
            errors.push(
              `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} ${messages[0]}`,
            );
          });

          this.errors.classList.remove("hidden");
          this.errors.querySelector(".errors").innerHTML = errors.join("; ");
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.button.classList.remove("loading");
        this.button.removeAttribute("disabled");
      });
  }
}

customElements.define("shipping-calculator", ShippingCalculator);

if (typeof subscribe === "function" && typeof PUB_SUB_EVENTS !== "undefined") {
  subscribe(PUB_SUB_EVENTS.cartUpdate, function () {
    const cartItems = document.querySelector("cart-items");
    if (
      cartItems &&
      typeof cartItems.syncProductCartQuantityLabel === "function"
    ) {
      cartItems.syncProductCartQuantityLabel();
    }
  });
}
