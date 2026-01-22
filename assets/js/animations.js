// assets/js/animations.js
document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".animate");
  if (!els.length) return;

  // If IntersectionObserver isn't supported, show everything
  if (!("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("active"));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => obs.observe(el));
});
