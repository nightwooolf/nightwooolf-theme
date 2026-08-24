document.addEventListener("shopify:section:load", function (event) {
  reinitializeFlickity(event.target);
  modelElementsInit();
});

document.addEventListener("shopify:section:select", function (event) {
  reinitializeFlickity(event.target);
  modelElementsInit();
});

function reinitializeFlickity(container) {
  const galleries = container.querySelectorAll("[data-flickity]");
  galleries.forEach((el) => {
    // Destroy existing instance if needed
    if (el.flickityInstance) {
      el.flickityInstance.destroy();
    }

    // Read config from data attribute
    const config = JSON.parse(el.getAttribute("data-flickity") || "{}");

    // Initialize Flickity
    el.flickityInstance = new Flickity(el, config);
  });
}
