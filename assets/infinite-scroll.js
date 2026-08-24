class InfiniteScroll extends HTMLElement {
  constructor() {
    super();
    // Bind the event handlers
    this.onClickHandler = this.onClickHandler.bind(this);
    this.handleIntersection = this.handleIntersection.bind(this);
  }

  connectedCallback() {
    // Check if the mode is click or load
    const mode = this.getAttribute("mode") || "on-click"; // Default to 'on-click'

    if (mode === "on-click") {
      // Initialize for click-based loading
      this.addEventListener("click", this.onClickHandler);
      this.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          this.onClickHandler();
        }
      });
    } else if (mode === "on-load") {
      // Initialize IntersectionObserver for on-load functionality
      this.observer = new IntersectionObserver(this.handleIntersection, {
        root: null,
        threshold: 0.1, // Fully visible
      });
      this.observer.observe(this);
    }
  }

  disconnectedCallback() {
    const mode = this.getAttribute("mode") || "on-click";

    if (mode === "on-click") {
      // Cleanup click listeners
      this.removeEventListener("click", this.onClickHandler);
    } else if (mode === "on-load") {
      // Cleanup IntersectionObserver
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }

  onClickHandler() {
    if (
      this.classList.contains("loading") ||
      this.classList.contains("disabled")
    ) {
      return; // Prevent multiple triggers
    }

    this.classList.add("loading", "disabled"); // Add loading state

    const url = this.dataset.url;
    if (url) {
      InfiniteScroll.loadContent(url).finally(() => {
        this.classList.remove("loading", "disabled"); // Remove loading state
      });
    }
  }

  handleIntersection(entries) {
    const entry = entries[0];
    if (entry.isIntersecting) {
      this.observer.unobserve(this); // Stop observing to prevent multiple triggers
      this.onClickHandler(); // Trigger content loading automatically
    }
  }

  static async loadContent(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const html = await response.text();

      // Update the UI with new content
      InfiniteScroll.updatePagination(html);
      InfiniteScroll.updateProductGrid(html);
    } catch (error) {
      console.error("Error loading content:", error);
    }
  }

  static updatePagination(html) {
    const container = document
      .getElementById("ProductGridContainer")
      ?.querySelector(".pagination-container");
    const pagination = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductGridContainer")
      ?.querySelector(".pagination-container");

    if (pagination && container) {
      container.innerHTML = pagination.innerHTML;
    } else if (container) {
      container.remove(); // Remove pagination if not present in the new content
    }
  }

  static updateProductGrid(html) {
    const productsContainer = document.getElementById("result-product-grid");
    const products = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("result-product-grid");

    if (productsContainer && products) {
      productsContainer.insertAdjacentHTML("beforeend", products.innerHTML);

      // Focus management for new content
      const newGridRow = productsContainer.querySelector(
        ".grid-row:last-child",
      );
      setTimeout(() => {
        if (newGridRow) {
          const focusableElements = getFocusableElements(newGridRow);
          if (focusableElements && focusableElements.length) {
            focusableElements[0].focus(); // Focus on the first focusable element
          }
        }
      }, 500);

      // Animation refresh if AOS library is used
      if (
        typeof animationCheck !== "undefined" &&
        animationCheck &&
        typeof AOS !== "undefined"
      ) {
        AOS.refreshHard();
      }
    }
  }
}

customElements.define("infinite-scroll", InfiniteScroll);
