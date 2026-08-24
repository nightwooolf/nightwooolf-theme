function stickyheaderLoadInit() {
  var windowScroll = window.scrollY;
  let scrollHeightValue = 0;
  var headerElement = document.querySelector(".main-header-top");
  let header = document.querySelector("header");
  if (header) {
    let stickyHeader = header.getAttribute("data-sticky-header");
    let stickyHeaderType = header.getAttribute("data-header-type");
    if (stickyHeader == "true") {
      headerElement.classList.add("sticky-header-active");
    }
    if (stickyHeaderType == "always") {
      document.querySelector("body").classList.add("sticky-header-always");
    }

    if (headerElement.querySelector("[data-header-main]")) {
      var headerHeight = headerElement
        .querySelector("[data-header-main]")
        .getBoundingClientRect()
        .height.toFixed(2);
      document
        .querySelector("body")
        .style.setProperty("--headerheight", `${headerHeight}px`);
      scrollHeightValue = scrollHeightValue + headerHeight;
      var outerheight = headerHeight + 50;

      if (document.querySelector(".announcement-wrapper")) {
        let announcementMain = document.querySelector(".announcement-wrapper");
        let annoucementHeight = announcementMain
          .getBoundingClientRect()
          .height.toFixed(2);
        document
          .querySelector("body")
          .style.setProperty("--announcementheight", `${annoucementHeight}px`);
      }

      if (window.innerWidth > 991) {
        if (headerElement.querySelector('[transparent="true"]')) {
          document
            .querySelector("body")
            .style.setProperty(
              "--transparentheaderheight",
              `${headerHeight}px`,
            );
        }
      }
      window.addEventListener("scroll", function () {
        let mainHeader = document.querySelector("header");
        let stickyHeader = mainHeader.getAttribute("data-sticky-header");

        if (stickyHeader == "false") {
          return false;
        }

        if (stickyHeader == "true") {
          if (window.scrollY > 50) {
            headerElement.classList.add("stickytrue");
          } else {
            headerElement.classList.remove("stickytrue");
          }
          if (stickyHeaderType == "on_scroll") {
            if (mainHeader && stickyHeader == "true") {
              if (window.scrollY > 50) {
                if (windowScroll > window.scrollY) {
                  headerElement.classList.remove("sticky-header-hidden");
                } else {
                  if (
                    !document
                      .querySelector("body")
                      .classList.contains("menuopen")
                  ) {
                    headerElement.classList.add("sticky-header-hidden");
                  }
                }
              } else {
                headerElement.classList.remove("sticky-header-hidden");
              }
            }
          }
        }
        windowScroll = window.scrollY;
      });
      window.addEventListener("resize", function () {
        setTimeout(function () {
          let headerHeight = headerElement
            .querySelector("[ data-header-main]")
            .getBoundingClientRect()
            .height.toFixed(2);
          document
            .querySelector("body")
            .style.setProperty("--headerheight", `${headerHeight}px`);

          // let annoucementHeight = announcementSection.getBoundingClientRect().height.toFixed(2);;
          // document.querySelector('body').style.setProperty('--announcementheight', `${annoucementHeight}px`);

          if (window.innerWidth > 991) {
            if (headerElement.querySelector(".transparent-true")) {
              document
                .querySelector("body")
                .style.setProperty(
                  "--transparentheaderheight",
                  `${headerHeight}px`,
                );
            }
          }
        }, 500);
      });
    }
  }
}

/* hamburger nemu for mobile header */
function mobileHumburgerMenuInit() {
  let mobileHumburgerElements = document.querySelectorAll(
    "[data-hamburger-mobile]",
  );
  let headerMainParent = document.querySelector("header");
  let body = document.querySelector("body");

  Array.from(mobileHumburgerElements).forEach(function (element) {
    element.addEventListener("click", function (event) {
      event.preventDefault();
      let drawerElement = element.getAttribute("href");
      let contentDrawerContainer = document.querySelector(drawerElement);
      if (element.classList.contains("active")) {
        if (body.classList.contains("mobile-menu-active")) {
          body.classList.remove("no-scroll", "mobile-menu-active");
          contentDrawerContainer.classList.remove("active");
          element.classList.remove("active");
        }
      } else {
        element.classList.add("active");
        body.classList.add("no-scroll", "mobile-menu-active");
        contentDrawerContainer.classList.add("active");
      }
    });
  });
  window.addEventListener("resize", function () {
    if (
      window.innerWidth > 991 &&
      body.classList.contains("mobile-menu-active")
    ) {
      body.classList.remove("mobile-menu-active", "no-scroll");
      contentDrawerContainer.classList.remove("show");
    }
  });
}
function mobileMenuitemsEvent() {
  let mobileMenus = document.querySelectorAll(".mobile-menus-item");
  Array.from(mobileMenus).forEach(function (mobileMenu) {
    mobileMenu.addEventListener("click", function (event) {
      if (mobileMenu) {
        mobileMenu.closest("[data-child-items]").classList.add("active");
      }
    });
  });
  let backToNavElemets = document.querySelectorAll(
    "[data-backtonav-items],[data-subbacktonav-items]",
  );
  Array.from(backToNavElemets).forEach(function (navBarbackElement) {
    navBarbackElement.addEventListener("click", function (event) {
      if (event.target.closest("details").hasAttribute("open")) {
        event.target.closest("details[open]").removeAttribute("open");
        event.target
          .closest("[data-child-items].active")
          .classList.remove("active");
        //mobileMenuitemsEvent();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function (section = document) {
  stickyheaderLoadInit();
  mobileHumburgerMenuInit();
  mobileMenuitemsEvent();
});

document.addEventListener("shopify:section:load", function (section) {
  let sectiontargetHead = section.target;
  stickyheaderLoadInit(sectiontargetHead);
  mobileHumburgerMenuInit(sectiontargetHead);
  mobileMenuitemsEvent(sectiontargetHead);
});
