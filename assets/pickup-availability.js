if (!customElements.get("pickup-availability")) {
  class PickupAvailability extends HTMLElement {
    constructor() {
      super();
      if (!this.hasAttribute("available")) return;
      this.fetchAvailability(this.dataset.variantId);
      modelElementsInit();
    }
    fetchAvailability(variantId) {
      const variantSectionUrl = `${this.dataset.rootUrl}variants/${variantId}/?section_id=pickup-availability`;
      fetch(variantSectionUrl)
        .then((response) => response.text())
        .then((text) => {
          const sectionInnerHTML = new DOMParser()
            .parseFromString(text, "text/html")
            .querySelector(".shopify-section");
          this.renderPreview(sectionInnerHTML);
        });
    }
    renderPreview(sectionInnerHTML) {
      const drawer = document.querySelector("pickup-availability-popup");
      if (drawer) drawer.remove();
      if (!sectionInnerHTML.querySelector("pickup-availability-preview")) {
        this.innerHTML = "";
        this.removeAttribute("available");
        return;
      }
      this.innerHTML = sectionInnerHTML.querySelector(
        "pickup-availability-preview",
      ).outerHTML;
      this.setAttribute("available", "");
      document.body.appendChild(
        sectionInnerHTML.querySelector("pickup-availability-popup"),
      );
      if (this.querySelector("[data-model-main-head]")) {
        let focusElementItem = this.querySelector("[data-model-main-head]");
        this.querySelector("[data-model-main-head]").addEventListener(
          "click",
          (evt) => {
            evt.preventDefault();
            document
              .querySelector("pickup-availability-popup")
              .show(evt.target);
            setTimeout(function () {
              focusElement == "" && (focusElement = focusElementItem);
              trapFocusElements(
                document.querySelector("pickup-availability-popup"),
              );
            }, 500);
          },
        );
      }
    }
  }
  customElements.define("pickup-availability", PickupAvailability);
}
if (!customElements.get("pickup-availability-popup")) {
  customElements.define(
    "pickup-availability-popup",
    class PickupAvailabilityPopup extends HTMLElement {
      constructor() {
        super();

        this.hide();

        this.addEventListener("keyup", () => {
          if (event.code.toUpperCase() === "ESCAPE") this.hide();
        });
      }

      hide() {
        this.closeAllElements = this.querySelectorAll("[data-model-close]");
        this.closeAllElements.forEach(function (ement) {
          ement.addEventListener("click", (e) => {
            e.preventDefault();
            ement
              .closest("pickup-availability-popup")
              .classList.remove("active");
            document.body.classList.remove("no-scroll");
          });
        });
      }

      show(focusElement) {
        this.focusElement = focusElement;
        this.classList.add("active");
        document.body.classList.add("no-scroll");
      }
    },
  );
}
