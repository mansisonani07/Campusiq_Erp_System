const root = document.documentElement;
const themeToggle = document.getElementById("theme_toggle");
const themeStateText = document.querySelector("[data-theme-state]");
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
const activeTheme = savedTheme || (prefersDark ? "dark" : "light");
root.setAttribute("data-theme", activeTheme);

function refreshThemeToggle() {
  if (!themeToggle) return;
  const current = root.getAttribute("data-theme");
  const isDark = current === "dark";
  themeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  if (themeStateText) {
    themeStateText.textContent = isDark ? "Dark" : "Light";
  }
}

if (themeToggle) {
  refreshThemeToggle();
  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    refreshThemeToggle();
  });
}

const pageMain = document.querySelector("main");
if (pageMain) {
  pageMain.classList.add("erp-page-enter");
  requestAnimationFrame(() => pageMain.classList.add("is-visible"));
}

function applyERPRevealAnimations() {
  const targets = Array.from(
    document.querySelectorAll(
      "main .panel, main .card, main .hero-card, main .table-wrap, main form, main .notice, main .section-card, main .stat-card, main .portal-card"
    )
  ).filter((el) => !el.classList.contains("flash-message") && !el.classList.contains("app-sidebar"));

  if (!targets.length) return;
  targets.forEach((el, idx) => {
    el.classList.add("erp-reveal");
    el.style.transitionDelay = `${Math.min(idx * 35, 220)}ms`;
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((el) => io.observe(el));
}

applyERPRevealAnimations();

function parseDisplayNumber(text) {
  const compact = String(text || "").trim();
  if (!compact || compact.includes("/")) return null;
  const numeric = compact.replace(/[^0-9.\-]/g, "");
  if (!numeric) return null;
  const value = Number(numeric);
  if (!Number.isFinite(value)) return null;
  const prefixMatch = compact.match(/^[^0-9\-]*/);
  const suffixMatch = compact.match(/[^0-9]*$/);
  return {
    value,
    prefix: prefixMatch ? prefixMatch[0] : "",
    suffix: suffixMatch ? suffixMatch[0] : "",
    decimals: Number.isInteger(value) ? 0 : 1,
  };
}

function animateCounter(el, duration = 700) {
  if (!el || el.dataset.counted === "yes") return;
  const parsed = parseDisplayNumber(el.textContent);
  if (!parsed) return;
  const start = performance.now();
  const to = parsed.value;
  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const current = to * progress;
    const formatted = parsed.decimals
      ? current.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : Math.round(current).toLocaleString();
    el.textContent = `${parsed.prefix}${formatted}${parsed.suffix}`;
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      const finalText = parsed.decimals
        ? to.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : Math.round(to).toLocaleString();
      el.textContent = `${parsed.prefix}${finalText}${parsed.suffix}`;
      el.dataset.counted = "yes";
    }
  }
  requestAnimationFrame(frame);
}

document.querySelectorAll(".stat-card p, .portal-kpis .card p").forEach((el) => animateCounter(el));

document.addEventListener(
  "invalid",
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    target.classList.add("input-shake");
    setTimeout(() => target.classList.remove("input-shake"), 320);
  },
  true
);

const csrfMeta = document.querySelector('meta[name="csrf-token"]');
const csrfToken = csrfMeta ? csrfMeta.getAttribute("content") : "";
if (csrfToken) {
  document.querySelectorAll("form").forEach((form) => {
    const method = (form.getAttribute("method") || "get").toLowerCase();
    if (method === "post" && !form.querySelector('input[name="csrf_token"]')) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "csrf_token";
      input.value = csrfToken;
      form.appendChild(input);
    }
  });
}

const roleTabs = Array.from(document.querySelectorAll("[data-role-tab]"));
const loginRoleInput = document.getElementById("login_as");
if (roleTabs.length && loginRoleInput) {
  roleTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const role = tab.getAttribute("data-role-tab") || "student";
      loginRoleInput.value = role;
      roleTabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
    });
  });
}

function wireIdentifierInput(selectId, inputId, emailPlaceholder, phonePlaceholder) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!select || !input) return;
  const apply = () => {
    if (select.value === "phone") {
      input.placeholder = phonePlaceholder;
      input.inputMode = "tel";
    } else {
      input.placeholder = emailPlaceholder;
      input.inputMode = "email";
    }
  };
  apply();
  select.addEventListener("change", apply);
}

wireIdentifierInput("identifier_type", "identifier_input", "Email address", "Phone number");
wireIdentifierInput("forgot_identifier_type", "forgot_identifier_input", "Email address", "Phone number");

const registerForm = document.getElementById("register-form");
const registerRole = document.getElementById("register_role");
const studentOnlyFields = Array.from(document.querySelectorAll(".student-only-field"));
if (registerRole && studentOnlyFields.length) {
  const applyRoleFields = () => {
    const isStudent = registerRole.value === "student";
    studentOnlyFields.forEach((field) => {
      field.classList.toggle("is-hidden", !isStudent);
      field.querySelectorAll("input, select").forEach((input) => {
        const required = input.hasAttribute("required");
        if (isStudent) {
          if (input.dataset.requiredOnStudent === "yes" || required) {
            input.setAttribute("required", "required");
            input.dataset.requiredOnStudent = "yes";
          }
        } else {
          if (required) {
            input.dataset.requiredOnStudent = "yes";
          }
          input.removeAttribute("required");
        }
      });
    });
  };
  applyRoleFields();
  registerRole.addEventListener("change", applyRoleFields);
}

document.querySelectorAll(".password-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-toggle-target");
    if (!targetId) return;
    const input = document.getElementById(targetId);
    if (!input) return;
    const makeVisible = input.type === "password";
    input.type = makeVisible ? "text" : "password";
    btn.setAttribute("aria-pressed", makeVisible ? "true" : "false");
    btn.setAttribute("aria-label", makeVisible ? "Hide password" : "Show password");
  });
});

if (window.jQuery) {
  const $ = window.jQuery;
  const $root = $("#toast-root");

  function showToast(type, text) {
    if (!text || !$root.length) return;
    const safeType = ["success", "error", "info"].includes(type) ? type : "info";
    const $toast = $(`
      <div class="app-toast app-toast-${safeType}" role="status">
        <div class="app-toast-title">${safeType.toUpperCase()}</div>
        <div class="app-toast-text"></div>
      </div>
    `);
    $toast.find(".app-toast-text").text(text);
    $root.append($toast);
    requestAnimationFrame(() => $toast.addClass("show"));
    setTimeout(() => {
      $toast.removeClass("show");
      setTimeout(() => $toast.remove(), 220);
    }, 4200);
  }
  window.showToast = showToast;

  function showCenterNotice(text, type = "error") {
    if (!text) return;
    let $centerRoot = $("#center-notice-root");
    if (!$centerRoot.length) {
      $("body").append('<div id="center-notice-root" aria-live="assertive" aria-atomic="true"></div>');
      $centerRoot = $("#center-notice-root");
    }
    const safeType = ["success", "error", "info"].includes(type) ? type : "error";
    const $notice = $(`<div class="center-notice ${safeType}" role="alert"></div>`);
    $notice.text(text);
    $centerRoot.empty().append($notice);
    requestAnimationFrame(() => $notice.addClass("show"));
    setTimeout(() => {
      $notice.removeClass("show");
      setTimeout(() => $notice.remove(), 180);
    }, 2600);
  }
  window.showCenterNotice = showCenterNotice;

  $(function () {
    if (!document.getElementById("global-loading-spinner")) {
      const spinner = document.createElement("div");
      spinner.id = "global-loading-spinner";
      spinner.innerHTML = '<div class="spinner" aria-label="Loading"></div>';
      document.body.appendChild(spinner);
    }

    function toggleSpinner(show) {
      const el = document.getElementById("global-loading-spinner");
      if (!el) return;
      el.classList.toggle("show", !!show);
    }

    document.body.addEventListener("htmx:beforeRequest", () => toggleSpinner(true));
    document.body.addEventListener("htmx:afterRequest", () => toggleSpinner(false));
    window.addEventListener("pageshow", () => toggleSpinner(false));

    $("[data-app-notice]").each(function () {
      const type = $(this).data("type") || "info";
      const text = $(this).data("text") || "";
      showToast(String(type), String(text));
      $(this).remove();
    });

    const rememberKey = "erp_login_remember";
    const $loginForm = $("#login-form");
    if ($loginForm.length) {
      const $identifier = $("#identifier_input");
      const $password = $("#login_password");
      const $remember = $("#remember_me");
      const loginHasError = $(".login-panel .error").length > 0;
      if (loginHasError && $password.length) {
        $password.addClass("input-shake");
        setTimeout(() => $password.removeClass("input-shake"), 320);
      }

      try {
        const raw = localStorage.getItem(rememberKey);
        if (raw && !$identifier.val() && !$password.val()) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.identifier && parsed.password) {
            $identifier.val(parsed.identifier);
            $password.val(parsed.password);
            $remember.prop("checked", true);
          }
        }
      } catch (_) {}

      $loginForm.on("submit", function () {
        const identifierVal = String($identifier.val() || "").trim();
        const passwordVal = String($password.val() || "").trim();
        if (!identifierVal || !passwordVal) {
          if (!identifierVal) {
            $identifier.addClass("input-shake");
            setTimeout(() => $identifier.removeClass("input-shake"), 320);
          }
          if (!passwordVal) {
            $password.addClass("input-shake");
            setTimeout(() => $password.removeClass("input-shake"), 320);
          }
          return false;
        }
        if ($remember.is(":checked")) {
          const payload = {
            identifier: String($identifier.val() || ""),
            password: String($password.val() || ""),
          };
          localStorage.setItem(rememberKey, JSON.stringify(payload));
        } else {
          localStorage.removeItem(rememberKey);
        }
      });
    }

    const $registerForm = $("#register-form");
    if ($registerForm.length) {
      $(".toggle-password").on("click keydown", function (event) {
        if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        $(this).toggleClass("is-visible");
        const $input = $($(this).attr("toggle"));
        if (!$input.length) return;
        if ($input.attr("type") === "password") {
          $input.attr("type", "text");
        } else {
          $input.attr("type", "password");
        }
      });

      $registerForm.on("submit", function (event) {
        const empty = [];
        $(this)
          .find("input[required], select[required], textarea[required]")
          .filter(":visible")
          .each(function () {
            const value = ($(this).val() || "").toString().trim();
            if (!value) {
              const label = $(this).closest("label").contents().first().text().trim() || "field";
              empty.push(label);
            }
          });
        if (empty.length) {
          event.preventDefault();
          showCenterNotice(`Please fill required field(s): ${empty.join(", ")}`);
          return false;
        }
        return true;
      });
    }
  });
}
