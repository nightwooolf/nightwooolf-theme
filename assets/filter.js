class FilterRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector("a").addEventListener("click", (event) => {
      event.preventDefault();
      const form =
        this.querySelector("sidebar-filter-form") ||
        document.querySelector("sidebar-filter-form");
      form.onActiveFilterClick(event);
    });
  }
}
customElements.define("filter-remove", FilterRemove);

class SiderbarFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);
    this.querySelector("form").addEventListener(
      "input",
      this.debouncedOnSubmit.bind(this),
    );
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state
        ? event.state.searchParams
        : SiderbarFiltersForm.searchParamsInitial;
      if (searchParams === SiderbarFiltersForm.searchParamsPrev) return;
      SiderbarFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener("popstate", onHistoryChange);
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    SiderbarFiltersForm.searchParamsPrev = searchParams;
    const sections = SiderbarFiltersForm.getSections();
    document
      .getElementById("ProductGridContainer")
      .querySelector(".collection-result")
      .classList.add("loading");
    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;
      SiderbarFiltersForm.filterData.some(filterDataUrl)
        ? SiderbarFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : SiderbarFiltersForm.renderSectionFromFetch(url, event);
    });
    if (updateURLHash) SiderbarFiltersForm.updateURLHash(searchParams);
    document.dispatchEvent(new CustomEvent("collection:reloaded"));
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        SiderbarFiltersForm.filterData = [
          ...SiderbarFiltersForm.filterData,
          { html, url },
        ];
        SiderbarFiltersForm.renderFilters(html, event);
        SiderbarFiltersForm.renderProductGridContainer(html);
        SiderbarFiltersForm.renderProductCount(html);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = SiderbarFiltersForm.filterData.find(filterDataUrl).html;
    SiderbarFiltersForm.renderFilters(html, event);
    SiderbarFiltersForm.renderProductGridContainer(html);
    SiderbarFiltersForm.renderProductCount(html);
  }

  static renderProductGridContainer(html) {
    document.getElementById("ProductGridContainer").innerHTML = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductGridContainer").innerHTML;

    // Get the selected color from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedColor = urlParams.get("color");

    if (selectedColor) {
      // Add color variant filtering class to container
      document
        .getElementById("ProductGridContainer")
        .classList.add("color-filter-active");
    }

    if (AOS) {
      AOS.refreshHard();
    }
  }

  static renderProductCount(html) {
    const count = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductCount").innerHTML;
    const container = document.getElementById("ProductCount");
    if (container) {
      container.innerHTML = count;
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html");
    const facetDetailsElements = parsedHTML.querySelectorAll(
      "#SidebarFiltersForm .js-filter, #sidebarFiltersFormMobile .js-filter",
    );
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest(".js-filter") : undefined;
      return jsFilter
        ? element.dataset.index === jsFilter.dataset.index
        : false;
    };
    const facetsToRender = Array.from(facetDetailsElements).filter(
      (element) => !matchesIndex(element),
    );
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);
    facetsToRender.forEach((element) => {
      document.querySelector(
        `.js-filter[data-index="${element.dataset.index}"]`,
      ).innerHTML = element.innerHTML;
    });

    SiderbarFiltersForm.renderActiveFacets(parsedHTML);
  }
  /// active filter html render
  static renderActiveFacets(html) {
    const activeFacetElementSelectors = [
      ".active-facets-mobile",
      ".active-filter-desktop",
    ];
    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML =
        activeFacetsElement.innerHTML;
    });
  }
  /// mobile and sorting

  static updateURLHash(searchParams) {
    history.pushState(
      { searchParams },
      "",
      `${window.location.pathname}${searchParams && "?".concat(searchParams)}`,
    );
  }

  static getSections() {
    return [
      {
        section: document.getElementById("result-product-grid").dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData);
  }

  mergeSearchParams(form, searchParams) {
    const params = this.createSearchParams(form);
    params.forEach((value, key) => {
      searchParams.append(key, value);
    });
    return searchParams;
  }

  onSubmitForm(searchParams, event) {
    SiderbarFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const currentForm = event.target.closest("form");

    if (currentForm.id === "sidebarFiltersFormMobile") {
      const searchParams = this.createSearchParams(currentForm);
      this.onSubmitForm(searchParams.toString(), event);
    } else {
      let searchParams = new URLSearchParams();
      const sortFilterForms = document.querySelectorAll(
        "sidebar-filter-form form",
      );
      sortFilterForms.forEach((form) => {
        if (
          form.id === "SidebarFiltersForm" ||
          form.id === "FiltersSortForm" ||
          currentForm.id === "SortDrawerForm"
        ) {
          searchParams = this.mergeSearchParams(form, searchParams);
        }
      });
      this.onSubmitForm(searchParams.toString(), event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    SiderbarFiltersForm.renderPage(
      new URL(event.currentTarget.href).searchParams.toString(),
    );
  }
}
SiderbarFiltersForm.filterData = [];
SiderbarFiltersForm.searchParamsInitial = window.location.search.slice(1);
SiderbarFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define("sidebar-filter-form", SiderbarFiltersForm);
SiderbarFiltersForm.setListeners();

class PriceSlider extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    let rangeslider = this.querySelector(".range-slider"),
      amounts = this.querySelector(".side-filter-price-range"),
      args = {
        start: [
          parseFloat(rangeslider.dataset.minValue),
          parseFloat(rangeslider.dataset.maxValue),
        ],
        connect: true,
        step: 1,
        range: {
          min: parseFloat(rangeslider.dataset.min),
          max: parseFloat(rangeslider.dataset.max),
        },
      },
      event = new CustomEvent("input"),
      form =
        this.closest("sidebar-filter-form") ||
        document.querySelector("sidebar-filter-form");
    if (rangeslider.classList.contains("noUi-target")) {
      rangeslider.noUiSlider.destroy();
    }
    noUiSlider.create(rangeslider, args);

    rangeslider.noUiSlider.on("update", function (values) {
      amounts.querySelector(".field__input_min").value = values[0];
      amounts.querySelector(".field__input_max").value = values[1];
    });
    rangeslider.noUiSlider.on("change", function (values) {
      form.querySelector("form").dispatchEvent(event);
    });
  }
}
customElements.define("price-slider", PriceSlider);

class ShowMoreFilterButton extends HTMLElement {
  constructor() {
    super();
    const attributes = {
      expanded: "aria-expanded",
    };
    this.querySelector(".show-more-button").addEventListener(
      "click",
      (event) => {
        const filter = this.closest(".collapse-box");
        (filter.setAttribute(
          attributes.expanded,
          (filter.getAttribute(attributes.expanded) === "false").toString(),
        ),
          filter.querySelector(".more-items").classList.toggle("hidden"));
        this.querySelectorAll(".visible-hidden").forEach((element) =>
          element.classList.toggle("hidden"),
        );
      },
    );
  }
}
customElements.define("show-more-button", ShowMoreFilterButton);
