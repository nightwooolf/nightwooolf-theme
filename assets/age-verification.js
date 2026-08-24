class AgeVerification extends HTMLElement {
  constructor() {
    super();
    this.cookieName = "paris:ageverification";
    this.classes = {
      bodyClass: "modal-popup-open",
      activeClass: "active",
      closingClass: "closing",
      hiddenClass: "hidden",
    };
    this.popup = this.querySelector(".age-verification-popup");
    this.declineContent = this.querySelector("[data-decline-container]");

    if (!this.getCookie(this.cookieName)) {
      this.init();
    }
    const button = this.querySelector("[data-approve-age-button]");
    if (button) button.addEventListener("click", this.close.bind(this));
    const declineButton = this.querySelector("[data-decline-age-button]");
    if (declineButton)
      declineButton.addEventListener("click", this.decline.bind(this));
    const backButton = this.querySelector("[data-age-back-button]");
    if (backButton)
      backButton.addEventListener("click", this.backToOriginal.bind(this));
  }
  init() {
    this.open();
  }

  open() {
    document.body.classList.remove(this.classes.bodyClass);
    this.popup.classList.add(this.classes.activeClass);
    if ((this.popup.dataset.ageverification = "true")) {
      document.body.classList.add(this.classes.bodyClass);
    }
  }

  close() {
    this.popup.classList.add(this.classes.closingClass);
    setTimeout(() => {
      this.popup.classList.remove(this.classes.activeClass);
      this.popup.classList.remove(this.classes.closingClass);
      if ((this.popup.dataset.ageverification = "true")) {
        document.body.classList.remove(this.classes.bodyClass);
      }
    }, 500);
    this.setCookie(this.cookieName, this.dataset.expiry);
  }

  decline() {
    this.popup
      .querySelector(".age-verification-popup-wrapper")
      .classList.add(this.classes.hiddenClass);
    this.declineContent.classList.remove(this.classes.hiddenClass);
  }
  backToOriginal() {
    this.declineContent.classList.add(this.classes.hiddenClass);
    this.popup
      .querySelector(".age-verification-popup-wrapper")
      .classList.remove(this.classes.hiddenClass);
  }
  getCookie(name) {
    const match = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
    return match ? match[2] : null;
  }

  setCookie(name, expiry) {
    document.cookie = `${name}=true; max-age=${expiry * 24 * 60 * 60}; path=/`;
  }

  removeCookie(name) {
    document.cookie = `${name}=; max-age=0`;
  }
}
customElements.define("age-verification", AgeVerification);
