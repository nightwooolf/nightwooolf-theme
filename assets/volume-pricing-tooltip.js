(function () {
  "use strict";
  if (window.__volumePricingTooltipBound) return;
  window.__volumePricingTooltipBound = true;

  var WRAPPER_SEL = "[data-volume-pricing-tooltip]";
  var POPOVER_SEL = "[data-volume-pricing-tooltip-popover]";
  var DRAWER_CONTEXT = "drawer";
  var OPEN_CLASS = "volume-pricing-tooltip--open";

  var mainCartCloseTimer = null;
  var drawerCloseTimer = null;

  function isDrawerTooltip(wrapper) {
    return wrapper.getAttribute("data-tooltip-context") === DRAWER_CONTEXT;
  }

  function isMainCartTooltip(wrapper) {
    return (
      wrapper.closest(".cart-wrapper") !== null && !isDrawerTooltip(wrapper)
    );
  }

  var POPOVER_WIDTH = 300;
  var POPOVER_MAX_HEIGHT = 360;
  var VIEWPORT_MARGIN = 16;
  var SMALL_VIEWPORT_MAX_HEIGHT = 280;

  function positionCartPopover(wrapper, popover) {
    if (!popover) return;
    var rect = wrapper.getBoundingClientRect();
    var viewW = window.innerWidth;
    var viewH = window.innerHeight;
    var centerX = rect.left + rect.width / 2;
    /* Use trigger's center so each tooltip stays at its own position; only clamp left edge */
    var left = Math.max(VIEWPORT_MARGIN + POPOVER_WIDTH / 2, centerX);
    var top;
    var maxHeight = POPOVER_MAX_HEIGHT;
    var spaceBelow = viewH - VIEWPORT_MARGIN - (rect.bottom + 8);
    var spaceAbove = rect.top - 8 - VIEWPORT_MARGIN;
    var useSmallViewport = viewH < 600 || viewW < 768;
    var effectiveMaxHeight = useSmallViewport
      ? Math.min(SMALL_VIEWPORT_MAX_HEIGHT, viewH - 2 * VIEWPORT_MARGIN - 40)
      : POPOVER_MAX_HEIGHT;

    if (spaceBelow >= effectiveMaxHeight) {
      top = rect.bottom + 8;
      maxHeight = effectiveMaxHeight;
    } else if (!useSmallViewport && spaceAbove >= effectiveMaxHeight) {
      /* On small viewports skip "above" so we don't get a gap: popover at top of screen */
      top = rect.top - effectiveMaxHeight - 8;
      maxHeight = effectiveMaxHeight;
    } else {
      /* Prefer below trigger (no gap); use available space and scroll inside */
      top = rect.bottom + 8;
      maxHeight = Math.max(120, spaceBelow);
    }
    popover.style.setProperty("--vp-left", left + "px");
    popover.style.setProperty("--vp-top", top + "px");
    popover.style.setProperty("--vp-max-height", maxHeight + "px");
  }

  function openTooltip(wrapper, isDrawer) {
    if (isDrawer) {
      if (drawerCloseTimer) {
        clearTimeout(drawerCloseTimer);
        drawerCloseTimer = null;
      }
      var drawer = wrapper.closest(
        "cart-drawer, .side-drawer-panel, mini-cart",
      );
      if (drawer) {
        var others = drawer.querySelectorAll(WRAPPER_SEL + "." + OPEN_CLASS);
        for (var i = 0; i < others.length; i++) {
          if (others[i] !== wrapper) others[i].classList.remove(OPEN_CLASS);
        }
      }
    } else {
      if (mainCartCloseTimer) {
        clearTimeout(mainCartCloseTimer);
        mainCartCloseTimer = null;
      }
      var cart = wrapper.closest(".cart-wrapper");
      if (cart) {
        var others = cart.querySelectorAll(WRAPPER_SEL + "." + OPEN_CLASS);
        for (var i = 0; i < others.length; i++) {
          if (others[i] !== wrapper) others[i].classList.remove(OPEN_CLASS);
        }
      }
    }
    var popover = wrapper.querySelector(POPOVER_SEL);
    if (popover) positionCartPopover(wrapper, popover);
    wrapper.classList.add(OPEN_CLASS);
  }

  function openMainCartTooltip(wrapper) {
    openTooltip(wrapper, false);
  }

  function closeMainCartTooltip(wrapper) {
    mainCartCloseTimer = setTimeout(function () {
      mainCartCloseTimer = null;
      wrapper.classList.remove(OPEN_CLASS);
    }, 100);
  }

  function closeDrawerTooltip(wrapper) {
    drawerCloseTimer = setTimeout(function () {
      drawerCloseTimer = null;
      wrapper.classList.remove(OPEN_CLASS);
    }, 100);
  }

  function cancelCloseMainCart() {
    if (mainCartCloseTimer) {
      clearTimeout(mainCartCloseTimer);
      mainCartCloseTimer = null;
    }
  }

  function cancelCloseDrawer() {
    if (drawerCloseTimer) {
      clearTimeout(drawerCloseTimer);
      drawerCloseTimer = null;
    }
  }

  var productCloseTimer = null;

  function isProductTooltip(wrapper) {
    return !isDrawerTooltip(wrapper) && !isMainCartTooltip(wrapper);
  }

  function closeProductTooltip(wrapper) {
    productCloseTimer = setTimeout(function () {
      productCloseTimer = null;
      wrapper.classList.remove(OPEN_CLASS);
    }, 100);
  }

  function cancelCloseProduct() {
    if (productCloseTimer) {
      clearTimeout(productCloseTimer);
      productCloseTimer = null;
    }
  }

  function positionProductPopover(wrapper, popover) {
    if (!popover) return;
    // Only apply JS positioning on mobile
    if (window.innerWidth >= 768) {
      popover.style.removeProperty("right");
      return;
    }
    // Find the nearest scrollable/visible container to center within
    var container =
      wrapper.closest(".quickview-body-content") ||
      wrapper.closest(".quick-view-content") ||
      wrapper.closest(".main-product-content") ||
      wrapper.closest(".featured-product-card") ||
      wrapper.closest(".product-view-content");
    if (!container) {
      popover.style.removeProperty("right");
      return;
    }
    var containerRect = container.getBoundingClientRect();
    var wrapperRect = wrapper.getBoundingClientRect();
    var popoverWidth = Math.min(300, containerRect.width - 24);
    // Calculate right offset so the popover is centered within the container
    var containerCenter = containerRect.left + containerRect.width / 2;
    var popoverLeft = containerCenter - popoverWidth / 2;
    // Convert to a "right" value relative to the wrapper
    var rightValue = wrapperRect.right - popoverLeft - popoverWidth;
    popover.style.setProperty("right", rightValue + "px");
    popover.style.setProperty("width", popoverWidth + "px");
  }

  function openProductTooltip(wrapper) {
    cancelCloseProduct();
    // Close other product-page tooltips
    var others = document.querySelectorAll(WRAPPER_SEL + "." + OPEN_CLASS);
    for (var i = 0; i < others.length; i++) {
      if (others[i] !== wrapper && isProductTooltip(others[i])) {
        others[i].classList.remove(OPEN_CLASS);
      }
    }
    var popover = wrapper.querySelector(POPOVER_SEL);
    positionProductPopover(wrapper, popover);
    wrapper.classList.add(OPEN_CLASS);
  }

  document.addEventListener("mouseover", function (e) {
    var wrapper = e.target.closest(WRAPPER_SEL);
    if (!wrapper) return;
    if (isDrawerTooltip(wrapper)) {
      cancelCloseDrawer();
      openTooltip(wrapper, true);
      return;
    }
    if (isMainCartTooltip(wrapper)) {
      cancelCloseMainCart();
      openTooltip(wrapper, false);
      return;
    }
    openProductTooltip(wrapper);
  });

  document.addEventListener("mouseout", function (e) {
    var wrapper = e.target.closest(WRAPPER_SEL);
    if (!wrapper) return;
    var related = e.relatedTarget;
    var popover = wrapper.querySelector(POPOVER_SEL);
    var goingToPopover = related && popover && popover.contains(related);
    if (isDrawerTooltip(wrapper)) {
      if (!goingToPopover) closeDrawerTooltip(wrapper);
      return;
    }
    if (isMainCartTooltip(wrapper)) {
      if (!goingToPopover) closeMainCartTooltip(wrapper);
      return;
    }
    if (!goingToPopover) closeProductTooltip(wrapper);
  });

  // Toggle on click/tap for touch devices
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-volume-pricing-tooltip-trigger]");
    if (!trigger) return;
    var wrapper = trigger.closest(WRAPPER_SEL);
    if (!wrapper) return;
    e.preventDefault();
    if (wrapper.classList.contains(OPEN_CLASS)) {
      wrapper.classList.remove(OPEN_CLASS);
    } else {
      if (isDrawerTooltip(wrapper)) {
        openTooltip(wrapper, true);
      } else if (isMainCartTooltip(wrapper)) {
        openTooltip(wrapper, false);
      } else {
        openProductTooltip(wrapper);
      }
    }
  });

  // Close on click outside
  document.addEventListener("click", function (e) {
    if (e.target.closest(WRAPPER_SEL)) return;
    var openTooltips = document.querySelectorAll(
      WRAPPER_SEL + "." + OPEN_CLASS,
    );
    for (var i = 0; i < openTooltips.length; i++) {
      openTooltips[i].classList.remove(OPEN_CLASS);
    }
  });
})();
