if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart = document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        this.hideErrors = this.dataset.hideErrors === "true";
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;
        this.handleErrorMessage();
        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".loading-overlay__spinner")?.classList.remove(
          "hidden",
        );
        this.submitButton
          .querySelector("[data-addtocart-text]")
          .classList.add("hidden");

        const formData = new FormData(this.form);
        const variantId = formData.get("id");
        const requestedQty = parseInt(formData.get("quantity"), 10) || 1;

        // Shopify's /cart/add has a limit of ~20 items per request.
        // To work around this, first check the cart for existing items of
        // this variant, then use /cart/update to set the total quantity directly.
        fetch(`${window.routes?.cart_url || "/cart"}.js`)
          .then((res) => res.json())
          .then((cart) => {
            const existingQty = (cart.items || [])
              .filter((item) => String(item.variant_id) === String(variantId))
              .reduce((sum, item) => sum + (item.quantity || 0), 0);
            const newTotalQty = existingQty + requestedQty;

            if (existingQty > 0) {
              // Variant already in cart — use /cart/update to set total quantity
              // Check quantity_rule.max and cap if needed
              const qtyInput = document.querySelector(
                "input[data-input-quantity]",
              );
              const maxRule = qtyInput
                ? parseInt(qtyInput.getAttribute("data-max-rule"), 10)
                : NaN;
              let cappedTotalQty = newTotalQty;
              let wasCapped = false;
              if (!isNaN(maxRule) && maxRule > 0 && newTotalQty > maxRule) {
                cappedTotalQty = maxRule;
                wasCapped = true;
              }

              // If capped and already at max, skip the update entirely — just show error
              if (wasCapped && existingQty >= cappedTotalQty) {
                return {
                  updateResponse: null,
                  isUpdate: true,
                  wasCapped,
                  maxRule,
                  cappedTotalQty,
                };
              }

              const sections = this.cart
                ? this.cart.getSectionsToRender().map((s) => s.id)
                : [];
              const body = JSON.stringify({
                updates: { [variantId]: cappedTotalQty },
                sections: sections,
                sections_url: window.location.pathname,
              });
              return fetch(`${routes.cart_update_url}`, {
                ...fetchConfig(),
                body,
              })
                .then((r) => r.json())
                .then((updateResponse) => {
                  return {
                    updateResponse,
                    isUpdate: true,
                    wasCapped,
                    maxRule,
                    cappedTotalQty,
                  };
                });
            } else {
              // Variant not in cart — use normal /cart/add
              const config = fetchConfig("javascript");
              config.headers["X-Requested-With"] = "XMLHttpRequest";
              delete config.headers["Content-Type"];
              if (this.cart) {
                formData.append(
                  "sections",
                  this.cart.getSectionsToRender().map((section) => section.id),
                );
                formData.append("sections_url", window.location.pathname);
              }
              config.body = formData;
              return fetch(`${routes.cart_add_url}`, config)
                .then((r) => r.json())
                .then((addResponse) => ({ addResponse, isUpdate: false }));
            }
          })
          .then((result) => {
            if (result.isUpdate) {
              // Handled via /cart/update
              if (result.wasCapped) {
                const errorMsg = this.dataset.quantityError || "";
                this.handleErrorMessage(errorMsg);
                this.error = true;
                // Ensure drawer stays closed
                if (this.cart) {
                  this.cart.classList.remove("active");
                  document.querySelector("body").classList.remove("no-scroll");
                }
                // Sync quantity label with actual cart state
                const cartItemsEl = document.querySelector("cart-items");
                if (
                  cartItemsEl &&
                  typeof cartItemsEl.syncProductCartQuantityLabel === "function"
                ) {
                  cartItemsEl.syncProductCartQuantityLabel();
                }
                return;
              }
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: "product-form",
                productVariantId: variantId,
              });
              this.error = false;
              if (
                document.querySelector("#product-quic-kview") &&
                document
                  .querySelector("#product-quic-kview")
                  .classList.contains("active")
              ) {
                document
                  .querySelector("#product-quic-kview")
                  .classList.remove("active");
              }
              if (this.cart) {
                // Fetch fresh drawer HTML since /cart/update sections format differs
                fetch(`${routes.cart_url}?section_id=mini-cart`)
                  .then((res) => res.text())
                  .then((html) => {
                    const parsedHtml = new DOMParser().parseFromString(
                      html,
                      "text/html",
                    );
                    const sourceCartDrawer =
                      parsedHtml.querySelector("cart-drawer");
                    const targetCartDrawer =
                      document.querySelector("cart-drawer");
                    if (targetCartDrawer && sourceCartDrawer) {
                      targetCartDrawer.innerHTML = sourceCartDrawer.innerHTML;
                    }
                    const miniCartEl = parsedHtml.querySelector("mini-cart");
                    if (miniCartEl) {
                      const totalCount =
                        miniCartEl.getAttribute("data-cart-count");
                      if (document.querySelector("#cartDrawer-count")) {
                        document.querySelector(
                          "#cartDrawer-count",
                        ).textContent = "(" + totalCount + ")";
                      }
                      if (document.querySelector("[data-header-cart-count]")) {
                        const headerCount = document.querySelector(
                          "[data-header-cart-count]",
                        );
                        headerCount.classList.toggle("hidden", totalCount == 0);
                        if (totalCount > 0 && totalCount < 100) {
                          headerCount.textContent = totalCount;
                        }
                      }
                    }
                    if (document.querySelector("#cart-upsell-product")) {
                      themeSlidersInit($("#cart-upsell-product"));
                    }
                    const shippingWrapper = document.querySelector(
                      "#mini-cart .free-shipping-wrapper",
                    );
                    if (shippingWrapper) {
                      shippingWrapper.classList.remove("hidden");
                    }
                    this.cart.classList.add("active");
                    document.querySelector("body").classList.add("no-scroll");
                    this.cart
                      .querySelectorAll("[data-sideDrawer-close]")
                      .forEach((button) =>
                        button.addEventListener("click", (e) => {
                          e.preventDefault();
                          this.cart.classList.remove("active");
                          document
                            .querySelector("body")
                            .classList.remove("no-scroll");
                        }),
                      );
                    const cartItemsEl = document.querySelector("cart-items");
                    if (
                      cartItemsEl &&
                      typeof cartItemsEl.syncProductCartQuantityLabel ===
                        "function"
                    ) {
                      cartItemsEl.syncProductCartQuantityLabel();
                    }
                  })
                  .catch((e) => console.error(e));
              }
            } else {
              // Handled via /cart/add
              const response = result.addResponse;
              if (response.status) {
                publish(PUB_SUB_EVENTS.cartError, {
                  source: "product-form",
                  productVariantId: variantId,
                  errors: response.description,
                  message: response.message,
                });
                this.handleErrorMessage(response.description);
                this.submitButton.setAttribute("aria-disabled", true);
                this.error = true;
                const cartItemsEl = document.querySelector("cart-items");
                if (
                  cartItemsEl &&
                  typeof cartItemsEl.syncProductCartQuantityLabel === "function"
                ) {
                  cartItemsEl.syncProductCartQuantityLabel();
                }
                return;
              } else if (!this.cart) {
                window.location = window.routes.cart_url;
                return;
              }
              if (!this.error)
                publish(PUB_SUB_EVENTS.cartUpdate, {
                  source: "product-form",
                  productVariantId: variantId,
                });
              this.error = false;
              if (
                document.querySelector("#product-quic-kview") &&
                document
                  .querySelector("#product-quic-kview")
                  .classList.contains("active")
              ) {
                document
                  .querySelector("#product-quic-kview")
                  .classList.remove("active");
              }
              if (this.cart) {
                this.cart.renderContents(response);
                this.cart.classList.add("active");
                let cartItemsElement = this.cart.querySelector(
                  ".side-drawer-modal-inner",
                );
                setTimeout(function () {
                  focusElement == "" && (focusElement = this.submitButton);
                  trapFocusElements(cartItemsElement);
                }, 1500);
                const cartItemsEl = document.querySelector("cart-items");
                if (
                  cartItemsEl &&
                  typeof cartItemsEl.syncProductCartQuantityLabel === "function"
                ) {
                  cartItemsEl.syncProductCartQuantityLabel();
                }
              }
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            this.submitButton
              .querySelector("[data-addtocart-text]")
              .classList.remove("hidden");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading-overlay__spinner")?.classList.add(
              "hidden",
            );
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message",
          );
        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);
        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    },
  );
}
