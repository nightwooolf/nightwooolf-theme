class NewsLetterPopup extends HTMLElement {
  constructor() {
    super();

    // Exit early if on the "/challenge" page
    if (window.location.pathname === "/challenge") {
      return;
    }

    this.cookieName = "paris:newsletter-popup";
    this.popup = this.querySelector(".newsletter-popup");
    this.classes = {
      bodyClass: "modal-popup-open",
      activeClass: "active",
      closingClass: "closing",
    };

    // Open popup if errors or success messages exist in the form
    if (this.querySelector(".form-message")) {
      this.open();
    }

    // Attach event listeners for popup close buttons
    this.querySelectorAll("[data-popup-close]").forEach((button) => {
      button.addEventListener("click", this.onButtonClick.bind(this));
    });

    // Initialize only if the cookie is not set
    if (!this.getCookie(this.cookieName)) {
      this.init();
    } else {
      console.log("Cookie found. Popup will remain hidden.");
      this.hidePopup();
    }
  }

  /**
   * Initialize the popup logic.
   */
  init() {
    if (!this.popup) {
      console.warn("Newsletter popup element not found.");
      return;
    }

    const delay = parseInt(this.dataset.delay) || 2; // Default to 2 seconds if not specified
    console.log(`Popup will appear after ${delay} seconds.`);

    setTimeout(() => {
      this.open();
    }, delay * 1000);
  }

  /**
   * Hides the popup entirely (if the cookie is set).
   */
  hidePopup() {
    if (this.popup) {
      this.popup.style.display = "none";
    }
  }

  /**
   * Handles the close button click event.
   * @param {Event} event
   */
  onButtonClick(event) {
    event.preventDefault();
    if (this.popup.classList.contains(this.classes.activeClass)) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Opens the popup and applies the necessary styles.
   */
  open() {
    document.body.classList.remove(this.classes.bodyClass);
    if (this.dataset.newsletterpopup === "true") {
      document.body.classList.add(this.classes.bodyClass);
      this.popup.classList.add(this.classes.activeClass);
      console.log("Newsletter popup opened.");
    }
  }

  /**
   * Closes the popup and sets a cookie to prevent reopening.
   */
  close() {
    this.popup.classList.add(this.classes.closingClass);

    setTimeout(() => {
      this.popup.classList.remove(this.classes.activeClass);
      this.popup.classList.remove(this.classes.closingClass);
      console.log("Newsletter popup closed.");
    }, 500);

    const expiry = parseInt(this.dataset.expiry) || 7; // Default to 7 days
    this.setCookie(this.cookieName, expiry);
    console.log(`Cookie "${this.cookieName}" set for ${expiry} days.`);
  }

  /**
   * Gets a cookie value by name.
   * @param {string} name
   * @returns {string|null}
   */
  getCookie(name) {
    const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
    const value = match ? decodeURIComponent(match[1]) : null;
    console.log(`Cookie "${name}" retrieved:`, value);
    return value;
  }

  /**
   * Sets a cookie with a given name and expiry in days.
   * @param {string} name
   * @param {number} expiry
   */
  setCookie(name, expiry) {
    const maxAge = expiry * 24 * 60 * 60; // Convert days to seconds
    document.cookie = `${name}=true; max-age=${maxAge}; path=/; Secure; SameSite=Strict`;
    console.log(`Cookie "${name}" set with max-age: ${maxAge} seconds.`);
  }

  /**
   * Removes a cookie by name.
   * @param {string} name
   */
  removeCookie(name) {
    document.cookie = `${name}=; max-age=0; path=/`;
    console.log(`Cookie "${name}" removed.`);
  }
}

// Define the custom element
customElements.define("newsletter-popup", NewsLetterPopup);
