const params = new URLSearchParams(window.location.search);
const post = params.get("post");
const container = document.getElementById("postContent");

if (!post) {
  container.innerHTML = "<p>No article selected.</p>";
} else {
  fetch(`content/blog/${post}.md`)
    .then(res => res.text())
    .then(md => {
      const parts = md.split('---');
      let front = {};
      let body = md;

      if (parts.length > 2) {
        body = parts.slice(2).join('---').trim();
        parts[1].split('\n').forEach(line => {
          const [k, ...v] = line.split(':');
          if (k && v) front[k.trim()] = v.join(':').trim().replace(/"/g, '');
        });
      }

      // Reading time
      const words = body.split(/\s+/).length;
      const minutes = Math.ceil(words / 200);
      document.getElementById("readingTime").innerText =
        `${minutes} min read`;

      let html = '';
      if (front.image) html += `<img src="${front.image}" class="article-img">`;
      if (front.title) html += `<h1>${front.title}</h1>`;
      if (front.date) html += `<p class="article-date">${front.date}</p>`;
      html += marked.parse(body);

      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = "<p>Failed to load article.</p>";
    });
}
function copyLink(){
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied");
}

function shareArticle(){
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    });
  } else {
    copyLink();
  }
}

// Likes (per article, per user)
function likeArticle(){
  const key = "likes_" + window.location.search;
  let likes = parseInt(localStorage.getItem(key) || "0", 10);
  likes++;
  localStorage.setItem(key, likes);
  document.getElementById("likeCount").innerText = likes;
}

window.addEventListener("load", () => {
  const el = document.getElementById("likeCount");
  if(el){
    const key = "likes_" + window.location.search;
    el.innerText = localStorage.getItem(key) || "0";
  }
});
