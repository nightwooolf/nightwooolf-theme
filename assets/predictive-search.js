class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.modal = this.closest(".search-modal");
    this.cachedResults = {};
    this.input = this.querySelector('input[type="search"]');
    this.predictiveSearchResults = this.querySelector(
      "[data-predictive-search]",
    );
    this.allPredictiveSearchInstances =
      document.querySelectorAll("predictive-search");
    this.suggestions = this.querySelector("[data-popular-search]");
    this.searchTerm = "";
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.querySelector("form.search").addEventListener(
      "submit",
      this.onFormSubmit.bind(this),
    );
    this.querySelector('button[type="button"]').addEventListener(
      "click",
      this.close.bind(this),
    );
    this.querySelector('button[type="reset"]').addEventListener(
      "click",
      this.clear.bind(this),
    );
    this.input.addEventListener(
      "input",
      debounce((event) => {
        this.onChange(event);
      }, 300).bind(this),
    );
    this.input.addEventListener("focus", this.onFocus.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    //this.addEventListener('keyup', this.onKeyup.bind(this));
    //  this.addEventListener('keydown', this.onKeydown.bind(this));
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    const newSearchTerm = this.getQuery();
    if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
      this.querySelector("#predictive-search-results-content")?.remove();
    }
    if (newSearchTerm != "") {
      this.querySelector('button[type="reset"]').classList.remove("hidden");
    } else {
      this.querySelector('button[type="reset"]').classList.add("hidden");
    }
    this.searchTerm = newSearchTerm;
    if (!this.searchTerm.length) {
      this.clear();
      this.close(true);
      return;
    }
    this.getSearchResults(this.searchTerm);
    focusElement = this;
    trapFocusElements(this);
    setTimeout(() => {
      document
        .querySelector(this.querySelector("#Search-In-Template"))
        .setAttribute("tabindex", "0");
      document.querySelector(this.querySelector("#Search-In-Template")).focus();
    }, 100);
  }

  onFormSubmit(event) {
    if (
      !this.getQuery().length ||
      this.querySelector('[aria-selected="true"] a')
    )
      event.preventDefault();
  }

  onFocus() {
    document.body.classList.add("predictive-search--focus");
    const currentSearchTerm = this.getQuery();
    if (!currentSearchTerm.length) return;
    if (this.searchTerm !== currentSearchTerm) {
      this.onChange();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    if (!this.getQuery().length) {
      this.clear(event);
      this.close(true);
    }
    event.preventDefault();
    switch (event.code) {
      case "Enter":
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    // Prevent the cursor from moving in the input when using the up and down arrow keys
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      event.preventDefault();
    }
  }

  selectOption() {
    const selectedProduct = this.querySelector(
      '[aria-selected="true"] a, [aria-selected="true"] button',
    );
    if (selectedProduct) selectedProduct.click();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      if (this.suggestions) {
        this.suggestions.classList.add("hidden");
      }
      this.renderSearchResults(this.cachedResults[queryKey]);
      if (this.modal) this.modal.classList.add("searching");
      return;
    }
    fetch(
      `${window.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`,
    )
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }
        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, "text/html")
          .querySelector("#shopify-section-predictive-search").innerHTML;
        this.allPredictiveSearchInstances.forEach(
          (predictiveSearchInstance) => {
            predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
          },
        );
        if (this.suggestions) {
          this.suggestions.classList.add("hidden");
        }
        this.renderSearchResults(resultsMarkup);
        if (animationCheck) {
          if (AOS) {
            AOS.refreshHard();
          }
        }
      })
      .catch((error) => {
        if (error?.code === 20) {
          // Code 20 means the call was aborted
          return;
        }
        this.close();
        throw error;
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement =
      this.statusElement || this.querySelector("[data-predictive-search]");
    this.setLiveRegionText(storeLoader);
    this.setAttribute("loading", true);
  }

  setLiveRegionText(statuscontent) {
    this.statusElement.setAttribute("aria-hidden", "false");
    if (this.suggestions) {
      this.suggestions.classList.add("populat-content-blur");
    }
    this.statusElement.innerHTML = statuscontent;
    setTimeout(() => {
      this.statusElement.setAttribute("aria-hidden", "true");
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute("results", true);
    this.setLiveRegionResults();
  }

  setLiveRegionResults() {
    this.removeAttribute("loading");
  }

  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = "";
    }
    const selected = this.querySelector('[aria-selected="true"]');
    if (selected) selected.setAttribute("aria-selected", false);
    this.input.setAttribute("aria-activedescendant", "");
    this.removeAttribute("loading");
    this.input.setAttribute("aria-expanded", false);
    document.body.classList.remove("predictive-search--focus");
  }

  clear(event) {
    this.input.value = "";
    this.querySelector("[data-predictive-search]").innerHTML = "";
    this.input.focus();
    if (this.suggestions) {
      this.suggestions.classList.remove("hidden", "populat-content-blur");
    }
    if (this.modal) this.modal.classList.remove("searching");
  }
}

customElements.define("predictive-search", PredictiveSearch);
