let subscribers = {};

function subscribe(eventName, callback) {
  if (subscribers[eventName] === undefined) {
    subscribers[eventName] = [];
  }

  subscribers[eventName] = [...subscribers[eventName], callback];

  return function unsubscribe() {
    subscribers[eventName] = subscribers[eventName].filter((cb) => {
      return cb !== callback;
    });
  };
}

function publish(eventName, data) {
  if (subscribers[eventName]) {
    subscribers[eventName].forEach((callback) => {
      callback(data);
    });
  }
}
Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options,
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid,
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this),
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};
function filterShopifyEvent(event, domElement, callback) {
  let executeCallback = false;
  if (event.type.includes("shopify:section")) {
    if (
      domElement.hasAttribute("data-section-id") &&
      domElement.getAttribute("data-section-id") === event.detail.sectionId
    ) {
      executeCallback = true;
    }
  } else if (
    event.type.includes("shopify:block") &&
    event.target === domElement
  ) {
    executeCallback = true;
  }
  if (executeCallback) {
    callback(event);
  }
}
function pad(num, size) {
  return num.toString().padStart(size, "0");
}
function parseDate(date) {
  const parsed = Date.parse(date);
  if (!isNaN(parsed)) return parsed;
  return Date.parse(date.replace(/-/g, "/").replace(/[a-z]+/gi, " "));
}
function getRemainingTime(endtime) {
  const total = parseDate(endtime) - Date.parse(new Date());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
  };
}
function isOnScreen(elem, form) {
  if (elem.length == 0) {
    return;
  }
  var $window = $(window);
  var viewport_top = $window.scrollTop();
  var viewport_height = $window.height();
  var viewport_bottom = viewport_top + viewport_height;
  var $elem = $(elem);
  var top = $elem.offset().top;
  var height = $elem.height();
  var bottom = top + height;

  return (
    (top >= viewport_top && top < viewport_bottom) ||
    (bottom > viewport_top && bottom <= viewport_bottom) ||
    (height > viewport_height &&
      top <= viewport_top &&
      bottom >= viewport_bottom)
  );
}
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe",
    ),
  );
}
const trapFocusHandlers = {};
var focusElement = "";

function trapFocusElements(wrapper) {
  removeTrapFocus();
  let elements = getFocusableElements(wrapper);
  if (elements == !1) return !1;
  let first = elements[0];
  first.focus();
  let last = elements[elements.length - 1];
  ((trapFocusHandlers.focusin = (e) => {
    (e.target !== wrapper && e.target !== last && e.target !== first) ||
      document.addEventListener("keydown", trapFocusHandlers.keydown);
  }),
    (trapFocusHandlers.focusout = function () {
      document.removeEventListener("keydown", trapFocusHandlers.keydown);
    }),
    (trapFocusHandlers.keydown = function (e) {
      e.code.toUpperCase() === "TAB" &&
        (e.target === last &&
          !e.shiftKey &&
          (e.preventDefault(), first.focus()),
        (e.target === wrapper[0] || e.target === first) &&
          e.shiftKey &&
          (e.preventDefault(), last.focus()));
    }),
    document.addEventListener("focusout", trapFocusHandlers.focusout),
    document.addEventListener("focusin", trapFocusHandlers.focusin));
}

function removeTrapFocus() {
  (document.removeEventListener("focusin", trapFocusHandlers.focusin),
    document.removeEventListener("focusout", trapFocusHandlers.focusout),
    document.removeEventListener("keydown", trapFocusHandlers.keydown));
}

function shippingProgressBar(totalprice) {
  if (currencyRate != null && shippingStatus == true) {
    let shippingText = "";
    let currencyConvertRate = Math.round(
      currencyRate * (Shopify.currency.rate || 1),
    );
    let getcurrencySymbol = Shopify.currency.active;
    totalprice = totalprice / 100;
    let shippingPrice = currencyConvertRate - totalprice;
    if (shippingPrice > 0) {
      shippingPrice = shippingPrice.toFixed(2);
      let shippingpricemessage = shippingPrice + " " + getcurrencySymbol;
      shippingText = shippingmessage.replace("||price||", shippingpricemessage);
    } else {
      shippingText = shippingsuccessmessage;
    }
    let shippingRatePercentage = (totalprice * 100) / currencyConvertRate;
    if (shippingRatePercentage > 10 && shippingRatePercentage < 100) {
      shippingRatePercentage = parseFloat(shippingRatePercentage) - 5;
    } else if (shippingRatePercentage > 100) {
      shippingRatePercentage = 100;
    }
    shippingRatePercentage = Math.trunc(shippingRatePercentage);
    if (document.querySelector("[data-shipping-bar-wrapper]")) {
      let shippingSelector = document.querySelector(
        "[data-shipping-bar-wrapper]",
      );
      shippingSelector.classList.remove("hidden");
      shippingSelector.querySelector(".free-shipping-message").textContent =
        shippingText;
      shippingSelector.querySelector("[data-shipping-bar]").style.width =
        shippingRatePercentage + "%";
      shippingSelector.querySelector("[data-shipping-percentage]").textContent =
        shippingRatePercentage + "%";
    }
  }
}
