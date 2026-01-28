// ===============================
// Kamog Artistry (U) Ltd — script.js
// Site-wide script (safe checks included)
// Fixes:
// - Loader blocking mobile portfolio (hide early + only if loader exists)
// - Pause other videos when one plays
// - Performance helpers (no video preload, gallery load-more)
// - Portfolio filter, lightbox, testimonials, blog actions
// ===============================

/* ===============================
   LOADER (FIXED)
   - Only runs if #loader exists
   - Hides on DOMContentLoaded (not waiting for images/videos)
   - Safety timeout
=============================== */
(function () {
  const loader = document.getElementById("loader");
  if (!loader) return; // critical: do nothing on pages without loader

  const hide = () => loader.classList.add("hidden");

  document.addEventListener("DOMContentLoaded", hide);
  setTimeout(hide, 2000);
  window.addEventListener("load", hide);
})();

/* ===============================
   MOBILE NAV
=============================== */
function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("show");
}

// Close mobile menu after clicking a link
window.addEventListener("click", (e) => {
  const nav = document.getElementById("navLinks");
  if (!nav || !nav.classList.contains("show")) return;

  if (e.target && e.target.closest && e.target.closest("#navLinks a")) {
    nav.classList.remove("show");
  }
});

/* ===============================
   PORTFOLIO FILTER
=============================== */
function filterPortfolio(category) {
  document.querySelectorAll(".portfolio-item").forEach((item) => {
    item.style.display =
      category === "all" || item.classList.contains(category) ? "block" : "none";
  });
}

/* ===============================
   LIGHTBOX
=============================== */
function openLightbox(el) {
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  if (!lightbox || !img) return;

  const selected = el.querySelector("img");
  if (!selected) return;

  lightbox.style.display = "flex";
  img.src = selected.src;
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) lightbox.style.display = "none";
}

/* ===============================
   TESTIMONIALS (SAFE GLOBALS)
=============================== */
window.KA_TESTIMONIALS = window.KA_TESTIMONIALS || [
  { text: "Kamog Artistry elevated our brand presence beyond expectations.", author: "— Client" },
  { text: "Their creativity and professionalism stand out.", author: "— Client" },
  { text: "From print to branding, the quality is outstanding.", author: "— Client" }
];

window.KA_T_INDEX = window.KA_T_INDEX || 0;

function showTestimonial() {
  const t = document.getElementById("testimonialText");
  const a = document.getElementById("testimonialAuthor");
  if (!t || !a) return;

  const data = window.KA_TESTIMONIALS[window.KA_T_INDEX];
  t.innerText = data.text;
  a.innerText = data.author;
}

function nextTestimonial() {
  window.KA_T_INDEX = (window.KA_T_INDEX + 1) % window.KA_TESTIMONIALS.length;
  showTestimonial();
}

function prevTestimonial() {
  window.KA_T_INDEX =
    (window.KA_T_INDEX - 1 + window.KA_TESTIMONIALS.length) % window.KA_TESTIMONIALS.length;
  showTestimonial();
}

window.addEventListener("load", () => {
  if (document.getElementById("testimonialText")) {
    showTestimonial();
    setInterval(nextTestimonial, 5000);
  }
});

/* ===============================
   BLOG / ARTICLE ACTIONS
=============================== */
function copyLink() {
  if (!navigator.clipboard) {
    alert("Clipboard not supported in this browser.");
    return;
  }

  navigator.clipboard
    .writeText(window.location.href)
    .then(() => alert("Link copied!"))
    .catch(() => alert("Failed to copy link."));
}

function shareArticle() {
  if (navigator.share) {
    navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
  } else {
    copyLink();
    alert("Sharing not supported here — link copied instead.");
  }
}

function likeArticle() {
  const key = "likes_" + window.location.search;
  let count = parseInt(localStorage.getItem(key) || "0", 10);
  count += 1;
  localStorage.setItem(key, count);

  const el = document.getElementById("likeCount");
  if (el) el.innerText = count;
}

window.addEventListener("load", () => {
  const el = document.getElementById("likeCount");
  if (el) {
    const key = "likes_" + window.location.search;
    el.innerText = localStorage.getItem(key) || "0";
  }
});

/* ===============================
   VIDEO FIX: Pause other videos when one starts
=============================== */
document.addEventListener(
  "play",
  (e) => {
    const target = e.target;
    if (!(target instanceof HTMLVideoElement)) return;

    document.querySelectorAll("video").forEach((v) => {
      if (v !== target) v.pause();
    });
  },
  true
);

/* ===============================
   PERFORMANCE HELPERS (GLOBAL)
   - Force no-preload on videos (reduces mobile blocking)
   - Universal lazy/async images (safety)
   - Optional true lazy-video if you use data-src on <source>
   - Auto "Load more" for big galleries (.portfolio-preview)
=============================== */
(function () {
  // Image safety net
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  });

  // Make videos not preload (big win)
  document.querySelectorAll("video").forEach((v) => {
    v.setAttribute("preload", "none");
    if (!v.hasAttribute("playsinline")) v.setAttribute("playsinline", "");
    // If you want ALL videos muted by default, uncomment:
    // if (!v.hasAttribute("muted")) v.setAttribute("muted", "");
  });

  // Optional true lazy-video loading (only works if you change src -> data-src)
  const canIO = "IntersectionObserver" in window;
  if (canIO) {
    const vids = Array.from(document.querySelectorAll("video"));
    if (vids.length) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const v = entry.target;
            const sources = v.querySelectorAll("source");
            let changed = false;

            sources.forEach((s) => {
              const ds = s.getAttribute("data-src");
              if (ds && !s.getAttribute("src")) {
                s.setAttribute("src", ds);
                changed = true;
              }
            });

            if (changed) v.load();
            obs.unobserve(v);
          });
        },
        { rootMargin: "300px 0px" }
      );

      vids.forEach((v) => io.observe(v));
    }
  }

  // Gallery: auto "Load more" for big case-study grids
  const previews = Array.from(document.querySelectorAll(".portfolio-preview"));
  if (previews.length > 20) {
    const SHOW_FIRST = 20;

    previews.forEach((el, i) => {
      if (i >= SHOW_FIRST) el.style.display = "none";
    });

    const grid = previews[0].closest(".grid") || previews[0].parentElement;
    if (grid) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-secondary";
      btn.style.margin = "18px auto 0";
      btn.style.display = "block";
      btn.textContent = `Load more (${previews.length - SHOW_FIRST})`;

      btn.addEventListener("click", () => {
        previews.forEach((el) => (el.style.display = ""));
        btn.remove();
      });

      grid.insertAdjacentElement("afterend", btn);
    }
  }
})();
