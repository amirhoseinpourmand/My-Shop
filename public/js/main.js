(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "shop-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var toggle = document.getElementById("themeToggle");
    if (toggle) toggle.checked = theme === "dark";
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* Changing Theme */
    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.checked = root.getAttribute("data-theme") === "dark";
      themeToggle.addEventListener("change", function () {
        var theme = themeToggle.checked ? "dark" : "light";
        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {}
        applyTheme(theme);
      });
    }

    /* Password Show/Hide Toggle */
    document.querySelectorAll(".password-toggle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = document.getElementById(btn.getAttribute("data-target"));
        if (!input) return;
        var icon = btn.querySelector("i");
        var isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        if (icon) {
          icon.classList.toggle("bi-eye", !isHidden);
          icon.classList.toggle("bi-eye-slash", isHidden);
        }
        btn.setAttribute("aria-label", isHidden ? "مخفی کردن رمز عبور" : "نمایش رمز عبور");
      });
    });

    /* Mobile Menu */
    var navToggle = document.getElementById("navToggle");
    var nav = document.getElementById("primaryNav");
    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("is-open");
        navToggle.classList.toggle("is-active", isOpen);
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("is-open");
          navToggle.classList.remove("is-active");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });

      document.addEventListener("click", function (event) {
        if (!nav.classList.contains("is-open")) return;
        if (nav.contains(event.target) || navToggle.contains(event.target)) return;
        nav.classList.remove("is-open");
        navToggle.classList.remove("is-active");
        navToggle.setAttribute("aria-expanded", "false");
      });
    }
  });
})();
