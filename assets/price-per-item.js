if (!customElements.get("price-per-item")) {
  customElements.define(
    "price-per-item",
    class ProductPricePerUnit extends HTMLElement {
      constructor() {
        super();
        this._priceBreaks = [];
        this._boundUpdate = () => this.updatePriceDisplay();
      }

      connectedCallback() {
        this._parsePriceBreaks();
        this._attachListeners();
        this.updatePriceDisplay();
      }

      disconnectedCallback() {
        const wrapper = this.closest("quantity-input");
        const input = wrapper?.querySelector('input[name="quantity"]');
        if (input) {
          input.removeEventListener("change", this._boundUpdate);
          input.removeEventListener("input", this._boundUpdate);
        }
      }

      _parsePriceBreaks() {
        const minQty = parseInt(this.dataset.minQuantity || "", 10) || 1;
        const variantPrice = this.dataset.variantPrice;

        this._priceBreaks = [];
        if (variantPrice) {
          this._priceBreaks.push({ quantity: minQty, price: variantPrice });
        }
        if (this.dataset.priceBreaks) {
          try {
            const breaks = JSON.parse(this.dataset.priceBreaks);
            for (const b of breaks) {
              if (b.quantity != null && b.price) {
                this._priceBreaks.push({
                  quantity: parseInt(b.quantity, 10),
                  price: b.price,
                });
              }
            }
          } catch (e) {}
        }
        this._priceBreaks.sort((a, b) => b.quantity - a.quantity);
      }

      _attachListeners() {
        const wrapper = this.closest("quantity-input");
        const input = wrapper?.querySelector('input[name="quantity"]');
        if (input) {
          input.addEventListener("change", this._boundUpdate);
          input.addEventListener("input", this._boundUpdate);
        }
      }

      _getCurrentQuantity() {
        const wrapper = this.closest("quantity-input");
        const input = wrapper?.querySelector('input[name="quantity"]');
        if (!input) return 1;
        const cartQty =
          parseInt(input.getAttribute("data-cart-quantity") || "0", 10) || 0;
        const inputQty = parseInt(input.value, 10) || 1;
        return cartQty + inputQty;
      }

      updatePriceDisplay() {
        const textEl = this.querySelector(".price-per-item__text");
        if (!textEl || !this._priceBreaks.length) return;

        const qty = this._getCurrentQuantity();
        const atText = this.dataset.atText || "at";
        const eachText = this.dataset.eachText || "ea";

        const tier =
          this._priceBreaks.find((pb) => qty >= pb.quantity) ??
          this._priceBreaks[this._priceBreaks.length - 1];
        if (tier) {
          textEl.textContent = `${atText} ${tier.price}/${eachText}`;
        }
      }
    },
  );
}
