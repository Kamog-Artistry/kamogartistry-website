(() => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("post");
  const container = document.getElementById("postContent");
  const readingEl = document.getElementById("readingTime");

  if (!container) return;

  if (!slug) {
    container.innerHTML = "<p><strong>Error:</strong> No article selected.</p>";
    return;
  }

  // IMPORTANT: absolute path so it works on /post route too
  const mdPath = `/content/blog/${slug}.md`;

  container.innerHTML = "<p>Loading article…</p>";

  fetch(mdPath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${mdPath}`);
      return res.text();
    })
    .then(md => {
      // Split YAML front matter
      let front = {};
      let body = md;

      const fmMatch = md.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
      if (fmMatch) {
        const fm = fmMatch[1];
        body = fmMatch[2].trim();

        fm.split("\n").forEach(line => {
          const idx = line.indexOf(":");
          if (idx === -1) return;
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
          if (key) front[key] = value;
        });
      }

      // Reading time
      const words = body.split(/\s+/).filter(Boolean).length;
      const mins = Math.max(1, Math.ceil(words / 200));
      if (readingEl) readingEl.textContent = `${mins} min read`;

      // Build article header (image, title, date)
      let html = "";
      if (front.image) {
        html += `<img src="${front.image}" class="article-img" alt="Article image">`;
      }
      if (front.title) {
        html += `<h1 class="article-title">${front.title}</h1>`;
      }
      if (front.date) {
        html += `<p class="article-date">${front.date}</p>`;
      }

      // Render markdown
      if (typeof marked === "undefined") {
        html += `<pre>${body.replace(/</g, "&lt;")}</pre>`;
      } else {
        html += marked.parse(body);
      }

      container.innerHTML = html;
      document.title = (front.title ? `${front.title} | Kamog Artistry` : document.title);
    })
    .catch(err => {
      container.innerHTML = `
        <h3 style="color:#b00020;margin-bottom:8px">Failed to load article</h3>
        <p><strong>Expected file:</strong> <code>${mdPath}</code></p>
        <p style="opacity:.8">${err.message}</p>
      `;
      console.error(err);
    });
})();
