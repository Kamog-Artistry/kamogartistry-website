// ===============================
// Kamog Artistry (U) Ltd — script.js
// Shared across all pages (safe checks included)
// ===============================

// Hide loader (only if loader exists on the page)
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
});

// Mobile menu toggle
function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("show");
}

// Close mobile menu after clicking a link (nice UX)
window.addEventListener("click", (e) => {
  const nav = document.getElementById("navLinks");
  if (!nav || !nav.classList.contains("show")) return;

  // If a nav link is clicked, close menu
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
   TESTIMONIALS (no redeclare error)
=============================== */
window.KA_TESTIMONIALS = window.KA_TESTIMONIALS || [
  { text: "Kamog Artistry elevated our brand presence beyond expectations.", author: "— Capsada Co. Ltd" },
  { text: "Their creativity and professionalism stand out.", author: "— Voltech Engineering Services" },
  { text: "From print to branding, the quality is outstanding.", author: "— TOOKE)" }
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

// Only auto-rotate if testimonial elements exist on the page
window.addEventListener("load", () => {
  if (document.getElementById("testimonialText")) {
    showTestimonial();
    setInterval(nextTestimonial, 5000);
  }
});

/* ===============================
   BLOG / ARTICLE ACTIONS
=============================== */

// Copy current page link
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

// Native share (mobile) fallback to copy
function shareArticle() {
  if (navigator.share) {
    navigator
      .share({ title: document.title, url: window.location.href })
      .catch(() => {}); // user may cancel share, that's okay
  } else {
    copyLink();
    alert("Sharing not supported here — link copied instead.");
  }
}

// Like counter (stored in localStorage per article URL query string)
function likeArticle() {
  const key = "likes_" + window.location.search;
  let count = parseInt(localStorage.getItem(key) || "0", 10);
  count += 1;
  localStorage.setItem(key, count);

  const el = document.getElementById("likeCount");
  if (el) el.innerText = count;
}

// Load like count on page (if likeCount exists)
window.addEventListener("load", () => {
  const el = document.getElementById("likeCount");
  if (el) {
    const key = "likes_" + window.location.search;
    el.innerText = localStorage.getItem(key) || "0";
  }
});



// Pause other videos when any video starts playing (works everywhere)
document.addEventListener("play", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLVideoElement)) return;

  document.querySelectorAll("video").forEach(v => {
    if (v !== target) v.pause();
  });
}, true);
