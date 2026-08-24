if (!customElements.get("volume-pricing")) {
  customElements.define(
    "volume-pricing",
    class ProductVolumePricingTable extends HTMLElement {
      connectedCallback() {
        this._bindQuantityInput();
        this._updateActiveRow();
      }

      _expandToggle() {
        this.classList.toggle("volume-pricing--expanded");
        const toggle = this.querySelector("[data-volume-pricing-toggle]");
        if (toggle) {
          toggle.setAttribute(
            "aria-expanded",
            this.classList.contains("volume-pricing--expanded"),
          );
        }
      }

      _bindQuantityInput() {
        if (this._qtyBound) return;
        const quantityWrapper =
          this.closest("quantity-input") ||
          this.parentElement?.closest("quantity-input") ||
          this._findSiblingQuantityInput();
        if (!quantityWrapper) return;

        const input = quantityWrapper.querySelector(
          'input[name="quantity"], input[name="updates[]"]',
        );
        if (!input) return;

        this._quantityInput = input;
        this._onQtyChange = () => this._updateActiveRow();
        input.addEventListener("change", this._onQtyChange);
        input.addEventListener("input", this._onQtyChange);
        this._qtyBound = true;
      }

      _findSiblingQuantityInput() {
        let el = this.parentElement;
        while (
          el &&
          !el.matches(
            "form, .product-view-content, .featured-product-card, .cart-product-qty, .minicart-products",
          )
        ) {
          const qtyInput = el.querySelector("quantity-input");
          if (qtyInput && qtyInput !== this) return qtyInput;
          el = el.parentElement;
        }
        if (el) {
          const qtyInput = el.querySelector("quantity-input");
          if (qtyInput) return qtyInput;
        }
        return null;
      }

      _updateActiveRow() {
        const qty = this._getCurrentQuantity();
        const rows = this.querySelectorAll(
          ".volume-pricing__row[data-quantity]",
        );
        const sortedRows = Array.from(rows).sort(
          (a, b) =>
            parseInt(a.dataset.quantity, 10) - parseInt(b.dataset.quantity, 10),
        );

        sortedRows.forEach((row) =>
          row.classList.remove("volume-pricing__row--active"),
        );

        let activeRow = null;
        for (const row of sortedRows) {
          const minQty = parseInt(row.dataset.quantity, 10);
          if (qty >= minQty) {
            activeRow = row;
          }
        }
        if (activeRow) {
          activeRow.classList.add("volume-pricing__row--active");
        }
      }

      _getCurrentQuantity() {
        if (!this._quantityInput) return 1;
        const input = this._quantityInput;
        const cartQty =
          parseInt(input.getAttribute("data-cart-quantity") || "0", 10) || 0;
        const inputQty = parseInt(input.value, 10) || 1;
        return cartQty + inputQty;
      }

      disconnectedCallback() {
        if (this._quantityInput && this._onQtyChange) {
          this._quantityInput.removeEventListener("change", this._onQtyChange);
          this._quantityInput.removeEventListener("input", this._onQtyChange);
        }
      }
    },
  );
}

/* Event delegation for volume-pricing toggles — works reliably for all contexts including dynamic content */
if (!window.__volumePricingToggleBound) {
  window.__volumePricingToggleBound = true;
  document.addEventListener("click", function (e) {
    const toggle = e.target.closest("[data-volume-pricing-toggle]");
    if (!toggle) return;
    const wrapper = toggle.closest(".volume-pricing, volume-pricing");
    if (!wrapper) return;
    wrapper.classList.toggle("volume-pricing--expanded");
    toggle.setAttribute(
      "aria-expanded",
      wrapper.classList.contains("volume-pricing--expanded"),
    );
  });
}
