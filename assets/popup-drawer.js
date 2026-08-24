function modelElementsInit() {
  let modelHeadElements = document.querySelectorAll("[data-model-main-head]");
  let modelConetntBody = document.querySelectorAll("[data-model-main-body]");
  Array.from(modelHeadElements).forEach(function (element) {
    element.addEventListener("click", function (event) {
      event.preventDefault();
      let dataId = element.getAttribute("data-id");
      Array.from(modelConetntBody).forEach(function (bodyElement) {
        bodyElement.classList.remove("active");
      });
      if (element.classList.contains("search")) {
        document.querySelector("body").classList.add("search-open");
        focusElement = element;
        trapFocusElements(
          document.querySelector(".predictive-search-container"),
        );
        setTimeout(() => {
          document
            .querySelector("#Search-In-Template")
            .setAttribute("tabindex", "0");
          document.querySelector("#Search-In-Template").focus();
        }, 100);
      }
      document.querySelector("body").classList.add("no-scroll");
      const mainslector = document.querySelector("#" + dataId);
      mainslector.classList.add("active");
      focusElement = element;

      if (dataId == "product-media-popup") {
        trapFocusElements(mainslector.querySelector(".product-gallery-inner"));
        if (mainslector.querySelector("[data-flickity]")) {
          let index = element.getAttribute("data-index");
          let slider = Flickity.data(
            mainslector.querySelector("[data-flickity].flickity-enabled"),
          );
          themeSlidersInit($(".paroduct-thumbnail-gallery"));
          slider.resize();
          slider.select(index);
          if (window.ProductModel) window.ProductModel.loadShopifyXR();
        }
      } else {
        trapFocusElements(mainslector);
      }
    });
  });
  let modelCloseElements = document.querySelectorAll("[data-model-close]");
  Array.from(modelCloseElements).forEach(function (closeElement) {
    closeElement.addEventListener("click", function (event) {
      event.preventDefault();
      document.querySelector("body").classList.remove("no-scroll");
      if (document.querySelector("body").classList.contains("search-open")) {
        document.querySelector("body").classList.remove("search-open");
      }

      closeElement.closest("[data-model-main-body]").classList.remove("active");
      if (document.querySelector("[data-predictive-search]")) {
        document.querySelector("[data-predictive-search]").innerHTML = "";
      }
      focusElement = "";
      removeTrapFocus();
    });
  });
}
document.addEventListener("DOMContentLoaded", function (section = document) {
  modelElementsInit();
});

document.addEventListener("shopify:section:load", function (section) {
  let sectiontarget = section.target;
  modelElementsInit(sectiontarget);
});
