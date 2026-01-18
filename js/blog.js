const params = new URLSearchParams(window.location.search);
const post = params.get("post");
const container = document.getElementById("postContent");

container.innerHTML = "<p>Loading article…</p>";

if (!post) {
  container.innerHTML = "<p><b>Error:</b> No post selected.</p>";
} else {
  fetch(`content/blog/${post}.md`)
    .then(res => {
      if (!res.ok) throw new Error("Markdown file not found");
      return res.text();
    })
    .then(md => {
      container.innerHTML = marked.parse(md);
    })
    .catch(err => {
      container.innerHTML = `
        <h3 style="color:#b00020">Failed to load article</h3>
        <p>Expected file:</p>
        <code>content/blog/${post}.md</code>
      `;
      console.error(err);
    });
}
